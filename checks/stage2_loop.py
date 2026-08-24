"""
Stage 2 — Agent Loop Detection.

Tracks (agent_id, tool_name, args_hash) call counts in Redis.
If the same call is made more than loop_count_max times within a 5-minute window,
the next call is blocked.

This is the "Runaway Agent" scenario (Scenario 2) and golden set items G-06/G-07/G-08.
"""

import hashlib
import json

from policy.aggregator import CheckResult
from proxy.cache import increment_loop_counter


def _hash_args(args: dict) -> str:
    """Stable hash of tool call arguments for use as a Redis key component."""
    serialized = json.dumps(args, sort_keys=True)
    return hashlib.sha256(serialized.encode()).hexdigest()[:16]


async def run(
    agent_id: str,
    tool_name: str,
    tool_args: dict,
    policy: dict,
) -> CheckResult:
    """
    Increment the Redis counter for this (agent_id, tool_name, args_hash) tuple.
    Block if count exceeds the policy threshold.
    """
    if not policy.get("checks_enabled", {}).get("loop_detection", True):
        return CheckResult(passed=True)
    if not agent_id:
        return CheckResult(passed=True)

    max_calls: int = policy.get("thresholds", {}).get("loop_count_max", 3)
    args_hash = _hash_args(tool_args)

    count = await increment_loop_counter(agent_id, tool_name, args_hash)

    if count > max_calls:
        return CheckResult(
            passed=False,
            categories=["cost"],
            reason=(
                f"Agent loop detected: tool '{tool_name}' called {count} times "
                f"with identical arguments (max={max_calls}). Blocking to prevent cost overrun."
            ),
            confidence=1.0,
            span=f"{tool_name}({json.dumps(tool_args)[:80]})",
        )

    return CheckResult(passed=True)
