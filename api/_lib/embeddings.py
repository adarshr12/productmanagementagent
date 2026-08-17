"""Turn text into embeddings using Voyage AI.

Called with plain HTTP (urllib) so we don't need an extra dependency.
"""
from __future__ import annotations

import json
import urllib.request
import urllib.error

VOYAGE_URL = "https://api.voyageai.com/v1/embeddings"
BATCH_SIZE = 100  # Voyage accepts many inputs per call; stay well within limits.


def embed_texts(texts, api_key: str, model: str, input_type: str = "document"):
    """Return a list of embedding vectors, one per input text (same order)."""
    if not texts:
        return []

    vectors: list[list[float]] = []
    for start in range(0, len(texts), BATCH_SIZE):
        batch = texts[start : start + BATCH_SIZE]
        vectors.extend(_embed_batch(batch, api_key, model, input_type))
    return vectors


def _embed_batch(batch, api_key, model, input_type):
    payload = json.dumps(
        {"input": batch, "model": model, "input_type": input_type}
    ).encode("utf-8")

    request = urllib.request.Request(
        VOYAGE_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Voyage API error {err.code}: {detail}") from err

    # Voyage returns data sorted by "index"; sort to be safe.
    rows = sorted(body.get("data", []), key=lambda d: d.get("index", 0))
    return [row["embedding"] for row in rows]
