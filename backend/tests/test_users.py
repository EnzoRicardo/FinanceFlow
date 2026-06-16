from unittest.mock import MagicMock, patch

from app.schemas.user import UserRole


def _mock_user_doc(doc_id: str, data: dict):
    doc = MagicMock()
    doc.id = doc_id
    doc.to_dict.return_value = data
    return doc


def test_list_users_success(auth_client, mock_db):
    mock_db.collection.return_value.stream.return_value = [
        _mock_user_doc(
            "user-1",
            {
                "name": "Maria",
                "email": "maria@example.com",
                "role": "user",
                "createdAt": "2026-01-02T10:00:00+00:00",
            },
        ),
        _mock_user_doc(
            "admin-1",
            {
                "name": "Admin",
                "email": "admin@example.com",
                "role": "admin",
                "createdAt": "2026-01-03T10:00:00+00:00",
            },
        ),
    ]

    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {
        "name": "Admin",
        "email": "admin@example.com",
        "role": "admin",
    }
    mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

    with patch(
        "app.core.auth.firebase_auth.verify_id_token",
        return_value={"uid": "admin-1", "email": "admin@example.com", "name": "Admin"},
    ):
        response = auth_client.get(
            "/users",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["uid"] == "admin-1"
    assert data[0]["role"] == UserRole.ADMIN.value
    assert data[1]["uid"] == "user-1"
    assert data[1]["role"] == UserRole.USER.value


def test_list_users_forbidden_for_non_admin(auth_client, mock_db):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {
        "name": "Maria",
        "email": "maria@example.com",
        "role": "user",
    }
    mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

    with patch(
        "app.core.auth.firebase_auth.verify_id_token",
        return_value={"uid": "user-1", "email": "maria@example.com", "name": "Maria"},
    ):
        response = auth_client.get(
            "/users",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == 403
    assert response.json()["detail"] == "Acesso restrito a administradores."


def _mock_admin_auth(mock_db):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {
        "name": "Admin",
        "email": "admin@example.com",
        "role": "admin",
    }
    mock_db.collection.return_value.document.return_value.get.return_value = mock_doc
    return patch(
        "app.core.auth.firebase_auth.verify_id_token",
        return_value={"uid": "admin-1", "email": "admin@example.com", "name": "Admin"},
    )


def test_update_user_success(auth_client, mock_db):
    admin_doc = MagicMock()
    admin_doc.exists = True
    admin_doc.to_dict.return_value = {
        "name": "Admin",
        "email": "admin@example.com",
        "role": "admin",
    }

    target_doc = MagicMock()
    target_doc.exists = True
    target_doc.to_dict.return_value = {
        "name": "Maria",
        "email": "maria@example.com",
        "role": "user",
        "createdAt": "2026-01-02T10:00:00+00:00",
    }

    mock_db.collection.return_value.document.return_value.get.side_effect = [
        admin_doc,
        target_doc,
    ]

    with patch(
        "app.core.auth.firebase_auth.verify_id_token",
        return_value={"uid": "admin-1", "email": "admin@example.com", "name": "Admin"},
    ), patch(
        "app.routes.users.firebase_auth.update_user",
    ) as update_user:
        response = auth_client.patch(
            "/users/user-1",
            headers={"Authorization": "Bearer valid-token"},
            json={"name": "Maria Silva", "role": "admin"},
        )

    assert response.status_code == 200
    assert response.json()["name"] == "Maria Silva"
    assert response.json()["role"] == UserRole.ADMIN.value
    mock_db.collection.return_value.document.return_value.update.assert_called_once_with(
        {"name": "Maria Silva", "role": "admin"}
    )
    update_user.assert_called_once_with("user-1", display_name="Maria Silva")


def test_update_user_cannot_demote_self(auth_client, mock_db):
    target_doc = MagicMock()
    target_doc.exists = True
    target_doc.to_dict.return_value = {
        "name": "Admin",
        "email": "admin@example.com",
        "role": "admin",
    }
    mock_db.collection.return_value.document.return_value.get.return_value = target_doc

    with _mock_admin_auth(mock_db):
        response = auth_client.patch(
            "/users/admin-1",
            headers={"Authorization": "Bearer valid-token"},
            json={"name": "Admin", "role": "user"},
        )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "Você não pode remover seu próprio perfil de administrador."
    )


def test_delete_user_success(auth_client, mock_db):
    admin_doc = MagicMock()
    admin_doc.exists = True
    admin_doc.to_dict.return_value = {
        "name": "Admin",
        "email": "admin@example.com",
        "role": "admin",
    }

    target_doc = MagicMock()
    target_doc.exists = True
    target_doc.to_dict.return_value = {
        "name": "Maria",
        "email": "maria@example.com",
        "role": "user",
    }

    mock_db.collection.return_value.document.return_value.get.side_effect = [
        admin_doc,
        target_doc,
    ]

    with patch(
        "app.core.auth.firebase_auth.verify_id_token",
        return_value={"uid": "admin-1", "email": "admin@example.com", "name": "Admin"},
    ), patch(
        "app.routes.users.firebase_auth.delete_user",
    ) as delete_user:
        response = auth_client.delete(
            "/users/user-1",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == 200
    assert response.json() == {"ok": True}
    mock_db.collection.return_value.document.return_value.delete.assert_called_once()
    delete_user.assert_called_once_with("user-1")


def test_delete_user_cannot_delete_self(auth_client, mock_db):
    target_doc = MagicMock()
    target_doc.exists = True
    target_doc.to_dict.return_value = {
        "name": "Admin",
        "email": "admin@example.com",
        "role": "admin",
    }
    mock_db.collection.return_value.document.return_value.get.return_value = target_doc

    with _mock_admin_auth(mock_db):
        response = auth_client.delete(
            "/users/admin-1",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == 400
    assert response.json()["detail"] == "Você não pode excluir sua própria conta."


def test_get_user_details_success(auth_client, mock_db):
    admin_doc = MagicMock()
    admin_doc.exists = True
    admin_doc.to_dict.return_value = {
        "name": "Admin",
        "email": "admin@example.com",
        "role": "admin",
    }

    user_doc = MagicMock()
    user_doc.exists = True
    user_doc.to_dict.return_value = {
        "name": "Maria",
        "email": "maria@example.com",
        "role": "user",
        "createdAt": "2026-01-02T10:00:00+00:00",
    }

    users_col = MagicMock()
    users_col.document.return_value.get.side_effect = [admin_doc, user_doc]

    transactions_col = MagicMock()
    transactions_col.where.return_value.stream.return_value = [
        _mock_user_doc(
            "tx-1",
            {
                "userId": "user-1",
                "type": "expense",
                "amount": 45,
                "category": "Alimentação",
                "createdAt": "2026-06-01T10:00:00+00:00",
            },
        ),
    ]

    accounts_col = MagicMock()
    accounts_col.where.return_value.stream.return_value = [
        _mock_user_doc(
            "acc-1",
            {
                "userId": "user-1",
                "name": "Conta Corrente",
                "type": "Corrente",
                "initialBalance": 1000,
            },
        ),
    ]

    empty_col = MagicMock()
    empty_col.where.return_value.stream.return_value = []

    def collection_side_effect(name):
        return {
            "users": users_col,
            "transactions": transactions_col,
            "accounts": accounts_col,
            "categories": empty_col,
            "goals": empty_col,
            "budgets": empty_col,
        }[name]

    mock_db.collection.side_effect = collection_side_effect

    with patch(
        "app.core.auth.firebase_auth.verify_id_token",
        return_value={"uid": "admin-1", "email": "admin@example.com", "name": "Admin"},
    ):
        response = auth_client.get(
            "/users/user-1/details",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["user"]["uid"] == "user-1"
    assert data["summary"]["transactionsCount"] == 1
    assert data["summary"]["accountsCount"] == 1
    assert len(data["transactions"]) == 1
    assert data["transactions"][0]["category"] == "Alimentação"
    assert len(data["accounts"]) == 1


def test_get_user_details_not_found(auth_client, mock_db):
    admin_doc = MagicMock()
    admin_doc.exists = True
    admin_doc.to_dict.return_value = {
        "name": "Admin",
        "email": "admin@example.com",
        "role": "admin",
    }

    missing_doc = MagicMock()
    missing_doc.exists = False

    users_col = MagicMock()
    users_col.document.return_value.get.side_effect = [admin_doc, missing_doc]

    mock_db.collection.side_effect = lambda name: users_col

    with patch(
        "app.core.auth.firebase_auth.verify_id_token",
        return_value={"uid": "admin-1", "email": "admin@example.com", "name": "Admin"},
    ):
        response = auth_client.get(
            "/users/user-404/details",
            headers={"Authorization": "Bearer valid-token"},
        )

    assert response.status_code == 404
    assert response.json()["detail"] == "Usuário não encontrado."
