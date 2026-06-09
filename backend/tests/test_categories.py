def test_list_categories(client):
    response = client.get("/categories")

    assert response.status_code == 200
    assert response.json() == []


def test_create_category(client):
    payload = {
        "type": "income",
        "name": "Salário",
    }

    response = client.post("/categories", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["received"]["type"] == "income"
    assert body["received"]["name"] == "Salário"


def test_create_category_invalid_type(client):
    payload = {
        "type": "other",
        "name": "Teste",
    }

    response = client.post("/categories", json=payload)

    assert response.status_code == 422
