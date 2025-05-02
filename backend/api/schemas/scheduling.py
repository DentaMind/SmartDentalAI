from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, validator
from datetime import datetime, time, timedelta
from enum import Enum
from api.models.scheduling import ProcedureCategory, AppointmentStatus, RecurrenceFrequency, ProviderRole

# Base schemas
class BaseSchema(BaseModel):
    id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

# Procedure Schemas
class ProcedureBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    category: ProcedureCategory
    default_duration_minutes: int = Field(..., gt=0)
    increment_size: int = Field(15, gt=0)
    is_active: bool = True

class ProcedureCreate(ProcedureBase):
    pass

class ProcedureUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ProcedureCategory] = None
    default_duration_minutes: Optional[int] = None
    increment_size: Optional[int] = None
    is_active: Optional[bool] = None

class Procedure(ProcedureBase, BaseSchema):
    pass

# Provider Profile Schemas
class ProviderProfileBase(BaseModel):
    provider_id: str
    procedure_id: str
    duration_modifier: float = Field(1.0, ge=0.1)
    average_duration_minutes: Optional[int] = None
    total_procedures: int = 0
    is_active: bool = True

class ProviderProfileCreate(ProviderProfileBase):
    pass

class ProviderProfileUpdate(BaseModel):
    duration_modifier: Optional[float] = None
    average_duration_minutes: Optional[int] = None
    total_procedures: Optional[int] = None
    is_active: Optional[bool] = None

class ProviderProfile(ProviderProfileBase, BaseSchema):
    pass

# Scheduler Column Schemas
class SchedulerColumnBase(BaseModel):
    name: str
    order: int
    color: Optional[str] = None
    provider_id: Optional[str] = None
    role: Optional[ProviderRole] = None
    is_active: bool = True

class SchedulerColumnCreate(SchedulerColumnBase):
    pass

class SchedulerColumnUpdate(BaseModel):
    name: Optional[str] = None
    order: Optional[int] = None
    color: Optional[str] = None
    provider_id: Optional[str] = None
    role: Optional[ProviderRole] = None
    is_active: Optional[bool] = None

class SchedulerColumn(SchedulerColumnBase, BaseSchema):
    pass

# Room Schemas
class RoomBase(BaseModel):
    name: str
    description: Optional[str] = None
    floor: Optional[str] = None
    features: List[str] = []
    is_active: bool = True

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    floor: Optional[str] = None
    features: Optional[List[str]] = None
    is_active: Optional[bool] = None

class Room(RoomBase, BaseSchema):
    pass

# Appointment Type Schemas
class AppointmentTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    default_duration: int = Field(..., gt=0)
    color: Optional[str] = None
    requires_provider: bool = True
    allows_side_booking: bool = False
    provider_role: Optional[ProviderRole] = None
    is_active: bool = True

class AppointmentTypeCreate(AppointmentTypeBase):
    pass

class AppointmentTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    default_duration: Optional[int] = None
    color: Optional[str] = None
    requires_provider: Optional[bool] = None
    allows_side_booking: Optional[bool] = None
    provider_role: Optional[ProviderRole] = None
    is_active: Optional[bool] = None

class AppointmentType(AppointmentTypeBase, BaseSchema):
    pass

# Appointment Procedure Schemas
class AppointmentProcedureBase(BaseModel):
    appointment_id: str
    procedure_id: Optional[str] = None
    procedure_code: str
    procedure_name: str
    tooth_number: Optional[str] = None
    surface: Optional[str] = None
    quadrant: Optional[str] = None
    estimated_time: Optional[int] = None
    notes: Optional[str] = None

class AppointmentProcedureCreate(AppointmentProcedureBase):
    pass

class AppointmentProcedureUpdate(BaseModel):
    procedure_id: Optional[str] = None
    procedure_code: Optional[str] = None
    procedure_name: Optional[str] = None
    tooth_number: Optional[str] = None
    surface: Optional[str] = None
    quadrant: Optional[str] = None
    estimated_time: Optional[int] = None
    notes: Optional[str] = None

class AppointmentProcedure(AppointmentProcedureBase, BaseSchema):
    pass

