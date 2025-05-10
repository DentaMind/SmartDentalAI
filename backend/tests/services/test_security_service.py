import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from api.services.security_service import SecurityService
from api.models.communication import (
    CommunicationLog,
    CommunicationPreference,
    MessageTemplate
)
from api.models.audit import AuditLog
from api.schemas.communication import CommunicationChannel
import uuid
import json

@pytest.fixture
def security_service(db: Session) -> SecurityService:
    """Create a security service instance for testing."""
    return SecurityService(db)

@pytest.fixture
def test_communication_log(db: Session) -> CommunicationLog:
    """Create a test communication log."""
    log = CommunicationLog(
        id=str(uuid.uuid4()),
        patient_id=str(uuid.uuid4()),
        channel=CommunicationChannel.EMAIL,
        message_type="APPOINTMENT",
        subject="Test Subject",
        body="Test Body",
        status="SENT",
        metadata={"key": "value"}
    )
    db.add(log)
    db.commit()
    return log

@pytest.fixture
def test_preference(db: Session) -> CommunicationPreference:
    """Create a test communication preference."""
    preference = CommunicationPreference(
        id=str(uuid.uuid4()),
        patient_id=str(uuid.uuid4()),
        preferred_channel=CommunicationChannel.EMAIL,
        email_consent=True,
        sms_consent=False,
        voice_consent=False
    )
    db.add(preference)
    db.commit()
    return preference

@pytest.fixture
def test_template(db: Session) -> MessageTemplate:
    """Create a test message template."""
    template = MessageTemplate(
        id="test-template",
        name="Test Template",
        subject="Test Subject",
        body="Test Body",
        category="APPOINTMENT",
        variables=["name", "date"],
        is_active=True
    )
    db.add(template)
    db.commit()
    return template

def test_encrypt_decrypt_data(security_service: SecurityService):
    """Test encryption and decryption of data."""
    original_data = "Sensitive information"
    
    # Encrypt data
    encrypted_data = security_service.encrypt_data(original_data)
    assert encrypted_data != original_data
    assert isinstance(encrypted_data, str)
    
    # Decrypt data
    decrypted_data = security_service.decrypt_data(encrypted_data)
    assert decrypted_data == original_data

def test_log_access(security_service: SecurityService):
    """Test logging access to sensitive data."""
    user_id = str(uuid.uuid4())
    entity_type = "test_entity"
    entity_id = str(uuid.uuid4())
    action = "read"
    details = {"field": "value"}
    ip_address = "127.0.0.1"
    user_agent = "test-agent"
    
    # Log access
    security_service.log_access(
        user_id=user_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    # Verify log was created
    log = security_service.db.query(AuditLog).first()
    assert log is not None
    assert log.user_id == user_id
    assert log.entity_type == entity_type
    assert log.entity_id == entity_id
    assert log.action == action
    assert log.details == details
    assert log.ip_address == ip_address
    assert log.user_agent == user_agent

def test_update_consent_history(
    security_service: SecurityService,
    test_preference: CommunicationPreference
):
    """Test updating consent history."""
    user_id = str(uuid.uuid4())
    channel = CommunicationChannel.SMS
    consent = True
    reason = "Test reason"
    
    # Update consent
    security_service.update_consent_history(
        patient_id=test_preference.patient_id,
        channel=channel,
        consent=consent,
        user_id=user_id,
        reason=reason
    )
    
    # Verify consent was updated
    updated_preference = security_service.db.query(CommunicationPreference).filter(
        CommunicationPreference.patient_id == test_preference.patient_id
    ).first()
    
    assert updated_preference is not None
    assert getattr(updated_preference, f"{channel.value}_consent") == consent
    assert getattr(updated_preference, f"{channel.value}_consent_date") is not None
    
    # Verify consent history
    consent_history = updated_preference.consent_history
    assert len(consent_history) > 0
    latest_entry = consent_history[-1]
    assert latest_entry["channel"] == channel.value
    assert latest_entry["consent"] == consent
    assert latest_entry["changed_by"] == user_id
    assert latest_entry["reason"] == reason

def test_create_template_version(
    security_service: SecurityService,
    test_template: MessageTemplate
):
    """Test creating a new template version."""
    user_id = str(uuid.uuid4())
    changes = {"subject": "New Subject", "body": "New Body"}
    
    # Create new version
    security_service.create_template_version(
        template_id=test_template.id,
        user_id=user_id,
        changes=changes
    )
    
    # Verify version was created
    updated_template = security_service.db.query(MessageTemplate).filter(
        MessageTemplate.id == test_template.id
    ).first()
    
    assert updated_template is not None
    assert updated_template.version == test_template.version + 1
    
    # Verify version history
    version_history = updated_template.version_history
    assert len(version_history) > 0
    latest_entry = version_history[-1]
    assert latest_entry["version"] == updated_template.version
    assert latest_entry["changed_by"] == user_id
    assert latest_entry["changes"] == changes

def test_encrypt_decrypt_communication_log(
    security_service: SecurityService,
    test_communication_log: CommunicationLog
):
    """Test encrypting and decrypting a communication log."""
    user_id = str(uuid.uuid4())
    
    # Encrypt log
    security_service.encrypt_communication_log(test_communication_log, user_id)
    
    # Verify encryption
    assert test_communication_log.subject != "Test Subject"
    assert test_communication_log.body != "Test Body"
    assert test_communication_log.metadata != {"key": "value"}
    
    # Verify audit log
    audit_log = security_service.db.query(AuditLog).filter(
        AuditLog.entity_id == test_communication_log.id,
        AuditLog.action == "encrypt"
    ).first()
    assert audit_log is not None
    
    # Decrypt log
    security_service.decrypt_communication_log(test_communication_log, user_id)
    
    # Verify decryption
    assert test_communication_log.subject == "Test Subject"
    assert test_communication_log.body == "Test Body"
    assert test_communication_log.metadata == {"key": "value"}
    
    # Verify audit log
    audit_log = security_service.db.query(AuditLog).filter(
        AuditLog.entity_id == test_communication_log.id,
        AuditLog.action == "decrypt"
    ).first()
    assert audit_log is not None

def test_get_audit_logs(security_service: SecurityService):
    """Test retrieving audit logs with filtering."""
    # Create test logs
    user_id = str(uuid.uuid4())
    entity_type = "test_entity"
    entity_id = str(uuid.uuid4())
    
    for i in range(5):
        security_service.log_access(
            user_id=user_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=f"action_{i}",
            details={"index": i}
        )
    
    # Test filtering by user_id
    logs = security_service.get_audit_logs(user_id=user_id)
    assert len(logs) == 5
    assert all(log["user_id"] == user_id for log in logs)
    
    # Test filtering by entity_type
    logs = security_service.get_audit_logs(entity_type=entity_type)
    assert len(logs) == 5
    assert all(log["entity_type"] == entity_type for log in logs)
    
    # Test filtering by entity_id
    logs = security_service.get_audit_logs(entity_id=entity_id)
    assert len(logs) == 5
    assert all(log["entity_id"] == entity_id for log in logs)
    
    # Test date filtering
    start_date = datetime.utcnow() - timedelta(minutes=1)
    end_date = datetime.utcnow() + timedelta(minutes=1)
    logs = security_service.get_audit_logs(
        start_date=start_date,
        end_date=end_date
    )
    assert len(logs) == 5
    
    # Test limit
    logs = security_service.get_audit_logs(limit=2)
    assert len(logs) == 2 