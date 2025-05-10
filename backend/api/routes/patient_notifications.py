from fastapi import APIRouter, Depends, HTTPException, WebSocket, Path, Query, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime
from pydantic import BaseModel

from ..database import get_db
from ..services.patient_notification_service import (
    patient_notification_service, 
    NotificationPayload,
    AppointmentReminderPayload
)
from ..models.patient_notification import (
    PatientNotificationType,
    PatientNotificationPriority,
    PatientNotificationChannel
)
from ..auth.auth import get_current_patient
from ..models.patient import Patient

router = APIRouter(prefix="/patient-notifications", tags=["patient-notifications"])

class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    created_at: datetime
    is_read: bool
    priority: str
    action_url: Optional[str]
    metadata: Optional[Dict]

class NotificationPreferenceResponse(BaseModel):
    notification_type: str
    email_enabled: bool
    sms_enabled: bool
    in_app_enabled: bool
    push_enabled: bool

class NotificationPreferenceUpdate(BaseModel):
    email_enabled: bool
    sms_enabled: bool
    in_app_enabled: bool
    push_enabled: bool

# WebSocket endpoint for real-time notifications
@router.websocket("/ws/{patient_id}")
async def websocket_endpoint(websocket: WebSocket, patient_id: str):
    """Connect to WebSocket for real-time patient notifications"""
    await patient_notification_service.connect(websocket, patient_id)
    try:
        while True:
            # Keep the connection alive
            await websocket.receive_text()
    except Exception as e:
        patient_notification_service.disconnect(websocket, patient_id)

# Get all notifications for a patient
@router.get("", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = Query(False, description="Only return unread notifications"),
    limit: int = Query(50, description="Maximum number of notifications to return"),
    offset: int = Query(0, description="Number of notifications to skip"),
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Get all notifications for the authenticated patient"""
    notifications = await patient_notification_service.get_notifications(
        db=db,
        patient_id=current_patient.id,
        unread_only=unread_only,
        limit=limit,
        offset=offset
    )
    
    return [
        NotificationResponse(
            id=n.id,
            type=n.type,
            title=n.title,
            message=n.message,
            created_at=n.created_at,
            is_read=n.is_read,
            priority=n.priority,
            action_url=n.action_url,
            metadata=n.metadata
        ) for n in notifications
    ]

# Mark a notification as read
@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: str = Path(..., description="The ID of the notification to mark as read"),
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    notification = await patient_notification_service.get_notification(db, notification_id)
    
    if not notification or notification.patient_id != current_patient.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    await patient_notification_service.mark_as_read(db, notification_id)
    return {"status": "success"}

# Mark all notifications as read
@router.post("/read-all")
async def mark_all_as_read(
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for the authenticated patient"""
    count = await patient_notification_service.mark_all_as_read(db, current_patient.id)
    return {"status": "success", "count": count}

# Dismiss a notification
@router.post("/{notification_id}/dismiss")
async def dismiss_notification(
    notification_id: str = Path(..., description="The ID of the notification to dismiss"),
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Dismiss a notification"""
    notification = await patient_notification_service.get_notification(db, notification_id)
    
    if not notification or notification.patient_id != current_patient.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    await patient_notification_service.dismiss_notification(db, notification_id)
    return {"status": "success"}

# Get notification preferences
@router.get("/preferences", response_model=Dict[str, NotificationPreferenceResponse])
async def get_notification_preferences(
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Get notification preferences for the authenticated patient"""
    preferences = await patient_notification_service.get_preferences(db, current_patient.id)
    
    result = {}
    # Ensure all notification types are represented
    for notification_type in PatientNotificationType:
        if notification_type in preferences:
            pref = preferences[notification_type]
            result[notification_type] = NotificationPreferenceResponse(
                notification_type=pref.notification_type,
                email_enabled=pref.email_enabled,
                sms_enabled=pref.sms_enabled,
                in_app_enabled=pref.in_app_enabled,
                push_enabled=pref.push_enabled
            )
        else:
            # Default preferences
            result[notification_type] = NotificationPreferenceResponse(
                notification_type=notification_type,
                email_enabled=True,
                sms_enabled=True,
                in_app_enabled=True,
                push_enabled=True
            )
    
    return result

# Update notification preferences
@router.put("/preferences/{notification_type}", response_model=NotificationPreferenceResponse)
async def update_notification_preference(
    notification_type: PatientNotificationType = Path(..., description="The type of notification"),
    preference: NotificationPreferenceUpdate = Body(..., description="Updated preferences"),
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Update notification preferences for a specific notification type"""
    updated_pref = await patient_notification_service.update_preference(
        db=db,
        patient_id=current_patient.id,
        notification_type=notification_type,
        email_enabled=preference.email_enabled,
        sms_enabled=preference.sms_enabled,
        in_app_enabled=preference.in_app_enabled,
        push_enabled=preference.push_enabled
    )
    
    return NotificationPreferenceResponse(
        notification_type=updated_pref.notification_type,
        email_enabled=updated_pref.email_enabled,
        sms_enabled=updated_pref.sms_enabled,
        in_app_enabled=updated_pref.in_app_enabled,
        push_enabled=updated_pref.push_enabled
    )

# Test endpoint for creating a notification (for development/testing)
@router.post("/test")
async def create_test_notification(
    payload: NotificationPayload,
    notification_type: PatientNotificationType = Query(..., description="The type of notification to create"),
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Create a test notification (for development only)"""
    notification = await patient_notification_service.create_notification(
        db=db,
        patient_id=current_patient.id,
        notification_type=notification_type,
        payload=payload
    )
    
    return {
        "status": "success",
        "notification_id": notification.id
    } 