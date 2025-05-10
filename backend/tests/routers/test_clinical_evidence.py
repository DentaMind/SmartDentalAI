import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
import uuid
from datetime import datetime

from ...api.main import app
from ...api.models.clinical_evidence import (
    EvidenceType,
    EvidenceGrade,
    ClinicalEvidence,
    EvidenceCitation
)

client = TestClient(app)

# Mock data
MOCK_EVIDENCE_ID = str(uuid.uuid4())
MOCK_DOI = "10.1002/TEST.12345"

MOCK_EVIDENCE = {
    "id": MOCK_EVIDENCE_ID,
    "title": "Test Clinical Guideline",
    "authors": "Smith J, Johnson K",
    "publication": "Journal of Test Dentistry",
    "publication_date": datetime(2022, 1, 15).isoformat(),
    "doi": MOCK_DOI,
    "url": "https://example.com/test-guideline",
    "evidence_type": "guideline",
    "evidence_grade": "A",
    "summary": "This is a test clinical guideline for unit testing.",
    "recommendations": [{"condition": "test_condition", "recommendation": "Test recommendation"}],
    "specialties": ["general_dentistry", "endodontics"],
    "conditions": ["caries", "pulpitis"],
    "procedures": ["D2391", "D3310"],
    "keywords": ["test", "guideline", "dental"],
    "version": "2022",
    "created_at": datetime.now().isoformat(),
    "updated_at": None
}

MOCK_EVIDENCE_CREATE = {
    "title": "New Test Guideline",
    "authors": "Doe J, Smith A",
    "publication": "Test Dental Journal",
    "publication_date": datetime(2023, 2, 15).isoformat(),
    "doi": "10.1002/TEST.54321",
    "evidence_type": "systematic_review",
    "evidence_grade": "B",
    "summary": "This is a new test guideline for unit testing.",
    "specialties": ["general_dentistry"]
}

MOCK_CITATION = {
    "title": "Test Citation",
    "authors": "Smith J",
    "publication": "Journal of Test Dentistry",
    "publication_date": datetime(2022, 1, 15).isoformat(),
    "doi": MOCK_DOI,
    "evidence_type": "guideline",
    "evidence_grade": "A",
    "summary": "This is a test citation.",
    "page_reference": "42-45",
    "quote": "This is a direct quote from the source"
}

# Utility functions for mocking auth
def get_admin_token_headers():
    return {"Authorization": "Bearer test_admin_token"}

def get_provider_token_headers():
    return {"Authorization": "Bearer test_provider_token"}

# Mock dependencies
@pytest.fixture(autouse=True)
def mock_dependencies():
    # Mock auth dependencies
    with patch("backend.api.auth.dependencies.get_current_user") as mock_get_user:
        mock_get_user.return_value = {"id": "test_user_id", "role": "admin"}
        
        # Mock admin role verification
        with patch("backend.api.auth.dependencies.verify_admin_role") as mock_verify_admin:
            mock_verify_admin.return_value = True
            
            # Mock provider role verification
            with patch("backend.api.auth.dependencies.verify_provider_role") as mock_verify_provider:
                mock_verify_provider.return_value = True
                
                # Mock database session
                with patch("backend.api.database.get_db"):
                    yield


# Mock service
@pytest.fixture
def mock_clinical_evidence_service():
    with patch("backend.api.services.clinical_evidence_service.ClinicalEvidenceService") as mock_service:
        instance = mock_service.return_value
        
        # Mock create_evidence
        instance.create_evidence = AsyncMock(return_value=ClinicalEvidence(**MOCK_EVIDENCE))
        
        # Mock get_evidence_by_id
        instance.get_evidence_by_id = AsyncMock(return_value=ClinicalEvidence(**MOCK_EVIDENCE))
        
        # Mock search_evidence
        instance.search_evidence = AsyncMock(return_value=[ClinicalEvidence(**MOCK_EVIDENCE)])
        
        # Mock update_evidence
        instance.update_evidence = AsyncMock(return_value=ClinicalEvidence(**MOCK_EVIDENCE))
        
        # Mock delete_evidence
        instance.delete_evidence = AsyncMock(return_value=True)
        
        # Mock associate methods
        instance.associate_finding_with_evidence = AsyncMock(return_value=True)
        instance.associate_treatment_with_evidence = AsyncMock(return_value=True)
        
        # Mock get_evidence methods
        instance.get_evidence_for_finding = AsyncMock(return_value=[{"evidence": MOCK_EVIDENCE, "relevance_score": 0.9}])
        instance.get_evidence_for_treatment = AsyncMock(return_value=[{"evidence": MOCK_EVIDENCE, "relevance_score": 0.8}])
        
        # Mock get_citations_for_suggestion
        instance.get_citations_for_suggestion = AsyncMock(return_value=[MOCK_CITATION])
        
        # Mock seed_initial_evidence
        instance.seed_initial_evidence = AsyncMock(return_value=[ClinicalEvidence(**MOCK_EVIDENCE)])
        
        yield instance


