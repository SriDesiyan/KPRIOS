import enum
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates
from sqlalchemy.types import JSON

from app.core.database import Base


class FactType(str, enum.Enum):
    OBSERVATION = "OBSERVATION"
    TECHNICAL_ARTIFACT = "TECHNICAL_ARTIFACT"
    COMMUNICATION = "COMMUNICATION"
    GEO_LOCATION = "GEO_LOCATION"
    TIMELINE_EVENT = "TIMELINE_EVENT"
    LEGAL_DOCUMENT = "LEGAL_DOCUMENT"


class Fact(Base):
    __tablename__ = "facts"

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
    fact_type: Mapped[FactType] = mapped_column(
        Enum(
            FactType,
            name="fact_type",
            native_enum=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        default=FactType.OBSERVATION,
        nullable=False,
    )
    event_timestamp: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )
    # Mandatory non-empty source_ids array for structural provenance
    source_ids: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
    )
    confidence: Mapped[float] = mapped_column(
        Float,
        default=1.0,
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
    case = relationship("Case", back_populates="facts")

    @validates("source_ids")
    def validate_source_ids(self, key, value):
        if not value or not isinstance(value, list) or len(value) == 0:
            raise ValueError(
                "Invariant violation: source_ids must be a non-empty list of evidence identifiers."
            )
        return value

    def __repr__(self) -> str:
        return f"<Fact id={self.id} type={self.fact_type} stmt={self.statement[:25]}...>"
