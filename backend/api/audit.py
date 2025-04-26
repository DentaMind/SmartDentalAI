from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel

from database import get_db
from models.audit import AuditEvent, AuditEventType
from auth import get_current_user, require_admin

router = APIRouter(prefix="/audit", tags=["audit"])

class AuditLogResponse(BaseModel):
    """Response model for audit log entries."""
    id: int
    event_type: str
    user_id: int
    patient_id: Optional[int]
    resource_type: str
    resource_id: int
    ip_address: str
    timestamp: datetime
    metadata: dict

@router.get("/logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    patient_id: Optional[int] = None,
    event_type: Optional[str] = None,
    user_id: Optional[int] = None,
    resource_type: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    offset: int = 0,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[AuditLogResponse]:
    """
    Get audit logs with optional filtering.
    
    Args:
        start_date: Filter logs after this date
        end_date: Filter logs before this date
        patient_id: Filter by patient ID
        event_type: Filter by event type
        user_id: Filter by user ID
        resource_type: Filter by resource type
        limit: Maximum number of logs to return (max 100)
        offset: Number of logs to skip
        current_user: Currently authenticated user (must be admin)
        db: Database session
        
    Returns:
        List of audit log entries
    """
    # Ensure user is admin
    require_admin(current_user)
    
    # Build query
    query = db.query(AuditEvent)
    
    # Apply filters
    if start_date:
        query = query.filter(AuditEvent.timestamp >= start_date)
    if end_date:
        query = query.filter(AuditEvent.timestamp <= end_date)
    if patient_id:
        query = query.filter(AuditEvent.patient_id == patient_id)
    if event_type:
        query = query.filter(AuditEvent.event_type == event_type)
    if user_id:
        query = query.filter(AuditEvent.user_id == user_id)
    if resource_type:
        query = query.filter(AuditEvent.resource_type == resource_type)
        
    # Order by most recent first
    query = query.order_by(desc(AuditEvent.timestamp))
    
    # Paginate
    logs = query.offset(offset).limit(limit).all()
    
    return logs

@router.get("/event-types")
async def get_event_types(
    current_user = Depends(get_current_user),
) -> dict:
    """
    Get list of available audit event types.
    
    Args:
        current_user: Currently authenticated user (must be admin)
        
    Returns:
        Dict of event type categories and their values
    """
    # Ensure user is admin
    require_admin(current_user)
    
    # Group event types by category
    event_types = {
        "treatment_plan": [
            AuditEventType.TREATMENT_PLAN_CREATED,
            AuditEventType.TREATMENT_PLAN_UPDATED,
            AuditEventType.TREATMENT_PLAN_DELETED,
            AuditEventType.CONSENT_SIGNED,
        ],
        "clinical": [
            AuditEventType.PROCEDURE_COMPLETED,
            AuditEventType.PROCEDURE_CANCELLED,
            AuditEventType.XRAY_UPLOADED,
            AuditEventType.DIAGNOSIS_ADDED,
        ],
        "financial": [
            AuditEventType.PAYMENT_POSTED,
            AuditEventType.PAYMENT_REVERSED,
            AuditEventType.LEDGER_ADJUSTMENT,
            AuditEventType.INSURANCE_CLAIM_SUBMITTED,
            AuditEventType.INSURANCE_PREAUTH_SENT,
            AuditEventType.INSURANCE_PAYMENT_POSTED,
        ],
        "communication": [
            AuditEventType.PATIENT_COMMUNICATION_SENT,
            AuditEventType.REFERRAL_SENT,
            AuditEventType.PRESCRIPTION_SENT,
        ],
    }
    
    return event_types 