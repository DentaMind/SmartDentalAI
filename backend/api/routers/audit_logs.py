"""
Audit Logs API Router

This module provides API endpoints for accessing audit logs for HIPAA compliance.
These endpoints are restricted to admin users.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path, Request, BackgroundTasks
from fastapi.responses import JSONResponse, StreamingResponse
import io
import csv
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging
import json
from pydantic import BaseModel, Field

from ..models.audit_log import (
    AuditLog,
    AuditLogResponse,
    AuditLogFilter,
    AuditLogStats,
    get_audit_logs,
    count_audit_logs,
    get_audit_log_stats,
    get_recent_patient_accesses,
    get_unusual_access_patterns
)
from ..auth.dependencies import get_current_user, verify_admin_role, verify_phi_access
from ..utils.anomaly_detection import anomaly_detector

# Setup logger
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/audit",
    tags=["audit logs"],
    responses={404: {"description": "Not found"}}
)

# Alert configuration model
class AlertConfig(BaseModel):
    """Configuration for security alerts"""
    failed_logins_threshold: int = Field(5, description="Number of failed logins to trigger alert")
    patient_access_threshold: int = Field(20, description="Number of patients accessed to trigger alert")
    std_dev_threshold: float = Field(3.0, description="Standard deviation threshold for anomaly detection")
    unusual_hours_start: int = Field(22, description="Start hour for unusual access (24h format)")
    unusual_hours_end: int = Field(6, description="End hour for unusual access (24h format)")
    alert_webhook_url: Optional[str] = Field(None, description="Webhook URL for real-time alerts")
    email_alerts: bool = Field(False, description="Send email alerts for high severity anomalies")
    alert_recipients: Optional[List[str]] = Field(None, description="Email addresses for alerts")

# Alert storage
_alert_config = AlertConfig()
_webhook_subscribers = []

@router.get("/logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    start_time: Optional[datetime] = Query(None, description="Start timestamp (ISO format)"),
    end_time: Optional[datetime] = Query(None, description="End timestamp (ISO format)"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    user_role: Optional[str] = Query(None, description="Filter by user role"),
    path: Optional[str] = Query(None, description="Filter by path (partial match)"),
    status_code: Optional[int] = Query(None, description="Filter by status code"),
    patient_id: Optional[str] = Query(None, description="Filter by patient ID"),
    is_phi_access: Optional[bool] = Query(None, description="Filter by PHI access flag"),
    limit: int = Query(100, description="Maximum number of logs to return"),
    offset: int = Query(0, description="Number of logs to skip"),
    current_user: Dict[str, Any] = Depends(verify_admin_role)
):
    """
    Get audit logs with filtering.
    
    This endpoint is restricted to admin users.
    """
    # Create filter from query parameters
    filter_params = AuditLogFilter(
        start_time=start_time,
        end_time=end_time,
        user_id=user_id,
        user_role=user_role,
        path=path,
        status_code=status_code,
        patient_id=patient_id,
        is_phi_access=is_phi_access
    )
    
    # Get logs and total count
    logs = await get_audit_logs(filter_params, limit=limit, offset=offset)
    total_count = await count_audit_logs(filter_params)
    
    # Add pagination headers
    headers = {
        "X-Total-Count": str(total_count),
        "X-Limit": str(limit),
        "X-Offset": str(offset)
    }
    
    # Log the access to audit logs
    logger.info(
        f"Audit logs accessed by {current_user['user_id']} ({current_user['role']}) "
        f"with filters: {filter_params.dict(exclude_none=True)}"
    )
    
    return JSONResponse(
        content=[log.model_dump() for log in logs], 
        headers=headers
    )

@router.get("/stats", response_model=AuditLogStats)
async def get_audit_statistics(
    start_time: Optional[datetime] = Query(None, description="Start timestamp (ISO format)"),
    end_time: Optional[datetime] = Query(None, description="End timestamp (ISO format)"),
    user_role: Optional[str] = Query(None, description="Filter by user role"),
    current_user: Dict[str, Any] = Depends(verify_admin_role)
):
    """
    Get statistics for audit logs.
    
    This endpoint is restricted to admin users.
    """
    stats = await get_audit_log_stats(
        start_time=start_time,
        end_time=end_time,
        user_role=user_role
    )
    
    return stats

@router.get("/patient/{patient_id}", response_model=List[AuditLogResponse])
async def get_patient_audit_logs(
    patient_id: str = Path(..., description="Patient ID"),
    limit: int = Query(50, description="Maximum number of logs to return"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get audit logs for a specific patient.
    
    This endpoint requires the user to have access to the patient's data.
    Access is logged for HIPAA compliance.
    """
    # First, verify that the user has access to this patient's data
    await verify_phi_access(current_user, patient_id)
    
    # Get recent accesses
    logs = await get_recent_patient_accesses(patient_id, limit)
    
    return logs

