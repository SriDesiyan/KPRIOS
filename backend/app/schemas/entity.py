from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.entity import EntityType, ProposalStatus


class EntityBase(BaseModel):
    name: str = Field(..., min_length=1)
    entity_type: EntityType = EntityType.PERSON
    attributes: Dict[str, Any] = Field(default_factory=dict)
    source_ids: List[str] = Field(
        ..., min_length=1, description="Mandatory non-empty source evidence IDs"
    )
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)

    @field_validator("source_ids")
    @classmethod
    def validate_source_ids(cls, v: List[str]) -> List[str]:
        if not v or len(v) == 0:
            raise ValueError(
                "Invariant violation: source_ids must contain at least one evidence identifier."
            )
        return v


class EntityCreate(EntityBase):
    pass


class EntityResponse(EntityBase):
    id: str
    case_id: str
    is_merged: bool
    merged_into_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EntityMergeProposalResponse(BaseModel):
    id: str
    case_id: str
    source_entity: EntityResponse
    target_entity: EntityResponse
    similarity_score: float
    reason: str
    status: ProposalStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
