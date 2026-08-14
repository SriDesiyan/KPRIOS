from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.evidence import EvidenceModality


class TrustVectorSchema(BaseModel):
    reliability: float = Field(default=1.0, ge=0.0, le=1.0)
    authenticity: float = Field(default=1.0, ge=0.0, le=1.0)
    freshness: float = Field(default=1.0, ge=0.0, le=1.0)
    provenance_score: float = Field(default=1.0, ge=0.0, le=1.0)


class EvidenceItemResponse(BaseModel):
    id: str
    case_id: str
    hash: str
    source_fingerprint: str
    modality: EvidenceModality
    file_name: str
    file_size_bytes: int
    mime_type: str
    trust_vector: TrustVectorSchema
    metadata_payload: Dict[str, Any]
    ingested_at: datetime
    ingested_by_id: Optional[str] = None
    extracted_entities_count: int = 0
    extracted_facts_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class IngestionResult(BaseModel):
    evidence_item: EvidenceItemResponse
    extracted_entities: List[Dict[str, Any]]
    extracted_facts: List[Dict[str, Any]]
    message: str = "Evidence ingested and processed successfully"
