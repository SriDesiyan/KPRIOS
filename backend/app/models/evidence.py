import enum
import uuid
from datetime import datetime, timezone
from typing import Any, Dict

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base


class EvidenceModality(str, enum.Enum):
    IMAGE = "IMAGE"
    DOCUMENT = "DOCUMENT"
    CHAT_LOG = "CHAT_LOG"
    CALL_RECORD = "CALL_RECORD"
    NETWORK_PCAP = "NETWORK_PCAP"
    VIDEO = "VIDEO"
    AUDIO = "AUDIO"
    OTHER = "OTHER"


class EvidenceItem(Base):
    __tablename__ = "evidence_items"

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
    hash: Mapped[str] = mapped_column(
        String(64),  # SHA-256 hex string (64 characters)
        index=True,
        nullable=False,
    )
    source_fingerprint: Mapped[str] = mapped_column(
        String(128),
        index=True,
        nullable=False,
    )
    modality: Mapped[EvidenceModality] = mapped_column(
        Enum(
            EvidenceModality,
            name="evidence_modality",
            native_enum=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        default=EvidenceModality.OTHER,
        nullable=False,
    )
    file_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    file_size_bytes: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )
    mime_type: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
    )
    storage_path: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
    )
    # Embedded TrustVector: { reliability: float, authenticity: float, freshness: float, provenance_score: float }
    trust_vector: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        default=lambda: {
            "reliability": 1.0,
            "authenticity": 1.0,
            "freshness": 1.0,
            "provenance_score": 1.0,
        },
        nullable=False,
    )
    # Extracted EXIF, OCR, headers, device metadata
    metadata_payload: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
    )
    ingested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    ingested_by_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    case = relationship("Case", back_populates="evidence_items")

    def __repr__(self) -> str:
        return f"<EvidenceItem id={self.id} file={self.file_name} hash={self.hash[:8]}...>"
