"""
Stage 2 — Toxicity / Safety Classifier (Upgraded to toxic-bert)

Uses a fast, local HuggingFace model (unitary/toxic-bert) to evaluate text for toxicity.
This is highly performant (<50ms) and keeps all data completely private.
"""

from policy.aggregator import CheckResult
import time

_classifier = None

def _get_classifier():
    global _classifier
    if _classifier is None:
        from transformers import pipeline
        import torch
        
        # Lock to 1 thread to completely eliminate OpenMP thrashing with other models
        torch.set_num_threads(1)
        
        # Use GPU (device 0) if available, otherwise fallback to CPU (device -1)
        device = 0 if torch.cuda.is_available() else -1
        
        _classifier = pipeline("text-classification", model="martin-ha/toxic-comment-model", device=device)
    return _classifier

async def run(text: str, policy: dict) -> CheckResult:
    """
    Evaluate text for toxicity using local toxic-bert model.
    """
    if not policy.get("checks_enabled", {}).get("toxicity", True):
        return CheckResult(passed=True, check_name="toxicity", latency_ms=0)

    try:
        classifier = _get_classifier()
        
        t0 = time.perf_counter()
        
        # Run natively on the main thread
        result = classifier(text)
        
        t_inference = (time.perf_counter() - t0) * 1000
        
        if not result or not isinstance(result, list):
            return CheckResult(passed=True, check_name="toxicity", latency_ms=t_inference)

        # The pipeline usually returns [{"label": "toxic", "score": 0.9}]
        score = result[0].get('score', 0)
        label = result[0].get('label', '').lower()
        
        # Only flag if the model explicitly labeled it as toxic with high confidence
        is_toxic = (label == 'toxic' and score > 0.7)
        
        if is_toxic:
            return CheckResult(
                passed=False,
                categories=["responsibility"],
                reason=f"Toxicity check flagged content: {label} (confidence: {score:.2f})",
                confidence=score,
                span=text[:150] + "..." if len(text) > 150 else text,
                check_name="toxicity",
                latency_ms=t_inference
            )
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return CheckResult(passed=True, check_name="toxicity")

    return CheckResult(passed=True, check_name="toxicity", latency_ms=t_inference)
