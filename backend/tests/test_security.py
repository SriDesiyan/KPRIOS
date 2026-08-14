from datetime import timedelta

import jwt
import pytest

from app.api.deps import ActionTier, InviolablePolicyError, enforce_three_tier_action
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)


def test_password_hashing_and_verification():
    raw_password = "SecureInvestigatorPassword#2026"
    hashed = get_password_hash(raw_password)

    assert hashed != raw_password
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword123", hashed) is False


def test_password_hash_uniqueness():
    raw_password = "SamePasswordEveryTime"
    hash1 = get_password_hash(raw_password)
    hash2 = get_password_hash(raw_password)

    # Different salts should yield different hash outputs
    assert hash1 != hash2
    assert verify_password(raw_password, hash1) is True
    assert verify_password(raw_password, hash2) is True


def test_access_token_creation_and_decoding():
    user_id = "test-user-12345"
    role = "investigator"
    token = create_access_token(subject=user_id, role=role)

    payload = decode_token(token)
    assert payload["sub"] == user_id
    assert payload["role"] == role
    assert payload["type"] == "access"
    assert "exp" in payload
    assert "iat" in payload


def test_refresh_token_creation_and_decoding():
    user_id = "test-user-67890"
    role = "supervisor"
    token = create_refresh_token(subject=user_id, role=role)

    payload = decode_token(token)
    assert payload["sub"] == user_id
    assert payload["role"] == role
    assert payload["type"] == "refresh"


def test_token_expiration():
    user_id = "expired-user"
    # Token that expired 5 seconds ago
    token = create_access_token(
        subject=user_id,
        role="investigator",
        expires_delta=timedelta(seconds=-5),
    )

    with pytest.raises(jwt.ExpiredSignatureError):
        decode_token(token)


def test_tampered_token_rejection():
    token = create_access_token(subject="valid-user", role="investigator")
    tampered_token = token[:-5] + "ABCDE"

    with pytest.raises(jwt.PyJWTError):
        decode_token(tampered_token)


def test_three_tier_authorization_guards():
    # AUTO tier allows immediate execution
    assert enforce_three_tier_action(ActionTier.AUTO) is True

    # REVIEW tier passes guard check (handled via human workflow checkpoint)
    assert enforce_three_tier_action(ActionTier.REVIEW) is True

    # ONLY tier (Tier 3) is strictly forbidden for automated execution — raises InviolablePolicyError
    with pytest.raises(InviolablePolicyError) as exc_info:
        enforce_three_tier_action(ActionTier.ONLY)

    assert "Tier 3" in str(exc_info.value.detail)
