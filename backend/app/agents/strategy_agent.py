import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List

from app.agents.engines.information_gain import compute_expected_information_gain
from app.agents.llm.llm_narrate import narrate_strategy_recommendation
from app.agents.state import InvestigationStateDict
from app.core.logging import logger


def run_strategy_agent_step(state: InvestigationStateDict) -> InvestigationStateDict:
    """
    Strategy Agent Node (EIG Optimization & Recommendation):
    Reads state -> Identifies gaps/contradictions -> Generates candidate actions ->
    Computes Shannon EIG -> Ranks actions -> Explains top recommendation with named hypothesis citations.
    """
    case_id = state.get("case_id", "unknown")
    state["current_agent"] = "strategy_agent"
    version = state.get("version", 1) + 1
    state["version"] = version

    audit_log = state.setdefault("audit_log", [])
    timestamp_str = datetime.now(timezone.utc).isoformat()

    hypotheses = state.get("hypotheses", [])
    gaps = state.get("evidence_gaps", [])
    contradictions = state.get("contradictions", [])
    evidence_items = state.get("evidence", [])
    graph = state.get("evidence_graph", {"nodes": [], "edges": []})
    entities = [n for n in graph.get("nodes", []) if n.get("node_type") == "entity"]

    # 1. Generate Candidate Actions from Gaps, Contradictions, and Hypotheses
    raw_candidates: List[Dict[str, Any]] = []
    hyp_ids = [h.get("id", "") for h in hypotheses]
    primary_target = [hyp_ids[0]] if hyp_ids else []

    # Action from ISP Gaps
    has_isp_gap = any(g.get("gap_type") == "UNCOLLECTED_ISP_RECORDS" for g in gaps)
    if has_isp_gap:
        raw_candidates.append(
            {
                "action_type": "request_isp_subscriber_records",
                "description": "Request ISP subscriber records and IP assignment logs for identified chat timestamps",
                "tier": "REVIEW",
                "payload": {
                    "authority": "Section 91 CrPC / IT Act",
                    "service": "Telecom/ISP Gateway",
                },
                "discriminates_between": primary_target,
            }
        )

    # Action from Location / EXIF Gaps
    has_loc_gap = any(g.get("gap_type") == "UNVERIFIED_LOCATION" for g in gaps)
    if has_loc_gap:
        raw_candidates.append(
            {
                "action_type": "extract_device_forensic_telemetry",
                "description": "Extract full BSSID and cell tower telemetry from suspect device images to verify scene coordinates",
                "tier": "AUTO",
                "payload": {"target_modality": "IMAGE"},
                "discriminates_between": primary_target,
            }
        )

    # Action from Contradictions
    if contradictions:
        raw_candidates.append(
            {
                "action_type": "subpoena_telecom_tower_dump",
                "description": "Subpoena multi-carrier cellular tower dump at contradiction coordinates to resolve spatiotemporal conflict",
                "tier": "REVIEW",
                "payload": {"conflict_id": contradictions[0].get("id")},
                "discriminates_between": primary_target,
            }
        )

    # Action from Unresolved Identity Handles
    has_identity_gap = any(g.get("gap_type") == "UNRESOLVED_IDENTITY" for g in gaps)
    if has_identity_gap:
        raw_candidates.append(
            {
                "action_type": "merge_candidate_entities",
                "description": "Evaluate high-similarity candidate entity merge proposal under investigator oversight",
                "tier": "REVIEW",
                "payload": {"target_gap": "UNRESOLVED_IDENTITY"},
                "discriminates_between": primary_target,
            }
        )

    # Action from Crypto addresses
    has_crypto = any(
        e.get("sub_type") == "CRYPTO_ADDRESS" or e.get("entity_type") == "CRYPTO_ADDRESS"
        for e in entities
    )
    if has_crypto:
        raw_candidates.append(
            {
                "action_type": "query_cryptocurrency_ledger",
                "description": "Query blockchain ledger and trace transaction hops to identify exchange KYC account",
                "tier": "AUTO",
                "payload": {"chain": "ethereum/bitcoin"},
                "discriminates_between": primary_target,
            }
        )

    # Fallback standard investigative candidate
    if not raw_candidates:
        raw_candidates.append(
            {
                "action_type": "request_isp_subscriber_records",
                "description": "Request comprehensive subscriber and call detail records for active phone numbers",
                "tier": "REVIEW",
                "payload": {},
                "discriminates_between": primary_target,
            }
        )

    # 2. Compute Expected Information Gain (EIG) and Narrate Justifications
    scored_candidates: List[Dict[str, Any]] = []
    for cand in raw_candidates:
        cand_id = str(uuid.uuid4())
        eig_res = compute_expected_information_gain(
            action_type=cand["action_type"],
            current_hypotheses=hypotheses,
            discriminates_between=cand.get("discriminates_between", []),
        )
        eig_val = eig_res["eig_score"]

        justification = narrate_strategy_recommendation(
            action_type=cand["action_type"],
            description=cand["description"],
            eig_score=eig_val,
            discriminates_between=cand.get("discriminates_between", []),
            hypotheses=hypotheses,
            known_entities=entities,
            known_evidence=evidence_items,
        )

        scored_candidates.append(
            {
                "id": cand_id,
                "action_type": cand["action_type"],
                "description": cand["description"],
                "eig_score": eig_val,
                "justification": justification,
                "tier": cand["tier"],
                "payload": cand["payload"],
                "discriminates_between": cand.get("discriminates_between", []),
                "current_entropy": eig_res["current_entropy"],
                "expected_posterior_entropy": eig_res["expected_posterior_entropy"],
                "is_poc_approximation": True,
            }
        )

    # 3. Rank Candidates by EIG descending
    scored_candidates.sort(key=lambda x: x["eig_score"], reverse=True)
    state["candidate_actions"] = scored_candidates

    top_action = scored_candidates[0] if scored_candidates else None
    audit_log.append(
        {
            "agent": "strategy_agent",
            "step": "Rank",
            "input_summary": f"Evaluated {len(scored_candidates)} candidate actions across {len(hypotheses)} competing hypotheses.",
            "output_summary": (
                f"Top recommendation: '{top_action['description']}' with EIG {top_action['eig_score']:.3f} bits."
                if top_action
                else "No candidates generated."
            ),
            "timestamp": timestamp_str,
        }
    )

    logger.info(
        f"Strategy Agent generated {len(scored_candidates)} ranked recommendations for case {case_id}"
    )
    return state
