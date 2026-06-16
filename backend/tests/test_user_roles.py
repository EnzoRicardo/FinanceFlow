from unittest.mock import MagicMock, patch

import pytest

from app.core.auth import resolve_user_role
from app.schemas.user import UserRole


def test_resolve_user_role_defaults_to_user():
    assert resolve_user_role("user@example.com", None) == UserRole.USER
    assert resolve_user_role("user@example.com", "user") == UserRole.USER


def test_resolve_user_role_from_firestore():
    assert resolve_user_role("user@example.com", "admin") == UserRole.ADMIN


def test_resolve_user_role_from_admin_emails(monkeypatch):
    monkeypatch.setenv("ADMIN_EMAILS", "admin@example.com, other@example.com")
    assert resolve_user_role("admin@example.com", None) == UserRole.ADMIN
    assert resolve_user_role("other@example.com", "user") == UserRole.ADMIN


def test_resolve_user_role_firestore_admin_overrides_env(monkeypatch):
    monkeypatch.setenv("ADMIN_EMAILS", "user@example.com")
    assert resolve_user_role("other@example.com", "admin") == UserRole.ADMIN


def _mock_user_doc(mock_db, data: dict):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = data
    mock_db.collection.return_value.document.return_value.get.return_value = mock_doc


def test_get_me_success(auth_client, mock_db):
    _mock_user_doc(
        mock_db,
        {"name": "Maria", "email": "maria@example.com", "role": "user"},
    )

    with patch(
        "app.core.auth.firebase_auth.verify_id_token",
        return_value={"uid": "user-123", "email": "maria@example.com", "name": "Maria"},
    ):
        response = auth_client.get(
            "/auth/me",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == 200
    assert response.json() == {
        "uid": "user-123",
        "email": "maria@example.com",
        "name": "Maria",
        "role": "user",
    }


def test_get_me_admin(auth_client, mock_db):
    _mock_user_doc(
        mock_db,
        {"name": "Admin", "email": "admin@example.com", "role": "admin"},
    )

    with patch(
        "app.core.auth.firebase_auth.verify_id_token",
        return_value={"uid": "admin-1", "email": "admin@example.com", "name": "Admin"},
    ):
        response = auth_client.get(
            "/auth/me",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == 200
    assert response.json()["role"] == "admin"


def test_get_me_missing_token(auth_client):
    response = auth_client.get("/auth/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Token não informado."


def test_get_me_invalid_token(auth_client, mock_db):
    with patch(
        "app.core.auth.firebase_auth.verify_id_token",
        side_effect=Exception("invalid"),
    ):
        response = auth_client.get(
            "/auth/me",
            headers={"Authorization": "Bearer invalid-token"},
        )

    assert response.status_code == 401
    assert response.json()["detail"] == "Token inválido ou expirado."


def test_require_admin_forbidden():
    from fastapi import HTTPException

    from app.core.auth import require_admin
    from app.schemas.user import CurrentUser, UserRole

    current_user = CurrentUser(
        uid="user-123",
        email="maria@example.com",
        name="Maria",
        role=UserRole.USER,
    )

    with pytest.raises(HTTPException) as exc_info:
        require_admin(current_user)

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "Acesso restrito a administradores."


def test_require_admin_success():
    from app.core.auth import require_admin
    from app.schemas.user import CurrentUser, UserRole

    current_user = CurrentUser(
        uid="admin-1",
        email="admin@example.com",
        name="Admin",
        role=UserRole.ADMIN,
    )

    result = require_admin(current_user)
    assert result.role == UserRole.ADMIN
