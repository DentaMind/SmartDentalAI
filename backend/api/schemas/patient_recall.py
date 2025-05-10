from typing import Optional, List, Dict, Any, Union
from datetime import datetime, date
from pydantic import BaseModel, Field, validator
from enum import Enum

# Enums from models
class RecallType(str, Enum):
    HYGIENE = "hygiene"
    PERIO_MAINTENANCE = "perio_maintenance" 
    RESTORATIVE_FOLLOWUP = "restorative_followup"
    PATIENT_REACTIVATION = "patient_reactivation"
    OTHER = "other"

class RecallFrequency(str, Enum):
    ONE_MONTH = "1"
    THREE_MONTHS = "3"
    FOUR_MONTHS = "4"
    SIX_MONTHS = "6"
    TWELVE_MONTHS = "12"
    CUSTOM = "custom"

class RecallStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Add a new enum for recall history status
class RecallHistoryStatus(str, Enum):
    COMPLETED = "completed"
    MISSED = "missed"
    SCHEDULED = "scheduled"

# Base schemas
class RecallReminderHistoryBase(BaseModel):
    recall_schedule_id: str
    days_before_due: int
    delivery_channel: str
    metadata: Optional[Dict[str, Any]] = None

class PatientRecallScheduleBase(BaseModel):
    patient_id: str
    recall_type: RecallType
    frequency: RecallFrequency = RecallFrequency.SIX_MONTHS
    custom_days: Optional[int] = None
    provider_id: Optional[str] = None
    status: RecallStatus = RecallStatus.ACTIVE
    last_appointment_date: Optional[datetime] = None
    next_due_date: datetime
    notes: Optional[str] = None
    reminder_days_before: Optional[List[int]] = Field(default=[30, 15, 7])
    max_reminders: int = 3

# Create schemas
class RecallReminderHistoryCreate(RecallReminderHistoryBase):
    pass

class PatientRecallScheduleCreate(PatientRecallScheduleBase):
    @validator('custom_days')
    def validate_custom_days(cls, v, values):
        if values.get('frequency') == RecallFrequency.CUSTOM and v is None:
            raise ValueError("custom_days must be provided when frequency is custom")
        return v
    
    @validator('next_due_date')
    def validate_next_due_date(cls, v):
        if v < datetime.now():
            raise ValueError("next_due_date cannot be in the past")
        return v

# Update schemas
class RecallReminderHistoryUpdate(BaseModel):
    days_before_due: Optional[int] = None
    delivery_channel: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class PatientRecallScheduleUpdate(BaseModel):
    recall_type: Optional[RecallType] = None
    frequency: Optional[RecallFrequency] = None
    custom_days: Optional[int] = None
    provider_id: Optional[str] = None
    status: Optional[RecallStatus] = None
    last_appointment_date: Optional[datetime] = None
    next_due_date: Optional[datetime] = None
    notes: Optional[str] = None
    reminder_days_before: Optional[List[int]] = None
    max_reminders: Optional[int] = None

    @validator('custom_days')
    def validate_custom_days(cls, v, values):
        if values.get('frequency') == RecallFrequency.CUSTOM and v is None:
            raise ValueError("custom_days must be provided when frequency is custom")
        return v
    
    @validator('next_due_date')
    def validate_next_due_date(cls, v):
        if v and v < datetime.now():
            raise ValueError("next_due_date cannot be in the past")
        return v

# Response schemas
class RecallReminderHistoryResponse(RecallReminderHistoryBase):
    id: str
    sent_at: datetime
    notification_id: Optional[str] = None
    sent_by: Optional[str] = None
    
    class Config:
        orm_mode = True

class PatientRecallScheduleResponse(PatientRecallScheduleBase):
    id: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    
    class Config:
        orm_mode = True

class PatientRecallScheduleWithHistoryResponse(PatientRecallScheduleResponse):
    reminder_history: List[RecallReminderHistoryResponse] = []
    
    class Config:
        orm_mode = True

# Batch creation schema for multiple recalls
class BatchRecallScheduleCreate(BaseModel):
    recall_type: RecallType
    frequency: RecallFrequency = RecallFrequency.SIX_MONTHS
    custom_days: Optional[int] = None
    provider_id: Optional[str] = None
    patient_ids: List[str]
    days_ahead: int = Field(default=30, description="Days ahead to schedule the reminders")
    reminder_days_before: Optional[List[int]] = Field(default=[30, 15, 7])
    notes: Optional[str] = None

# Summary schema for statistics
class RecallStatistics(BaseModel):
    total_active: int
    total_paused: int
    total_completed: int
    total_cancelled: int
    by_type: Dict[RecallType, int]
    overdue_count: int
    due_within_30_days: int
    
    class Config:
        orm_mode = True

# Add a new schema for recall history items
class RecallHistoryResponse(BaseModel):
    id: str
    recall_type: RecallType
    due_date: datetime
    appointment_date: Optional[datetime] = None
    status: RecallHistoryStatus
    notes: Optional[str] = None
    
    class Config:
        orm_mode = True 