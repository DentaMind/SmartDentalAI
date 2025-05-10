import pytest
import pytest_asyncio
from httpx import AsyncClient
from datetime import datetime
from typing import Dict, Any, AsyncGenerator
from backend.api.main import app
from backend.models.medical_history import ASAClassification
from backend.tests.api.test_data import (
    TEST_MEDICAL_HISTORY,
    HEALTHY_PATIENT_HISTORY,
    SEVERE_CONDITIONS_HISTORY,
    HIGH_RISK_HISTORY,
    LOW_RISK_HISTORY,
    BETA_BLOCKER_HISTORY,
    ANTICOAGULANT_HISTORY,
    IMMUNOSUPPRESSANT_HISTORY,
    MULTIPLE_CONDITIONS_HISTORY,
    EMPTY_HISTORY,
    EPINEPHRINE_CONTRAINDICATED_HISTORY,
    ABNORMAL_BLOODWORK_HISTORY
)

@pytest_asyncio.fixture
async def client() -> AsyncClient:
    return AsyncClient(app=app, base_url="http://test")

@pytest.mark.asyncio
async def test_complete_risk_evaluation(client: AsyncClient):
    response = await client.post("/risk/evaluate", json=TEST_MEDICAL_HISTORY)
    assert response.status_code == 200
    data = response.json()
    assert "asa_classification" in data
    assert "risk_level" in data
    assert "recommendations" in data
    assert "reasoning" in data
    assert "concerns" in data

@pytest.mark.asyncio
async def test_risk_evaluation_healthy_patient(client: AsyncClient):
    response = await client.post("/risk/evaluate", json=HEALTHY_PATIENT_HISTORY)
    assert response.status_code == 200
    data = response.json()
    assert data["asa_classification"] == "ASA I"
    assert data["risk_level"] == "low"
    assert not data["concerns"]

@pytest.mark.asyncio
async def test_risk_evaluation_severe_conditions(client: AsyncClient):
    response = await client.post("/risk/evaluate", json=SEVERE_CONDITIONS_HISTORY)
    assert response.status_code == 200
    data = response.json()
    assert data["asa_classification"] in ["ASA III", "ASA IV"]
    assert data["risk_level"] == "high"
    assert "epinephrine_warning" in data["concerns"]

@pytest.mark.asyncio
async def test_epinephrine_safety_check(client: AsyncClient):
    response = await client.post("/risk/epinephrine-check", json=TEST_MEDICAL_HISTORY)
    assert response.status_code == 200
    data = response.json()
    assert "is_safe" in data
    assert "risk_level" in data
    assert "max_dose" in data
    assert "recommendations" in data
    assert "reasoning" in data
    assert "epinephrine_warning" in data

@pytest.mark.asyncio
async def test_medication_check(client: AsyncClient):
    response = await client.post("/risk/medications", json=TEST_MEDICAL_HISTORY)
    assert response.status_code == 200
    data = response.json()
    assert "concerns" in data

@pytest.mark.asyncio
async def test_asa_classification(client: AsyncClient):
    response = await client.post("/risk/asa-classification", json=TEST_MEDICAL_HISTORY)
    assert response.status_code == 200
    data = response.json()
    assert "classification" in data
    assert "reasoning" in data

@pytest.mark.asyncio
async def test_high_risk_scenario(client: AsyncClient):
    response = await client.post("/risk/evaluate", json=HIGH_RISK_HISTORY)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "high"

@pytest.mark.asyncio
async def test_low_risk_scenario(client: AsyncClient):
    response = await client.post("/risk/evaluate", json=LOW_RISK_HISTORY)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "low"

@pytest.mark.asyncio
async def test_invalid_input(client: AsyncClient):
    response = await client.post("/risk/evaluate", json={})
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert "At least one condition or medication must be provided" in data["detail"]

@pytest.mark.asyncio
async def test_missing_required_fields(client: AsyncClient):
    incomplete_history = {"patient_id": "test123"}
    response = await client.post("/risk/evaluate", json=incomplete_history)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert "At least one condition or medication must be provided" in data["detail"]

@pytest.mark.asyncio
async def test_beta_blocker_scenario(client: AsyncClient):
    response = await client.post("/risk/evaluate", json=BETA_BLOCKER_HISTORY)
    assert response.status_code == 200
    data = response.json()
    assert "epinephrine_warning" in data["concerns"]

@pytest.mark.asyncio
async def test_anticoagulant_scenario(client: AsyncClient):
    response = await client.post("/risk/evaluate", json=ANTICOAGULANT_HISTORY)
    assert response.status_code == 200
    data = response.json()
    assert "bleeding_risk" in data["concerns"]

@pytest.mark.asyncio
async def test_immunosuppressant_scenario(client: AsyncClient):
    response = await client.post("/risk/evaluate", json=IMMUNOSUPPRESSANT_HISTORY)
    assert response.status_code == 200
    data = response.json()
    assert "infection_risk" in data["concerns"]

@pytest.mark.asyncio
async def test_multiple_conditions_scenario(client: AsyncClient):
    response = await client.post("/risk/evaluate", json=MULTIPLE_CONDITIONS_HISTORY)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "high"
    assert data["asa_classification"] in ["ASA III", "ASA IV"]

@pytest.mark.asyncio
async def test_empty_history_scenario(client: AsyncClient):
    response = await client.post("/risk/evaluate", json=EMPTY_HISTORY)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert "At least one condition or medication must be provided" in data["detail"]

@pytest.mark.asyncio
async def test_epinephrine_contraindications(client: AsyncClient):
    response = await client.post("/risk/epinephrine-check", json=EPINEPHRINE_CONTRAINDICATED_HISTORY)
    assert response.status_code == 200
    data = response.json()
    assert not data["is_safe"]
    assert data["risk_level"] == "red"
    assert data["epinephrine_warning"] is True
    assert "Avoid epinephrine use" in data["recommendations"]

@pytest.mark.asyncio
async def test_bloodwork_abnormalities(client: AsyncClient):
    response = await client.post("/risk/evaluate", json=ABNORMAL_BLOODWORK_HISTORY)
    assert response.status_code == 200
    data = response.json()
    assert "lab_concerns" in data["concerns"] 