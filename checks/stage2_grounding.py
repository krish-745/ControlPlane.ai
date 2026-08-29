"""
Stage 2 — Grounding / Hallucination Checker.

Uses Hugging Face Inference API (all-MiniLM-L6-v2) to compute cosine similarity
between response sentences and the RAG context.
"""

import time
import httpx
from policy.aggregator import CheckResult
from proxy.config import settings

def _sentence_split(text: str) -> list[str]:
    import re
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    return [s.strip() for s in sentences if len(s.strip()) > 15]

async def _get_embeddings(sentences: list[str]) -> list[list[float]]:
    if not settings.hf_api_token:
        print("[Warning] No HF_API_TOKEN set. Cannot run grounding check.")
        return []
    
    url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
    headers = {"Authorization": f"Bearer {settings.hf_api_token}"}
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        # Wrap in a retry loop since HF free tier can sometimes be "loading"
        for _ in range(3):
            resp = await client.post(url, headers=headers, json={"inputs": sentences})
            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 503:
                # Model is loading
                await asyncio.sleep(2.0)
            else:
                break
        return []

async def run(response: str, rag_context: str, policy: dict) -> CheckResult:
    if not policy.get("checks_enabled", {}).get("grounding", True):
        return CheckResult(passed=True, check_name="grounding", latency_ms=0)
    if not rag_context or not rag_context.strip():
        return CheckResult(passed=True, check_name="grounding", latency_ms=0)

    t0 = time.perf_counter()
    threshold: float = policy.get("thresholds", {}).get("grounding_similarity_min", 0.75)

    import asyncio
    import numpy as np

    response_sentences = _sentence_split(response)
    context_sentences = _sentence_split(rag_context)

    if not response_sentences or not context_sentences:
        return CheckResult(passed=True, check_name="grounding", latency_ms=0)

    # Fetch embeddings in parallel
    try:
        results = await asyncio.gather(
            _get_embeddings(response_sentences),
            _get_embeddings(context_sentences)
        )
        response_embeddings, context_embeddings = results
    except Exception as e:
        print(f"[Grounding Error] API call failed: {e}")
        return CheckResult(passed=True, check_name="grounding")
        
    if not response_embeddings or not context_embeddings:
        return CheckResult(passed=True, check_name="grounding")

    # Convert to numpy arrays
    re_arr = np.array(response_embeddings)
    ce_arr = np.array(context_embeddings)

    # Normalize manually since HF API doesn't guarantee normalized outputs for this model
    re_norms = np.linalg.norm(re_arr, axis=1, keepdims=True)
    ce_norms = np.linalg.norm(ce_arr, axis=1, keepdims=True)
    
    # Avoid division by zero
    re_norms[re_norms == 0] = 1.0
    ce_norms[ce_norms == 0] = 1.0
    
    re_arr = re_arr / re_norms
    ce_arr = ce_arr / ce_norms

    # Cosine similarity matrix
    sim_matrix = np.dot(re_arr, ce_arr.T)
    max_sims = sim_matrix.max(axis=1)

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
            reason=f"Response contains claim not sufficiently grounded (similarity={worst_score:.2f}, threshold={threshold:.2f})",
            confidence=min(1.0, round(1.0 - worst_score, 3)),
            span=worst_sentence[:200],
            check_name="grounding",
            latency_ms=elapsed_ms
        )

    return CheckResult(passed=True, check_name="grounding", latency_ms=elapsed_ms)

