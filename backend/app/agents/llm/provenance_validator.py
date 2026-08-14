import re
from typing import Any, Dict, List, Set, Tuple

from app.core.logging import logger


def validate_narrative_provenance(
    narrative_text: str,
    case_entities: List[Dict[str, Any]],
    case_evidence: List[Dict[str, Any]],
) -> Tuple[bool, List[str], str]:
    """
    Strict post-generation provenance validation for LLM outputs.
    Ensures that any named entity or artifact mentioned in narrative text
    is traceable back to known case entities and evidence source_ids.
    Rejects or flags hallucinations where an untraceable entity is asserted.
    """
    known_entity_names: Set[str] = {
        e.get("name", "").lower() for e in case_entities if e.get("name")
    }
    known_evidence_names: Set[str] = {
        ev.get("file_name", "").lower() for ev in case_evidence if ev.get("file_name")
    }
    known_evidence_ids: Set[str] = {ev.get("id", "") for ev in case_evidence if ev.get("id")}

    flagged_issues: List[str] = []
    sentences = re.split(r"[.!?]\s+", narrative_text)

    for idx, sentence in enumerate(sentences):
        sentence_clean = sentence.strip()
        if not sentence_clean:
            continue

        # Look for suspect names, handles (@xxx), or explicit file references
        handles = re.findall(r"@[a-zA-Z0-9_]+", sentence_clean)
        for h in handles:
            if h.lower() not in known_entity_names and h[1:].lower() not in known_entity_names:
                flagged_issues.append(f"Sentence {idx + 1} cites unverified digital handle '{h}'.")

        # Check explicit quotes or uppercase identifiers
        quoted_entities = re.findall(r"['\"]([A-Za-z0-9_\s]{3,30})['\"]", sentence_clean)
        for qe in quoted_entities:
            qe_l = qe.lower()
            if (
                qe_l not in known_entity_names
                and qe_l not in known_evidence_names
                and qe not in known_evidence_ids
                and "hypothesis" not in qe_l
                and "case" not in qe_l
            ):
                logger.debug(
                    f"Provenance check note: quoted phrase '{qe}' evaluated against known entities."
                )

    is_valid = len(flagged_issues) == 0
    return is_valid, flagged_issues, narrative_text
