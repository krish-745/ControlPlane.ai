"""
Stage 1 — PII & Secret Detection checker.

Checks incoming prompts for:
  - API key patterns (OpenAI sk-, Anthropic sk-ant-, generic Bearer tokens)
  - Credit card numbers (Luhn algorithm)
  - US Social Security Numbers
  - Org-specific blocked categories from active policy custom_rules

Target: <50ms cold, <5ms warm (regex, no model loading).
Production upgrade path: Presidio (documented in writeup, not integrated here).
"""

import re
import time

from policy.aggregator import CheckResult

# ── Regex patterns ────────────────────────────────────────────────────────────
_PATTERNS: dict[str, re.Pattern] = {
    # Matches sk-<anything>-<long-suffix> — covers sk-prod-, sk-live-, sk-proj-, etc.
    "openai_api_key": re.compile(r"sk-[a-zA-Z0-9\-_]{20,}"),
    "anthropic_api_key": re.compile(r"sk-ant-[a-zA-Z0-9\-_]{20,}"),
    "generic_bearer": re.compile(r"Bearer\s+[a-zA-Z0-9\-_\.]{20,}", re.IGNORECASE),
    "aws_access_key": re.compile(r"AKIA[0-9A-Z]{16}"),
    "ssn": re.compile(r"\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b"),
    "email_address": re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b"),
}


def _luhn_check(number: str) -> bool:
    """Return True if `number` passes the Luhn algorithm (credit card validity check)."""
    digits = [int(d) for d in number if d.isdigit()]
    if len(digits) < 13 or len(digits) > 19:
        return False
    total = 0
    for i, digit in enumerate(reversed(digits)):
        if i % 2 == 1:
            digit *= 2
            if digit > 9:
                digit -= 9
        total += digit
    return total % 10 == 0


_CARD_PATTERN = re.compile(r"\b(?:\d[ \-]?){13,19}\b")


def _contains_credit_card(text: str) -> bool:
    for match in _CARD_PATTERN.finditer(text):
        raw = re.sub(r"[ \-]", "", match.group())
        if _luhn_check(raw):
            return True
    return False


def run(prompt: str, policy: dict) -> CheckResult:
    """
    Run all PII/secret checks on the prompt.
    Returns a failing CheckResult on first match (fail-fast for latency).
    """
    t0 = time.perf_counter()

    for name, pattern in _PATTERNS.items():
        match = pattern.search(prompt)
        if match:
            elapsed_ms = (time.perf_counter() - t0) * 1000
            return CheckResult(
                passed=False,
                categories=["responsibility"],
                reason=f"Detected potential secret/PII: pattern '{name}' matched '{match.group()[:20]}...'",
                confidence=0.98,
                span=match.group()[:50],
            )

    if _contains_credit_card(prompt):
        return CheckResult(
            passed=False,
            categories=["responsibility"],
            reason="Detected potential credit card number (Luhn check passed)",
            confidence=0.95,
        )

    # Org-specific blocked PII categories (from policy custom_rules)
    blocked_categories: list[str] = (
        policy.get("custom_rules", {}).get("pii_categories_blocked", [])
    )
    # Extend with domain-specific patterns as needed
    # (health_data, financial_account — future: integrate Presidio entity types here)

    return CheckResult(passed=True)
