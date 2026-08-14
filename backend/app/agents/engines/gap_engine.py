import uuid
from typing import Any, Dict, List

from app.models.entity import EntityType

# Expected evidence ontology per modality/investigative category
EXPECTED_REQUIREMENTS = {
    "CHAT_LOG": ["CALL_RECORD", "DIGITAL_ACCOUNT"],
    "IMAGE": ["EXIF_TIMESTAMP", "GEO_LOCATION"],
    "CRYPTO_ADDRESS": ["TRANSACTION_LEDGER", "EXCHANGE_KYC"],
}


def detect_evidence_gaps(
    evidence_items: List[Dict[str, Any]],
    entities: List[Dict[str, Any]],
    hypotheses: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Evaluates evidence gaps using domain ontology comparison against present artifacts.
    Identifies uncorroborated hypotheses, uncollected ISP/CDR records, and unverified identities.
    """
    gaps: List[Dict[str, Any]] = []
    seen_modalities = {e.get("modality") for e in evidence_items}

    # 1. Check for Chat Logs without CDR/ISP Records
    if "CHAT_LOG" in seen_modalities and "CALL_RECORD" not in seen_modalities:
        gaps.append(
            {
                "id": str(uuid.uuid4()),
                "gap_type": "UNCOLLECTED_ISP_RECORDS",
                "description": "Chat log evidence present without corroborating ISP subscriber logs or Call Detail Records (CDR).",
                "status": "IDENTIFIED",
                "source_ids": [e["id"] for e in evidence_items if e.get("modality") == "CHAT_LOG"],
            }
        )

    # 2. Check for Images with missing EXIF / GPS
    for ev in evidence_items:
        if ev.get("modality") == "IMAGE":
            has_gps = ev.get("metadata_payload", {}).get("geo_location") is not None
            if not has_gps:
                gaps.append(
                    {
                        "id": str(uuid.uuid4()),
                        "gap_type": "UNVERIFIED_LOCATION",
                        "description": f"Image '{ev.get('file_name')}' lacks GPS telemetry; physical location unverified.",
                        "status": "IDENTIFIED",
                        "source_ids": [ev["id"]],
                    }
                )

    # 3. Check for Unresolved Digital Account Handles
    for ent in entities:
        if (
            ent.get("entity_type") == EntityType.DIGITAL_ACCOUNT.value
            or ent.get("entity_type") == "DIGITAL_ACCOUNT"
        ):
            if not ent.get("is_merged") and "email" not in ent.get("name", ""):
                gaps.append(
                    {
                        "id": str(uuid.uuid4()),
                        "gap_type": "UNRESOLVED_IDENTITY",
                        "description": f"Digital account handle '{ent.get('name')}' is unlinked to a verified legal identity.",
                        "status": "IDENTIFIED",
                        "target_entity_id": ent.get("id"),
                        "source_ids": ent.get("source_ids", []),
                    }
                )

    # 4. Check for Hypotheses with Low Corroboration Count (< 2)
    for hyp in hypotheses:
        support_cnt = int(hyp.get("support_count", 0))
        statement_str = str(hyp.get("statement", "Hypothesis"))
        if support_cnt < 2 and hyp.get("status") != "REFUTED":
            gaps.append(
                {
                    "id": str(uuid.uuid4()),
                    "gap_type": "MISSING_CORROBORATION",
                    "description": f"Hypothesis '{statement_str[:40]}...' has only {support_cnt} corroborating source cluster(s).",
                    "status": "IDENTIFIED",
                    "source_ids": hyp.get("source_ids", []),
                }
            )

    return gaps
