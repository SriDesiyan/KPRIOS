import enum
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates
from sqlalchemy.types import JSON

from app.core.database import Base


class EntityType(str, enum.Enum):
    # Aligned with CAC-Ontology & CASE/UCO 1.5.0 classes
    PERSON = "PERSON"
    OFFENDER = "OFFENDER"
    VICTIM = "VICTIM"
    DIGITAL_ACCOUNT = "DIGITAL_ACCOUNT"
    PHONE_NUMBER = "PHONE_NUMBER"
    DEVICE = "DEVICE"
    LOCATION = "LOCATION"
    ORGANIZATION = "ORGANIZATION"
    CRYPTO_ADDRESS = "CRYPTO_ADDRESS"
    ONLINE_SERVICE = "ONLINE_SERVICE"


class ProposalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Entity(Base):
    __tablename__ = "entities"

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
    name: Mapped[str] = mapped_column(
        String(255),
        index=True,
        nullable=False,
    )
    entity_type: Mapped[EntityType] = mapped_column(
        Enum(
            EntityType,
            name="entity_type",
            native_enum=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        default=EntityType.PERSON,
        nullable=False,
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
    is_merged: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    merged_into_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("entities.id", ondelete="SET NULL"),
        nullable=True,
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
    case = relationship("Case", back_populates="entities")

    @validates("source_ids")
    def validate_source_ids(self, key, value):
        if not value or not isinstance(value, list) or len(value) == 0:
            raise ValueError(
                "Invariant violation: source_ids must be a non-empty list of evidence identifiers."
            )
        return value

    def __repr__(self) -> str:
        return f"<Entity id={self.id} type={self.entity_type} name={self.name}>"


class EntityMergeProposal(Base):
    __tablename__ = "entity_merge_proposals"

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
        nullable=False,
    )
    target_entity_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    similarity_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    reason: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    status: Mapped[ProposalStatus] = mapped_column(
        Enum(
            ProposalStatus,
            name="proposal_status",
            native_enum=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        default=ProposalStatus.PENDING,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<EntityMergeProposal src={self.source_entity_id} tgt={self.target_entity_id} score={self.similarity_score}>"
