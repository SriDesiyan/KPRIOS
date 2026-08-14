from typing import Any, Callable, Dict

from app.agents.engines.belief_propagation import compute_belief_distribution
from app.agents.engines.contradiction_engine import detect_contradictions
from app.agents.engines.dependency_analysis import calculate_dependency_impact
from app.agents.engines.gap_engine import detect_evidence_gaps
from app.services.entity_resolution import generate_candidate_merge_proposals
from app.services.extraction import (
    extract_entities_from_text,
    extract_facts_from_content,
    extract_metadata,
    extract_ocr_text,
)

# Deterministic tools callable by the Investigation Agent under the AUTO tier
AGENT_TOOLS: Dict[str, Callable[..., Any]] = {
    "extract_metadata": extract_metadata,
    "extract_ocr": extract_ocr_text,
    "extract_nlp_entities": extract_entities_from_text,
    "extract_facts": extract_facts_from_content,
    "propose_entity_merges": generate_candidate_merge_proposals,
    "detect_gaps": detect_evidence_gaps,
    "detect_contradictions": detect_contradictions,
    "compute_belief_propagation": compute_belief_distribution,
    "compute_dependency_impact": calculate_dependency_impact,
}


def get_tool(tool_name: str) -> Callable[..., Any]:
    """Retrieves a registered deterministic tool by name."""
    if tool_name not in AGENT_TOOLS:
        raise KeyError(f"Tool '{tool_name}' is not registered in AGENT_TOOLS.")
    return AGENT_TOOLS[tool_name]
