from sqlalchemy import Column, String, Integer, ForeignKey, Enum, DateTime, Boolean, Text, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
import enum
from datetime import datetime, timedelta

from .base import Base
from .patient import Patient

class RecallType(str, enum.Enum):
    """Types of dental recalls"""
    HYGIENE = "hygiene"
    PERIO_MAINTENANCE = "perio_maintenance" 
    RESTORATIVE_FOLLOWUP = "restorative_followup"
    PATIENT_REACTIVATION = "patient_reactivation"
    OTHER = "other"

class RecallFrequency(str, enum.Enum):
    """Common recall intervals in months"""
    ONE_MONTH = "1"
    THREE_MONTHS = "3"
    FOUR_MONTHS = "4"
    SIX_MONTHS = "6"
    TWELVE_MONTHS = "12"
    CUSTOM = "custom"  # For custom intervals defined in days

class RecallStatus(str, enum.Enum):
    """Status of a recall schedule"""
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PatientRecallSchedule(Base):
    """Model for patient recall schedules"""
    __tablename__ = "patient_recall_schedules"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    recall_type = Column(Enum(RecallType), nullable=False)
    frequency = Column(Enum(RecallFrequency), nullable=False, default=RecallFrequency.SIX_MONTHS)
    custom_days = Column(Integer, nullable=True)  # Used when frequency is CUSTOM
    provider_id = Column(String, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(RecallStatus), nullable=False, default=RecallStatus.ACTIVE)
    
    last_appointment_date = Column(DateTime, nullable=True)
    next_due_date = Column(DateTime, nullable=False)
    notes = Column(Text, nullable=True)
    
    # Notification settings
    reminder_days_before = Column(JSONB, nullable=True)  # e.g., [30, 14, 7, 1]
    max_reminders = Column(Integer, nullable=False, default=3)
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    patient = relationship("Patient", back_populates="recall_schedules")
    reminder_history = relationship("RecallReminderHistory", back_populates="recall_schedule", 
                                   cascade="all, delete-orphan")
    
    # Helper methods
    def calculate_next_due_date(self):
        """Calculate the next due date based on last appointment and frequency"""
        if not self.last_appointment_date:
            return self.next_due_date
            
        if self.frequency == RecallFrequency.CUSTOM and self.custom_days:
            return self.last_appointment_date + timedelta(days=self.custom_days)
        else:
            # Convert frequency enum to int months
            months = int(self.frequency.value)
            
            # Add months to last appointment date
            # Simple approach: adding 30 days per month
            return self.last_appointment_date + timedelta(days=30 * months)
    
    def is_due_for_reminder(self, days_before):
        """Check if a reminder should be sent based on days before due date"""
        if self.status != RecallStatus.ACTIVE:
            return False
            
        today = datetime.now().date()
        due_date = self.next_due_date.date()
        target_date = due_date - timedelta(days=days_before)
        
        return today == target_date

class RecallReminderHistory(Base):
    """Model for tracking recall reminder history"""
    __tablename__ = "recall_reminder_history"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    recall_schedule_id = Column(String, ForeignKey("patient_recall_schedules.id"), nullable=False)
    sent_at = Column(DateTime, server_default=func.now())
    notification_id = Column(String, nullable=True)  # Reference to the generated notification
    days_before_due = Column(Integer, nullable=False)  # How many days before due date was this sent
    sent_by = Column(String, ForeignKey("users.id"), nullable=True)  # Who triggered this reminder
    delivery_channel = Column(String, nullable=False)  # email, sms, app, etc.
    metadata = Column(JSONB, nullable=True)  # Additional data about the reminder
    
    # Relationships
    recall_schedule = relationship("PatientRecallSchedule", back_populates="reminder_history") 