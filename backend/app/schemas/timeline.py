from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict


class TimelineEvent(BaseModel):
    id: str
    case_id: str
    timestamp: datetime
    title: str
    description: str
    event_type: str  # "EXTRACTED_EXIF", "CHAT_MESSAGE", "CALL_LOG", "OBSERVATION", "INGESTION"
    source_ids: List[str]
    confidence: float = 1.0
    evidence_file_name: Optional[str] = None
    attributes: Dict[str, Any] = {}

    model_config = ConfigDict(from_attributes=True)


class TimelineResponse(BaseModel):
    case_id: str
    total_events: int
    events: List[TimelineEvent]
