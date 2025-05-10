import pytest
import json
import uuid
from fastapi.testclient import TestClient
from datetime import datetime
from unittest.mock import patch, MagicMock

from backend.api.main import app
from backend.api.models.clinical_evidence import (
    ClinicalEvidence,
    EvidenceType,
    EvidenceGrade
)

client = TestClient(app)

# Mock data for tests
MOCK_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0X3VzZXJfaWQiLCJyb2xlIjoiYWRtaW4ifQ.token"
MOCK_EVIDENCE_ID = str(uuid.uuid4())

MOCK_EVIDENCE_DATA = {
    "title": "Test Clinical Guideline",
    "authors": "Smith J, Johnson K",
    "publication": "Journal of Dental Testing",
    "publication_date": datetime.now().isoformat(),
    "doi": "10.1002/TEST.12345",
    "url": "https://example.com/test-guideline",
    "evidence_type": "guideline",
    "evidence_grade": "A",
    "summary": "This is a test clinical guideline.",
    "specialties": ["general_dentistry"]
}

MOCK_UPDATE_DATA = {
    "title": "Updated Clinical Guideline",
    "evidence_grade": "B"
}

MOCK_FINDING_ASSOC = {
    "finding_type": "caries",
    "evidence_id": MOCK_EVIDENCE_ID,
    "relevance_score": 0.9
}

MOCK_TREATMENT_ASSOC = {
    "procedure_code": "D2391",
    "evidence_id": MOCK_EVIDENCE_ID,
    "relevance_score": 0.85
}

# Utility functions for auth headers
def get_admin_headers():
    return {"Authorization": f"Bearer {MOCK_TOKEN}"}

def get_provider_headers():
    return {"Authorization": f"Bearer {MOCK_TOKEN}"}


