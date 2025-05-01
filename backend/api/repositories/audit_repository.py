from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from ..models.audit import AuditLog
from ..schemas.audit import AuditLogFilter

class AuditRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, audit_log: AuditLog) -> AuditLog:
        """Create a new audit log entry."""
        self.db.add(audit_log)
        self.db.commit()
        self.db.refresh(audit_log)
        return audit_log

    def get_by_id(self, log_id: str) -> Optional[AuditLog]:
        """Get an audit log by its ID."""
        return self.db.query(AuditLog).filter(AuditLog.id == log_id).first()

    def get_all(
        self,
        page: int = 1,
        per_page: int = 50,
        filters: Optional[AuditLogFilter] = None
    ) -> tuple[List[AuditLog], int]:
        """Get paginated audit logs with optional filtering."""
        query = self.db.query(AuditLog)

        if filters:
            if filters.action:
                query = query.filter(AuditLog.action == filters.action)
            if filters.entity_type:
                query = query.filter(AuditLog.entity_type == filters.entity_type)
            if filters.search:
                search = f"%{filters.search}%"
                query = query.filter(
                    or_(
                        AuditLog.details.ilike(search),
                        AuditLog.user_id.ilike(search),
                        AuditLog.entity_id.ilike(search)
                    )
                )
            if filters.start_date:
                query = query.filter(AuditLog.timestamp >= filters.start_date)
            if filters.end_date:
                query = query.filter(AuditLog.timestamp <= filters.end_date)

        total = query.count()
        logs = query.order_by(desc(AuditLog.timestamp)) \
            .offset((page - 1) * per_page) \
            .limit(per_page) \
            .all()

        return logs, total

    def export_logs(
        self,
        filters: Optional[AuditLogFilter] = None
    ) -> List[Dict[str, Any]]:
        """Export audit logs as a list of dictionaries."""
        query = self.db.query(AuditLog)

        if filters:
            if filters.action:
                query = query.filter(AuditLog.action == filters.action)
            if filters.entity_type:
                query = query.filter(AuditLog.entity_type == filters.entity_type)
            if filters.search:
                search = f"%{filters.search}%"
                query = query.filter(
                    or_(
                        AuditLog.details.ilike(search),
                        AuditLog.user_id.ilike(search),
                        AuditLog.entity_id.ilike(search)
                    )
                )
            if filters.start_date:
                query = query.filter(AuditLog.timestamp >= filters.start_date)
            if filters.end_date:
                query = query.filter(AuditLog.timestamp <= filters.end_date)

        logs = query.order_by(desc(AuditLog.timestamp)).all()
        return [
            {
                "timestamp": log.timestamp.isoformat(),
                "user_id": log.user_id,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "ip_address": log.ip_address,
                "details": log.details
            }
            for log in logs
        ]

    def get_user_logs(
        self,
        user_id: str,
        page: int = 1,
        per_page: int = 50
    ) -> tuple[List[AuditLog], int]:
        """Get paginated audit logs for a specific user."""
        query = self.db.query(AuditLog).filter(AuditLog.user_id == user_id)
        total = query.count()
        logs = query.order_by(desc(AuditLog.timestamp)) \
            .offset((page - 1) * per_page) \
            .limit(per_page) \
            .all()
        return logs, total

    def get_entity_logs(
        self,
        entity_type: str,
        entity_id: str,
        page: int = 1,
        per_page: int = 50
    ) -> tuple[List[AuditLog], int]:
        """Get paginated audit logs for a specific entity."""
        query = self.db.query(AuditLog).filter(
            AuditLog.entity_type == entity_type,
            AuditLog.entity_id == entity_id
        )
        total = query.count()
        logs = query.order_by(desc(AuditLog.timestamp)) \
            .offset((page - 1) * per_page) \
            .limit(per_page) \
            .all()
        return logs, total 