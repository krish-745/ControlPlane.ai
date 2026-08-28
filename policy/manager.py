"""
Policy Configuration Layer.

Responsibilities:
  1. Load the active policy for an (org_id, use_case) pair.
  2. Cache it in Redis (30s TTL) so the proxy never waits on Postgres per-request.
  3. Merge with system defaults if org hasn't configured a field.

The Policy Aggregator (aggregator.py) imports get_active_policy() and reads
thresholds + on_violation actions from the returned dict.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import PolicyConfig
from proxy.cache import cache_policy, get_cached_policy
from proxy.config import settings

# ── System defaults (applied when org policy is missing a field) ──────────────
_DEFAULTS: dict = {
    "jurisdiction": None,
    "latency_budget_ms": 400,
    "checks_enabled": {
        "pii": True,
        "prompt_injection": True,
        "grounding": True,
        "loop_detection": True,
        "toxicity": True,
    },
    "thresholds": {
        "grounding_similarity_min": settings.default_grounding_similarity_min,
        "loop_count_max": settings.default_loop_count_max,
    },
    "on_violation": {
        "performance": "escalate",
        "responsibility": "block",
        "cost": "block",
    },
    "custom_rules": {},
}

# ── Built-in demo profiles (seeded on first run) ──────────────────────────────
DEMO_PROFILES: list[dict] = [
    {
        "org_id": "demo",
        "use_case": "customer_support_bot",
        "jurisdiction": "EU",
        "latency_budget_ms": 200,
        "checks_enabled": {
            "pii": True,
            "prompt_injection": True,
            "grounding": True,
            "loop_detection": False,
            "toxicity": True,
        },
        "thresholds": {"grounding_similarity_min": 0.75, "loop_count_max": 3},
        "on_violation": {
            "performance": "block",
            "responsibility": "block",
            "cost": "block",
        },
        "custom_rules": {"pii_categories_blocked": ["health_data", "financial_account"]},
    },
    {
        "org_id": "demo",
        "use_case": "internal_knowledge_assistant",
        "jurisdiction": "US",
        "latency_budget_ms": 400,
        "checks_enabled": {
            "pii": True,
            "prompt_injection": True,
            "grounding": True,
            "loop_detection": True,
            "toxicity": False,
        },
        "thresholds": {"grounding_similarity_min": 0.65, "loop_count_max": 5},
        "on_violation": {
            "performance": "escalate",
            "responsibility": "escalate",
            "cost": "escalate",
        },
        "custom_rules": {},
    },
    {
        "org_id": "demo",
        "use_case": "decision_support_batch",
        "jurisdiction": None,
        "latency_budget_ms": 5000,
        "checks_enabled": {
            "pii": True,
            "prompt_injection": True,
            "grounding": True,
            "loop_detection": True,
            "toxicity": True,
        },
        "thresholds": {"grounding_similarity_min": 0.60, "loop_count_max": 3},
        "on_violation": {
            "performance": "escalate",
            "responsibility": "block",
            "cost": "block",
        },
        "custom_rules": {},
    },
]


def _merge_with_defaults(raw: dict) -> dict:
    """Deep-merge a policy record with system defaults."""
    merged = dict(_DEFAULTS)
    for key in ("checks_enabled", "thresholds", "on_violation", "custom_rules"):
        merged[key] = {**_DEFAULTS.get(key, {}), **raw.get(key, {})}
    for key in ("jurisdiction", "latency_budget_ms"):
        if raw.get(key) is not None:
            merged[key] = raw[key]
    return merged


async def get_active_policy(
    org_id: str, use_case: str, db: AsyncSession
) -> dict:
    """
    Return the merged active policy for (org_id, use_case).
    Checks Redis cache first; falls back to Postgres; falls back to defaults.
    """
    cached = await get_cached_policy(org_id, use_case)
    if cached:
        return cached

    result = await db.execute(
        select(PolicyConfig)
        .where(
            PolicyConfig.org_id == org_id,
            PolicyConfig.use_case == use_case,
            PolicyConfig.is_active.is_(True),
        )
        .order_by(PolicyConfig.updated_at.desc())
        .limit(1)
    )
    record = result.scalar_one_or_none()

    if record:
        raw = {
            "org_id": record.org_id,
            "use_case": record.use_case,
            "jurisdiction": record.jurisdiction,
            "latency_budget_ms": record.latency_budget_ms,
            "checks_enabled": record.checks_enabled,
            "thresholds": record.thresholds,
            "on_violation": record.on_violation,
            "custom_rules": record.custom_rules,
        }
    else:
        raw = {"org_id": org_id, "use_case": use_case}

    policy = _merge_with_defaults(raw)
    await cache_policy(org_id, use_case, policy)
    return policy


async def upsert_policy(payload: dict, db: AsyncSession) -> PolicyConfig:
    """Create or update a policy config for an org + use_case."""
    result = await db.execute(
        select(PolicyConfig).where(
            PolicyConfig.org_id == payload["org_id"],
            PolicyConfig.use_case == payload["use_case"],
        )
    )
    record = result.scalar_one_or_none()

    if record:
        for field in (
            "jurisdiction", "latency_budget_ms", "checks_enabled",
            "thresholds", "on_violation", "custom_rules",
        ):
            if field in payload:
                setattr(record, field, payload[field])
        record.updated_at = datetime.now(timezone.utc)
    else:
        record = PolicyConfig(
            id=uuid.uuid4(),
            org_id=payload["org_id"],
            use_case=payload["use_case"],
            jurisdiction=payload.get("jurisdiction"),
            latency_budget_ms=payload.get("latency_budget_ms", 400),
            checks_enabled=payload.get("checks_enabled", {}),
            thresholds=payload.get("thresholds", {}),
            on_violation=payload.get("on_violation", {}),
            custom_rules=payload.get("custom_rules", {}),
        )
        db.add(record)

    await db.commit()
    await db.refresh(record)

    # Invalidate Redis cache
    await cache_policy(
        record.org_id, record.use_case,
        _merge_with_defaults({
            "org_id": record.org_id,
            "use_case": record.use_case,
            "jurisdiction": record.jurisdiction,
            "latency_budget_ms": record.latency_budget_ms,
            "checks_enabled": record.checks_enabled,
            "thresholds": record.thresholds,
            "on_violation": record.on_violation,
            "custom_rules": record.custom_rules,
        }),
    )
    return record


async def seed_demo_profiles(db: AsyncSession) -> None:
    """Idempotently insert the three built-in demo profiles on startup."""
    for profile in DEMO_PROFILES:
        result = await db.execute(
            select(PolicyConfig).where(
                PolicyConfig.org_id == profile["org_id"],
                PolicyConfig.use_case == profile["use_case"],
            )
        )
        if not result.scalar_one_or_none():
            await upsert_policy(profile, db)