# Tests
def test_create_evidence(mock_clinical_evidence_service):
    response = client.post(
        "/api/clinical-evidence/",
        json=MOCK_EVIDENCE_CREATE,
        headers=get_admin_token_headers()
    )
    
    assert response.status_code == 200
    assert response.json()["title"] == MOCK_EVIDENCE["title"]
    mock_clinical_evidence_service.create_evidence.assert_called_once()


def test_get_evidence(mock_clinical_evidence_service):
    response = client.get(
        f"/api/clinical-evidence/{MOCK_EVIDENCE_ID}",
        headers=get_provider_token_headers()
    )
    
    assert response.status_code == 200
    assert response.json()["id"] == MOCK_EVIDENCE_ID
    mock_clinical_evidence_service.get_evidence_by_id.assert_called_once_with(MOCK_EVIDENCE_ID)


def test_search_evidence(mock_clinical_evidence_service):
    response = client.get(
        "/api/clinical-evidence/?search_term=test&evidence_type=guideline&specialty=endodontics",
        headers=get_provider_token_headers()
    )
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) == 1
    mock_clinical_evidence_service.search_evidence.assert_called_once()


def test_update_evidence(mock_clinical_evidence_service):
    update_data = {"title": "Updated Title"}
    response = client.put(
        f"/api/clinical-evidence/{MOCK_EVIDENCE_ID}",
        json=update_data,
        headers=get_admin_token_headers()
    )
    
    assert response.status_code == 200
    mock_clinical_evidence_service.update_evidence.assert_called_once_with(MOCK_EVIDENCE_ID, update_data)


def test_delete_evidence(mock_clinical_evidence_service):
    response = client.delete(
        f"/api/clinical-evidence/{MOCK_EVIDENCE_ID}",
        headers=get_admin_token_headers()
    )
    
    assert response.status_code == 200
    assert response.json() == {"success": True}
    mock_clinical_evidence_service.delete_evidence.assert_called_once_with(MOCK_EVIDENCE_ID)


def test_associate_finding(mock_clinical_evidence_service):
    data = {
        "finding_type": "caries",
        "evidence_id": MOCK_EVIDENCE_ID,
        "relevance_score": 0.9
    }
    
    response = client.post(
        "/api/clinical-evidence/associate/finding",
        json=data,
        headers=get_admin_token_headers()
    )
    
    assert response.status_code == 200
    assert response.json() == {"success": True}
    mock_clinical_evidence_service.associate_finding_with_evidence.assert_called_once()


def test_associate_treatment(mock_clinical_evidence_service):
    data = {
        "procedure_code": "D2391",
        "evidence_id": MOCK_EVIDENCE_ID,
        "relevance_score": 0.8
    }
    
    response = client.post(
        "/api/clinical-evidence/associate/treatment",
        json=data,
        headers=get_admin_token_headers()
    )
    
    assert response.status_code == 200
    assert response.json() == {"success": True}
    mock_clinical_evidence_service.associate_treatment_with_evidence.assert_called_once()


def test_get_evidence_for_finding(mock_clinical_evidence_service):
    response = client.get(
        "/api/clinical-evidence/finding/caries?specialty=general_dentistry&limit=5",
        headers=get_provider_token_headers()
    )
    
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert "evidence" in response.json()[0]
    assert "relevance_score" in response.json()[0]
    mock_clinical_evidence_service.get_evidence_for_finding.assert_called_once()


def test_get_evidence_for_treatment(mock_clinical_evidence_service):
    response = client.get(
        "/api/clinical-evidence/treatment/D2391?finding_type=caries&specialty=general_dentistry&limit=5",
        headers=get_provider_token_headers()
    )
    
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert "evidence" in response.json()[0]
    assert "relevance_score" in response.json()[0]
    mock_clinical_evidence_service.get_evidence_for_treatment.assert_called_once()


def test_get_citations_for_suggestion(mock_clinical_evidence_service):
    response = client.get(
        "/api/clinical-evidence/citations/caries/D2391?specialty=general_dentistry&limit=3",
        headers=get_provider_token_headers()
    )
    
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == MOCK_CITATION["title"]
    mock_clinical_evidence_service.get_citations_for_suggestion.assert_called_once()


def test_seed_initial_evidence(mock_clinical_evidence_service):
    response = client.post(
        "/api/clinical-evidence/seed",
        headers=get_admin_token_headers()
    )
    
    assert response.status_code == 200
    assert "message" in response.json()
    assert "count" in response.json()
    mock_clinical_evidence_service.seed_initial_evidence.assert_called_once() 