class TestClinicalEvidenceAPI:
    """Test cases for Clinical Evidence API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup_mocks(self):
        """Setup common mocks for all tests"""
        # Mock auth middleware
        with patch("backend.api.auth.jwt.decode_token", return_value={"sub": "test_user_id", "role": "admin"}):
            # Mock database session
            with patch("backend.api.database.get_db"):
                yield
    
    def test_create_evidence(self):
        """Test creating a new evidence entry"""
        with patch("backend.api.services.clinical_evidence_service.ClinicalEvidenceService") as mock_service:
            # Setup mock
            instance = mock_service.return_value
            instance.create_evidence = MagicMock(return_value=ClinicalEvidence(id=MOCK_EVIDENCE_ID, **MOCK_EVIDENCE_DATA))
            
            # Send request
            response = client.post(
                "/api/clinical-evidence/",
                json=MOCK_EVIDENCE_DATA,
                headers=get_admin_headers()
            )
            
            # Assertions
            assert response.status_code == 200
            assert response.json()["id"] == MOCK_EVIDENCE_ID
            assert response.json()["title"] == MOCK_EVIDENCE_DATA["title"]
            assert response.json()["evidence_type"] == MOCK_EVIDENCE_DATA["evidence_type"]
            
            # Verify service was called
            instance.create_evidence.assert_called_once()
    
    def test_get_evidence_by_id(self):
        """Test getting a specific evidence entry by ID"""
        with patch("backend.api.services.clinical_evidence_service.ClinicalEvidenceService") as mock_service:
            # Setup mock
            instance = mock_service.return_value
            instance.get_evidence_by_id = MagicMock(
                return_value=ClinicalEvidence(id=MOCK_EVIDENCE_ID, **MOCK_EVIDENCE_DATA)
            )
            
            # Send request
            response = client.get(
                f"/api/clinical-evidence/{MOCK_EVIDENCE_ID}",
                headers=get_provider_headers()
            )
            
            # Assertions
            assert response.status_code == 200
            assert response.json()["id"] == MOCK_EVIDENCE_ID
            assert response.json()["title"] == MOCK_EVIDENCE_DATA["title"]
            
            # Verify service was called
            instance.get_evidence_by_id.assert_called_once_with(MOCK_EVIDENCE_ID)
    
    def test_get_evidence_not_found(self):
        """Test getting an evidence entry that doesn't exist"""
        with patch("backend.api.services.clinical_evidence_service.ClinicalEvidenceService") as mock_service:
            # Setup mock
            instance = mock_service.return_value
            instance.get_evidence_by_id = MagicMock(return_value=None)
            
            # Send request
            response = client.get(
                f"/api/clinical-evidence/{MOCK_EVIDENCE_ID}",
                headers=get_provider_headers()
            )
            
            # Assertions
            assert response.status_code == 404
            assert "detail" in response.json()
            assert response.json()["detail"] == "Evidence not found"
    
    def test_search_evidence(self):
        """Test searching for evidence with various criteria"""
        with patch("backend.api.services.clinical_evidence_service.ClinicalEvidenceService") as mock_service:
            # Setup mock
            instance = mock_service.return_value
            instance.search_evidence = MagicMock(
                return_value=[ClinicalEvidence(id=MOCK_EVIDENCE_ID, **MOCK_EVIDENCE_DATA)]
            )
            
            # Send request
            response = client.get(
                "/api/clinical-evidence/?search_term=Test&evidence_type=guideline&evidence_grade=A&specialty=general_dentistry",
                headers=get_provider_headers()
            )
            
            # Assertions
            assert response.status_code == 200
            assert isinstance(response.json(), list)
            assert len(response.json()) == 1
            assert response.json()[0]["id"] == MOCK_EVIDENCE_ID
            
            # Verify service was called
            instance.search_evidence.assert_called_once_with(
                search_term="Test",
                evidence_type="guideline",
                evidence_grade="A",
                specialty="general_dentistry",
                limit=20,
                offset=0
            )
    
    def test_update_evidence(self):
        """Test updating an existing evidence entry"""
        with patch("backend.api.services.clinical_evidence_service.ClinicalEvidenceService") as mock_service:
            # Setup mock
            instance = mock_service.return_value
            updated_evidence = ClinicalEvidence(
                id=MOCK_EVIDENCE_ID,
                **{**MOCK_EVIDENCE_DATA, **MOCK_UPDATE_DATA}
            )
            instance.update_evidence = MagicMock(return_value=updated_evidence)
            
            # Send request
            response = client.put(
                f"/api/clinical-evidence/{MOCK_EVIDENCE_ID}",
                json=MOCK_UPDATE_DATA,
                headers=get_admin_headers()
            )
            
            # Assertions
            assert response.status_code == 200
            assert response.json()["id"] == MOCK_EVIDENCE_ID
            assert response.json()["title"] == MOCK_UPDATE_DATA["title"]
            assert response.json()["evidence_grade"] == MOCK_UPDATE_DATA["evidence_grade"]
            
            # Verify service was called
            instance.update_evidence.assert_called_once_with(MOCK_EVIDENCE_ID, MOCK_UPDATE_DATA)
    
    def test_delete_evidence(self):
        """Test deleting an evidence entry"""
        with patch("backend.api.services.clinical_evidence_service.ClinicalEvidenceService") as mock_service:
            # Setup mock
            instance = mock_service.return_value
            instance.delete_evidence = MagicMock(return_value=True)
            
            # Send request
            response = client.delete(
                f"/api/clinical-evidence/{MOCK_EVIDENCE_ID}",
                headers=get_admin_headers()
            )
            
            # Assertions
            assert response.status_code == 200
            assert response.json() == {"success": True}
            
            # Verify service was called
            instance.delete_evidence.assert_called_once_with(MOCK_EVIDENCE_ID)
    
    def test_associate_finding(self):
        """Test associating a finding with evidence"""
        with patch("backend.api.services.clinical_evidence_service.ClinicalEvidenceService") as mock_service:
            # Setup mock
            instance = mock_service.return_value
            instance.associate_finding_with_evidence = MagicMock(return_value=True)
            
            # Send request
            response = client.post(
                "/api/clinical-evidence/associate/finding",
                json=MOCK_FINDING_ASSOC,
                headers=get_admin_headers()
            )
            
            # Assertions
            assert response.status_code == 200
            assert response.json() == {"success": True}
            
            # Verify service was called
            instance.associate_finding_with_evidence.assert_called_once_with(
                finding_type=MOCK_FINDING_ASSOC["finding_type"],
                evidence_id=MOCK_FINDING_ASSOC["evidence_id"],
                relevance_score=MOCK_FINDING_ASSOC["relevance_score"]
            )
    
    def test_associate_treatment(self):
        """Test associating a treatment with evidence"""
        with patch("backend.api.services.clinical_evidence_service.ClinicalEvidenceService") as mock_service:
            # Setup mock
            instance = mock_service.return_value
            instance.associate_treatment_with_evidence = MagicMock(return_value=True)
            
            # Send request
            response = client.post(
                "/api/clinical-evidence/associate/treatment",
                json=MOCK_TREATMENT_ASSOC,
                headers=get_admin_headers()
            )
            
            # Assertions
            assert response.status_code == 200
            assert response.json() == {"success": True}
            
            # Verify service was called
            instance.associate_treatment_with_evidence.assert_called_once_with(
                procedure_code=MOCK_TREATMENT_ASSOC["procedure_code"],
                evidence_id=MOCK_TREATMENT_ASSOC["evidence_id"],
                relevance_score=MOCK_TREATMENT_ASSOC["relevance_score"]
            )
    
    def test_get_evidence_for_finding(self):
        """Test getting evidence associated with a finding"""
        with patch("backend.api.services.clinical_evidence_service.ClinicalEvidenceService") as mock_service:
            # Setup mock
            instance = mock_service.return_value
            instance.get_evidence_for_finding = MagicMock(
                return_value=[{
                    "evidence": {
                        "id": MOCK_EVIDENCE_ID,
                        **MOCK_EVIDENCE_DATA
                    },
                    "relevance_score": 0.9
                }]
            )
            
            # Send request
            response = client.get(
                "/api/clinical-evidence/finding/caries?specialty=general_dentistry",
                headers=get_provider_headers()
            )
            
            # Assertions
            assert response.status_code == 200
            assert isinstance(response.json(), list)
            assert len(response.json()) == 1
            assert response.json()[0]["evidence"]["id"] == MOCK_EVIDENCE_ID
            assert response.json()[0]["relevance_score"] == 0.9
            
            # Verify service was called
            instance.get_evidence_for_finding.assert_called_once_with(
                finding_type="caries",
                specialty="general_dentistry",
                limit=5
            )
    
    def test_get_evidence_for_treatment(self):
        """Test getting evidence associated with a treatment"""
        with patch("backend.api.services.clinical_evidence_service.ClinicalEvidenceService") as mock_service:
            # Setup mock
            instance = mock_service.return_value
            instance.get_evidence_for_treatment = MagicMock(
                return_value=[{
                    "evidence": {
                        "id": MOCK_EVIDENCE_ID,
                        **MOCK_EVIDENCE_DATA
                    },
                    "relevance_score": 0.85
                }]
            )
            
            # Send request
            response = client.get(
                "/api/clinical-evidence/treatment/D2391?finding_type=caries",
                headers=get_provider_headers()
            )
            
            # Assertions
            assert response.status_code == 200
            assert isinstance(response.json(), list)
            assert len(response.json()) == 1
            assert response.json()[0]["evidence"]["id"] == MOCK_EVIDENCE_ID
            assert response.json()[0]["relevance_score"] == 0.85
            
            # Verify service was called
            instance.get_evidence_for_treatment.assert_called_once_with(
                procedure_code="D2391",
                finding_type="caries",
                specialty=None,
                limit=5
            )
    
    def test_get_citations_for_suggestion(self):
        """Test getting citations for a treatment suggestion"""
        with patch("backend.api.services.clinical_evidence_service.ClinicalEvidenceService") as mock_service:
            # Setup mock
            instance = mock_service.return_value
            mock_citation = {
                "title": MOCK_EVIDENCE_DATA["title"],
                "authors": MOCK_EVIDENCE_DATA["authors"],
                "publication": MOCK_EVIDENCE_DATA["publication"],
                "publication_date": MOCK_EVIDENCE_DATA["publication_date"],
                "doi": MOCK_EVIDENCE_DATA["doi"],
                "evidence_type": MOCK_EVIDENCE_DATA["evidence_type"],
                "evidence_grade": MOCK_EVIDENCE_DATA["evidence_grade"],
                "summary": MOCK_EVIDENCE_DATA["summary"],
                "page_reference": "42-45",
                "quote": "This is a direct quote from the clinical guideline."
            }
            instance.get_citations_for_suggestion = MagicMock(return_value=[mock_citation])
            
            # Send request
            response = client.get(
                "/api/clinical-evidence/citations/caries/D2391",
                headers=get_provider_headers()
            )
            
            # Assertions
            assert response.status_code == 200
            assert isinstance(response.json(), list)
            assert len(response.json()) == 1
            assert response.json()[0]["title"] == MOCK_EVIDENCE_DATA["title"]
            assert response.json()[0]["quote"] == "This is a direct quote from the clinical guideline."
            
            # Verify service was called
            instance.get_citations_for_suggestion.assert_called_once_with(
                finding_type="caries",
                procedure_code="D2391",
                specialty=None,
                limit=3
            )
    
    def test_unauthorized_access(self):
        """Test that endpoints require proper authentication"""
        # Test admin-only endpoint without auth
        response = client.post(
            "/api/clinical-evidence/",
            json=MOCK_EVIDENCE_DATA
        )
        assert response.status_code in [401, 403]  # Either unauthorized or forbidden
        
        # Test provider endpoint without auth
        response = client.get(
            f"/api/clinical-evidence/{MOCK_EVIDENCE_ID}"
        )
        assert response.status_code in [401, 403]  # Either unauthorized or forbidden 