@router.get("/alerts", response_model=List[Dict[str, Any]])
async def get_security_alerts(
    days: int = Query(1, description="Number of days to look back for alerts", ge=1, le=30),
    alert_types: Optional[List[str]] = Query(None, description="Filter by alert types"),
    severity: Optional[str] = Query(None, description="Filter by severity (high, medium, low)"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    current_user: Dict[str, Any] = Depends(verify_admin_role)
):
    """
    Get security alerts based on advanced anomaly detection.
    
    This endpoint is restricted to admin users.
    """
    try:
        # Use the advanced anomaly detection system
        time_window = timedelta(days=days)
        all_anomalies = await anomaly_detector.detect_all_anomalies(time_window)
        
        # Apply filters if specified
        if alert_types:
            all_anomalies = [a for a in all_anomalies if a.get("type") in alert_types]
            
        if severity:
            all_anomalies = [a for a in all_anomalies if a.get("severity") == severity.lower()]
            
        if user_id:
            all_anomalies = [a for a in all_anomalies if a.get("user_id") == user_id]
        
        # Log this security review
        logger.info(
            f"Security alerts accessed by {current_user['user_id']} ({current_user['role']}) "
            f"looking back {days} days"
        )
        
        return all_anomalies
    except Exception as e:
        logger.error(f"Error detecting anomalies: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error detecting anomalies: {str(e)}")

@router.get("/alerts/types", response_model=List[Dict[str, Any]])
async def get_alert_types(
    current_user: Dict[str, Any] = Depends(verify_admin_role)
):
    """
    Get available alert types with descriptions.
    
    This endpoint is restricted to admin users.
    """
    alert_types = [
        {
            "id": "multiple_failed_logins",
            "name": "Multiple Failed Logins",
            "description": "Multiple failed login attempts from the same IP address",
            "hipaa_relevant": True,
            "typical_severity": "medium"
        },
        {
            "id": "user_multiple_failed_logins",
            "name": "User Failed Logins", 
            "description": "Multiple failed login attempts for a specific user",
            "hipaa_relevant": True,
            "typical_severity": "high"
        },
        {
            "id": "excessive_patient_access",
            "name": "Excessive Patient Access",
            "description": "User accessed more patients than statistically normal for their role",
            "hipaa_relevant": True,
            "typical_severity": "high"
        },
        {
            "id": "many_patients_accessed",
            "name": "Multiple Patient Access",
            "description": "User accessed many different patients in a short period",
            "hipaa_relevant": True,
            "typical_severity": "medium"
        },
        {
            "id": "unusual_hours_access",
            "name": "After-Hours Access",
            "description": "PHI access during unusual hours (nights, weekends)",
            "hipaa_relevant": True,
            "typical_severity": "medium"
        },
        {
            "id": "behavioral_anomaly",
            "name": "Behavioral Anomaly",
            "description": "User activity differs significantly from their normal patterns",
            "hipaa_relevant": True,
            "typical_severity": "medium"
        },
        {
            "id": "new_ip_address",
            "name": "New Location",
            "description": "User accessed the system from a new IP address",
            "hipaa_relevant": True,
            "typical_severity": "medium"
        },
        {
            "id": "api_abuse",
            "name": "API Abuse",
            "description": "Unusually high frequency of API calls to specific endpoints",
            "hipaa_relevant": False,
            "typical_severity": "high"
        },
        {
            "id": "api_scraping",
            "name": "API Scraping",
            "description": "Access to many different API endpoints in a short period",
            "hipaa_relevant": True,
            "typical_severity": "high"
        }
    ]
    
    return alert_types

@router.get("/alerts/realtime", response_model=Dict[str, Any])
async def subscribe_to_alerts(
    callback_url: str,
    current_user: Dict[str, Any] = Depends(verify_admin_role)
):
    """
    Subscribe to real-time security alerts via webhook
    
    This endpoint is restricted to admin users.
    """
    # Validate the URL format
    if not callback_url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid callback URL format")
        
    # Add to subscribers if not already there
    subscriber = {
        "callback_url": callback_url,
        "user_id": current_user["user_id"],
        "created_at": datetime.utcnow().isoformat()
    }
    
    if callback_url not in [s["callback_url"] for s in _webhook_subscribers]:
        _webhook_subscribers.append(subscriber)
        logger.info(f"New alert webhook subscriber: {callback_url}")
    
    return {
        "status": "subscribed",
        "message": "You are now subscribed to real-time security alerts",
        "webhook_url": callback_url,
        "total_subscribers": len(_webhook_subscribers)
    }

@router.delete("/alerts/realtime", response_model=Dict[str, Any])
async def unsubscribe_from_alerts(
    callback_url: str,
    current_user: Dict[str, Any] = Depends(verify_admin_role)
):
    """
    Unsubscribe from real-time security alerts
    
    This endpoint is restricted to admin users.
    """
    # Remove from subscribers if exists
    global _webhook_subscribers
    initial_count = len(_webhook_subscribers)
    _webhook_subscribers = [s for s in _webhook_subscribers if s["callback_url"] != callback_url]
    
    if len(_webhook_subscribers) < initial_count:
        logger.info(f"Removed alert webhook subscriber: {callback_url}")
        message = "Successfully unsubscribed from alerts"
    else:
        message = "URL was not subscribed to alerts"
    
    return {
        "status": "unsubscribed",
        "message": message,
        "webhook_url": callback_url,
        "total_subscribers": len(_webhook_subscribers)
    }

@router.post("/alerts/test", response_model=Dict[str, Any])
async def test_alert_notification(
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(verify_admin_role)
):
    """
    Send a test alert to all subscribed webhooks
    
    This endpoint is restricted to admin users.
    """
    if not _webhook_subscribers:
        return {
            "status": "no_subscribers",
            "message": "No webhook subscribers found"
        }
        
    # Create a test alert
    test_alert = {
        "type": "test_alert",
        "timestamp": datetime.utcnow().isoformat(),
        "severity": "info",
        "description": "This is a test alert notification",
        "initiated_by": current_user["user_id"],
        "is_test": True
    }
    
    # Schedule the notifications to be sent in background
    background_tasks.add_task(send_webhook_notifications, test_alert)
    
    return {
        "status": "test_sent",
        "message": f"Test alert sent to {len(_webhook_subscribers)} subscribers",
        "alert": test_alert
    }

@router.get("/config", response_model=AlertConfig)
async def get_alert_config(
    current_user: Dict[str, Any] = Depends(verify_admin_role)
):
    """
    Get current alert configuration
    
    This endpoint is restricted to admin users.
    """
    return _alert_config

@router.post("/config", response_model=AlertConfig)
async def update_alert_config(
    config: AlertConfig,
    current_user: Dict[str, Any] = Depends(verify_admin_role)
):
    """
    Update alert configuration
    
    This endpoint is restricted to admin users.
    """
    global _alert_config
    _alert_config = config
    
    # Update anomaly detector thresholds
    anomaly_detector.thresholds.update({
        "failed_logins": config.failed_logins_threshold,
        "patient_access_count": config.patient_access_threshold,
        "std_dev_multiplier": config.std_dev_threshold,
        "unusual_hours_start": config.unusual_hours_start,
        "unusual_hours_end": config.unusual_hours_end
    })
    
    # Log the configuration change
    logger.info(
        f"Alert configuration updated by {current_user['user_id']} ({current_user['role']}): "
        f"{config.dict()}"
    )
    
    return _alert_config

@router.get("/export", response_class=StreamingResponse)
async def export_audit_logs(
    start_time: Optional[datetime] = Query(None, description="Start timestamp (ISO format)"),
    end_time: Optional[datetime] = Query(None, description="End timestamp (ISO format)"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    user_role: Optional[str] = Query(None, description="Filter by user role"),
    path: Optional[str] = Query(None, description="Filter by path (partial match)"),
    status_code: Optional[int] = Query(None, description="Filter by status code"),
    patient_id: Optional[str] = Query(None, description="Filter by patient ID"),
    is_phi_access: Optional[bool] = Query(None, description="Filter by PHI access flag"),
    format: str = Query("csv", description="Export format (csv or json)"),
    current_user: Dict[str, Any] = Depends(verify_admin_role)
):
    """
    Export audit logs in CSV or JSON format.
    
    This endpoint is restricted to admin users.
    """
    # Create filter from query parameters
    filter_params = AuditLogFilter(
        start_time=start_time,
        end_time=end_time,
        user_id=user_id,
        user_role=user_role,
        path=path,
        status_code=status_code,
        patient_id=patient_id,
        is_phi_access=is_phi_access
    )
    
    # Get all logs matching the filter (no pagination for export)
    logs = await get_audit_logs(filter_params, limit=10000, offset=0)
    
    # Log the export
    logger.info(
        f"Audit logs exported by {current_user['user_id']} ({current_user['role']}) "
        f"with filters: {filter_params.dict(exclude_none=True)}"
    )
    
    # Format timestamp for the filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if format.lower() == "json":
        # Convert to JSON
        json_data = [log.model_dump() for log in logs]
        json_str = json.dumps(json_data, default=str, indent=2)
        
        # Create a streaming response
        return StreamingResponse(
            io.StringIO(json_str),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=audit_logs_{timestamp}.json"}
        )
    else:
        # Default to CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            "ID", "Timestamp", "User ID", "User Role", "IP Address",
            "Method", "Path", "Status Code", "Duration (ms)",
            "Patient ID", "Is PHI Access", "User Agent"
        ])
        
        # Write data
        for log in logs:
            writer.writerow([
                log.id,
                log.timestamp.isoformat(),
                log.user_id,
                log.user_role,
                log.ip_address,
                log.method,
                log.path,
                log.status_code,
                log.duration_ms,
                log.patient_id or "",
                "Yes" if log.is_phi_access else "No",
                log.user_agent or ""
            ])
        
        # Reset the cursor position to the beginning of the StringIO object
        output.seek(0)
        
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=audit_logs_{timestamp}.csv"}
        )

