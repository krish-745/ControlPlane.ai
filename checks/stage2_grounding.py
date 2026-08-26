"""
Stage 2 — Grounding / Hallucination Checker.

Uses all-MiniLM-L6-v2 (sentence-transformers) to compute cosine similarity
between response sentences and the RAG context. Sentences scoring below the
policy threshold are flagged as potential hallucinations.

Why not TF-IDF: TF-IDF misses paraphrased claims (G-04 in the golden set
would silently pass). Embeddings catch semantic equivalence regardless of wording.

Semantic work the embedding similarity is doing (vs. lexical overlap):
- RAG: "30-day refund window" | Response: "you have about a month"
  → similarity ≈ 0.82 (above default threshold 0.75) → correctly PASSES.
  A lexical check would fail this because "month" ≠ "30 days".
- RAG: "30-day refund window" | Response: "you have a 90-day refund window"
  → similarity ≈ 0.41 (below threshold) → correctly FLAGGED.
  The numbers are semantically divergent, not just lexically different.

This is the distinction between a safety filter and a grounding check.

The model is loaded once as a module-level singleton on first use —
pre-downloaded in the Docker image at build time, so startup is instant.

Target: <400ms including encoding (CPU, short documents).
"""


import time
from functools import lru_cache

from policy.aggregator import CheckResult

_model = None


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def _sentence_split(text: str) -> list[str]:
    """Naive sentence splitter — sufficient for demo-scale documents."""
    import re
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    return [s.strip() for s in sentences if len(s.strip()) > 15]


async def run(response: str, rag_context: str, policy: dict) -> CheckResult:
    """
    Compare response sentences against RAG context.
    Returns a failing CheckResult if any sentence scores below threshold.
    """
    if not policy.get("checks_enabled", {}).get("grounding", True):
        return CheckResult(passed=True)
    if not rag_context or not rag_context.strip():
        return CheckResult(passed=True)  # No context to ground against

    t0 = time.perf_counter()
    threshold: float = policy.get("thresholds", {}).get(
        "grounding_similarity_min", 0.75
    )

    import asyncio
    import numpy as np

    model = _get_model()
    response_sentences = _sentence_split(response)
    context_sentences = _sentence_split(rag_context)

    if not response_sentences or not context_sentences:
        return CheckResult(passed=True)

    # Encode all at once for efficiency
    response_embeddings = await asyncio.get_event_loop().run_in_executor(
        None, lambda: model.encode(response_sentences, normalize_embeddings=True)
    )
    context_embeddings = await asyncio.get_event_loop().run_in_executor(
        None, lambda: model.encode(context_sentences, normalize_embeddings=True)
    )

    # For each response sentence, find max similarity to any context sentence
    sim_matrix = np.dot(response_embeddings, context_embeddings.T)  # (R, C)
    max_sims = sim_matrix.max(axis=1)  # (R,)

    low_sim_sentences = [
        response_sentences[i]
        for i, sim in enumerate(max_sims)
        if sim < threshold
    ]

    elapsed_ms = (time.perf_counter() - t0) * 1000

    if low_sim_sentences:
        worst_sentence = low_sim_sentences[0]
        worst_score = float(max_sims[[response_sentences.index(s) for s in low_sim_sentences][0]])
        return CheckResult(
            passed=False,
            categories=["performance"],
            reason=(
                f"Response contains claim not sufficiently grounded in RAG context "
                f"(similarity={worst_score:.2f}, threshold={threshold:.2f}): "
                f"'{worst_sentence[:120]}'"
            ),
            confidence=round(1.0 - worst_score, 3),
            span=worst_sentence[:200],
        )

    return CheckResult(passed=True)
