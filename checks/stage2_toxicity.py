"""
Stage 2 — Toxicity / Safety Classifier (Upgraded to toxic-bert)

Uses a fast, local HuggingFace model (unitary/toxic-bert) to evaluate text for toxicity.
This is highly performant (<50ms) and keeps all data completely private.
"""

from policy.aggregator import CheckResult

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
        
        # Switch to DistilBERT-based model which is ~2x faster than toxic-bert
        _classifier = pipeline("text-classification", model="martin-ha/toxic-comment-model", truncation=True, max_length=512, device=device)
    return _classifier

async def run(text: str, policy: dict) -> CheckResult:
    """
    Evaluate text for toxicity using local toxic-bert model.
    """
    if not policy.get("checks_enabled", {}).get("toxicity", True):
        return CheckResult(passed=True, check_name="toxicity", latency_ms=0)

    try:
        import asyncio
        import time
        classifier = _get_classifier()
        
        t0 = time.perf_counter()
        
        # Run natively on the main thread
        results = classifier(text)
        
        t_inference = (time.perf_counter() - t0) * 1000
        print(f"[DEBUG] toxic-bert inference took {t_inference:.2f}ms for {len(text)} characters")
        
        result = results[0]
        # toxic-bert outputs labels like 'toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate'
        # The default label if it exceeds threshold is usually just the highest scoring class
        
        # martin-ha/toxic-comment-model outputs 'toxic' or 'non-toxic'
        score = result['score']
        label = result['label'].lower()
        
        # Only flag if the model explicitly labeled it as toxic with high confidence
        is_toxic = (label == 'toxic' and score > 0.7)
        
        if is_toxic:
            return CheckResult(
                passed=False,
                categories=["responsibility"],
                reason=f"Local toxic-bert flagged content: {label} (confidence: {score:.2f})",
                confidence=score,
                span=text[:150] + "..." if len(text) > 150 else text,
                check_name="toxicity",
                latency_ms=t_inference
            )
            
    except Exception as e:
        print(f"[Toxicity Classifier Error] {e}")
        return CheckResult(passed=True, check_name="toxicity")

    return CheckResult(passed=True, check_name="toxicity", latency_ms=t_inference)
