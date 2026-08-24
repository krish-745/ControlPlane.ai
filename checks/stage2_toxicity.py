"""
Stage 2 — Toxicity / Safety Classifier.

Heuristic regex classifier for the prototype. Covers the most common toxicity
categories relevant to enterprise AI deployments.

Production upgrade path: Replace with Llama Guard (via LiteLLM moderation endpoint)
for production-grade coverage across hate speech, violence, self-harm, etc.

Target: <100ms (regex, no model loading).
"""

import re
from policy.aggregator import CheckResult

_TOXICITY_PATTERNS: list[tuple[str, re.Pattern]] = [
    (
        "hate_speech",
        re.compile(
            r"\b(hate|despise|exterminate|eliminate)\b.{0,20}\b"
            r"(group|race|religion|ethnicity|gender|nationality)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "violence_explicit",
        re.compile(
            r"\b(kill|murder|bomb|detonate|attack|assault)\b.{0,30}\b"
            r"(people|person|building|crowd|school|government)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "self_harm",
        re.compile(
            r"\b(how to|instructions? (for|to)|steps? (for|to))\b.{0,30}"
            r"\b(harm|hurt|kill|end)\b.{0,20}\b(yourself|myself|oneself)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "illegal_activity",
        re.compile(
            r"\b(how to|instructions? (for|to))\b.{0,30}"
            r"\b(hack|synthesize|manufacture|launder|traffic)\b",
            re.IGNORECASE,
        ),
    ),
]


def run(text: str, policy: dict) -> CheckResult:
    """
    Run toxicity patterns against the given text (response or prompt).
    """
    if not policy.get("checks_enabled", {}).get("toxicity", True):
        return CheckResult(passed=True)

    for category_name, pattern in _TOXICITY_PATTERNS:
        match = pattern.search(text)
        if match:
            return CheckResult(
                passed=False,
                categories=["responsibility"],
                reason=f"Potential toxicity detected: category='{category_name}'",
                confidence=0.85,
                span=match.group()[:150],
            )

    return CheckResult(passed=True)
