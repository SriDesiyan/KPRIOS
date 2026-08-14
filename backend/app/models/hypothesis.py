import enum
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates
from sqlalchemy.types import JSON

from app.core.database import Base


class HypothesisStatus(str, enum.Enum):
    PROPOSED = "PROPOSED"
    ACTIVE = "ACTIVE"
    REFUTED = "REFUTED"
    ELEVATED = "ELEVATED"


class Hypothesis(Base):
    __tablename__ = "hypotheses"

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
    statement: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    status: Mapped[HypothesisStatus] = mapped_column(
        Enum(
            HypothesisStatus,
            name="hypothesis_status",
            native_enum=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        default=HypothesisStatus.PROPOSED,
        nullable=False,
    )
    prior_probability: Mapped[float] = mapped_column(
        Float,
        default=0.5,
        nullable=False,
    )
    # Mandatory non-empty source_ids array for structural provenance
    source_ids: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
    )
    attributes: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    case = relationship("Case", back_populates="hypotheses")

    @validates("source_ids")
    def validate_source_ids(self, key, value):
        if not value or not isinstance(value, list) or len(value) == 0:
            raise ValueError(
                "Invariant violation: source_ids must be a non-empty list of evidence identifiers."
            )
        return value

    def __repr__(self) -> str:
        return f"<Hypothesis id={self.id} status={self.status} stmt={self.statement[:25]}...>"
