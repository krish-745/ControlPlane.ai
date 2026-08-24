"""Redis client — shared singleton for policy cache and agent-loop counters."""

import redis.asyncio as aioredis
from proxy.config import settings

_redis_client: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis_client


async def close_redis() -> None:
    global _redis_client
    if _redis_client:
        await _redis_client.aclose()
        _redis_client = None


# ── Policy cache helpers ──────────────────────────────────────────────────────
POLICY_TTL = 30  # seconds — hot-reload window


async def cache_policy(org_id: str, use_case: str, data: dict) -> None:
    r = await get_redis()
    import json
    await r.setex(f"policy:{org_id}:{use_case}", POLICY_TTL, json.dumps(data))


async def get_cached_policy(org_id: str, use_case: str) -> dict | None:
    r = await get_redis()
    import json
    raw = await r.get(f"policy:{org_id}:{use_case}")
    return json.loads(raw) if raw else None


# ── Agent loop counter helpers ────────────────────────────────────────────────
LOOP_COUNTER_TTL = 300  # 5-minute window per agent session


async def increment_loop_counter(agent_id: str, tool_name: str, args_hash: str) -> int:
    """Increment and return current call count for (agent_id, tool_name, args_hash)."""
    r = await get_redis()
    key = f"loop:{agent_id}:{tool_name}:{args_hash}"
    count = await r.incr(key)
    if count == 1:
        await r.expire(key, LOOP_COUNTER_TTL)
    return count


async def reset_loop_counter(agent_id: str, tool_name: str, args_hash: str) -> None:
    r = await get_redis()
    await r.delete(f"loop:{agent_id}:{tool_name}:{args_hash}")
