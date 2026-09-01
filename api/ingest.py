"""Admin-only ingestion endpoint (Vercel Python serverless function).

Flow:  verify the caller is the logged-in admin  ->  create a `documents` row  ->
parse the uploaded file  ->  chunk it  ->  embed the chunks with Gemini  ->
store the chunks  ->  mark the document `indexed`.

The browser sends JSON:
    { "title", "file_name", "source_type", "content_base64" }
with the admin's Supabase access token in the  Authorization: Bearer <token>  header.

Secrets (service-role key, Gemini key) live in environment variables and never
leave the server.
"""
from __future__ import annotations

import base64
import json
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(__file__))

from _lib.parse import extract_text          # noqa: E402
from _lib.chunker import chunk_text           # noqa: E402
from _lib.embeddings import embed_texts       # noqa: E402

import urllib.request                          # noqa: E402
import urllib.error                            # noqa: E402


def _load_env_files():
    """Load KEY=VALUE pairs from a .env.production file if one is bundled.
    Does not override variables already set in the real environment, so this is
    a no-op when env vars are configured in the Vercel dashboard."""
    candidates = [
        os.path.join(os.getcwd(), ".env.production"),
        os.path.join(os.path.dirname(__file__), ".env.production"),
        os.path.join(os.path.dirname(__file__), "..", ".env.production"),
    ]
    for path in candidates:
        try:
            if os.path.isfile(path):
                with open(path, "r", encoding="utf-8") as fh:
                    for line in fh:
                        line = line.strip()
                        if not line or line.startswith("#") or "=" not in line:
                            continue
                        key, value = line.split("=", 1)
                        os.environ.setdefault(key.strip(), value.strip())
                return
        except Exception:
            continue


_load_env_files()


SUPABASE_URL = (
    os.environ.get("SUPABASE_URL")
    or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
).rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_EMBED_MODEL", "gemini-embedding-001")
GEMINI_DIM = int(os.environ.get("GEMINI_EMBED_DIM", "768"))


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            self._handle()
        except _HttpError as err:
            self._json(err.status, {"error": err.message})
        except Exception as err:  # noqa: BLE001 — surface a clean message
            self._json(500, {"error": f"Ingestion failed: {err}"})

    # -- main logic ----------------------------------------------------------
    def _handle(self):
        if not (SUPABASE_URL and SERVICE_KEY and GEMINI_API_KEY):
            raise _HttpError(500, "Server is missing required environment variables.")

        self._require_admin()

        body = self._read_json()
        title = (body.get("title") or "").strip()
        file_name = (body.get("file_name") or "").strip()
        source_type = (body.get("source_type") or "").strip().lower()
        content_b64 = body.get("content_base64") or ""

        if not title or not file_name or source_type not in ("pdf", "docx", "txt"):
            raise _HttpError(400, "Missing or invalid title/file_name/source_type.")
        if not content_b64:
            raise _HttpError(400, "Missing file content.")

        try:
            raw = base64.b64decode(content_b64)
        except Exception as err:  # noqa: BLE001
            raise _HttpError(400, f"Could not decode file content: {err}")

        # 1) create the document row (status=processing)
        document = _sb_insert(
            "documents",
            {
                "title": title,
                "file_name": file_name,
                "source_type": source_type,
                "status": "processing",
                "embedding_model": GEMINI_MODEL,
            },
        )[0]
        document_id = document["id"]

        try:
            # 2) parse -> 3) chunk
            text = extract_text(source_type, raw)
            chunks = chunk_text(text, target_tokens=500, overlap_ratio=0.15)
            if not chunks:
                raise ValueError("No readable text found in the file.")

            # 4) embed
            vectors = embed_texts(
                [c["content"] for c in chunks],
                api_key=GEMINI_API_KEY,
                model=GEMINI_MODEL,
                dimension=GEMINI_DIM,
                input_type="document",
            )

            # 5) store chunks
            rows = [
                {
                    "document_id": document_id,
                    "chunk_index": i,
                    "content": chunks[i]["content"],
                    "embedding": vectors[i],
                    "token_count": chunks[i]["token_count"],
                }
                for i in range(len(chunks))
            ]
            _sb_insert("chunks", rows)

            # 6) mark indexed
            _sb_patch(
                "documents",
                {"id": f"eq.{document_id}"},
                {"status": "indexed", "chunk_count": len(rows)},
            )
        except Exception as err:  # noqa: BLE001 — record failure on the document
            _sb_patch(
                "documents",
                {"id": f"eq.{document_id}"},
                {"status": "error", "error_message": str(err)[:500]},
            )
            raise _HttpError(500, f"Ingestion failed while processing: {err}")

        self._json(200, {"document_id": document_id, "chunk_count": len(chunks)})

    # -- helpers -------------------------------------------------------------
    def _require_admin(self):
        auth = self.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            raise _HttpError(401, "Not authenticated.")
        token = auth[len("Bearer ") :]

        req = urllib.request.Request(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={"Authorization": f"Bearer {token}", "apikey": SERVICE_KEY},
            method="GET",
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                if resp.status != 200:
                    raise _HttpError(401, "Not authenticated.")
        except urllib.error.HTTPError:
            raise _HttpError(401, "Not authenticated.")

    def _read_json(self):
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b""
        try:
            return json.loads(raw.decode("utf-8")) if raw else {}
        except Exception:  # noqa: BLE001
            raise _HttpError(400, "Body must be valid JSON.")

    def _json(self, status: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


class _HttpError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


# --- Supabase REST (PostgREST) helpers, service-role auth --------------------
def _sb_headers(extra: dict | None = None) -> dict:
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    if extra:
        headers.update(extra)
    return headers


def _sb_insert(table: str, rows):
    payload = json.dumps(rows).encode("utf-8")
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{table}",
        data=payload,
        headers=_sb_headers({"Prefer": "return=representation"}),
        method="POST",
    )
    return _sb_send(req)


def _sb_patch(table: str, filters: dict, values: dict):
    query = "&".join(f"{k}={v}" for k, v in filters.items())
    payload = json.dumps(values).encode("utf-8")
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{table}?{query}",
        data=payload,
        headers=_sb_headers({"Prefer": "return=minimal"}),
        method="PATCH",
    )
    return _sb_send(req)


def _sb_send(req):
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else []
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Supabase error {err.code}: {detail}") from err
