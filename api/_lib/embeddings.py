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
MAX_RETRIES = 5


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

    vectors: list[list[float]] = []
    for start in range(0, len(texts), BATCH_SIZE):
        batch = texts[start : start + BATCH_SIZE]
        vectors.extend(_embed_batch(batch, api_key, model, dimension, task_type))
    return vectors


def _embed_batch(batch, api_key, model, dimension, task_type):
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
            with urllib.request.urlopen(request, timeout=45) as response:
                body = json.loads(response.read().decode("utf-8"))
            return [_normalize(e["values"]) for e in body.get("embeddings", [])]
        except urllib.error.HTTPError as err:
            if err.code == 429 and attempt < MAX_RETRIES:
                time.sleep((2**attempt) * 2)
                continue
            detail = err.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Gemini embedding error {err.code}: {detail}") from err
