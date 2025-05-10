"""
Security Alerts Router

This module provides API endpoints for managing security alerts generated
by the anomaly detection system.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging
import uuid
import ssl

from ..models.security_alert import (
    SecurityAlert,
    SecurityAlertResponse,
    SecurityAlertUpdate,
    SecurityAlertFilter,
    AlertStatus,
    AlertSeverity,
    AlertCategory,
    create_security_alert_from_anomaly,
    update_alert_status,
    get_security_alerts,
    count_security_alerts,
    get_resolution_stats
)
from ..database import AsyncSession
from ..auth.dependencies import get_current_user, verify_admin_role
from ..utils.anomaly_detection import anomaly_detector
from ..services.email_service import (
    send_email_notification,
    send_critical_security_alert_email,
    send_weekly_security_digest
)

# Setup logger
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/security/alerts",
    tags=["security alerts"],
    responses={404: {"description": "Not found"}}
)

@router.get("", response_model=List[SecurityAlertResponse])
async def list_security_alerts(
    start_time: Optional[datetime] = Query(None, description="Start timestamp (ISO format)"),
    end_time: Optional[datetime] = Query(None, description="End timestamp (ISO format)"),
    alert_type: Optional[str] = Query(None, description="Filter by alert type"),
    category: Optional[AlertCategory] = Query(None, description="Filter by alert category"),
    severity: Optional[List[AlertSeverity]] = Query(None, description="Filter by severity levels"),
    status: Optional[List[AlertStatus]] = Query(None, description="Filter by alert status"),
    user_id: Optional[str] = Query(None, description="Filter by affected user ID"),
    ip_address: Optional[str] = Query(None, description="Filter by IP address"),
    patient_id: Optional[str] = Query(None, description="Filter by patient ID"),
    limit: int = Query(100, description="Maximum number of alerts to return"),
    offset: int = Query(0, description="Number of alerts to skip"),
    current_user: Dict[str, Any] = Depends(verify_admin_role)
):
    """
    Get security alerts with filtering.
    
    This endpoint is restricted to admin/security users.
    """
    # Create filter from query parameters
    filter_params = SecurityAlertFilter(
        start_time=start_time,
        end_time=end_time,
        alert_type=alert_type,
        category=category,
        severity=severity,
        status=status,
        user_id=user_id,
        ip_address=ip_address,
        patient_id=patient_id
    )
    
    # Get alerts and total count
    alerts = await get_security_alerts(filter_params, limit=limit, offset=offset)
    total_count = await count_security_alerts(filter_params)
    
    # Add pagination headers
    headers = {
        "X-Total-Count": str(total_count),
        "X-Limit": str(limit),
        "X-Offset": str(offset)
    }
    
    # Log the access to security alerts
    logger.info(
        f"Security alerts accessed by {current_user['user_id']} ({current_user['role']}) "
        f"with filters: {filter_params.dict(exclude_none=True)}"
    )
    
    # Convert ORM objects to Pydantic models
    response_data = [SecurityAlertResponse.from_orm(alert) for alert in alerts]
    return JSONResponse(
        content=[alert.dict() for alert in response_data], 
        headers=headers
    )

@router.get("/stats", response_model=Dict[str, Any])
async def get_security_alert_stats(
    start_time: Optional[datetime] = Query(None, description="Start timestamp (ISO format)"),
    end_time: Optional[datetime] = Query(None, description="End timestamp (ISO format)"),
    current_user: Dict[str, Any] = Depends(verify_admin_role)
):
    """
    Get statistics about security alerts and resolutions.
    
    This endpoint is restricted to admin/security users.
    """
    stats = await get_resolution_stats(start_time, end_time)
    return stats.dict()

@router.post("/scan", response_model=List[SecurityAlertResponse])
async def run_security_scan(
    days: int = Query(1, description="Number of days to scan", ge=1, le=30),
    background_tasks: BackgroundTasks = None,
    current_user: Dict[str, Any] = Depends(verify_admin_role)
):
    """
    Run an on-demand security scan using the anomaly detection system.
    
    This endpoint is restricted to admin/security users.
    """
    time_window = timedelta(days=days)
    
    try:
        # Run all anomaly detection algorithms
        anomalies = await anomaly_detector.detect_all_anomalies(time_window)
        
        # Create security alerts for each anomaly
        alerts = []
        for anomaly in anomalies:
            alert = await create_security_alert_from_anomaly(anomaly)
            alerts.append(alert)
        
        # Queue email notifications for critical alerts
        if background_tasks:
            critical_alerts = [a for a in alerts if a.severity == AlertSeverity.CRITICAL]
            if critical_alerts:
                background_tasks.add_task(
                    send_alert_notifications,
                    critical_alerts,
                    f"{current_user['user_id']} ({current_user['role']})"
                )
        
        # Log the scan
        logger.info(
            f"Security scan run by {current_user['user_id']} ({current_user['role']}) "
            f"detected {len(anomalies)} anomalies, created {len(alerts)} alerts"
        )
        
        # Return the created alerts
        return [SecurityAlertResponse.from_orm(alert) for alert in alerts]
    except Exception as e:
        logger.error(f"Error running security scan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error running security scan: {str(e)}")

@router.put("/{alert_id}/status", response_model=SecurityAlertResponse)
async def update_alert(
    alert_id: str = Path(..., description="Alert ID (UUID)"),
    update_data: SecurityAlertUpdate = None,
    current_user: Dict[str, Any] = Depends(verify_admin_role)
):
    """
    Update the status of a security alert.
    
    This endpoint is restricted to admin/security users.
    """
    try:
        # Update the alert status
        updated_alert = await update_alert_status(
            alert_id=alert_id,
            status=update_data.status,
            user_id=current_user["user_id"],
            notes=update_data.resolution_notes
        )
        
        if not updated_alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        # Assign to the specified user if provided
        if update_data.assigned_to:
            updated_alert.assigned_to = update_data.assigned_to
            
            # Save changes
            async with AsyncSession() as session:
                session.add(updated_alert)
                await session.commit()
                await session.refresh(updated_alert)
        
        # Log the status update
        logger.info(
            f"Security alert {alert_id} updated by {current_user['user_id']} "
            f"to status '{update_data.status}'"
        )
        
        return SecurityAlertResponse.from_orm(updated_alert)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating alert status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating alert status: {str(e)}")

@router.get("/categories", response_model=Dict[str, List[str]])
async def get_alert_categories_and_types(
    current_user: Dict[str, Any] = Depends(verify_admin_role)
):
    """
    Get available alert categories, types and severities.
    
    This endpoint is restricted to admin/security users.
    """
    return {
        "categories": [cat.value for cat in AlertCategory],
        "severities": [sev.value for sev in AlertSeverity],
        "statuses": [status.value for status in AlertStatus],
        "types": [
            "multiple_failed_logins",
            "user_multiple_failed_logins",
            "excessive_patient_access",
            "many_patients_accessed",
            "unusual_hours_access",
            "behavioral_anomaly",
            "new_ip_address",
            "api_abuse",
            "api_scraping"
        ]
    }

@router.get("/{alert_id}", response_model=SecurityAlertResponse)
async def get_security_alert_by_id(
    alert_id: str = Path(..., description="Alert ID (UUID)"),
    current_user: Dict[str, Any] = Depends(verify_admin_role)
):
    """
    Get a specific security alert by ID.
    
    This endpoint is restricted to admin/security users.
    """
    async with AsyncSession() as session:
        # Find the alert
        query = "SELECT * FROM security_alerts WHERE alert_id = :alert_id"
        result = await session.execute(query, {"alert_id": alert_id})
        alert = result.scalar_one_or_none()
        
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
            
        return SecurityAlertResponse.from_orm(alert)

@router.delete("/{alert_id}", status_code=204)
async def delete_security_alert(
    alert_id: str = Path(..., description="Alert ID (UUID)"),
    current_user: Dict[str, Any] = Depends(verify_admin_role)
):
    """
    Delete a security alert (admin only).
    
    This endpoint is restricted to admin users.
    """
    # Only allow admin users to delete alerts
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403, 
            detail="Only admin users can delete security alerts"
        )
        
    async with AsyncSession() as session:
        # Find the alert
        query = "SELECT * FROM security_alerts WHERE alert_id = :alert_id"
        result = await session.execute(query, {"alert_id": alert_id})
        alert = result.scalar_one_or_none()
        
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
            
        # Delete the alert
        await session.delete(alert)
        await session.commit()
        
        # Log the deletion
        logger.info(
            f"Security alert {alert_id} deleted by {current_user['user_id']} ({current_user['role']})"
        )
        
        return None  # 204 No Content

@router.post("/digest", response_model=Dict[str, str])
async def send_security_digest(
    days: int = Query(7, description="Number of days to include in digest", ge=1, le=30),
    recipients: Optional[str] = Query(None, description="Comma-separated list of email recipients"),
    background_tasks: BackgroundTasks = None,
    current_user: Dict[str, Any] = Depends(verify_admin_role)
):
    """
    Send a security digest email with statistics about alerts and resolutions.
    
    This endpoint is restricted to admin/security users.
    """
    try:
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Get statistics for the period
        stats = await get_resolution_stats(start_date, end_date)
        
        # Parse recipients
        recipient_list = None
        if recipients:
            recipient_list = [email.strip() for email in recipients.split(',')]
        
        # Send the digest in the background to avoid blocking
        if background_tasks:
            background_tasks.add_task(
                send_weekly_security_digest,
                start_date=start_date,
                end_date=end_date,
                stats=stats.dict(),
                recipients=recipient_list
            )
            
            # Log the action
            logger.info(
                f"Security digest queued by {current_user['user_id']} "
                f"for period {start_date.date()} to {end_date.date()}"
            )
            
            return {
                "status": "success",
                "message": f"Security digest for period {start_date.date()} to {end_date.date()} has been queued for delivery"
            }
        else:
            # Send immediately if background_tasks not available
            success = await send_weekly_security_digest(
                start_date=start_date,
                end_date=end_date,
                stats=stats.dict(),
                recipients=recipient_list
            )
            
            if success:
                logger.info(
                    f"Security digest sent by {current_user['user_id']} "
                    f"for period {start_date.date()} to {end_date.date()}"
                )
                
                return {
                    "status": "success",
                    "message": f"Security digest for period {start_date.date()} to {end_date.date()} has been sent"
                }
            else:
                raise HTTPException(status_code=500, detail="Failed to send security digest")
    except Exception as e:
        logger.error(f"Error sending security digest: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending security digest: {str(e)}")

# Add a helper function for sending alert notifications
async def send_alert_notifications(
    alerts: List[SecurityAlert],
    initiated_by: str
):
    """
    Send notifications for critical security alerts
    
    Args:
        alerts: List of alerts to send notifications for
        initiated_by: User who initiated the scan
    """
    for alert in alerts:
        # Convert the alert to a dictionary
        alert_dict = {
            "alert_id": alert.alert_id,
            "alert_type": alert.alert_type,
            "category": alert.category,
            "severity": alert.severity,
            "description": alert.description,
            "user_id": alert.user_id,
            "ip_address": alert.ip_address,
            "patient_id": alert.patient_id,
            "resource_path": alert.resource_path,
            "timestamp": alert.timestamp,
            "details": alert.details
        }
        
        # Send email notification for critical alerts
        await send_critical_security_alert_email(alert_dict)
        
        logger.info(
            f"Critical security alert notification sent for alert {alert.alert_id} "
            f"(initiated by {initiated_by})"
        )

@router.post("/export", response_model=List[SecurityAlertResponse])
async def export_security_alerts(
    format: str = Query("json", description="Export format (json or csv)"),
    current_user: Dict[str, Any] = Depends(verify_admin_role),
    start_time: Optional[datetime] = Query(None, description="Start timestamp (ISO format)"),
    end_time: Optional[datetime] = Query(None, description="End timestamp (ISO format)"),
    alert_type: Optional[str] = Query(None, description="Filter by alert type"),
    category: Optional[AlertCategory] = Query(None, description="Filter by alert category"),
    severity: Optional[List[AlertSeverity]] = Query(None, description="Filter by severity levels"),
    status: Optional[List[AlertStatus]] = Query(None, description="Filter by alert status"),
    user_id: Optional[str] = Query(None, description="Filter by affected user ID"),
    ip_address: Optional[str] = Query(None, description="Filter by IP address"),
    patient_id: Optional[str] = Query(None, description="Filter by patient ID"),
):
    """
    Export security alerts with filtering.
    
    This endpoint is restricted to admin/security users.
    """
    # Create filter from query parameters
    filter_params = SecurityAlertFilter(
        start_time=start_time,
        end_time=end_time,
        alert_type=alert_type,
        category=category,
        severity=severity,
        status=status,
        user_id=user_id,
        ip_address=ip_address,
        patient_id=patient_id
    )
    
    # Get all matching alerts (no limit)
    alerts = await get_security_alerts(filter_params, limit=10000, offset=0)
    
    # Log the export
    logger.info(
        f"Security alerts exported by {current_user['user_id']} ({current_user['role']}) "
        f"with filters: {filter_params.dict(exclude_none=True)}"
    )
    
    # Convert ORM objects to Pydantic models
    response_data = [SecurityAlertResponse.from_orm(alert) for alert in alerts]
    
    # For CSV format, we'd need to add additional content-type headers and conversion
    # This would be handled in a custom response class
    return response_data 