from datetime import datetime
from typing import Dict, Any, Optional, List
import json
import os
from cryptography.fernet import Fernet
from sqlalchemy.orm import Session
from ..models.communication import (
    CommunicationLog,
    CommunicationPreference,
    MessageTemplate,
    CommunicationAnalytics
)
from ..models.audit import AuditLog
from ..schemas.communication import (
    CommunicationChannel,
    CommunicationIntent,
    MessageCategory
)
import uuid
import logging

logger = logging.getLogger(__name__)

class SecurityService:
    """Service for handling encryption, audit logging, and HIPAA compliance features."""
    
    def __init__(self, db: Session):
        self.db = db
        self.encryption_key = os.environ.get('ENCRYPTION_KEY')
        if not self.encryption_key:
            raise ValueError("ENCRYPTION_KEY environment variable is required")
        self.cipher_suite = Fernet(self.encryption_key.encode())
    
    def encrypt_data(self, data: str) -> str:
        """Encrypt sensitive data."""
        if not data:
            return data
        return self.cipher_suite.encrypt(data.encode()).decode()
    
    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data."""
        if not encrypted_data:
            return encrypted_data
        return self.cipher_suite.decrypt(encrypted_data.encode()).decode()
    
    def log_access(
        self,
        user_id: str,
        entity_type: str,
        entity_id: str,
        action: str,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> None:
        """Log access to sensitive data."""
        audit_log = AuditLog(
            id=str(uuid.uuid4()),
            user_id=user_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=datetime.utcnow()
        )
        self.db.add(audit_log)
        self.db.commit()
    
    def update_consent_history(
        self,
        patient_id: str,
        channel: CommunicationChannel,
        consent: bool,
        user_id: str,
        reason: Optional[str] = None
    ) -> None:
        """Update consent history for a patient."""
        preference = self.db.query(CommunicationPreference).filter(
            CommunicationPreference.patient_id == patient_id
        ).first()
        
        if not preference:
            preference = CommunicationPreference(
                id=str(uuid.uuid4()),
                patient_id=patient_id,
                preferred_channel=channel,
                consent_history=[]
            )
            self.db.add(preference)
        
        consent_date = datetime.utcnow()
        consent_field = f"{channel.value}_consent"
        consent_date_field = f"{channel.value}_consent_date"
        
        setattr(preference, consent_field, consent)
        setattr(preference, consent_date_field, consent_date)
        
        consent_history = preference.consent_history or []
        consent_history.append({
            'timestamp': consent_date.isoformat(),
            'channel': channel.value,
            'consent': consent,
            'changed_by': user_id,
            'reason': reason
        })
        
        preference.consent_history = consent_history
        self.db.commit()
    
    def create_template_version(
        self,
        template_id: str,
        user_id: str,
        changes: Dict[str, Any]
    ) -> None:
        """Create a new version of a message template."""
        template = self.db.query(MessageTemplate).filter(
            MessageTemplate.id == template_id
        ).first()
        
        if not template:
            raise ValueError(f"Template {template_id} not found")
        
        template.version += 1
        version_history = template.version_history or []
        version_history.append({
            'version': template.version,
            'timestamp': datetime.utcnow().isoformat(),
            'changed_by': user_id,
            'changes': changes
        })
        
        template.version_history = version_history
        self.db.commit()
    
    def encrypt_communication_log(
        self,
        log: CommunicationLog,
        user_id: str
    ) -> None:
        """Encrypt sensitive fields in a communication log."""
        if log.subject:
            log.subject = self.encrypt_data(log.subject)
        if log.body:
            log.body = self.encrypt_data(log.body)
        if log.metadata:
            log.metadata = self.encrypt_data(json.dumps(log.metadata))
        
        self.log_access(
            user_id=user_id,
            entity_type='communication_log',
            entity_id=str(log.id),
            action='encrypt',
            details={'fields': ['subject', 'body', 'metadata']}
        )
    
    def decrypt_communication_log(
        self,
        log: CommunicationLog,
        user_id: str
    ) -> None:
        """Decrypt sensitive fields in a communication log."""
        if log.subject:
            log.subject = self.decrypt_data(log.subject)
        if log.body:
            log.body = self.decrypt_data(log.body)
        if log.metadata:
            log.metadata = json.loads(self.decrypt_data(log.metadata))
        
        self.log_access(
            user_id=user_id,
            entity_type='communication_log',
            entity_id=str(log.id),
            action='decrypt',
            details={'fields': ['subject', 'body', 'metadata']}
        )
    
    def get_audit_logs(
        self,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        user_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Retrieve audit logs with optional filtering."""
        query = self.db.query(AuditLog)
        
        if entity_type:
            query = query.filter(AuditLog.entity_type == entity_type)
        if entity_id:
            query = query.filter(AuditLog.entity_id == entity_id)
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if start_date:
            query = query.filter(AuditLog.created_at >= start_date)
        if end_date:
            query = query.filter(AuditLog.created_at <= end_date)
        
        logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
        return [{
            'id': str(log.id),
            'user_id': log.user_id,
            'entity_type': log.entity_type,
            'entity_id': log.entity_id,
            'action': log.action,
            'details': log.details,
            'ip_address': log.ip_address,
            'user_agent': log.user_agent,
            'created_at': log.created_at.isoformat()
        } for log in logs] 