@router.get("/summary/daily", response_model=List[Dict[str, Any]])
async def get_daily_summary(
    days: int = Query(7, description="Number of days to include"),
    current_user: Dict[str, Any] = Depends(verify_admin_role)
):
    """
    Get a daily summary of audit logs.
    
    This endpoint is restricted to admin users.
    """
    # Calculate start date based on number of days
    start_date = datetime.now() - timedelta(days=days)
    
    # Build the summary by day
    daily_summary = []
    
    # Loop through each day
    for day in range(days):
        day_date = start_date + timedelta(days=day)
        next_day = day_date + timedelta(days=1)
        
        # Create filter for this day
        day_filter = AuditLogFilter(
            start_time=day_date,
            end_time=next_day
        )
        
        # Get stats for this day
        total_logs = await count_audit_logs(day_filter)
        
        # Get PHI accesses for this day
        phi_filter = AuditLogFilter(
            start_time=day_date,
            end_time=next_day,
            is_phi_access=True
        )
        phi_accesses = await count_audit_logs(phi_filter)
        
        # Get error count for this day
        error_filter = AuditLogFilter(
            start_time=day_date,
            end_time=next_day,
            status_code=500  # Just counting 500 errors for simplicity
        )
        errors = await count_audit_logs(error_filter)
        
        # Add to summary
        daily_summary.append({
            "date": day_date.strftime("%Y-%m-%d"),
            "total_logs": total_logs,
            "phi_accesses": phi_accesses,
            "errors": errors
        })
    
    return daily_summary

async def send_webhook_notifications(alert: Dict[str, Any]):
    """
    Send notifications to all subscribed webhooks
    
    Args:
        alert: The alert payload to send
    """
    import aiohttp
    
    # Add timestamp if not present
    if "timestamp" not in alert:
        alert["timestamp"] = datetime.utcnow().isoformat()
        
    # Process each subscriber
    async with aiohttp.ClientSession() as session:
        for subscriber in _webhook_subscribers:
            try:
                # Send POST request to the webhook URL
                async with session.post(
                    subscriber["callback_url"], 
                    json=alert,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status >= 400:
                        logger.warning(
                            f"Failed to send alert to webhook {subscriber['callback_url']}: "
                            f"Status {response.status}"
                        )
            except Exception as e:
                logger.error(f"Error sending alert to webhook {subscriber['callback_url']}: {str(e)}") 