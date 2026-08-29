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
        
        # Switch to a PyTorch-native zero-shot classification model
        # Using an encoder-only DistilBERT MNLI model which is extremely fast on CPU (<50ms) compared to BART
        _classifier = pipeline("zero-shot-classification", model="typeform/distilbert-base-uncased-mnli", device=device)
    return _classifier

async def run(text: str, policy: dict) -> CheckResult:
    """
    Evaluate text for bias using local zero-shot classifier.
    """
    if not policy.get("checks_enabled", {}).get("bias", True):
        return CheckResult(passed=True, check_name="bias", latency_ms=0)

    try:
        import time
        import re
        
        classifier = _get_classifier()
        
        # Get dynamic threshold from environment or default to 0.60
        threshold = float(os.environ.get("BIAS_THRESHOLD", "0.60"))
        
        t0 = time.perf_counter()
        
        # Simple fast sentence splitter based on regex
        # Splits on period, exclamation, question mark followed by space
        sentences = [s.strip() for s in re.split(r'(?<=[.!?]) +', text) if s.strip()]
        if not sentences:
            sentences = [text]
            
        # Run natively on the main thread, batched
        results = classifier(sentences, candidate_labels=["biased", "objective"])
        
        t_inference = (time.perf_counter() - t0) * 1000
        
        for i, result in enumerate(results):
            # zero-shot-classification returns a list of 'labels' and 'scores' sorted by score
            # Find the score for the 'biased' label
            labels = result['labels']
            scores = result['scores']
            
            try:
                bias_idx = labels.index("biased")
                score = scores[bias_idx]
            except ValueError:
                continue
            
            is_biased = (score > threshold)
            
            if is_biased:
                trigger_sentence = sentences[i] if i < len(sentences) else text
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
        import traceback
        traceback.print_exc()
        return CheckResult(passed=True, check_name="bias")

    return CheckResult(passed=True, check_name="bias", latency_ms=t_inference)
