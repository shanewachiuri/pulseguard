import pytest
from fastapi.testclient import TestClient
from main import app

# This fixture starts the app and lifespan exactly ONCE for the whole file
@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_engine_pulse_endpoint(client):
    """
    Tests the core AI underwriting endpoint. 
    Note: Because this hits the Groq API and local database, ensure your .env is loaded.
    """
    response = client.post(
        "/engine/pulse",
        json={
            "phone": "0799111222", 
            "input_data": "I am testing the system. I grow beans."
        }
    )

    assert response.status_code == 200
    data = response.json()

    # Verify the privacy mask worked
    assert data["phone"] == "079911***222"
    # Verify the database assigned a policy ID
    assert "policy_id" in data
    # Verify the LLM returned a text assessment
    assert "assessment" in data
    assert len(data["assessment"]) > 10