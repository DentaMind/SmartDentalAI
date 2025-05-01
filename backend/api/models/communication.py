from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum, JSON, Text, UUID, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
from ..schemas.communication import CommunicationChannel, CommunicationIntent, MessageCategory
import uuid
import json
from cryptography.fernet import Fernet
import os

class EncryptedField:
    """Mixin for encrypted fields using Fernet encryption."""
    
    def __init__(self):
        self.key = os.environ.get('ENCRYPTION_KEY')
        if not self.key:
            raise ValueError("ENCRYPTION_KEY environment variable is required")
        self.cipher_suite = Fernet(self.key.encode())
    
    def encrypt(self, value: str) -> str:
        """Encrypt a string value."""
        if not value:
            return value
        return self.cipher_suite.encrypt(value.encode()).decode()
    
    def decrypt(self, value: str) -> str:
        """Decrypt a string value."""
        if not value:
            return value
        return self.cipher_suite.decrypt(value.encode()).decode()

class CommunicationLog(Base, EncryptedField):
    __tablename__ = "communication_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    channel = Column(Enum(CommunicationChannel), nullable=False)
    message_type = Column(Enum(MessageCategory), nullable=False)
    subject = Column(Text)
    body = Column(Text)
    status = Column(String(50), nullable=False)
    intent = Column(Enum(CommunicationIntent), nullable=True)
    sent_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    response_received_at = Column(DateTime(timezone=True), nullable=True)
    metadata = Column(JSON)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    audit_log = Column(JSON)

    # Relationships
    patient = relationship("Patient", back_populates="communication_logs")
    escalations = relationship("CommunicationEscalation", back_populates="communication")

    # Indexes for performance
    __table_args__ = (
        Index('idx_comm_log_patient', 'patient_id'),
        Index('idx_comm_log_channel', 'channel'),
        Index('idx_comm_log_status', 'status'),
        Index('idx_comm_log_created', 'created_at'),
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.audit_log = {
            'created_at': datetime.utcnow().isoformat(),
            'created_by': kwargs.get('created_by', 'system'),
            'access_log': []
        }

    def log_access(self, user_id: str, action: str, details: dict = None):
        """Log access to this communication record."""
        self.audit_log['access_log'].append({
            'timestamp': datetime.utcnow().isoformat(),
            'user_id': user_id,
            'action': action,
            'details': details or {}
        })

    def encrypt_sensitive_data(self):
        """Encrypt sensitive fields before storage."""
        if self.subject:
            self.subject = self.encrypt(self.subject)
        if self.body:
            self.body = self.encrypt(self.body)
        if self.metadata:
            self.metadata = self.encrypt(json.dumps(self.metadata))

    def decrypt_sensitive_data(self):
        """Decrypt sensitive fields after retrieval."""
        if self.subject:
            self.subject = self.decrypt(self.subject)
        if self.body:
            self.body = self.decrypt(self.body)
        if self.metadata:
            self.metadata = json.loads(self.decrypt(self.metadata))

class CommunicationPreference(Base):
    __tablename__ = "communication_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), unique=True, nullable=False)
    preferred_channel = Column(Enum(CommunicationChannel), nullable=False)
    allow_sms = Column(Boolean, default=False, nullable=False)
    allow_voice = Column(Boolean, default=False, nullable=False)
    allow_email = Column(Boolean, default=True, nullable=False)
    allow_urgent_calls = Column(Boolean, default=False, nullable=False)
    allow_sensitive_emails = Column(Boolean, default=False, nullable=False)
    sms_consent_date = Column(DateTime(timezone=True), nullable=True)
    voice_consent_date = Column(DateTime(timezone=True), nullable=True)
    email_consent_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    consent_history = Column(JSON)

    # Relationships
    patient = relationship("Patient", back_populates="communication_preferences")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.consent_history = {
            'created_at': datetime.utcnow().isoformat(),
            'changes': []
        }

    def update_consent(self, channel: str, consent: bool, user_id: str):
        """Update consent for a specific channel and log the change."""
        consent_field = f"{channel}_consent"
        consent_date_field = f"{channel}_consent_date"
        
        if hasattr(self, consent_field):
            setattr(self, consent_field, consent)
            setattr(self, consent_date_field, datetime.utcnow())
            
            self.consent_history['changes'].append({
                'timestamp': datetime.utcnow().isoformat(),
                'channel': channel,
                'new_value': consent,
                'changed_by': user_id
            })

class CommunicationEscalation(Base):
    __tablename__ = "communication_escalations"

    id = Column(Integer, primary_key=True, index=True)
    communication_id = Column(Integer, ForeignKey("communication_logs.id"), nullable=False)
    original_channel = Column(Enum(CommunicationChannel), nullable=False)
    escalated_to = Column(Enum(CommunicationChannel), nullable=False)
    escalation_reason = Column(String, nullable=False)
    scheduled_for = Column(DateTime, nullable=False)
    executed_at = Column(DateTime)
    status = Column(String, nullable=False)  # pending, completed, failed
    error_message = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    communication = relationship("CommunicationLog", back_populates="escalations")

class MessageTemplate(Base, EncryptedField):
    __tablename__ = "message_templates"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    subject = Column(Text, nullable=False)
    body = Column(Text, nullable=False)
    category = Column(Enum(MessageCategory), nullable=True)
    intent = Column(Enum(CommunicationIntent), nullable=True)
    variables = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    version = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    version_history = Column(JSON)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.version_history = {
            'created_at': datetime.utcnow().isoformat(),
            'created_by': kwargs.get('created_by', 'system'),
            'versions': []
        }

    def create_new_version(self, user_id: str, changes: dict):
        """Create a new version of the template and log changes."""
        self.version += 1
        self.version_history['versions'].append({
            'version': self.version,
            'timestamp': datetime.utcnow().isoformat(),
            'changed_by': user_id,
            'changes': changes
        })

    def encrypt_sensitive_data(self):
        """Encrypt sensitive fields before storage."""
        if self.subject:
            self.subject = self.encrypt(self.subject)
        if self.body:
            self.body = self.encrypt(self.body)

    def decrypt_sensitive_data(self):
        """Decrypt sensitive fields after retrieval."""
        if self.subject:
            self.subject = self.decrypt(self.subject)
        if self.body:
            self.body = self.decrypt(self.body)

class CommunicationAnalytics(Base):
    __tablename__ = "communication_analytics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey('patients.id'))
    date = Column(DateTime(timezone=True), nullable=False)
    channel = Column(Enum(CommunicationChannel), nullable=False)
    category = Column(Enum(MessageCategory), nullable=False)
    intent = Column(Enum(CommunicationIntent), nullable=True)
    total_messages = Column(Integer, default=0, nullable=False)
    successful_messages = Column(Integer, default=0, nullable=False)
    failed_messages = Column(Integer, default=0, nullable=False)
    average_response_time = Column(Integer, nullable=True)  # in minutes
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    audit_log = Column(JSON)

    # Relationships
    patient = relationship("Patient", back_populates="communication_analytics")

    # Unique constraint to prevent duplicate entries
    __table_args__ = (
        Index('idx_comm_analytics_patient_date_channel', 'patient_id', 'date', 'channel', unique=True),
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.audit_log = {
            'created_at': datetime.utcnow().isoformat(),
            'created_by': kwargs.get('created_by', 'system'),
            'access_log': []
        }

    def log_access(self, user_id: str, action: str, details: dict = None):
        """Log access to this analytics record."""
        self.audit_log['access_log'].append({
            'timestamp': datetime.utcnow().isoformat(),
            'user_id': user_id,
            'action': action,
            'details': details or {}
        }) 