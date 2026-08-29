"""
Stage 2 — Bias Classifier

Uses a local HuggingFace model (d4data/bias-detection-model) to evaluate text for bias.
"""

from policy.aggregator import CheckResult
import os

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
        
        # Switch to a PyTorch-native zero-shot classification model to avoid all the TensorFlow conversion errors
        _classifier = pipeline("zero-shot-classification", model="valhalla/distilbart-mnli-12-3", device=device)
    return _classifier

async def run(text: str, policy: dict) -> CheckResult:
    """
    Evaluate text for bias using local zero-shot classifier.
    """
    if not policy.get("checks_enabled", {}).get("bias", True):
        return CheckResult(passed=True, check_name="bias", latency_ms=0)

    try:
        import asyncio
        import time
        import re
        
        classifier = _get_classifier()
        
        # Get dynamic threshold from environment or default to 0.75
        threshold = float(os.environ.get("BIAS_THRESHOLD", "0.75"))
        
        t0 = time.perf_counter()
        
        # Simple fast sentence splitter based on regex
        # Splits on period, exclamation, question mark followed by space
        sentences = [s.strip() for s in re.split(r'(?<=[.!?]) +', text) if s.strip()]
        if not sentences:
            sentences = [text]
            
        # Run natively on the main thread, batched
        results = classifier(sentences, candidate_labels=["biased, stereotyping, or prejudiced", "fair and objective"])
        
        t_inference = (time.perf_counter() - t0) * 1000
        
        for i, result in enumerate(results):
            # zero-shot-classification returns a list of 'labels' and 'scores' sorted by score
            # Find the score for the 'biased' label
            labels = result['labels']
            scores = result['scores']
            bias_idx = labels.index("biased, stereotyping, or prejudiced")
            score = scores[bias_idx]
            
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
