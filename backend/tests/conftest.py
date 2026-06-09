from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def reset_firebase_cache():
    import app.core.firebase as firebase_module

    firebase_module._db = None
    yield
    firebase_module._db = None


@pytest.fixture
def mock_db():
    db = MagicMock()
    collection = MagicMock()
    document = MagicMock()
    db.collection.return_value = collection
    collection.document.return_value = document
    collection.add.return_value = None
    document.set.return_value = None
    return db


@pytest.fixture
def client(mock_db):
    from app.core.firebase import get_db
    from app.main import app

    app.dependency_overrides[get_db] = lambda: mock_db
    yield TestClient(app)
    app.dependency_overrides.clear()