# Provider Schemas
class ProviderBase(BaseModel):
    user_id: Optional[str] = None
    first_name: str
    last_name: str
    title: Optional[str] = None
    role: ProviderRole
    specialty: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True
    color: Optional[str] = None
    display_name: Optional[str] = None
    default_appointment_duration: int = 30
    column_number: Optional[int] = None
    max_side_bookings: int = 0
    default_room_id: Optional[str] = None

class ProviderCreate(ProviderBase):
    pass

class ProviderUpdate(BaseModel):
    user_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    title: Optional[str] = None
    role: Optional[ProviderRole] = None
    specialty: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    color: Optional[str] = None
    display_name: Optional[str] = None
    default_appointment_duration: Optional[int] = None
    column_number: Optional[int] = None
    max_side_bookings: Optional[int] = None
    default_room_id: Optional[str] = None

class Provider(ProviderBase, BaseSchema):
    full_name: str
    scheduler_display_name: str

# Provider Availability Schemas
class ProviderAvailabilityBase(BaseModel):
    provider_id: str
    day_of_week: int = Field(..., ge=0, le=6)
    start_time: str  # "HH:MM" format
    end_time: str  # "HH:MM" format
    is_exception: bool = False
    exception_date: Optional[datetime] = None

    @validator('day_of_week')
    def validate_day_of_week(cls, v):
        if not 0 <= v <= 6:
            raise ValueError('day_of_week must be between 0 (Monday) and 6 (Sunday)')
        return v

    @validator('start_time', 'end_time')
    def validate_time_format(cls, v):
        try:
            hours, minutes = map(int, v.split(':'))
            if not (0 <= hours < 24 and 0 <= minutes < 60):
                raise ValueError()
        except Exception:
            raise ValueError('Time must be in format "HH:MM" (24-hour format)')
        return v

class ProviderAvailabilityCreate(ProviderAvailabilityBase):
    pass

class ProviderAvailabilityUpdate(BaseModel):
    day_of_week: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_exception: Optional[bool] = None
    exception_date: Optional[datetime] = None

class ProviderAvailability(ProviderAvailabilityBase, BaseSchema):
    pass

# Appointment Schemas
class PatientQuickInfo(BaseModel):
    id: str
    name: str
    dob: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    insuranceProvider: Optional[str] = None
    medicalAlerts: List[str] = []
    lastVisit: Optional[str] = None
    preferredLanguage: str = "English"

class RecurrencePattern(BaseModel):
    frequency: RecurrenceFrequency
    interval: int = 1
    count: Optional[int] = None
    until: Optional[datetime] = None
    byweekday: Optional[List[int]] = None
    bymonthday: Optional[List[int]] = None
    bymonth: Optional[List[int]] = None

class AppointmentBase(BaseModel):
    patient_id: str
    provider_id: Optional[str] = None
    appointment_type_id: str
    room_id: Optional[str] = None
    scheduler_column_id: Optional[str] = None
    start_time: datetime
    end_time: datetime
    status: AppointmentStatus = AppointmentStatus.SCHEDULED
    is_side_booking: bool = False
    parent_appointment_id: Optional[str] = None
    notes: Optional[str] = None
    location: Optional[str] = None
    room_number: Optional[str] = None
    patient_quick_info: Optional[PatientQuickInfo] = None
    is_recurring: bool = False
    recurrence_frequency: RecurrenceFrequency = RecurrenceFrequency.NONE
    recurrence_pattern: Optional[Dict[str, Any]] = None
    recurrence_group_id: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    procedures: Optional[List[AppointmentProcedureCreate]] = None

class AppointmentUpdate(BaseModel):
    provider_id: Optional[str] = None
    appointment_type_id: Optional[str] = None
    room_id: Optional[str] = None
    scheduler_column_id: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[AppointmentStatus] = None
    is_side_booking: Optional[bool] = None
    parent_appointment_id: Optional[str] = None
    notes: Optional[str] = None
    location: Optional[str] = None
    room_number: Optional[str] = None
    patient_quick_info: Optional[Dict[str, Any]] = None
    is_recurring: Optional[bool] = None
    recurrence_frequency: Optional[RecurrenceFrequency] = None
    recurrence_pattern: Optional[Dict[str, Any]] = None
    recurrence_group_id: Optional[str] = None

