"""
Stage 1 — Prompt Injection Guard.

Detects attempts to override or extract the system prompt via:
  - Known injection phrases ("ignore previous instructions", "disregard your instructions")
  - Role-override patterns ("you are now DAN", "act as if you have no restrictions")
  - System prompt extraction attempts ("repeat your instructions", "what is your system prompt")

Target: <50ms (regex only, no model).
"""

import re
from policy.aggregator import CheckResult

_INJECTION_PATTERNS: list[tuple[str, re.Pattern]] = [
    (
        "instruction_override",
        re.compile(
            r"\b(ignore|disregard|forget|override|bypass)\b.{0,30}"
            r"\b(previous|prior|above|all|your|system|original)\b.{0,30}"
            r"\b(instructions?|prompt|directives?|rules?|guidelines?)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "role_override",
        re.compile(
            r"\b(you are now|act as|pretend (you are|to be)|roleplay as|"
            r"simulate being|switch to|your new (role|persona|identity))\b",
            re.IGNORECASE,
        ),
    ),
    (
        "system_prompt_extraction",
        re.compile(
            r"\b(repeat|print|show|reveal|output|return|tell me|what (is|are))\b.{0,40}"
            r"\b(system prompt|your instructions?|your (initial|original) prompt|"
            r"your guidelines?|your (rules|directives?))\b",
            re.IGNORECASE,
        ),
    ),
    (
        "jailbreak_phrase",
        re.compile(
            r"\b(DAN|do anything now|jailbreak|no restrictions|unrestricted mode|"
            r"developer mode|god mode|evil mode)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "delimiter_injection",
        re.compile(
            r"(</?(system|instruction|prompt|context)>|"
            r"\[INST\]|\[/INST\]|<\|im_start\|>|<\|im_end\|>)",
            re.IGNORECASE,
        ),
    ),
]


def run(prompt: str, policy: dict) -> CheckResult:
    """
    Run prompt injection checks. Fail-fast on first match.
    """
    if not policy.get("checks_enabled", {}).get("prompt_injection", True):
        return CheckResult(passed=True)

    for name, pattern in _INJECTION_PATTERNS:
        match = pattern.search(prompt)
        if match:
            return CheckResult(
                passed=False,
                categories=["responsibility"],
                reason=f"Potential prompt injection detected: pattern '{name}' matched",
                confidence=0.92,
                span=match.group()[:100],
            )

    return CheckResult(passed=True)
