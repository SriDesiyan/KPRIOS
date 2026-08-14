import enum
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.core.database import Base


class ActionDecision(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class CandidateAction(Base):
    __tablename__ = "candidate_actions"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    case_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("cases.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    action_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    eig_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )
    justification: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    tier: Mapped[str] = mapped_column(
        String(16),
        default="REVIEW",
        nullable=False,
    )
    payload: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(32),
        default="PROPOSED",
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class PendingApproval(Base):
    __tablename__ = "pending_approvals"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    case_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("cases.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    action_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False,
    )
    action_name: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
    )
    payload: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
    )
    tier: Mapped[str] = mapped_column(
        String(16),
        default="REVIEW",
        nullable=False,
    )
    decision: Mapped[ActionDecision] = mapped_column(
        Enum(
            ActionDecision,
            name="action_decision",
            native_enum=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        default=ActionDecision.PENDING,
        nullable=False,
    )
    decided_by_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    decided_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )


class AgentRunLog(Base):
    __tablename__ = "agent_run_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    case_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("cases.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    agent: Mapped[str] = mapped_column(
        String(64),  # "investigation_agent" or "strategy_agent"
        nullable=False,
    )
    step: Mapped[str] = mapped_column(
        String(64),  # "Observe", "Understand", "Plan", "Select Tool", "Execute", "Update State"
        nullable=False,
    )
    input_summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    output_summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    details: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class CaseStateRecord(Base):
    __tablename__ = "case_state_records"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    case_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("cases.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    version: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )
    state_payload: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
