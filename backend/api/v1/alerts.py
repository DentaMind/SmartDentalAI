from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from database import get_db
from models.alert import Alert, AlertType, AlertStatus
from schemas.alert import AlertResponse, AlertStats
from services.alert_service import AlertService
from auth.dependencies import is_founder

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])

@router.get("/", response_model=List[AlertResponse])
async def get_alerts(
    type: Optional[AlertType] = None,
    status: Optional[AlertStatus] = None,
    hours: Optional[int] = 24,
    db: Session = Depends(get_db),
    _: dict = Depends(is_founder)  # Founder-only endpoint
):
    """Get alerts with optional filtering."""
    query = db.query(Alert)
    
    if type:
        query = query.filter(Alert.type == type)
    if status:
        query = query.filter(Alert.status == status)
    if hours:
        time_threshold = datetime.utcnow() - timedelta(hours=hours)
        query = query.filter(Alert.created_at >= time_threshold)
    
    return query.order_by(Alert.created_at.desc()).all()

@router.get("/stats", response_model=AlertStats)
async def get_alert_stats(
    hours: Optional[int] = 24,
    db: Session = Depends(get_db),
    _: dict = Depends(is_founder)  # Founder-only endpoint
):
    """Get alert statistics."""
    time_threshold = datetime.utcnow() - timedelta(hours=hours)
    
    # Get total alerts by type and severity
    alerts_by_type = (
        db.query(Alert.type, func.count(Alert.id))
        .filter(Alert.created_at >= time_threshold)
        .group_by(Alert.type)
        .all()
    )
    
    alerts_by_severity = (
        db.query(Alert.severity, func.count(Alert.id))
        .filter(Alert.created_at >= time_threshold)
        .group_by(Alert.severity)
        .all()
    )
    
    # Get active alerts count
    active_alerts = (
        db.query(Alert)
        .filter(Alert.status == AlertStatus.ACTIVE)
        .count()
    )
    
    return AlertStats(
        total_alerts=sum(count for _, count in alerts_by_type),
        alerts_by_type=dict(alerts_by_type),
        alerts_by_severity=dict(alerts_by_severity),
        active_alerts=active_alerts
    )

@router.post("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(is_founder)  # Founder-only endpoint
):
    """Resolve an active alert."""
    alert_service = AlertService(db)
    alert = await alert_service.resolve_alert(alert_id)
    
    if not alert:
        raise HTTPException(
            status_code=404,
            detail=f"Alert {alert_id} not found or already resolved"
        )
    
    return {"message": "Alert resolved successfully"}

@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(is_founder)  # Founder-only endpoint
):
    """Acknowledge an active alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
    
    if alert.status != AlertStatus.ACTIVE:
        raise HTTPException(
            status_code=400,
            detail=f"Alert {alert_id} is not active"
        )
    
    alert.status = AlertStatus.ACKNOWLEDGED
    alert.updated_at = datetime.utcnow()
    db.add(alert)
    db.commit()
    
    return {"message": "Alert acknowledged successfully"} 