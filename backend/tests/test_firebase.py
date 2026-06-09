from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

import app.core.firebase as firebase_module


def test_get_db_missing_env():
    with patch.dict("os.environ", {}, clear=True):
        with pytest.raises(RuntimeError, match="FIREBASE_CREDENTIALS_PATH não definido"):
            firebase_module.get_db()


def test_get_db_missing_file():
    with patch.dict("os.environ", {"FIREBASE_CREDENTIALS_PATH": "missing.json"}):
        with patch.object(Path, "exists", return_value=False):
            with pytest.raises(RuntimeError, match="Arquivo não encontrado"):
                firebase_module.get_db()


def test_get_db_initializes_client():
    mock_client = MagicMock()

    with patch.dict("os.environ", {"FIREBASE_CREDENTIALS_PATH": "service.json"}):
        with patch.object(Path, "exists", return_value=True):
            with patch.object(firebase_module.firebase_admin, "_apps", {}):
                with patch.object(
                    firebase_module.credentials, "Certificate", return_value="cred"
                ) as certificate:
                    with patch.object(
                        firebase_module.firebase_admin, "initialize_app"
                    ) as initialize_app:
                        with patch.object(
                            firebase_module.firestore, "client", return_value=mock_client
                        ) as firestore_client:
                            db = firebase_module.get_db()

    assert db is mock_client
    certificate.assert_called_once()
    initialize_app.assert_called_once_with("cred")
    firestore_client.assert_called_once()


def test_get_db_uses_cached_client():
    cached = MagicMock()
    firebase_module._db = cached

    db = firebase_module.get_db()

    assert db is cached
