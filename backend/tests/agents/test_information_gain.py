from app.agents.engines.information_gain import (
    calculate_shannon_entropy,
    compute_expected_information_gain,
)


def test_shannon_entropy_calculation():
    """
    Tests Shannon Entropy against known analytical values:
    - Uniform binary distribution [0.5, 0.5] => H = 1.0 bit
    - Certain distribution [1.0, 0.0] => H = 0.0 bits
    - Uniform 4-state distribution [0.25, 0.25, 0.25, 0.25] => H = 2.0 bits
    """
    # Binary uniform
    assert calculate_shannon_entropy([0.5, 0.5]) == 1.0

    # Certainty
    assert calculate_shannon_entropy([1.0, 0.0]) == 0.0

    # 4-state uniform
    assert calculate_shannon_entropy([0.25, 0.25, 0.25, 0.25]) == 2.0


def test_expected_information_gain_ranking():
    """
    Verifies that EIG computation produces positive information gain
    and correctly labels results as PoC approximation.
    """
    hypotheses = [
        {"id": "H1", "statement": "Suspect operated account", "belief": 0.5},
        {"id": "H2", "statement": "Third-party hijacked account", "belief": 0.5},
    ]

    res = compute_expected_information_gain(
        action_type="request_isp_subscriber_records",
        current_hypotheses=hypotheses,
        discriminates_between=["H1"],
    )

    assert res["current_entropy"] == 1.0
    assert res["eig_score"] > 0.0
    assert res["unit"] == "bits"
    assert res["is_poc_approximation"] is True
    assert res["outcome_branches_simulated"] > 0
