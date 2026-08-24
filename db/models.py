"""
SQLAlchemy ORM models for ControlPlane.ai.

Tables:
  - policy_configs   : per-org, per-use-case policy records
  - interactions     : every proxied request/response span
  - flags            : policy violations detected per interaction
"""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class PolicyConfig(Base):
    __tablename__ = "policy_configs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    org_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    use_case: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    jurisdiction: Mapped[str] = mapped_column(String(64), nullable=True)
    latency_budget_ms: Mapped[int] = mapped_column(Integer, default=400)
    checks_enabled: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    thresholds: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    on_violation: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    custom_rules: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    interactions: Mapped[list["Interaction"]] = relationship(back_populates="policy")


class Interaction(Base):
    __tablename__ = "interactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    policy_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("policy_configs.id"), nullable=True
    )
    org_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    use_case: Mapped[str] = mapped_column(String(128), nullable=False)
    agent_id: Mapped[str | None] = mapped_column(String(256), nullable=True, index=True)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    response: Mapped[str | None] = mapped_column(Text, nullable=True)
    stage1_decision: Mapped[str | None] = mapped_column(String(32), nullable=True)  # ALLOW | BLOCK
    stage1_latency_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    stage2_decision: Mapped[str | None] = mapped_column(String(32), nullable=True)  # ALLOW | ESCALATE
    stage2_latency_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    llm_backend: Mapped[str] = mapped_column(String(32), default="mock")  # mock | live
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    policy: Mapped["PolicyConfig | None"] = relationship(back_populates="interactions")
    flags: Mapped[list["Flag"]] = relationship(back_populates="interaction")


class Flag(Base):
    __tablename__ = "flags"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    interaction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("interactions.id"), nullable=False, index=True
    )
    stage: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 or 2
    span: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Multi-category: ["performance", "responsibility"] etc.
    categories: Mapped[list[str]] = mapped_column(JSONB, default=list)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    action_taken: Mapped[str] = mapped_column(String(32), nullable=False)  # BLOCK | ESCALATE
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    interaction: Mapped["Interaction"] = relationship(back_populates="flags")
