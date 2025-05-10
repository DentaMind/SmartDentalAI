from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json
import logging
from fastapi import WebSocket
from pydantic import BaseModel
from enum import Enum
from .notification_preferences_service import (
    notification_preferences_service,
    NotificationChannel
)

logger = logging.getLogger(__name__)

class NotificationType(str, Enum):
    CLAIM_SUBMITTED = "claim_submitted"
    CLAIM_DENIED = "claim_denied"
    PAYMENT_RECEIVED = "payment_received"
    APPEAL_SUBMITTED = "appeal_submitted"
    APPEAL_APPROVED = "appeal_approved"
    APPEAL_DENIED = "appeal_denied"
    SYSTEM_ALERT = "system_alert"
    TREATMENT_PLAN_MODIFIED = "treatment_plan_modified"
    FINANCIAL_CHANGE = "financial_change"
    APPOINTMENT_REMINDER = "appointment_reminder"
    PATIENT_MESSAGE = "patient_message"

class NotificationPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Notification(BaseModel):
    id: str
    type: NotificationType
    priority: NotificationPriority = NotificationPriority.MEDIUM
    title: str
    message: str
    timestamp: datetime
    read: bool = False
    claim_number: Optional[str] = None
    amount: Optional[float] = None
    patient_name: Optional[str] = None
    insurance_company: Optional[str] = None
    action_url: Optional[str] = None
    metadata: Optional[Dict] = None
    group_id: Optional[str] = None  # For grouping related notifications

class NotificationGroup(BaseModel):
    id: str
    type: NotificationType
    count: int
    latest_timestamp: datetime
    notifications: List[Notification]

class NotificationSettings(BaseModel):
    email_notifications: bool = True
    in_app_notifications: bool = True
    notification_types: Dict[NotificationType, bool] = {
        type: True for type in NotificationType
    }
    sound_enabled: bool = True
    desktop_notifications: bool = True

class NotificationService:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.notifications: Dict[str, List[Notification]] = {}
        self.settings: Dict[str, NotificationSettings] = {}
        self.notification_history: Dict[str, List[Notification]] = {}  # Store historical notifications

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        
        # Initialize user's notification storage if not exists
        if user_id not in self.notifications:
            self.notifications[user_id] = []
        if user_id not in self.settings:
            self.settings[user_id] = NotificationSettings()

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def broadcast_notification(self, user_id: str, notification: Notification):
        """Send notification to all connected clients of a user"""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(notification.dict())
                except Exception as e:
                    logger.error(f"Error sending notification to {user_id}: {e}")

    async def create_notification(
        self,
        user_id: str,
        type: NotificationType,
        title: str,
        message: str,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        **kwargs
    ) -> Notification:
        """Create and store a new notification"""
        # Check user's notification preferences
        channels = notification_preferences_service.get_notification_channels(user_id, type)
        if not channels:
            logger.info(f"User {user_id} has disabled notifications of type {type}")
            return None

        notification = Notification(
            id=str(len(self.notifications.get(user_id, [])) + 1),
            type=type,
            priority=priority,
            title=title,
            message=message,
            timestamp=datetime.utcnow(),
            **kwargs
        )
        
        if user_id not in self.notifications:
            self.notifications[user_id] = []
        self.notifications[user_id].append(notification)
        
        # Send notification through enabled channels
        if NotificationChannel.WEBSOCKET in channels:
            await self.broadcast_notification(user_id, notification)
        
        if NotificationChannel.EMAIL in channels:
            await self.send_email_notification(user_id, notification)
            
        if NotificationChannel.MOBILE_PUSH in channels:
            await self.send_mobile_notification(user_id, notification)
        
        return notification

    async def send_email_notification(self, user_id: str, notification: Notification):
        """Send email notification"""
        # TODO: Implement email sending
        pass

    async def send_mobile_notification(self, user_id: str, notification: Notification):
        """Send mobile push notification"""
        # TODO: Implement mobile push notifications
        pass

    async def get_notifications(
        self,
        user_id: str,
        type: Optional[NotificationType] = None,
        priority: Optional[NotificationPriority] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        unread_only: bool = False,
        group_by_type: bool = False
    ) -> List[Notification]:
        """Get filtered notifications for a user"""
        user_notifications = self.notifications.get(user_id, [])
        
        # Apply filters
        if type:
            user_notifications = [n for n in user_notifications if n.type == type]
        if priority:
            user_notifications = [n for n in user_notifications if n.priority == priority]
        if start_date:
            user_notifications = [n for n in user_notifications if n.timestamp >= start_date]
        if end_date:
            user_notifications = [n for n in user_notifications if n.timestamp <= end_date]
        if unread_only:
            user_notifications = [n for n in user_notifications if not n.read]
            
        # Sort by timestamp (newest first)
        user_notifications.sort(key=lambda x: x.timestamp, reverse=True)
        
        if group_by_type:
            return self._group_notifications(user_notifications)
            
        return user_notifications

    def _group_notifications(self, notifications: List[Notification]) -> List[NotificationGroup]:
        """Group notifications by type"""
        groups: Dict[str, NotificationGroup] = {}
        
        for notification in notifications:
            if notification.type not in groups:
                groups[notification.type] = NotificationGroup(
                    id=notification.type,
                    type=notification.type,
                    count=0,
                    latest_timestamp=notification.timestamp,
                    notifications=[]
                )
            
            group = groups[notification.type]
            group.count += 1
            group.latest_timestamp = max(group.latest_timestamp, notification.timestamp)
            group.notifications.append(notification)
            
        return list(groups.values())

    async def get_notification_history(
        self,
        user_id: str,
        days: int = 30,
        type: Optional[NotificationType] = None
    ) -> List[Notification]:
        """Get historical notifications for a user"""
        if user_id not in self.notification_history:
            return []
            
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        history = self.notification_history[user_id]
        
        if type:
            history = [n for n in history if n.type == type]
            
        return [n for n in history if n.timestamp >= cutoff_date]

    async def archive_notification(self, user_id: str, notification_id: str):
        """Move a notification to history"""
        if user_id in self.notifications:
            for i, notification in enumerate(self.notifications[user_id]):
                if notification.id == notification_id:
                    # Add to history
                    if user_id not in self.notification_history:
                        self.notification_history[user_id] = []
                    self.notification_history[user_id].append(notification)
                    
                    # Remove from active notifications
                    self.notifications[user_id].pop(i)
                    break

    async def mark_as_read(self, user_id: str, notification_id: str):
        """Mark a notification as read"""
        if user_id in self.notifications:
            for notification in self.notifications[user_id]:
                if notification.id == notification_id:
                    notification.read = True
                    break

    async def mark_all_as_read(self, user_id: str):
        """Mark all notifications as read for a user"""
        if user_id in self.notifications:
            for notification in self.notifications[user_id]:
                notification.read = True

    async def dismiss_notification(self, user_id: str, notification_id: str):
        """Remove a notification"""
        if user_id in self.notifications:
            self.notifications[user_id] = [
                n for n in self.notifications[user_id]
                if n.id != notification_id
            ]

    async def get_settings(self, user_id: str) -> NotificationSettings:
        """Get notification settings for a user"""
        return self.settings.get(user_id, NotificationSettings())

    async def update_settings(self, user_id: str, settings: NotificationSettings):
        """Update notification settings for a user"""
        self.settings[user_id] = settings

# Create a singleton instance
notification_service = NotificationService() 