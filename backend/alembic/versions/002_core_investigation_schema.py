"""Core investigation engine schema migration

Revision ID: 002_core_investigation_schema
Revises: 001_initial_users
Create Date: 2026-08-14 01:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "002_core_investigation_schema"
down_revision: Union[str, None] = "001_initial_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. cases
    op.create_table(
        "cases",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_number", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_by_id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_cases_case_number"), "cases", ["case_number"], unique=True)
    op.create_index(op.f("ix_cases_id"), "cases", ["id"], unique=False)

    # 2. evidence_items
    op.create_table(
        "evidence_items",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("hash", sa.String(length=64), nullable=False),
        sa.Column("source_fingerprint", sa.String(length=128), nullable=False),
        sa.Column("modality", sa.String(length=32), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("mime_type", sa.String(length=128), nullable=False),
        sa.Column("storage_path", sa.String(length=512), nullable=False),
        sa.Column("trust_vector", sa.JSON(), nullable=False),
        sa.Column("metadata_payload", sa.JSON(), nullable=False),
        sa.Column("ingested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ingested_by_id", sa.String(length=36), nullable=True),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["ingested_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_evidence_items_case_id"), "evidence_items", ["case_id"], unique=False)
    op.create_index(op.f("ix_evidence_items_hash"), "evidence_items", ["hash"], unique=False)
    op.create_index(
        op.f("ix_evidence_items_source_fingerprint"),
        "evidence_items",
        ["source_fingerprint"],
        unique=False,
    )
    op.create_index(op.f("ix_evidence_items_id"), "evidence_items", ["id"], unique=False)

    # 3. entities
    op.create_table(
        "entities",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("entity_type", sa.String(length=64), nullable=False),
        sa.Column("attributes", sa.JSON(), nullable=False),
        sa.Column("source_ids", sa.JSON(), nullable=False),
        sa.Column("is_merged", sa.Boolean(), nullable=False),
        sa.Column("merged_into_id", sa.String(length=36), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["merged_into_id"], ["entities.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_entities_case_id"), "entities", ["case_id"], unique=False)
    op.create_index(op.f("ix_entities_name"), "entities", ["name"], unique=False)
    op.create_index(op.f("ix_entities_id"), "entities", ["id"], unique=False)

    # 4. entity_merge_proposals
    op.create_table(
        "entity_merge_proposals",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("source_entity_id", sa.String(length=36), nullable=False),
        sa.Column("target_entity_id", sa.String(length=36), nullable=False),
        sa.Column("similarity_score", sa.Float(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_entity_id"], ["entities.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_entity_id"], ["entities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_entity_merge_proposals_case_id"),
        "entity_merge_proposals",
        ["case_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_entity_merge_proposals_id"), "entity_merge_proposals", ["id"], unique=False
    )

    # 5. relationships
    op.create_table(
        "relationships",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("source_entity_id", sa.String(length=36), nullable=False),
        sa.Column("target_entity_id", sa.String(length=36), nullable=False),
        sa.Column("relationship_type", sa.String(length=64), nullable=False),
        sa.Column("statement", sa.Text(), nullable=True),
        sa.Column("attributes", sa.JSON(), nullable=False),
        sa.Column("source_ids", sa.JSON(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_entity_id"], ["entities.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_entity_id"], ["entities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_relationships_case_id"), "relationships", ["case_id"], unique=False)
    op.create_index(op.f("ix_relationships_id"), "relationships", ["id"], unique=False)

    # 6. facts
    op.create_table(
        "facts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("statement", sa.Text(), nullable=False),
        sa.Column("fact_type", sa.String(length=64), nullable=False),
        sa.Column("event_timestamp", sa.DateTime(timezone=True), nullable=True),
        sa.Column("source_ids", sa.JSON(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("attributes", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_facts_case_id"), "facts", ["case_id"], unique=False)
    op.create_index(op.f("ix_facts_event_timestamp"), "facts", ["event_timestamp"], unique=False)
    op.create_index(op.f("ix_facts_id"), "facts", ["id"], unique=False)

    # 7. hypotheses
    op.create_table(
        "hypotheses",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("statement", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("prior_probability", sa.Float(), nullable=False),
        sa.Column("source_ids", sa.JSON(), nullable=False),
        sa.Column("attributes", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_hypotheses_case_id"), "hypotheses", ["case_id"], unique=False)
    op.create_index(op.f("ix_hypotheses_id"), "hypotheses", ["id"], unique=False)

    # 8. gap_entries
    op.create_table(
        "gap_entries",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("gap_type", sa.String(length=64), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("target_entity_id", sa.String(length=36), nullable=True),
        sa.Column("source_ids", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("attributes", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_entity_id"], ["entities.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_gap_entries_case_id"), "gap_entries", ["case_id"], unique=False)
    op.create_index(op.f("ix_gap_entries_id"), "gap_entries", ["id"], unique=False)


def downgrade() -> None:
    op.drop_table("gap_entries")
    op.drop_table("hypotheses")
    op.drop_table("facts")
    op.drop_table("relationships")
    op.drop_table("entity_merge_proposals")
    op.drop_table("entities")
    op.drop_table("evidence_items")
    op.drop_table("cases")
