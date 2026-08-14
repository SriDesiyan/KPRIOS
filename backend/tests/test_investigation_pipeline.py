import io

import pytest
from httpx import AsyncClient
from PIL import Image


@pytest.mark.asyncio
async def test_full_investigation_pipeline(client: AsyncClient):
    # 1. Login
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

    # 2. Create Case
    case_resp = await client.post(
        "/api/v1/cases",
        headers=headers,
        json={
            "case_number": "CR-CYBERDOME-2026-0042",
            "title": "Operation CyberShield Child Exploitation Investigation",
            "description": "Cross-platform digital forensic analysis of coordinated chat group.",
        },
    )
    assert case_resp.status_code == 201
    case_id = case_resp.json()["id"]

    # 3. Upload Synthetic Chat Transcript Evidence
    chat_content = b"""
    [2026-08-14 09:15:00] Suspect_Anand: Send files to anand.invest@protonmail.com
    [2026-08-14 09:16:30] Suspect_Anand: Backup contact is +919847112233
    [2026-08-14 09:18:00] Location: Kozhikode, Kerala
    [2026-08-14 09:20:00] Wallet: 0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed
    """
    upload_resp1 = await client.post(
        f"/api/v1/cases/{case_id}/evidence",
        headers=headers,
        files={"file": ("suspect_chat_export.txt", io.BytesIO(chat_content), "text/plain")},
        data={"reliability": "0.95", "authenticity": "1.0"},
    )
    assert upload_resp1.status_code == 201
    ingest1_data = upload_resp1.json()
    assert ingest1_data["evidence_item"]["hash"] is not None
    assert len(ingest1_data["extracted_entities"]) >= 3
    assert len(ingest1_data["extracted_facts"]) >= 1

    # 4. Upload Synthetic Image Evidence
    img = Image.new("RGB", (80, 80), color="red")
    img_buf = io.BytesIO()
    img.save(img_buf, format="JPEG")
    img_bytes = img_buf.getvalue()

    upload_resp2 = await client.post(
        f"/api/v1/cases/{case_id}/evidence",
        headers=headers,
        files={"file": ("device_screen_capture.jpg", io.BytesIO(img_bytes), "image/jpeg")},
        data={"reliability": "1.0", "authenticity": "0.9"},
    )
    assert upload_resp2.status_code == 201

    # 5. List Case Evidence
    ev_list_resp = await client.get(
        f"/api/v1/cases/{case_id}/evidence",
        headers=headers,
    )
    assert ev_list_resp.status_code == 200
    evidence_items = ev_list_resp.json()
    assert len(evidence_items) == 2

    # 6. Verify Evidence Graph
    graph_resp = await client.get(
        f"/api/v1/cases/{case_id}/graph",
        headers=headers,
    )
    assert graph_resp.status_code == 200
    graph_data = graph_resp.json()
    assert graph_data["case_id"] == case_id
    assert graph_data["node_count"] > 0
    assert graph_data["edge_count"] > 0
    assert len(graph_data["nodes"]) == graph_data["node_count"]

    # 7. Verify Timeline
    timeline_resp = await client.get(
        f"/api/v1/cases/{case_id}/timeline",
        headers=headers,
    )
    assert timeline_resp.status_code == 200
    timeline_data = timeline_resp.json()
    assert timeline_data["total_events"] > 0
    assert len(timeline_data["events"]) == timeline_data["total_events"]

    # 8. Check Candidate Entities Proposals
    candidates_resp = await client.get(
        f"/api/v1/cases/{case_id}/entities/candidates",
        headers=headers,
    )
    assert candidates_resp.status_code == 200
    assert isinstance(candidates_resp.json(), list)
