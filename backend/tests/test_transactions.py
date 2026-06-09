def test_list_transactions(client):
    response = client.get("/transactions")

    assert response.status_code == 200
    assert response.json() == []


def test_create_transaction(client):
    payload = {
        "type": "expense",
        "amount": 150.75,
        "date": "2026-06-09",
        "category": "Alimentação",
        "description": "Mercado",
    }

    response = client.post("/transactions", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["received"]["type"] == "expense"
    assert body["received"]["amount"] == 150.75
    assert body["received"]["category"] == "Alimentação"


def test_create_transaction_invalid_type(client):
    payload = {
        "type": "invalid",
        "amount": 10,
        "date": "2026-06-09",
        "category": "Outros",
    }

    response = client.post("/transactions", json=payload)

    assert response.status_code == 422
