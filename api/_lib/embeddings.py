"""Turn text into embeddings using Google Gemini (`gemini-embedding-001`, free tier).

Mirrors src/lib/voyage.ts so the admin single-file upload path (this Python
function) and the TypeScript /api/ingest route produce embeddings the same
way. Called with plain HTTP (urllib) so we don't need an extra dependency.
"""
from __future__ import annotations

import json
import math
import time
import urllib.request
import urllib.error

BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
BATCH_SIZE = 100
MAX_RETRIES = 1
REQUEST_TIMEOUT = 15

# ingest.py runs under a 60s Vercel function timeout (vercel.json), shared
# with auth, parsing, chunking, and the two Supabase writes that happen
# AFTER embedding returns — none of which count against this budget, so it
# has to be small. A killed function returns a plain HTML/text error page
# rather than JSON, which surfaced client-side as an "Unexpected token"
# crash instead of a real error message.
#
# Sustained rate limiting (a bulk import of hundreds of items hitting the
# free tier) also won't clear up within a few seconds of retrying inside
# one invocation — so beyond one short retry, failing fast and letting the
# caller re-run later (bulk import dedupes by title, so a re-run only
# retries what actually failed) is both safer and no slower in practice
# than trying to survive the rate limit in-process.
RETRY_BUDGET_SECONDS = 8


def _normalize(vec: list[float]) -> list[float]:
    """Gemini's Matryoshka embeddings must be L2-normalized when a
    non-default output size (< 3072) is requested, or cosine distances come
    out wrong."""
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [x / norm for x in vec]


def embed_texts(
    texts,
    api_key: str,
    model: str,
    dimension: int,
    input_type: str = "document",
):
    """Return a list of embedding vectors, one per input text (same order)."""
    if not texts:
        return []

    task_type = "RETRIEVAL_DOCUMENT" if input_type == "document" else "RETRIEVAL_QUERY"
    deadline = time.monotonic() + RETRY_BUDGET_SECONDS

    vectors: list[list[float]] = []
    for start in range(0, len(texts), BATCH_SIZE):
        batch = texts[start : start + BATCH_SIZE]
        vectors.extend(_embed_batch(batch, api_key, model, dimension, task_type, deadline))
    return vectors


def _embed_batch(batch, api_key, model, dimension, task_type, deadline):
    payload = json.dumps(
        {
            "requests": [
                {
                    "model": f"models/{model}",
                    "content": {"parts": [{"text": t}]},
                    "taskType": task_type,
                    "outputDimensionality": dimension,
                }
                for t in batch
            ]
        }
    ).encode("utf-8")

    url = f"{BASE_URL}/models/{model}:batchEmbedContents"

    for attempt in range(MAX_RETRIES + 1):
        request = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT) as response:
                body = json.loads(response.read().decode("utf-8"))
            return [_normalize(e["values"]) for e in body.get("embeddings", [])]
        except urllib.error.HTTPError as err:
            if err.code == 429 and attempt < MAX_RETRIES:
                backoff = (2**attempt) * 2
                # Don't sleep past our budget — better to fail fast with a
                # clear "rate limited" error the caller can retry later than
                # to get killed mid-sleep by the platform's own timeout.
                if time.monotonic() + backoff >= deadline:
                    raise RuntimeError(
                        "Gemini embedding error 429: rate limited, retry budget exhausted for this item"
                    ) from err
                time.sleep(backoff)
                continue
            detail = err.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Gemini embedding error {err.code}: {detail}") from err
