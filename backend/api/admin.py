from datetime import datetime, timedelta
from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy import func, desc, and_
from sqlalchemy.orm import Session

from database import get_db
from models.audit import AuditEvent, AuditEventType
from models.treatment_plan import TreatmentPlan, TreatmentPlanStatus
from models.ledger import LedgerEntry
from auth import get_current_user, require_admin

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/dashboard")
async def get_dashboard_metrics(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get high-level metrics for the admin dashboard.
    
    Returns:
        Dict containing various system metrics
    """
    # Ensure user is admin
    require_admin(current_user)
    
    # Calculate time ranges
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)
    
    # Audit event counts
    audit_metrics = {
        "total_events_today": db.query(AuditEvent).filter(
            AuditEvent.timestamp >= today_start
        ).count(),
        "total_events_week": db.query(AuditEvent).filter(
            AuditEvent.timestamp >= week_start
        ).count(),
        "total_events_month": db.query(AuditEvent).filter(
            AuditEvent.timestamp >= month_start
        ).count(),
    }
    
    # Treatment plan metrics
    treatment_plan_metrics = {
        "open_treatment_plans": db.query(TreatmentPlan).filter(
            TreatmentPlan.status == TreatmentPlanStatus.OPEN
        ).count(),
        "completed_treatment_plans": db.query(TreatmentPlan).filter(
            TreatmentPlan.status == TreatmentPlanStatus.COMPLETED
        ).count(),
        "signed_treatment_plans": db.query(AuditEvent).filter(
            and_(
                AuditEvent.event_type == AuditEventType.CONSENT_SIGNED,
                AuditEvent.timestamp >= month_start
            )
        ).count(),
    }
    
    # Financial metrics
    financial_metrics = {
        "total_outstanding_balance": float(db.query(func.sum(LedgerEntry.amount)).scalar() or 0),
        "payments_today": db.query(AuditEvent).filter(
            and_(
                AuditEvent.event_type.in_([
                    AuditEventType.PAYMENT_POSTED,
                    AuditEventType.INSURANCE_PAYMENT_POSTED
                ]),
                AuditEvent.timestamp >= today_start
            )
        ).count(),
    }
    
    # Recent activity
    recent_activity = db.query(AuditEvent).order_by(
        desc(AuditEvent.timestamp)
    ).limit(10).all()
    
    recent_activity_list = [{
        "id": event.id,
        "event_type": event.event_type,
        "timestamp": event.timestamp,
        "patient_id": event.patient_id,
        "resource_type": event.resource_type,
    } for event in recent_activity]
    
    # Event type distribution for the last week
    event_distribution = db.query(
        AuditEvent.event_type,
        func.count(AuditEvent.id).label('count')
    ).filter(
        AuditEvent.timestamp >= week_start
    ).group_by(
        AuditEvent.event_type
    ).all()
    
    event_type_metrics = {
        event_type: count
        for event_type, count in event_distribution
    }
    
    return {
        "audit_metrics": audit_metrics,
        "treatment_plan_metrics": treatment_plan_metrics,
        "financial_metrics": financial_metrics,
        "recent_activity": recent_activity_list,
        "event_type_distribution": event_type_metrics,
    } 