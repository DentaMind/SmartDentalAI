"""
Audit Log Retention Tasks

Scheduled tasks for managing audit log retention policies.
"""

import logging
from datetime import datetime
from fastapi import Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.audit_service import AuditService
from ..config.config import settings

logger = logging.getLogger(__name__)

async def daily_audit_log_cleanup(db: Session = Depends(get_db)):
    """
    Daily task to cleanup expired audit logs based on retention policy
    
    Args:
        db: Database session
    """
    try:
        logger.info("Starting daily audit log cleanup task")
        
        # Retention policy configuration from settings
        default_retention_days = settings.AUDIT_LOG_RETENTION_DAYS
        archive_enabled = settings.AUDIT_LOG_ARCHIVE_ENABLED
        
        # Purge expired logs
        results = AuditService.purge_expired_logs(
            db=db,
            default_retention_days=default_retention_days,
            archive_before_delete=archive_enabled
        )
        
        logger.info(
            f"Audit log cleanup completed: {results['archived']} logs archived, "
            f"{results['deleted']} logs deleted"
        )
        
        return results
    except Exception as e:
        logger.error(f"Error during audit log cleanup: {str(e)}")
        raise 