def test_health(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "FinanceFlow API"}


def test_firestore_test(client, mock_db):
    response = client.get("/firestore-test")

    assert response.status_code == 200
    assert response.json() == {"ok": True}
    mock_db.collection.assert_called_once_with("test_connection")
    mock_db.collection.return_value.add.assert_called_once_with(
        {"message": "FinanceFlow conectado"}
    )
