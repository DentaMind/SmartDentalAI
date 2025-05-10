import uuid
from typing import List, Dict, Optional, Any
from fastapi import Depends, WebSocket, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, timedelta
import json
import logging
from pydantic import BaseModel

from ..models.patient_notification import (
    PatientNotification, 
    PatientNotificationPreference,
    PatientNotificationType,
    PatientNotificationPriority,
    PatientNotificationChannel
)
from ..database import get_db

logger = logging.getLogger(__name__)

class NotificationPayload(BaseModel):
    """Base model for notification payload"""
    title: str
    message: str
    priority: PatientNotificationPriority = PatientNotificationPriority.MEDIUM
    action_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class AppointmentReminderPayload(NotificationPayload):
    """Payload for appointment reminders"""
    appointment_id: str
    appointment_date: datetime
    provider_name: str

class PatientNotificationService:
    """Service to manage patient notifications"""
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    # WebSocket connection management
    async def connect(self, websocket: WebSocket, patient_id: str):
        """Connect a patient to the WebSocket"""
        await websocket.accept()
        if patient_id not in self.active_connections:
            self.active_connections[patient_id] = []
        self.active_connections[patient_id].append(websocket)
        logger.info(f"Patient {patient_id} connected to WebSocket")
    
    def disconnect(self, websocket: WebSocket, patient_id: str):
        """Disconnect a patient from the WebSocket"""
        if patient_id in self.active_connections:
            if websocket in self.active_connections[patient_id]:
                self.active_connections[patient_id].remove(websocket)
            if not self.active_connections[patient_id]:
                del self.active_connections[patient_id]
            logger.info(f"Patient {patient_id} disconnected from WebSocket")
    
    async def broadcast_notification(self, patient_id: str, notification: PatientNotification):
        """Send a notification to all connected devices of a patient"""
        if patient_id in self.active_connections:
            for connection in self.active_connections[patient_id]:
                try:
                    # Convert the notification to a dict
                    notification_data = {
                        "id": notification.id,
                        "type": notification.type,
                        "title": notification.title,
                        "message": notification.message,
                        "created_at": notification.created_at.isoformat(),
                        "priority": notification.priority,
                        "is_read": notification.is_read,
                        "action_url": notification.action_url,
                        "metadata": notification.metadata
                    }
                    await connection.send_json(notification_data)
                    logger.info(f"Notification {notification.id} sent to patient {patient_id}")
                except Exception as e:
                    logger.error(f"Error sending notification to patient {patient_id}: {e}")
    
    # Notification CRUD operations
    async def create_notification(
        self,
        db: Session,
        patient_id: str,
        notification_type: str,
        payload: NotificationPayload
    ) -> PatientNotification:
        """Create a new notification for a patient"""
        # First check if the patient has enabled this notification type
        preference = self._get_notification_preference(db, patient_id, notification_type)
        
        # Create notification in database
        notification = PatientNotification(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            type=notification_type,
            title=payload.title,
            message=payload.message,
            priority=payload.priority,
            created_at=datetime.now(),
            action_url=payload.action_url,
            metadata=payload.metadata
        )
        
        db.add(notification)
        db.commit()
        db.refresh(notification)
        
        # Send in-app notification if enabled
        if preference and preference.in_app_enabled:
            await self.broadcast_notification(patient_id, notification)
        
        # Send emails if enabled
        if preference and preference.email_enabled:
            await self._send_email_notification(patient_id, notification)
        
        # Send SMS if enabled
        if preference and preference.sms_enabled:
            await self._send_sms_notification(patient_id, notification)
        
        return notification
    
    async def get_notifications(
        self,
        db: Session,
        patient_id: str,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0
    ) -> List[PatientNotification]:
        """Get notifications for a patient"""
        query = db.query(PatientNotification).filter(
            PatientNotification.patient_id == patient_id
        )
        
        if unread_only:
            query = query.filter(PatientNotification.read_at == None)
        
        return query.order_by(PatientNotification.created_at.desc()).limit(limit).offset(offset).all()
    
    async def get_notification(self, db: Session, notification_id: str) -> Optional[PatientNotification]:
        """Get a single notification by ID"""
        return db.query(PatientNotification).filter(
            PatientNotification.id == notification_id
        ).first()
    
    async def mark_as_read(self, db: Session, notification_id: str) -> PatientNotification:
        """Mark a notification as read"""
        notification = await self.get_notification(db, notification_id)
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        notification.read_at = datetime.now()
        db.commit()
        db.refresh(notification)
        return notification
    
    async def mark_all_as_read(self, db: Session, patient_id: str) -> int:
        """Mark all notifications for a patient as read"""
        unread_notifications = db.query(PatientNotification).filter(
            and_(
                PatientNotification.patient_id == patient_id,
                PatientNotification.read_at == None
            )
        ).all()
        
        now = datetime.now()
        for notification in unread_notifications:
            notification.read_at = now
        
        db.commit()
        return len(unread_notifications)
    
    async def dismiss_notification(self, db: Session, notification_id: str) -> None:
        """Dismiss a notification"""
        notification = await self.get_notification(db, notification_id)
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        notification.dismissed_at = datetime.now()
        db.commit()
    
    async def delete_notification(self, db: Session, notification_id: str) -> None:
        """Delete a notification"""
        notification = await self.get_notification(db, notification_id)
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        db.delete(notification)
        db.commit()
    
    # Notification preference management
    async def get_preferences(self, db: Session, patient_id: str) -> Dict[str, PatientNotificationPreference]:
        """Get all notification preferences for a patient"""
        preferences = db.query(PatientNotificationPreference).filter(
            PatientNotificationPreference.patient_id == patient_id
        ).all()
        
        # Convert to dictionary for easier access
        result = {}
        for pref in preferences:
            result[pref.notification_type] = pref
        
        return result
    
    async def update_preference(
        self,
        db: Session,
        patient_id: str,
        notification_type: str,
        email_enabled: bool = True,
        sms_enabled: bool = True,
        in_app_enabled: bool = True,
        push_enabled: bool = True
    ) -> PatientNotificationPreference:
        """Update a notification preference for a patient"""
        # Check if preference exists
        preference = self._get_notification_preference(db, patient_id, notification_type)
        
        if preference:
            # Update existing preference
            preference.email_enabled = email_enabled
            preference.sms_enabled = sms_enabled
            preference.in_app_enabled = in_app_enabled
            preference.push_enabled = push_enabled
        else:
            # Create new preference
            preference = PatientNotificationPreference(
                id=str(uuid.uuid4()),
                patient_id=patient_id,
                notification_type=notification_type,
                email_enabled=email_enabled,
                sms_enabled=sms_enabled,
                in_app_enabled=in_app_enabled,
                push_enabled=push_enabled
            )
            db.add(preference)
        
        db.commit()
        db.refresh(preference)
        return preference
    
    def _get_notification_preference(
        self,
        db: Session,
        patient_id: str,
        notification_type: str
    ) -> Optional[PatientNotificationPreference]:
        """Get a specific notification preference"""
        return db.query(PatientNotificationPreference).filter(
            and_(
                PatientNotificationPreference.patient_id == patient_id,
                PatientNotificationPreference.notification_type == notification_type
            )
        ).first()
    
    # Channel-specific notification handlers
    async def _send_email_notification(self, patient_id: str, notification: PatientNotification):
        """Send an email notification to a patient"""
        # TODO: Implement email sending logic
        logger.info(f"Email notification would be sent to patient {patient_id}")
    
    async def _send_sms_notification(self, patient_id: str, notification: PatientNotification):
        """Send an SMS notification to a patient"""
        # TODO: Implement SMS sending logic
        logger.info(f"SMS notification would be sent to patient {patient_id}")
    
    # Specialized notification generators
    async def create_appointment_reminder(
        self,
        db: Session,
        patient_id: str,
        payload: AppointmentReminderPayload
    ) -> PatientNotification:
        """Create an appointment reminder notification"""
        # Format the appointment date for display
        formatted_date = payload.appointment_date.strftime("%A, %B %d at %I:%M %p")
        
        # Create notification with appointment-specific message
        notification_payload = NotificationPayload(
            title=payload.title or f"Appointment Reminder",
            message=payload.message or f"You have an appointment with Dr. {payload.provider_name} on {formatted_date}",
            priority=payload.priority,
            action_url=f"/patient/appointments/{payload.appointment_id}",
            metadata={
                "appointment_id": payload.appointment_id,
                "appointment_date": payload.appointment_date.isoformat(),
                "provider_name": payload.provider_name
            }
        )
        
        return await self.create_notification(
            db=db,
            patient_id=patient_id,
            notification_type=PatientNotificationType.APPOINTMENT_REMINDER,
            payload=notification_payload
        )
    
    # Automated notification scheduling
    async def schedule_appointment_reminders(self, db: Session):
        """Schedule appointment reminders for upcoming appointments
        
        This should be run as a background task on a schedule
        """
        # TODO: Implement appointment reminder scheduling
        pass

# Create a singleton instance
patient_notification_service = PatientNotificationService() 