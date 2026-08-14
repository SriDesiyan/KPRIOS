from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.case import CaseStatus


class CaseBase(BaseModel):
    case_number: str = Field(..., description="Unique legal case tracking number e.g. CR-2026-0891")
    title: str = Field(..., min_length=2, description="Descriptive case title")
    description: Optional[str] = None
    status: CaseStatus = CaseStatus.ACTIVE


class CaseCreate(CaseBase):
    pass


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CaseStatus] = None


class CaseResponse(CaseBase):
    id: str
    created_by_id: str
    created_at: datetime
    updated_at: datetime
    evidence_count: int = 0
    entity_count: int = 0
    fact_count: int = 0
    hypothesis_count: int = 0
    gap_count: int = 0

    model_config = ConfigDict(from_attributes=True)
