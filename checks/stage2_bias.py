"""
Stage 2 — Bias Classifier.

Uses Hugging Face Inference API (valhalla/distilbart-mnli-12-3) to evaluate text for bias.
"""

import os
import time
import httpx
from policy.aggregator import CheckResult
from proxy.config import settings

async def _get_bias(sentences: list[str]) -> list[dict]:
    if not settings.hf_api_token:
        print("[Warning] No HF_API_TOKEN set. Cannot run bias check.")
        return []
    
    url = "https://api-inference.huggingface.co/models/valhalla/distilbart-mnli-12-3"
    headers = {"Authorization": f"Bearer {settings.hf_api_token}"}
    payload = {
        "inputs": sentences,
        "parameters": {"candidate_labels": ["biased, stereotyping, or prejudiced", "fair and objective"]}
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        import asyncio
        for _ in range(3):
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 503:
                await asyncio.sleep(2.0)
            else:
                break
        return []

async def run(text: str, policy: dict) -> CheckResult:
    if not policy.get("checks_enabled", {}).get("bias", True):
        return CheckResult(passed=True, check_name="bias", latency_ms=0)

    try:
        import re
        threshold = float(os.environ.get("BIAS_THRESHOLD", "0.75"))
        
        t0 = time.perf_counter()
        
        sentences = [s.strip() for s in re.split(r'(?<=[.!?]) +', text) if s.strip()]
        if not sentences:
            sentences = [text]
            
        results = await _get_bias(sentences)
        
        t_inference = (time.perf_counter() - t0) * 1000
        
        # Results can be a list of dicts (if batched) or a single dict (if 1 sentence)
        if isinstance(results, dict):
            results = [results]
            
        for i, result in enumerate(results):
            if 'labels' not in result or 'scores' not in result:
                continue
                
            labels = result['labels']
            scores = result['scores']
            
            try:
                bias_idx = labels.index("biased, stereotyping, or prejudiced")
                score = scores[bias_idx]
            except ValueError:
                continue
            
            is_biased = (score > threshold)
            
            if is_biased:
                trigger_sentence = sentences[i]
                return CheckResult(
                    passed=False,
                    categories=["responsibility"],
                    reason=f"Bias check flagged content (confidence: {score:.2f})",
                    confidence=score,
                    span=trigger_sentence[:150] + "..." if len(trigger_sentence) > 150 else trigger_sentence,
                    check_name="bias",
                    latency_ms=t_inference
                )
                
    except Exception as e:
        print(f"[Bias Classifier Error] {e}")
        return CheckResult(passed=True, check_name="bias")

    return CheckResult(passed=True, check_name="bias", latency_ms=t_inference)
