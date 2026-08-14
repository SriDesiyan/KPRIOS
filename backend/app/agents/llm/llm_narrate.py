from typing import Any, Dict, List

from app.agents.llm.provenance_validator import validate_narrative_provenance


def narrate_strategy_recommendation(
    action_type: str,
    description: str,
    eig_score: float,
    discriminates_between: List[str],
    hypotheses: List[Dict[str, Any]],
    known_entities: List[Dict[str, Any]],
    known_evidence: List[Dict[str, Any]],
) -> str:
    """
    Generates plain-language, investigator-facing explanation for a strategy recommendation.
    Cites which named hypotheses the candidate action discriminates between and its EIG.
    Strictly validated post-generation against known entity provenance.
    """
    # Lookup hypothesis statements
    hyp_names = []
    for h_id in discriminates_between:
        match = next((h.get("statement", h_id) for h in hypotheses if h.get("id") == h_id), h_id)
        hyp_names.append(f"'{match[:35]}...'")

    hyp_summary = " and ".join(hyp_names) if hyp_names else "competing propositions"

    narrative = (
        f"Recommended action: {description}. This investigative step provides an Expected Information Gain "
        f"of {eig_score:.3f} bits (PoC approximation), effectively discriminating between {hyp_summary}. "
        f"Executing this action directly addresses identified coverage gaps while preserving strict forensic provenance."
    )

    # Post-generation provenance check
    is_valid, flagged, text = validate_narrative_provenance(
        narrative, known_entities, known_evidence
    )
    if not is_valid:
        narrative += f" [Note: Flagged unverified mentions: {', '.join(flagged)}]"

    return narrative
