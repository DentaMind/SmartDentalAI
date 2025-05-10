from datetime import datetime, time
from typing import List, Optional
from pydantic import BaseModel, Field, validator
from enum import Enum

class ProviderType(str, Enum):
    dentist = "dentist"
    hygienist = "hygienist"
    specialist = "specialist"
    virtual = "virtual"

class AppointmentStatus(str, Enum):
    scheduled = "scheduled"
    confirmed = "confirmed"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"

# Base schemas
class ProviderBase(BaseModel):
    type: ProviderType
    specialties: Optional[List[str]] = None
    default_appointment_duration: int = Field(30, gt=0, le=240)
    allow_double_booking: bool = False
    active_locations: List[int]
    calendar_color: str = Field(..., regex="^#[0-9A-Fa-f]{6}$")
    scheduling_notes: Optional[str] = None

class ProviderCreate(ProviderBase):
    user_id: int

class ProviderUpdate(ProviderBase):
    pass

class Provider(ProviderBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AvailabilityBase(BaseModel):
    location_id: int
    day_of_week: int = Field(..., ge=0, le=6)
    start_time: time
    end_time: time
    is_active: bool = True

    @validator("end_time")
    def end_time_after_start_time(cls, v, values):
        if "start_time" in values and v <= values["start_time"]:
            raise ValueError("end_time must be after start_time")
        return v

class AvailabilityCreate(AvailabilityBase):
    provider_id: int

class AvailabilityUpdate(AvailabilityBase):
    pass

class Availability(AvailabilityBase):
    id: int
    provider_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TimeOffBase(BaseModel):
    start_datetime: datetime
    end_datetime: datetime
    reason: Optional[str] = None
    is_all_day: bool = False

    @validator("end_datetime")
    def end_datetime_after_start_datetime(cls, v, values):
        if "start_datetime" in values and v <= values["start_datetime"]:
            raise ValueError("end_datetime must be after start_datetime")
        return v

class TimeOffCreate(TimeOffBase):
    provider_id: int

class TimeOffUpdate(TimeOffBase):
    pass

class TimeOff(TimeOffBase):
    id: int
    provider_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AppointmentBase(BaseModel):
    patient_id: int
    provider_id: int
    location_id: int
    operatory_id: Optional[int] = None
    start_datetime: datetime
    duration_minutes: int = Field(..., gt=0, le=480)
    appointment_type: str
    notes: Optional[str] = None
    group_id: Optional[str] = None

    @validator("duration_minutes")
    def validate_duration(cls, v):
        if v <= 0 or v > 480:  # Max 8 hours
            raise ValueError("Duration must be between 1 and 480 minutes")
        return v

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(AppointmentBase):
    status: Optional[AppointmentStatus] = None
    cancellation_reason: Optional[str] = None

class Appointment(AppointmentBase):
    id: int
    status: AppointmentStatus
    end_datetime: datetime
    created_by: int
    updated_by: int
    created_at: datetime
    updated_at: datetime
    cancellation_reason: Optional[str] = None
    cancellation_datetime: Optional[datetime] = None
    confirmation_datetime: Optional[datetime] = None
    check_in_datetime: Optional[datetime] = None
    completion_datetime: Optional[datetime] = None

    class Config:
        from_attributes = True

class AppointmentHistoryEntry(BaseModel):
    id: int
    appointment_id: int
    action: str
    changes: dict
    performed_by: int
    created_at: datetime

    class Config:
        from_attributes = True

# Response models
class ProviderResponse(Provider):
    availability: List[Availability]
    time_off: List[TimeOff]

class AppointmentResponse(Appointment):
    provider: Provider
    history: List[AppointmentHistoryEntry]

# Query models
class AppointmentQuery(BaseModel):
    start_date: datetime
    end_date: datetime
    provider_ids: Optional[List[int]] = None
    location_ids: Optional[List[int]] = None
    status: Optional[List[AppointmentStatus]] = None

class AvailabilityQuery(BaseModel):
    date: datetime
    provider_ids: Optional[List[int]] = None
    location_ids: Optional[List[int]] = None
    duration_minutes: Optional[int] = None

class AvailabilitySlot(BaseModel):
    provider_id: int
    start_datetime: datetime
    end_datetime: datetime
    location_id: int
    operatory_id: Optional[int] = None

class AvailabilityResponse(BaseModel):
    available_slots: List[AvailabilitySlot]
    provider_conflicts: List[TimeOff] 