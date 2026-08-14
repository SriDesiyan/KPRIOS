import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.models.entity import EntityType
from app.models.fact import FactType

# Regex patterns for deterministic forensic entity extraction
EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
PHONE_REGEX = re.compile(r"(?:\+91[\-\s]?)?[6-9]\d{9}\b|\+?[1-9]\d{1,14}\b")
CRYPTO_BTC_REGEX = re.compile(r"\b(?:bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}\b")
CRYPTO_ETH_REGEX = re.compile(r"\b0x[a-fA-F0-9]{40}\b")
HANDLE_REGEX = re.compile(r"(?<=[\s@])@[a-zA-Z0-9_]{3,25}\b")
TIMESTAMP_REGEX = re.compile(
    r"\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})?\b"
)

# Try importing spacy for NER
nlp: Any = None
try:
    import spacy

    nlp = spacy.blank("en")
    if "sentencizer" not in nlp.pipe_names:
        nlp.add_pipe("sentencizer")
except Exception:
    nlp = None


def extract_entities_from_text(
    text: str,
    source_evidence_id: str,
) -> List[Dict[str, Any]]:
    """
    Extracts candidate entities from text content matching CAC-Ontology classes.
    Every entity includes mandatory source_ids linking back to the evidence artifact.
    """
    if not text or not text.strip():
        return []

    entities: List[Dict[str, Any]] = []
    seen_keys = set()

    def add_entity(
        name: str,
        entity_type: EntityType,
        confidence: float = 1.0,
        attrs: Optional[Dict[str, Any]] = None,
    ):
        name_clean = name.strip()
        if len(name_clean) < 2:
            return
        key = f"{entity_type.value}:{name_clean.lower()}"
        if key not in seen_keys:
            seen_keys.add(key)
            entities.append(
                {
                    "name": name_clean,
                    "entity_type": entity_type,
                    "confidence": confidence,
                    "source_ids": [source_evidence_id],
                    "attributes": attrs or {},
                }
            )

    # 1. Emails
    for match in EMAIL_REGEX.finditer(text):
        add_entity(match.group(), EntityType.DIGITAL_ACCOUNT, 0.98, {"protocol": "email"})

    # 2. Phone Numbers
    for match in PHONE_REGEX.finditer(text):
        val = match.group()
        if len(re.sub(r"\D", "", val)) >= 10:
            add_entity(
                val, EntityType.PHONE_NUMBER, 0.95, {"normalized_digits": re.sub(r"\D", "", val)}
            )

    # 3. Cryptocurrency Addresses
    for match in CRYPTO_ETH_REGEX.finditer(text):
        add_entity(match.group(), EntityType.CRYPTO_ADDRESS, 0.99, {"chain": "ethereum"})
    for match in CRYPTO_BTC_REGEX.finditer(text):
        add_entity(match.group(), EntityType.CRYPTO_ADDRESS, 0.99, {"chain": "bitcoin"})

    # 4. User Handles / Screen Names
    for match in HANDLE_REGEX.finditer(text):
        add_entity(match.group(), EntityType.DIGITAL_ACCOUNT, 0.90, {"platform": "social/chat"})

    # 5. Rule-based Person/Location extraction from formatted chat or lines
    lines = text.splitlines()
    for line in lines:
        line_s = line.strip()
        chat_sender_match = re.match(r"(?:\[.*?\]\s*)?([A-Za-z0-9_]{3,20}):\s+", line_s)
        if chat_sender_match:
            sender = chat_sender_match.group(1)
            add_entity(sender, EntityType.PERSON, 0.85, {"role_hint": "chat_participant"})

        loc_match = re.search(
            r"(?:Location|Place|City|District|Address):\s*([A-Za-z\s,]{3,40})",
            line_s,
            re.IGNORECASE,
        )
        if loc_match:
            loc_val = loc_match.group(1).strip()
            add_entity(loc_val, EntityType.LOCATION, 0.88)

    return entities


def extract_facts_from_content(
    text: str,
    metadata: Dict[str, Any],
    source_evidence_id: str,
) -> List[Dict[str, Any]]:
    """
    Extracts structured facts and timeline events with mandatory source_ids.
    """
    facts: List[Dict[str, Any]] = []

    # 1. Technical file fact
    facts.append(
        {
            "statement": f"Evidence file '{metadata.get('file_name', 'unknown')}' ingested ({metadata.get('file_size', 0)} bytes).",
            "fact_type": FactType.TECHNICAL_ARTIFACT,
            "event_timestamp": datetime.now(timezone.utc),
            "source_ids": [source_evidence_id],
            "confidence": 1.0,
            "attributes": {"mime_type": metadata.get("mime_type")},
        }
    )

    # 2. EXIF timestamp fact if present
    if metadata.get("has_exif") and "timestamps" in metadata:
        orig_time_str = metadata["timestamps"].get("original")
        if orig_time_str:
            parsed_dt = None
            try:
                parsed_dt = datetime.strptime(orig_time_str, "%Y:%m:%d %H:%M:%S").replace(
                    tzinfo=timezone.utc
                )
            except Exception:
                pass

            device_model = metadata.get("device_info", {}).get("model", "Unknown Camera")
            facts.append(
                {
                    "statement": f"Image captured using {device_model} at EXIF timestamp {orig_time_str}.",
                    "fact_type": FactType.TIMELINE_EVENT,
                    "event_timestamp": parsed_dt or datetime.now(timezone.utc),
                    "source_ids": [source_evidence_id],
                    "confidence": 0.95,
                    "attributes": {
                        "exif_timestamp": orig_time_str,
                        "device": metadata.get("device_info"),
                    },
                }
            )

    # 3. GPS fact if present
    if metadata.get("geo_location"):
        coords = metadata["geo_location"]
        facts.append(
            {
                "statement": f"Coordinates recorded in EXIF metadata: Lat {coords['latitude']}, Lon {coords['longitude']}.",
                "fact_type": FactType.GEO_LOCATION,
                "event_timestamp": datetime.now(timezone.utc),
                "source_ids": [source_evidence_id],
                "confidence": 0.95,
                "attributes": coords,
            }
        )

    # 4. Text lines with timestamps
    if text:
        for match in TIMESTAMP_REGEX.finditer(text):
            ts_str = match.group()
            try:
                dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                if not dt.tzinfo:
                    dt = dt.replace(tzinfo=timezone.utc)
                facts.append(
                    {
                        "statement": f"Activity recorded at timestamp {ts_str}.",
                        "fact_type": FactType.TIMELINE_EVENT,
                        "event_timestamp": dt,
                        "source_ids": [source_evidence_id],
                        "confidence": 0.90,
                        "attributes": {"raw_timestamp_string": ts_str},
                    }
                )
            except Exception:
                pass

    return facts
