import pytest
from httpx import AsyncClient

from app.agents.graph import investigation_graph
from app.agents.state import create_initial_state


def test_investigation_and_strategy_agent_langgraph_cycle():
    """
    Integration Test: Executes a full LangGraph dual-agent cycle on a synthetic state.
    Asserts:
      1. Investigation Agent executes ReAct step (Observe -> Plan -> Execute).
      2. Gaps are identified.
      3. Beliefs are propagated.
      4. Strategy Agent ranks candidate actions with EIG scores.
    """
    state = create_initial_state(case_id="case-synth-100")
    state["hypotheses"] = [
        {
            "id": "H1",
            "statement": "Suspect operated digital account",
            "prior_probability": 0.5,
            "belief": 0.5,
            "source_ids": ["E1"],
        },
        {
            "id": "H2",
            "statement": "Account compromised by malware",
            "prior_probability": 0.5,
            "belief": 0.5,
            "source_ids": ["E1"],
        },
    ]
    state["evidence"] = [
        {
            "id": "E1",
            "file_name": "telegram_chat.txt",
            "modality": "CHAT_LOG",
            "source_fingerprint": "fp_telegram_1",
            "hash": "hash_123",
            "trust_vector": {"reliability": 0.9, "authenticity": 0.95},
        }
    ]
    state["evidence_graph"] = {
        "nodes": [
            {"id": "E1", "node_type": "evidence", "label": "telegram_chat.txt"},
            {"id": "H1", "node_type": "hypothesis", "label": "Suspect operated account"},
            {"id": "H2", "node_type": "hypothesis", "label": "Account compromised"},
        ],
        "edges": [
            {
                "id": "edge_h1",
                "source": "E1",
                "target": "H1",
                "relationship_type": "supports",
                "source_ids": ["E1"],
            },
        ],
    }

    # Execute LangGraph workflow
    result_state = investigation_graph.invoke(state)

    # 1. Check version incremented
    assert result_state["version"] > 1

    # 2. Check Gaps detected (Chat log present without CDR/ISP records)
    assert len(result_state["evidence_gaps"]) >= 1
    assert any(g["gap_type"] == "UNCOLLECTED_ISP_RECORDS" for g in result_state["evidence_gaps"])

    # 3. Check Belief updated for H1 due to support edge
    h1 = next(h for h in result_state["hypotheses"] if h["id"] == "H1")
    assert h1["support_count"] >= 1

    # 4. Check Strategy Agent candidate actions generated & ranked by EIG
    assert len(result_state["candidate_actions"]) >= 1
    top_candidate = result_state["candidate_actions"][0]
    assert top_candidate["eig_score"] > 0
    assert "Expected Information Gain" in top_candidate["justification"]
    assert top_candidate["is_poc_approximation"] is True

    # 5. Check Audit Log contains ReAct steps
    steps = [log.get("step") for log in result_state["audit_log"]]
    assert "Observe" in steps
    assert "Plan" in steps
    assert "Rank" in steps


@pytest.mark.asyncio
async def test_agent_api_endpoints_integration(client: AsyncClient):
    """
    Integration Test: Tests /cases/{id}/investigate, /state, /recommendations,
    and /dependency/{hypothesis_id} through FastAPI HTTP client.
    """
    # 0. Login
    login_resp = await client.post(
        "/auth/login",
        json={
            "email": "investigator@test.police.in",
            "password": "InvestigatorPass123!",
        },
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a case
    create_resp = await client.post(
        "/api/v1/cases",
        headers=headers,
        json={
            "case_number": "CR-2026-9090",
            "title": "Agent Cycle Test Case",
            "description": "Testing agent APIs",
        },
    )
    assert create_resp.status_code == 201
    case_id = create_resp.json()["id"]

    # 2. Trigger investigate cycle
    inv_resp = await client.post(
        f"/api/v1/cases/{case_id}/investigate",
        headers=headers,
    )
    assert inv_resp.status_code == 200
    inv_data = inv_resp.json()
    assert inv_data["status"] == "success"
    assert inv_data["candidate_actions_count"] >= 1

    # 3. Fetch Case State
    state_resp = await client.get(
        f"/api/v1/cases/{case_id}/state",
        headers=headers,
    )
    assert state_resp.status_code == 200
    state_data = state_resp.json()
    assert len(state_data["hypotheses"]) >= 2
    assert len(state_data["candidate_actions"]) >= 1

    # 4. Fetch Strategy Recommendations
    rec_resp = await client.get(
        f"/api/v1/cases/{case_id}/recommendations",
        headers=headers,
    )
    assert rec_resp.status_code == 200
    recs = rec_resp.json()
    assert len(recs) >= 1
    assert "eig_score" in recs[0]

    # 5. Fetch Dependency Impact for first hypothesis
    h_id = state_data["hypotheses"][0]["id"]
    dep_resp = await client.get(
        f"/api/v1/cases/{case_id}/dependency/{h_id}",
        headers=headers,
    )
    assert dep_resp.status_code == 200

    # 6. Fetch Agent Trace
    trace_resp = await client.get(
        f"/api/v1/cases/{case_id}/agent-trace",
        headers=headers,
    )
    assert trace_resp.status_code == 200
    trace_logs = trace_resp.json()
    assert len(trace_logs) >= 1
