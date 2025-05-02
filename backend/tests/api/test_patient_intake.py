import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
import json
from datetime import datetime, date
import uuid

from backend.api.main import app

# Create test client
client = TestClient(app)

# Mock data
mock_patient_data = {
    "patient": {
        "first_name": "John",
        "last_name": "Doe",
        "date_of_birth": "1980-01-01",
        "gender": "male",
        "email": "john.doe@example.com",
        "phone": "555-123-4567"
    },
    "medical_history": {
        "has_heart_disease": False,
        "has_diabetes": True,
        "has_hypertension": False,
        "has_respiratory_disease": False,
        "has_bleeding_disorder": False,
        "current_smoker": False,
        "pregnant": False,
        "conditions": [
            {
                "name": "Type 2 Diabetes",
                "icd_code": "E11.9",
                "severity": "moderate",
                "is_controlled": True
            }
        ]
    },
    "allergies": [
        {
            "allergen": "Penicillin",
            "type": "MEDICATION",
            "reaction": "RASH",
            "severity": "moderate"
        }
    ],
    "medications": [
        {
            "name": "Metformin",
            "dosage": "500mg",
            "frequency": "twice daily",
            "type": "PRESCRIPTION"
        }
    ]
}

# Tests will be mocked since we don't have a test database setup
@pytest.mark.asyncio
@patch('backend.api.services.patient_intake_service.PatientIntakeService')
async def test_register_new_patient(mock_service):
    # Setup mock
    mock_instance = MagicMock()
    mock_service.return_value = mock_instance
    
    # Mock the return value of process_new_patient
    mock_patient = MagicMock()
    mock_patient.id = str(uuid.uuid4())
    mock_patient.first_name = "John"
    mock_patient.last_name = "Doe"
    mock_patient.date_of_birth = date(1980, 1, 1)
    mock_patient.email = "john.doe@example.com"
    
    mock_instance.process_new_patient.return_value = mock_patient
    
    # Make request
    response = client.post(
        "/api/patient-intake/register",
        json=mock_patient_data
    )
    
    # Assertions
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "John"
    assert data["last_name"] == "Doe"

@pytest.mark.asyncio
@patch('backend.api.services.patient_intake_service.PatientIntakeService')
async def test_get_patient_medical_profile(mock_service):
    # Setup mock
    patient_id = str(uuid.uuid4())
    mock_instance = MagicMock()
    mock_service.return_value = mock_instance
    
    # Mock profile data
    mock_profile = {
        "patient_id": patient_id,
        "medical_history": {
            "has_diabetes": True
        },
        "conditions": [
            {"name": "Type 2 Diabetes"}
        ],
        "allergies": [
            {"allergen": "Penicillin"}
        ],
        "medications": [
            {"name": "Metformin"}
        ],
        "asa_classification": "II",
        "last_reviewed": datetime.now().isoformat(),
        "alerts": [
            {
                "type": "medical",
                "severity": "medium",
                "description": "Diabetes"
            }
        ]
    }
    
    mock_instance.get_patient_medical_profile.return_value = mock_profile
    
    # Make request
    response = client.get(f"/api/patient-intake/patient/{patient_id}/medical-profile")
    
    # Assertions
    assert response.status_code == 200
    data = response.json()
    assert data["patient_id"] == patient_id
    assert len(data["alerts"]) > 0

@pytest.mark.asyncio
@patch('backend.api.services.patient_intake_service.PatientIntakeService')
async def test_add_patient_allergies(mock_service):
    # Setup mock
    patient_id = str(uuid.uuid4())
    mock_instance = MagicMock()
    mock_service.return_value = mock_instance
    
    # Mock allergies
    allergies = [
        {
            "allergen": "Penicillin",
            "type": "MEDICATION",
            "reaction": "RASH"
        }
    ]
    
    # Setup mock return value
    mock_allergies = []
    for allergy in allergies:
        mock_allergy = MagicMock()
        mock_allergy.id = str(uuid.uuid4())
        mock_allergy.patient_id = patient_id
        mock_allergy.allergen = allergy["allergen"]
        mock_allergy.type = allergy["type"]
        mock_allergy.reaction = allergy["reaction"]
        mock_allergies.append(mock_allergy)
    
    mock_instance.add_patient_allergies.return_value = mock_allergies
    
    # Make request
    response = client.post(
        f"/api/patient-intake/patient/{patient_id}/allergies",
        json=allergies
    )
    
    # Assertions
    assert response.status_code == 200
    data = response.json()
    assert len(data) == len(allergies)
    assert data[0]["allergen"] == "Penicillin" 