from unittest.mock import MagicMock, patch

from firebase_admin import auth as firebase_auth


def test_register_success(client, mock_db):
    user = MagicMock(uid="user-123")

    with patch("app.routes.auth.firebase_auth.create_user", return_value=user):
        response = client.post(
            "/auth/register",
            json={
                "name": "Maria",
                "email": "maria@example.com",
                "password": "senha123",
            },
        )

    assert response.status_code == 200
    assert response.json() == {"uid": "user-123"}
    mock_db.collection.assert_called_with("users")
    mock_db.collection.return_value.document.assert_called_with("user-123")
    mock_db.collection.return_value.document.return_value.set.assert_called_once()
    saved_data = mock_db.collection.return_value.document.return_value.set.call_args[0][0]
    assert saved_data["role"] == "user"


def test_register_email_already_exists(client):
    with patch(
        "app.routes.auth.firebase_auth.create_user",
        side_effect=firebase_auth.EmailAlreadyExistsError("exists", None, None),
    ):
        response = client.post(
            "/auth/register",
            json={
                "name": "Maria",
                "email": "maria@example.com",
                "password": "senha123",
            },
        )

    assert response.status_code == 400
    assert response.json()["detail"] == "E-mail já registrado."


def test_register_password_too_short(client):
    with patch(
        "app.routes.auth.firebase_auth.create_user",
        side_effect=Exception("PASSWORD_TOO_SHORT"),
    ):
        response = client.post(
            "/auth/register",
            json={
                "name": "Maria",
                "email": "maria@example.com",
                "password": "123",
            },
        )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "Senha inválida. Deve conter no mínimo 6 caracteres."
    )


def test_register_admin_email(client, mock_db, monkeypatch):
    monkeypatch.setenv("ADMIN_EMAILS", "admin@example.com")
    user = MagicMock(uid="admin-123")

    with patch("app.routes.auth.firebase_auth.create_user", return_value=user):
        response = client.post(
            "/auth/register",
            json={
                "name": "Admin",
                "email": "admin@example.com",
                "password": "senha123",
            },
        )

    assert response.status_code == 200
    saved_data = mock_db.collection.return_value.document.return_value.set.call_args[0][0]
    assert saved_data["role"] == "admin"


def test_register_generic_error(client):
    with patch(
        "app.routes.auth.firebase_auth.create_user",
        side_effect=Exception("unexpected failure"),
    ):
        response = client.post(
            "/auth/register",
            json={
                "name": "Maria",
                "email": "maria@example.com",
                "password": "senha123",
            },
        )

    assert response.status_code == 400
    assert response.json()["detail"] == "unexpected failure"
