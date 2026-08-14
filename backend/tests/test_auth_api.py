import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    response = await client.post(
        "/auth/login",
        json={
            "email": "investigator@test.police.in",
            "password": "InvestigatorPass123!",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "investigator@test.police.in"
    assert data["user"]["role"] == "investigator"


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient):
    response = await client.post(
        "/auth/login",
        json={
            "email": "investigator@test.police.in",
            "password": "WrongPassword!",
        },
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    response = await client.post(
        "/auth/login",
        json={
            "email": "nonexistent@test.police.in",
            "password": "AnyPassword123!",
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_authenticated(client: AsyncClient):
    # First login
    login_resp = await client.post(
        "/auth/login",
        json={
            "email": "supervisor@test.police.in",
            "password": "SupervisorPass123!",
        },
    )
    access_token = login_resp.json()["access_token"]

    # Call /auth/me
    me_resp = await client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert me_resp.status_code == 200
    user_data = me_resp.json()
    assert user_data["email"] == "supervisor@test.police.in"
    assert user_data["role"] == "supervisor"


@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient):
    response = await client.get("/auth/me")
    assert response.status_code == 403 or response.status_code == 401


@pytest.mark.asyncio
async def test_token_refresh_flow(client: AsyncClient):
    # 1. Login to get refresh token
    login_resp = await client.post(
        "/auth/login",
        json={
            "email": "auditor@test.police.in",
            "password": "AuditorPass123!",
        },
    )
    refresh_token = login_resp.json()["refresh_token"]

    # 2. Use refresh token to obtain new tokens
    refresh_resp = await client.post(
        "/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_resp.status_code == 200
    new_data = refresh_resp.json()
    assert "access_token" in new_data
    assert "refresh_token" in new_data

    # 3. Test new access token against /auth/me
    me_resp = await client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {new_data['access_token']}"},
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["role"] == "auditor"


@pytest.mark.asyncio
async def test_logout_endpoint(client: AsyncClient):
    login_resp = await client.post(
        "/auth/login",
        json={
            "email": "investigator@test.police.in",
            "password": "InvestigatorPass123!",
        },
    )
    access_token = login_resp.json()["access_token"]

    logout_resp = await client.post(
        "/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert logout_resp.status_code == 200
    assert logout_resp.json()["status"] == "success"
