"""Initial schema — policy_configs, interactions, flags."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "policy_configs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("org_id", sa.String(128), nullable=False),
        sa.Column("use_case", sa.String(128), nullable=False),
        sa.Column("jurisdiction", sa.String(64), nullable=True),
        sa.Column("latency_budget_ms", sa.Integer, nullable=False, server_default="400"),
        sa.Column("checks_enabled", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("thresholds", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("on_violation", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("custom_rules", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_policy_configs_org_use_case", "policy_configs", ["org_id", "use_case"])

    op.create_table(
        "interactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "policy_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("policy_configs.id"),
            nullable=True,
        ),
        sa.Column("org_id", sa.String(128), nullable=False),
        sa.Column("use_case", sa.String(128), nullable=False),
        sa.Column("agent_id", sa.String(256), nullable=True),
        sa.Column("prompt", sa.Text, nullable=False),
        sa.Column("response", sa.Text, nullable=True),
        sa.Column("stage1_decision", sa.String(32), nullable=True),
        sa.Column("stage1_latency_ms", sa.Float, nullable=True),
        sa.Column("stage2_decision", sa.String(32), nullable=True),
        sa.Column("stage2_latency_ms", sa.Float, nullable=True),
        sa.Column("llm_backend", sa.String(32), nullable=False, server_default="mock"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_interactions_org_id", "interactions", ["org_id"])
    op.create_index("ix_interactions_agent_id", "interactions", ["agent_id"])
    op.create_index("ix_interactions_created_at", "interactions", ["created_at"])

    op.create_table(
        "flags",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "interaction_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("interactions.id"),
            nullable=False,
        ),
        sa.Column("stage", sa.Integer, nullable=False),
        sa.Column("span", sa.Text, nullable=True),
        sa.Column("categories", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("reason", sa.Text, nullable=False),
        sa.Column("confidence", sa.Float, nullable=True),
        sa.Column("action_taken", sa.String(32), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_flags_interaction_id", "flags", ["interaction_id"])


def downgrade() -> None:
    op.drop_table("flags")
    op.drop_table("interactions")
    op.drop_table("policy_configs")
