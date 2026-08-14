import enum
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CaseStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    CLOSED = "CLOSED"


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    case_number: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    status: Mapped[CaseStatus] = mapped_column(
        Enum(
            CaseStatus,
            name="case_status",
            native_enum=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        default=CaseStatus.ACTIVE,
        nullable=False,
    )
    created_by_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    evidence_items = relationship(
        "EvidenceItem", back_populates="case", cascade="all, delete-orphan"
    )
    entities = relationship("Entity", back_populates="case", cascade="all, delete-orphan")
    facts = relationship("Fact", back_populates="case", cascade="all, delete-orphan")
    relationships = relationship(
        "Relationship", back_populates="case", cascade="all, delete-orphan"
    )
    hypotheses = relationship("Hypothesis", back_populates="case", cascade="all, delete-orphan")
    gaps = relationship("GapEntry", back_populates="case", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Case id={self.id} case_number={self.case_number} title={self.title}>"
