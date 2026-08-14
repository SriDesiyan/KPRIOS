import math
from typing import Any, Dict, List

# Hand-authored, explicitly labelled Action Outcome Probability Model
# Invariant: This is a Proof-of-Concept approximation for demonstration and ranking, never a calibrated legal probability.
ACTION_OUTCOME_MODEL = {
    "request_isp_subscriber_records": [
        {
            "name": "CONFIRMS_SUSPECT_IP",
            "probability": 0.65,
            "support_impact": 0.35,
            "attack_impact": 0.0,
        },
        {
            "name": "DISPROVES_OR_PROXY_IP",
            "probability": 0.35,
            "support_impact": 0.0,
            "attack_impact": 0.40,
        },
    ],
    "extract_device_forensic_telemetry": [
        {
            "name": "CONFIRMS_SCENE_GEOLOCATION",
            "probability": 0.70,
            "support_impact": 0.40,
            "attack_impact": 0.0,
        },
        {
            "name": "CONFLICTS_SCENE_GEOLOCATION",
            "probability": 0.30,
            "support_impact": 0.0,
            "attack_impact": 0.45,
        },
    ],
    "query_cryptocurrency_ledger": [
        {
            "name": "TRACES_TO_EXCHANGE_KYC",
            "probability": 0.55,
            "support_impact": 0.30,
            "attack_impact": 0.0,
        },
        {
            "name": "UNHOSTED_PRIVACY_MIXER",
            "probability": 0.45,
            "support_impact": 0.05,
            "attack_impact": 0.15,
        },
    ],
    "merge_candidate_entities": [
        {
            "name": "MERGE_CONFIRMED",
            "probability": 0.80,
            "support_impact": 0.25,
            "attack_impact": 0.0,
        },
        {
            "name": "DISTINCT_ACTORS",
            "probability": 0.20,
            "support_impact": 0.0,
            "attack_impact": 0.20,
        },
    ],
    "subpoena_telecom_tower_dump": [
        {
            "name": "CORROBORATES_PRESENCE",
            "probability": 0.60,
            "support_impact": 0.35,
            "attack_impact": 0.0,
        },
        {
            "name": "ABSENT_FROM_TOWER",
            "probability": 0.40,
            "support_impact": 0.0,
            "attack_impact": 0.50,
        },
    ],
}


def calculate_shannon_entropy(probabilities: List[float]) -> float:
    """
    Computes Shannon Entropy: H(P) = -sum(p * log2(p)) for p > 0.
    Measures the uncertainty over competing hypotheses in bits.
    """
    total = sum(probabilities)
    if total <= 0:
        return 0.0

    normalized = [p / total for p in probabilities if p > 0]
    entropy = 0.0
    for p in normalized:
        if p > 1e-9:
            entropy -= p * math.log2(p)

    return round(entropy, 4)


def compute_expected_information_gain(
    action_type: str,
    current_hypotheses: List[Dict[str, Any]],
    discriminates_between: List[str],
) -> Dict[str, Any]:
    """
    Computes Expected Information Gain (EIG) in bits for a candidate investigative action
    using the simulated outcome branches in ACTION_OUTCOME_MODEL.
    EIG = H(S) - E[H(S | A)]
    Invariant: Clearly labelled as 'PoC approximation', never presented as calibrated probability.
    """
    if not current_hypotheses:
        return {
            "eig_score": 0.0,
            "current_entropy": 0.0,
            "expected_posterior_entropy": 0.0,
            "unit": "bits",
            "is_poc_approximation": True,
        }

    # 1. Compute prior entropy H(S)
    prior_probs = [float(h.get("belief", 0.5)) for h in current_hypotheses]
    prior_entropy = calculate_shannon_entropy(prior_probs)

    # 2. Get outcome branches for this action type (defaulting to standard binary test)
    branches = ACTION_OUTCOME_MODEL.get(
        action_type,
        [
            {
                "name": "CONFIRMATORY_OUTCOME",
                "probability": 0.5,
                "support_impact": 0.25,
                "attack_impact": 0.0,
            },
            {
                "name": "DISCONFIRMATORY_OUTCOME",
                "probability": 0.5,
                "support_impact": 0.0,
                "attack_impact": 0.25,
            },
        ],
    )

    # 3. Simulate posterior entropy for each branch
    expected_posterior_entropy = 0.0

    for branch in branches:
        p_branch: float = float(str(branch.get("probability", 0.5)))
        sup_imp: float = float(str(branch.get("support_impact", 0.0)))
        att_imp: float = float(str(branch.get("attack_impact", 0.0)))

        simulated_probs: List[float] = []
        for h in current_hypotheses:
            h_id = h.get("id")
            cur_b = float(h.get("belief", 0.5))

            if h_id in discriminates_between:
                # Primary target hypothesis affected
                updated_b = max(0.01, cur_b * (1.0 + sup_imp) * (1.0 - att_imp))
            else:
                # Secondary hypothesis normalized inversely
                updated_b = max(0.01, cur_b * (1.0 - (0.5 * sup_imp)))

            simulated_probs.append(updated_b)

        branch_entropy = calculate_shannon_entropy(simulated_probs)
        expected_posterior_entropy += p_branch * branch_entropy

    eig = max(0.0, round(prior_entropy - expected_posterior_entropy, 4))

    return {
        "eig_score": eig,
        "current_entropy": prior_entropy,
        "expected_posterior_entropy": round(expected_posterior_entropy, 4),
        "unit": "bits",
        "is_poc_approximation": True,
        "outcome_branches_simulated": len(branches),
    }
