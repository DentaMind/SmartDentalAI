from sqlalchemy import Column, ForeignKey, String, DateTime, Boolean, Integer, JSON, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..database import Base
import enum

class PatientNotificationType(str, enum.Enum):
    """Patient notification types"""
    APPOINTMENT_REMINDER = "appointment_reminder"
    LAB_RESULTS = "lab_results"
    TREATMENT_COMPLETED = "treatment_completed"
    PAYMENT_CONFIRMATION = "payment_confirmation"
    INSURANCE_UPDATE = "insurance_update"
    TREATMENT_PLAN_UPDATE = "treatment_plan_update"
    SYSTEM_ALERT = "system_alert"
    PRESCRIPTION_READY = "prescription_ready"
    MESSAGE_FROM_PROVIDER = "message_from_provider"
    HYGIENE_RECALL = "hygiene_recall"
    PERIO_RECALL = "perio_recall"
    TREATMENT_FOLLOWUP = "treatment_followup"
    PATIENT_REACTIVATION = "patient_reactivation"
    GENERAL_REMINDER = "general_reminder"

class PatientNotificationChannel(str, enum.Enum):
    """Channels through which patient notifications can be delivered"""
    EMAIL = "email"
    SMS = "sms"
    IN_APP = "in_app"
    PUSH = "push"

class PatientNotificationPriority(str, enum.Enum):
    """Priority levels for patient notifications"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class PatientNotification(Base):
    """Model for storing patient notifications"""
    __tablename__ = "patient_notifications"

    id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    priority = Column(String, default=PatientNotificationPriority.MEDIUM)
    created_at = Column(DateTime, server_default=func.now())
    read_at = Column(DateTime, nullable=True)
    dismissed_at = Column(DateTime, nullable=True)
    action_url = Column(String, nullable=True)
    metadata = Column(JSON, nullable=True)
    
    # Relationships
    patient = relationship("Patient", back_populates="notifications")

    @property
    def is_read(self):
        return self.read_at is not None
    
    @property
    def is_dismissed(self):
        return self.dismissed_at is not None

class PatientNotificationPreference(Base):
    """Model for storing patient notification preferences"""
    __tablename__ = "patient_notification_preferences"
    
    id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    notification_type = Column(String, nullable=False)
    email_enabled = Column(Boolean, default=True)
    sms_enabled = Column(Boolean, default=True)
    in_app_enabled = Column(Boolean, default=True)
    push_enabled = Column(Boolean, default=True)
    
    # Relationships
    patient = relationship("Patient", back_populates="notification_preferences")
    
    class Config:
        orm_mode = True 