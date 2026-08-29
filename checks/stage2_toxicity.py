"""
Stage 2 — Toxicity / Safety Classifier.

Uses Hugging Face Inference API (martin-ha/toxic-comment-model) to evaluate text for toxicity.
"""

import time
import httpx
from policy.aggregator import CheckResult
from proxy.config import settings

async def _get_toxicity(text: str) -> dict:
    if not settings.hf_api_token:
        print("[Warning] No HF_API_TOKEN set. Cannot run toxicity check.")
        return {}
    
    url = "https://api-inference.huggingface.co/models/martin-ha/toxic-comment-model"
    headers = {"Authorization": f"Bearer {settings.hf_api_token}"}
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        import asyncio
        for _ in range(3):
            resp = await client.post(url, headers=headers, json={"inputs": text})
            if resp.status_code == 200:
                results = resp.json()
                if results and isinstance(results, list) and isinstance(results[0], list):
                    # Output is usually [[{"label": "toxic", "score": 0.9}]]
                    return results[0][0]
                elif results and isinstance(results, list) and isinstance(results[0], dict):
                    # Sometimes it's just [{"label": "toxic", "score": 0.9}]
                    return results[0]
                return {}
            elif resp.status_code == 503:
                await asyncio.sleep(2.0)
            else:
                break
        return {}

async def run(text: str, policy: dict) -> CheckResult:
    if not policy.get("checks_enabled", {}).get("toxicity", True):
        return CheckResult(passed=True, check_name="toxicity", latency_ms=0)

    try:
        t0 = time.perf_counter()
        
        result = await _get_toxicity(text)
        
        t_inference = (time.perf_counter() - t0) * 1000
        
        if not result:
            return CheckResult(passed=True, check_name="toxicity", latency_ms=t_inference)

        score = result.get('score', 0)
        label = result.get('label', '').lower()
        
        is_toxic = (label == 'toxic' and score > 0.7)
        
        if is_toxic:
            return CheckResult(
                passed=False,
                categories=["responsibility"],
                reason=f"HF API flagged content: {label} (confidence: {score:.2f})",
                confidence=score,
                span=text[:150] + "..." if len(text) > 150 else text,
                check_name="toxicity",
                latency_ms=t_inference
            )
            
    except Exception as e:
        print(f"[Toxicity Classifier Error] {e}")
        return CheckResult(passed=True, check_name="toxicity")

    return CheckResult(passed=True, check_name="toxicity", latency_ms=t_inference)
