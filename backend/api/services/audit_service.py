from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from sqlalchemy.orm import Session
from ..repositories.audit_repository import AuditRepository
from ..models.audit import AuditLog
from ..schemas.audit import AuditLogFilter, AuditLogCreate
from ..core.security import get_current_user
from ..models.user import User

class AuditService:
    def __init__(self, db: Session):
        self.repository = AuditRepository(db)
        self.db = db

    def create_audit_log(
        self,
        action: str,
        entity_type: str,
        entity_id: str,
        details: Dict[str, Any],
        user_id: str,
        ip_address: str
    ) -> AuditLog:
        """Create a new audit log entry."""
        audit_log = AuditLog(
            id=str(uuid.uuid4()),
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            ip_address=ip_address,
            details=details,
            timestamp=datetime.utcnow()
        )
        return self.repository.create(audit_log)

    def get_audit_log(self, log_id: str) -> Optional[AuditLog]:
        """Get an audit log by its ID."""
        return self.repository.get_by_id(log_id)

    def get_audit_logs(
        self,
        page: int = 1,
        per_page: int = 50,
        filters: Optional[AuditLogFilter] = None
    ) -> tuple[List[AuditLog], int]:
        """Get paginated audit logs with optional filtering."""
        return self.repository.get_all(page, per_page, filters)

    def export_audit_logs(
        self,
        filters: Optional[AuditLogFilter] = None
    ) -> List[Dict[str, Any]]:
        """Export audit logs as a list of dictionaries."""
        return self.repository.export_logs(filters)

    def get_user_audit_logs(
        self,
        user_id: str,
        page: int = 1,
        per_page: int = 50
    ) -> tuple[List[AuditLog], int]:
        """Get paginated audit logs for a specific user."""
        return self.repository.get_user_logs(user_id, page, per_page)

    def get_entity_audit_logs(
        self,
        entity_type: str,
        entity_id: str,
        page: int = 1,
        per_page: int = 50
    ) -> tuple[List[AuditLog], int]:
        """Get paginated audit logs for a specific entity."""
        return self.repository.get_entity_logs(entity_type, entity_id, page, per_page)

    def log_user_action(
        self,
        action: str,
        entity_type: str,
        entity_id: str,
        details: Dict[str, Any],
        ip_address: str,
        current_user: User
    ) -> AuditLog:
        """Log a user action with automatic user ID extraction."""
        return self.create_audit_log(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            user_id=current_user.id,
            ip_address=ip_address
        )

    def log_system_action(
        self,
        action: str,
        entity_type: str,
        entity_id: str,
        details: Dict[str, Any],
        ip_address: str
    ) -> AuditLog:
        """Log a system action with a system user ID."""
        return self.create_audit_log(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            user_id="system",
            ip_address=ip_address
        ) 