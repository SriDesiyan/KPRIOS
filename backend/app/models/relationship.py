import enum
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates
from sqlalchemy.types import JSON

from app.core.database import Base


class RelationshipType(str, enum.Enum):
    # Five locked edge types per Global Context
    SUPPORTS = "supports"
    ATTACKS = "attacks"
    DERIVES_FROM = "derives_from"
    CONTRADICTS = "contradicts"
    ASSOCIATED_WITH = "associated_with"


class Relationship(Base):
    __tablename__ = "relationships"

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
    source_entity_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("entities.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    target_entity_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("entities.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    relationship_type: Mapped[RelationshipType] = mapped_column(
        Enum(
            RelationshipType,
            name="relationship_type",
            native_enum=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        default=RelationshipType.ASSOCIATED_WITH,
        nullable=False,
    )
    statement: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    attributes: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
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
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    case = relationship("Case", back_populates="relationships")

    @validates("source_ids")
    def validate_source_ids(self, key, value):
        if not value or not isinstance(value, list) or len(value) == 0:
            raise ValueError(
                "Invariant violation: source_ids must be a non-empty list of evidence identifiers."
            )
        return value

    def __repr__(self) -> str:
        return f"<Relationship id={self.id} type={self.relationship_type} {self.source_entity_id}->{self.target_entity_id}>"
