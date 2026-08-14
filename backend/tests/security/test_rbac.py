import pytest

from app.core.security import create_access_token
from app.models.user import UserRole


@pytest.mark.asyncio
async def test_rbac_auditor_cannot_create_case(client):
    """RBAC Test: Auditor role cannot create cases (expects 403 Forbidden)."""
    token = create_access_token(subject="test-auditor-uuid-003", role=UserRole.AUDITOR.value)
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.post(
        "/api/v1/cases",
        json={
            "case_number": "CR-AUDIT-DENIED-001",
            "title": "Unauthorized Case Creation",
            "description": "Should fail",
            "status": "ACTIVE",
        },
        headers=headers,
    )
    # Auditor does not have case creation permission
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_rbac_investigator_can_create_case_and_access(client):
    """RBAC Test: Investigator role can create cases (expects 201 Created)."""
    token = create_access_token(
        subject="test-investigator-uuid-001", role=UserRole.INVESTIGATOR.value
    )
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.post(
        "/api/v1/cases",
        json={
            "case_number": "CR-INV-PERMITTED-001",
            "title": "Permitted Case Creation",
            "description": "Should succeed",
            "status": "ACTIVE",
        },
        headers=headers,
    )
    assert res.status_code == 201
    assert res.json()["case_number"] == "CR-INV-PERMITTED-001"


@pytest.mark.asyncio
async def test_health_endpoints_accessible(client):
    """Health endpoints GET /health and GET /health/db respond 200 OK without authentication."""
    h1 = await client.get("/health")
    assert h1.status_code == 200
    assert h1.json()["status"] == "healthy"

    h2 = await client.get("/health/db")
    assert h2.status_code == 200
    assert h2.json()["database"] == "connected"
