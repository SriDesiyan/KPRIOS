"""Agent reasoning schema migration

Revision ID: 003_agent_reasoning_schema
Revises: 002_core_investigation_schema
Create Date: 2026-08-14 02:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "003_agent_reasoning_schema"
down_revision: Union[str, None] = "002_core_investigation_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. candidate_actions
    op.create_table(
        "candidate_actions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("action_type", sa.String(length=64), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("eig_score", sa.Float(), nullable=False),
        sa.Column("justification", sa.Text(), nullable=False),
        sa.Column("tier", sa.String(length=16), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_candidate_actions_case_id"), "candidate_actions", ["case_id"], unique=False
    )
    op.create_index(op.f("ix_candidate_actions_id"), "candidate_actions", ["id"], unique=False)

    # 2. pending_approvals
    op.create_table(
        "pending_approvals",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("action_id", sa.String(length=36), nullable=False),
        sa.Column("action_name", sa.String(length=128), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("tier", sa.String(length=16), nullable=False),
        sa.Column("decision", sa.String(length=32), nullable=False),
        sa.Column("decided_by_id", sa.String(length=36), nullable=True),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["decided_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_pending_approvals_case_id"), "pending_approvals", ["case_id"], unique=False
    )
    op.create_index(op.f("ix_pending_approvals_id"), "pending_approvals", ["id"], unique=False)

    # 3. agent_run_logs
    op.create_table(
        "agent_run_logs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("agent", sa.String(length=64), nullable=False),
        sa.Column("step", sa.String(length=64), nullable=False),
        sa.Column("input_summary", sa.Text(), nullable=False),
        sa.Column("output_summary", sa.Text(), nullable=False),
        sa.Column("details", sa.JSON(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_agent_run_logs_case_id"), "agent_run_logs", ["case_id"], unique=False)
    op.create_index(op.f("ix_agent_run_logs_id"), "agent_run_logs", ["id"], unique=False)

    # 4. case_state_records
    op.create_table(
        "case_state_records",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("state_payload", sa.JSON(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_case_state_records_case_id"), "case_state_records", ["case_id"], unique=False
    )
    op.create_index(op.f("ix_case_state_records_id"), "case_state_records", ["id"], unique=False)


def downgrade() -> None:
    op.drop_table("case_state_records")
    op.drop_table("agent_run_logs")
    op.drop_table("pending_approvals")
    op.drop_table("candidate_actions")
