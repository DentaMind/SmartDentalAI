from typing import Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel
from enum import Enum
import json
import logging
from ..models.user import UserRole

logger = logging.getLogger(__name__)

class NotificationChannel(str, Enum):
    EMAIL = "email"
    WEBSOCKET = "websocket"
    MOBILE_PUSH = "mobile_push"

class NotificationPreference(BaseModel):
    enabled: bool = True
    channels: Dict[NotificationChannel, bool] = {
        NotificationChannel.EMAIL: True,
        NotificationChannel.WEBSOCKET: True,
        NotificationChannel.MOBILE_PUSH: False
    }

class NotificationPreferences(BaseModel):
    user_id: str
    role: UserRole
    preferences: Dict[str, NotificationPreference]  # key is notification type
    can_customize: bool = True
    last_updated: datetime

class GlobalNotificationSettings(BaseModel):
    role_defaults: Dict[UserRole, Dict[str, NotificationPreference]]
    locked_preferences: Dict[str, List[UserRole]]  # notification types that can't be customized by certain roles
    last_updated: datetime

class NotificationPreferencesService:
    def __init__(self):
        self.user_preferences: Dict[str, NotificationPreferences] = {}
        self.global_settings = GlobalNotificationSettings(
            role_defaults={},
            locked_preferences={},
            last_updated=datetime.utcnow()
        )
        self._load_defaults()

    def _load_defaults(self):
        """Initialize default settings for each role"""
        defaults = {
            UserRole.ADMIN: {
                "claim_submitted": NotificationPreference(enabled=True),
                "claim_denied": NotificationPreference(enabled=True),
                "payment_received": NotificationPreference(enabled=True),
                "system_alert": NotificationPreference(enabled=True),
                "treatment_plan_modified": NotificationPreference(enabled=True),
                "financial_change": NotificationPreference(enabled=True),
            },
            UserRole.DOCTOR: {
                "claim_submitted": NotificationPreference(enabled=True),
                "claim_denied": NotificationPreference(enabled=True),
                "payment_received": NotificationPreference(enabled=True),
                "treatment_plan_modified": NotificationPreference(enabled=True),
            },
            UserRole.ASSISTANT: {
                "claim_submitted": NotificationPreference(enabled=True),
                "payment_received": NotificationPreference(enabled=True),
                "appointment_reminder": NotificationPreference(enabled=True),
            },
            UserRole.FINANCIAL_MANAGER: {
                "claim_submitted": NotificationPreference(enabled=True),
                "claim_denied": NotificationPreference(enabled=True),
                "payment_received": NotificationPreference(enabled=True),
                "financial_change": NotificationPreference(enabled=True),
            }
        }
        
        # Set locked preferences (e.g., assistants can't disable financial alerts)
        locked = {
            "financial_change": [UserRole.ASSISTANT],
            "system_alert": [UserRole.ASSISTANT, UserRole.DOCTOR],
        }
        
        self.global_settings.role_defaults = defaults
        self.global_settings.locked_preferences = locked

    def get_user_preferences(self, user_id: str, role: UserRole) -> NotificationPreferences:
        """Get user's notification preferences, creating from defaults if not exists"""
        if user_id not in self.user_preferences:
            # Create new preferences from role defaults
            defaults = self.global_settings.role_defaults.get(role, {})
            self.user_preferences[user_id] = NotificationPreferences(
                user_id=user_id,
                role=role,
                preferences=defaults,
                can_customize=self._can_customize(role),
                last_updated=datetime.utcnow()
            )
        return self.user_preferences[user_id]

    def update_user_preferences(
        self,
        user_id: str,
        role: UserRole,
        preferences: Dict[str, NotificationPreference]
    ) -> NotificationPreferences:
        """Update user's notification preferences"""
        # Validate that user can modify these preferences
        for pref_type, pref in preferences.items():
            if not self._can_modify_preference(role, pref_type):
                raise ValueError(f"User role {role} cannot modify {pref_type} preferences")

        user_prefs = self.get_user_preferences(user_id, role)
        user_prefs.preferences.update(preferences)
        user_prefs.last_updated = datetime.utcnow()
        return user_prefs

    def update_global_settings(
        self,
        role_defaults: Optional[Dict[UserRole, Dict[str, NotificationPreference]]] = None,
        locked_preferences: Optional[Dict[str, List[UserRole]]] = None
    ) -> GlobalNotificationSettings:
        """Update global notification settings (admin only)"""
        if role_defaults:
            self.global_settings.role_defaults.update(role_defaults)
        if locked_preferences:
            self.global_settings.locked_preferences.update(locked_preferences)
        self.global_settings.last_updated = datetime.utcnow()
        return self.global_settings

    def _can_customize(self, role: UserRole) -> bool:
        """Check if a role can customize their preferences"""
        return role in [UserRole.ADMIN, UserRole.DOCTOR, UserRole.FINANCIAL_MANAGER]

    def _can_modify_preference(self, role: UserRole, preference_type: str) -> bool:
        """Check if a role can modify a specific preference type"""
        if not self._can_customize(role):
            return False
        if preference_type in self.global_settings.locked_preferences:
            return role not in self.global_settings.locked_preferences[preference_type]
        return True

    def get_notification_channels(self, user_id: str, notification_type: str) -> List[NotificationChannel]:
        """Get enabled channels for a specific notification type for a user"""
        user_prefs = self.user_preferences.get(user_id)
        if not user_prefs:
            return []
            
        pref = user_prefs.preferences.get(notification_type)
        if not pref or not pref.enabled:
            return []
            
        return [channel for channel, enabled in pref.channels.items() if enabled]

# Create a singleton instance
notification_preferences_service = NotificationPreferencesService() 