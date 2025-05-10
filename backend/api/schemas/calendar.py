from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class ProviderBase(BaseModel):
    name: str
    specialty: str
    email: str
    phone: Optional[str] = None

class ProviderCreate(ProviderBase):
    pass

class Provider(ProviderBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class AppointmentSlotBase(BaseModel):
    provider_id: int
    start_time: datetime
    end_time: datetime
    appointment_type: str
    notes: Optional[str] = None

class AppointmentSlotCreate(AppointmentSlotBase):
    pass

class SlotBooking(BaseModel):
    patient_id: int
    notes: Optional[str] = None

class AppointmentSlot(AppointmentSlotBase):
    id: int
    is_available: bool
    patient_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True 