class Appointment(AppointmentBase, BaseSchema):
    duration_minutes: int
    procedures: List[AppointmentProcedure] = []

# Waiting List Schemas
class WaitingListBase(BaseModel):
    patient_id: str
    appointment_type_id: str
    requested_provider_id: Optional[str] = None
    provider_role: Optional[ProviderRole] = None
    preferred_days: Optional[List[int]] = None
    preferred_time_start: Optional[str] = None
    preferred_time_end: Optional[str] = None
    requested_date: Optional[datetime] = None
    room_preference: Optional[str] = None
    priority: int = 0
    accepts_side_booking: bool = False
    notes: Optional[str] = None
    is_filled: bool = False
    filled_appointment_id: Optional[str] = None

class WaitingListCreate(WaitingListBase):
    pass

class WaitingListUpdate(BaseModel):
    appointment_type_id: Optional[str] = None
    requested_provider_id: Optional[str] = None
    provider_role: Optional[ProviderRole] = None
    preferred_days: Optional[List[int]] = None
    preferred_time_start: Optional[str] = None
    preferred_time_end: Optional[str] = None
    requested_date: Optional[datetime] = None
    room_preference: Optional[str] = None
    priority: Optional[int] = None
    accepts_side_booking: Optional[bool] = None
    notes: Optional[str] = None
    is_filled: Optional[bool] = None
    filled_appointment_id: Optional[str] = None

class WaitingList(WaitingListBase, BaseSchema):
    pass

# Cancellation List Schemas
class CancellationListBase(BaseModel):
    patient_id: str
    appointment_type_id: str
    preferred_days: Optional[Dict[str, Any]] = None
    preferred_times: Optional[Dict[str, Any]] = None
    earliest_date: Optional[datetime] = None
    latest_date: Optional[datetime] = None
    accepts_side_booking: bool = False
    is_active: bool = True

class CancellationListCreate(CancellationListBase):
    pass

class CancellationListUpdate(BaseModel):
    appointment_type_id: Optional[str] = None
    preferred_days: Optional[Dict[str, Any]] = None
    preferred_times: Optional[Dict[str, Any]] = None
    earliest_date: Optional[datetime] = None
    latest_date: Optional[datetime] = None
    accepts_side_booking: Optional[bool] = None
    is_active: Optional[bool] = None

class CancellationList(CancellationListBase, BaseSchema):
    pass

# Additional operational schemas
class TimeSlot(BaseModel):
    start_time: datetime
    end_time: datetime
    
    @property
    def duration_minutes(self) -> int:
        delta = self.end_time - self.start_time
        return int(delta.total_seconds() / 60)

class AvailabilityRequest(BaseModel):
    provider_id: Optional[str] = None
    provider_role: Optional[ProviderRole] = None
    appointment_type_id: str
    start_date: datetime
    end_date: Optional[datetime] = None
    duration_minutes: int = 30

class AvailabilityResponse(BaseModel):
    provider_id: Optional[str] = None
    provider_name: Optional[str] = None
    slots_by_date: Dict[str, List[TimeSlot]]

class ConflictCheckRequest(BaseModel):
    provider_id: str
    start_time: datetime
    end_time: datetime
    exclude_appointment_id: Optional[str] = None

class ConflictCheckResult(BaseModel):
    has_conflict: bool
    conflict_type: Optional[str] = None
    conflicting_appointment_id: Optional[str] = None

class AppointmentRescheduleRequest(BaseModel):
    appointment_id: str
    new_start_time: datetime
    new_end_time: datetime
    update_recurrences: bool = False

class RescheduleOptions(BaseModel):
    original_appointment_id: str
    suggested_slots: List[TimeSlot]

class AppointmentSummary(BaseModel):
    id: str
    patient_name: str
    provider_name: Optional[str] = None
    appointment_type: str
    status: AppointmentStatus
    start_time: datetime
    end_time: datetime
    room: Optional[str] = None
    procedures: List[str] = []

class SchedulerSettings(BaseModel):
    start_hour: int = 8
    end_hour: int = 18
    slot_duration_minutes: int = 15
    days_to_display: int = 7
    allow_side_booking: bool = True
    default_appointment_duration: int = 30
    auto_refresh_interval_seconds: int = 300
