"""
Policy Aggregator — the single decision point for all check results.

This is the component that answers the judge question:
"How do you avoid slowing it down?"

Checks never decide their own action. They return a CheckResult.
The aggregator reads the active policy and routes to:
  - BLOCK    → return 403 immediately, log to Postgres
  - ESCALATE → let response through, push flag to UI, log to Postgres
  - ALLOW    → log to Postgres, no action
"""

from dataclasses import dataclass, field
from enum import Enum


class Decision(str, Enum):
    ALLOW = "ALLOW"
    BLOCK = "BLOCK"
    ESCALATE = "ESCALATE"


@dataclass
class CheckResult:
    """Returned by every Stage 1 and Stage 2 checker."""
    passed: bool
    categories: list[str] = field(default_factory=list)  # ["performance", "responsibility", ...]
    reason: str = ""
    confidence: float | None = None
    span: str | None = None


@dataclass
class AggregatorDecision:
    decision: Decision
    flags: list[CheckResult] = field(default_factory=list)
    block_reason: str | None = None  # populated when decision == BLOCK


def aggregate_stage1(results: list[CheckResult], policy: dict) -> AggregatorDecision:
    """
    Stage 1 aggregation — synchronous, must complete in <50ms total.

    Any failing check triggers an immediate BLOCK (Stage 1 has no escalate path —
    if we can't trust the prompt/request, we don't touch the LLM at all).
    """
    failures = [r for r in results if not r.passed]
    if failures:
        # Pick the most specific reason from the first failure
        primary = failures[0]
        return AggregatorDecision(
            decision=Decision.BLOCK,
            flags=failures,
            block_reason=primary.reason,
        )
    return AggregatorDecision(decision=Decision.ALLOW)


def aggregate_stage2(results: list[CheckResult], policy: dict) -> AggregatorDecision:
    """
    Stage 2 aggregation — async, runs after streaming starts.

    Uses per-category on_violation rules from the active policy.
    A single failing check may produce BLOCK or ESCALATE depending on the policy.
    The most severe decision across all failing checks wins.
    """
    failures = [r for r in results if not r.passed]
    if not failures:
        return AggregatorDecision(decision=Decision.ALLOW)

    on_violation: dict = policy.get("on_violation", {})
    severity_rank = {Decision.BLOCK: 2, Decision.ESCALATE: 1, Decision.ALLOW: 0}

    worst_decision = Decision.ALLOW
    for result in failures:
        # Determine the action for each failing category
        for category in result.categories:
            action_str = on_violation.get(category, "escalate").upper()
            action = Decision(action_str) if action_str in Decision.__members__ else Decision.ESCALATE
            if severity_rank[action] > severity_rank[worst_decision]:
                worst_decision = action

    return AggregatorDecision(
        decision=worst_decision,
        flags=failures,
        block_reason=failures[0].reason if worst_decision == Decision.BLOCK else None,
    )
