"""Split long text into overlapping chunks of ~500 tokens each.

We don't run a heavyweight tokenizer here (keeps the function small and fast).
Instead we approximate: for English-ish text, 1 token is roughly 4 characters.
So ~500 tokens ~= ~2000 characters, with ~15% overlap carried between chunks so
no idea gets cut cleanly in half at a boundary.
"""
from __future__ import annotations

import re

CHARS_PER_TOKEN = 4


def chunk_text(text: str, target_tokens: int = 500, overlap_ratio: float = 0.15):
    """Return a list of {"content", "token_count"} chunks."""
    text = _normalize(text)
    if not text:
        return []

    target = target_tokens * CHARS_PER_TOKEN
    overlap = int(target * overlap_ratio)

    units = _split_into_units(text, target)

    chunks: list[str] = []
    current = ""
    for unit in units:
        if current and len(current) + 2 + len(unit) > target:
            chunks.append(current)
            tail = current[-overlap:] if overlap else ""
            current = (tail + "\n\n" + unit).strip() if tail else unit
        else:
            current = (current + "\n\n" + unit).strip() if current else unit
    if current:
        chunks.append(current)

    return [
        {"content": c, "token_count": max(1, len(c) // CHARS_PER_TOKEN)}
        for c in chunks
    ]


def _normalize(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _split_into_units(text: str, target: int) -> list[str]:
    """Break text into paragraphs; hard-split any paragraph longer than target."""
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    units: list[str] = []
    for para in paragraphs:
        if len(para) <= target:
            units.append(para)
        else:
            for i in range(0, len(para), target):
                piece = para[i : i + target].strip()
                if piece:
                    units.append(piece)
    return units
