import enum
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base


class GapType(str, enum.Enum):
    MISSING_CORROBORATION = "MISSING_CORROBORATION"
    TEMPORAL_DISCONTINUITY = "TEMPORAL_DISCONTINUITY"
    UNRESOLVED_IDENTITY = "UNRESOLVED_IDENTITY"
    UNVERIFIED_LOCATION = "UNVERIFIED_LOCATION"
    INSUFFICIENT_TIMELINE = "INSUFFICIENT_TIMELINE"
    UNCOLLECTED_ISP_RECORDS = "UNCOLLECTED_ISP_RECORDS"


class GapStatus(str, enum.Enum):
    IDENTIFIED = "IDENTIFIED"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"


class GapEntry(Base):
    __tablename__ = "gap_entries"

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
    gap_type: Mapped[GapType] = mapped_column(
        Enum(
            GapType,
            name="gap_type",
            native_enum=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        default=GapType.MISSING_CORROBORATION,
        nullable=False,
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    target_entity_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("entities.id", ondelete="SET NULL"),
        nullable=True,
    )
    source_ids: Mapped[List[str]] = mapped_column(
        JSON,
        default=list,
        nullable=False,
    )
    status: Mapped[GapStatus] = mapped_column(
        Enum(
            GapStatus,
            name="gap_status",
            native_enum=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        default=GapStatus.IDENTIFIED,
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
    case = relationship("Case", back_populates="gaps")

    def __repr__(self) -> str:
        return f"<GapEntry id={self.id} type={self.gap_type} status={self.status}>"
