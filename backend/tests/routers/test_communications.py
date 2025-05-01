import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from api.main import app
from api.schemas.communication import (
    CommunicationMessage,
    CommunicationChannel,
    MessageCategory,
    CommunicationIntent
)
import uuid

client = TestClient(app)

@pytest.fixture
def test_user_id() -> str:
    """Create a test user ID."""
    return str(uuid.uuid4())

@pytest.fixture
def test_patient_id() -> str:
    """Create a test patient ID."""
    return str(uuid.uuid4())

@pytest.fixture
def test_message() -> CommunicationMessage:
    """Create a test message."""
    return CommunicationMessage(
        patient_id=str(uuid.uuid4()),
        subject="Test Subject",
        body="Test Body",
        category=MessageCategory.APPOINTMENT,
        intent=CommunicationIntent.BOOK_APPOINTMENT,
        metadata={"key": "value"}
    )

def test_send_message(test_user_id: str, test_message: CommunicationMessage):
    """Test sending a message with encryption and audit logging."""
    response = client.post(
        "/communications/send",
        json=test_message.dict(),
        headers={"X-User-ID": test_user_id}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify response structure
    assert "id" in data
    assert data["patient_id"] == test_message.patient_id
    assert data["subject"] != test_message.subject  # Should be encrypted
    assert data["body"] != test_message.body  # Should be encrypted
    
    # Verify audit log
    audit_response = client.get(
        "/communications/audit-logs",
        params={"entity_id": data["id"]},
        headers={"X-User-ID": test_user_id}
    )
    assert audit_response.status_code == 200
    audit_logs = audit_response.json()
    assert len(audit_logs) > 0
    assert any(log["action"] == "create" for log in audit_logs)

def test_get_logs(test_user_id: str, test_patient_id: str):
    """Test retrieving communication logs with decryption and audit logging."""
    # First create some logs
    test_message = CommunicationMessage(
        patient_id=test_patient_id,
        subject="Test Subject",
        body="Test Body",
        category=MessageCategory.APPOINTMENT
    )
    client.post(
        "/communications/send",
        json=test_message.dict(),
        headers={"X-User-ID": test_user_id}
    )
    
    # Get logs
    response = client.get(
        "/communications/logs",
        params={"patient_id": test_patient_id},
        headers={"X-User-ID": test_user_id}
    )
    
    assert response.status_code == 200
    logs = response.json()
    assert len(logs) > 0
    
    # Verify decryption
    log = logs[0]
    assert log["subject"] == "Test Subject"
    assert log["body"] == "Test Body"
    
    # Verify audit logs
    audit_response = client.get(
        "/communications/audit-logs",
        params={"entity_type": "communication_log"},
        headers={"X-User-ID": test_user_id}
    )
    assert audit_response.status_code == 200
    audit_logs = audit_response.json()
    assert len(audit_logs) > 0
    assert any(log["action"] == "read" for log in audit_logs)

def test_get_preferences(test_user_id: str, test_patient_id: str):
    """Test retrieving communication preferences with audit logging."""
    response = client.get(
        f"/communications/preferences/{test_patient_id}",
        headers={"X-User-ID": test_user_id}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify response structure
    assert "patient_id" in data
    assert "preferred_channel" in data
    assert "email_consent" in data
    assert "sms_consent" in data
    assert "voice_consent" in data
    
    # Verify audit log
    audit_response = client.get(
        "/communications/audit-logs",
        params={"entity_type": "communication_preference"},
        headers={"X-User-ID": test_user_id}
    )
    assert audit_response.status_code == 200
    audit_logs = audit_response.json()
    assert len(audit_logs) > 0
    assert any(log["action"] == "read" for log in audit_logs)

def test_update_preferences(test_user_id: str, test_patient_id: str):
    """Test updating communication preferences with consent history."""
    # Create test preferences
    preferences = {
        "patient_id": test_patient_id,
        "preferred_channel": CommunicationChannel.SMS.value,
        "email_consent": True,
        "sms_consent": True,
        "voice_consent": False
    }
    
    response = client.put(
        f"/communications/preferences/{test_patient_id}",
        json=preferences,
        headers={"X-User-ID": test_user_id}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify updated preferences
    assert data["preferred_channel"] == CommunicationChannel.SMS.value
    assert data["email_consent"] is True
    assert data["sms_consent"] is True
    assert data["voice_consent"] is False
    
    # Verify consent history
    assert "consent_history" in data
    assert len(data["consent_history"]) > 0
    
    # Verify audit log
    audit_response = client.get(
        "/communications/audit-logs",
        params={"entity_type": "communication_preference"},
        headers={"X-User-ID": test_user_id}
    )
    assert audit_response.status_code == 200
    audit_logs = audit_response.json()
    assert len(audit_logs) > 0
    assert any(log["action"] == "update" for log in audit_logs)

def test_get_analytics(test_user_id: str):
    """Test retrieving communication analytics with audit logging."""
    response = client.get(
        "/communications/analytics",
        headers={"X-User-ID": test_user_id}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify response structure
    assert isinstance(data, list)
    if len(data) > 0:
        analytics = data[0]
        assert "total_messages" in analytics
        assert "successful_messages" in analytics
        assert "failed_messages" in analytics
        assert "average_response_time" in analytics
    
    # Verify audit log
    audit_response = client.get(
        "/communications/audit-logs",
        params={"entity_type": "communication_analytics"},
        headers={"X-User-ID": test_user_id}
    )
    assert audit_response.status_code == 200
    audit_logs = audit_response.json()
    assert len(audit_logs) > 0
    assert any(log["action"] == "read" for log in audit_logs)

def test_get_audit_logs(test_user_id: str):
    """Test retrieving audit logs with filtering."""
    # Test without filters
    response = client.get(
        "/communications/audit-logs",
        headers={"X-User-ID": test_user_id}
    )
    assert response.status_code == 200
    logs = response.json()
    assert isinstance(logs, list)
    
    # Test with filters
    start_date = (datetime.utcnow() - timedelta(days=1)).isoformat()
    end_date = (datetime.utcnow() + timedelta(days=1)).isoformat()
    
    response = client.get(
        "/communications/audit-logs",
        params={
            "start_date": start_date,
            "end_date": end_date,
            "limit": 10
        },
        headers={"X-User-ID": test_user_id}
    )
    assert response.status_code == 200
    filtered_logs = response.json()
    assert isinstance(filtered_logs, list)
    assert len(filtered_logs) <= 10

def test_unauthorized_access():
    """Test unauthorized access to protected endpoints."""
    # Test without user ID header
    response = client.post(
        "/communications/send",
        json={"patient_id": str(uuid.uuid4())}
    )
    assert response.status_code == 401
    
    response = client.get("/communications/logs")
    assert response.status_code == 401
    
    response = client.get(f"/communications/preferences/{str(uuid.uuid4())}")
    assert response.status_code == 401
    
    response = client.get("/communications/analytics")
    assert response.status_code == 401
    
    response = client.get("/communications/audit-logs")
    assert response.status_code == 401 