from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException

from ..models.calendar import Provider, AppointmentSlot
from ..schemas.calendar import ProviderCreate, AppointmentSlotCreate, SlotBooking

class CalendarService:
    def __init__(self, db: Session):
        self.db = db

    def get_provider(self, provider_id: int) -> Provider:
        provider = self.db.query(Provider).filter(Provider.id == provider_id).first()
        if not provider:
            raise HTTPException(status_code=404, detail="Provider not found")
        return provider

    def create_provider(self, provider: ProviderCreate) -> Provider:
        db_provider = Provider(**provider.dict())
        self.db.add(db_provider)
        self.db.commit()
        self.db.refresh(db_provider)
        return db_provider

    def get_available_slots(
        self,
        provider_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        appointment_type: Optional[str] = None
    ) -> List[AppointmentSlot]:
        query = self.db.query(AppointmentSlot).filter(AppointmentSlot.is_available == True)
        
        if provider_id:
            query = query.filter(AppointmentSlot.provider_id == provider_id)
        if start_date:
            query = query.filter(AppointmentSlot.start_time >= start_date)
        if end_date:
            query = query.filter(AppointmentSlot.end_time <= end_date)
        if appointment_type:
            query = query.filter(AppointmentSlot.appointment_type == appointment_type)
        
        return query.all()

    def create_slot(self, slot: AppointmentSlotCreate) -> AppointmentSlot:
        # Validate provider exists
        self.get_provider(slot.provider_id)
        
        # Validate time slot
        if slot.start_time >= slot.end_time:
            raise HTTPException(status_code=400, detail="End time must be after start time")
        
        # Check for overlapping slots
        overlapping = self.db.query(AppointmentSlot).filter(
            AppointmentSlot.provider_id == slot.provider_id,
            AppointmentSlot.start_time < slot.end_time,
            AppointmentSlot.end_time > slot.start_time
        ).first()
        
        if overlapping:
            raise HTTPException(status_code=400, detail="Time slot overlaps with existing appointment")
        
        db_slot = AppointmentSlot(**slot.dict(), is_available=True)
        self.db.add(db_slot)
        self.db.commit()
        self.db.refresh(db_slot)
        return db_slot

    def book_slot(self, slot_id: int, booking: SlotBooking) -> AppointmentSlot:
        slot = self.db.query(AppointmentSlot).filter(AppointmentSlot.id == slot_id).first()
        if not slot:
            raise HTTPException(status_code=404, detail="Appointment slot not found")
        if not slot.is_available:
            raise HTTPException(status_code=400, detail="Slot is already booked")
        
        slot.is_available = False
        slot.patient_id = booking.patient_id
        slot.appointment_type = booking.appointment_type
        slot.notes = booking.notes
        
        self.db.commit()
        self.db.refresh(slot)
        return slot

    def cancel_slot(self, slot_id: int) -> AppointmentSlot:
        slot = self.db.query(AppointmentSlot).filter(AppointmentSlot.id == slot_id).first()
        if not slot:
            raise HTTPException(status_code=404, detail="Appointment slot not found")
        
        slot.is_available = True
        slot.patient_id = None
        slot.notes = None
        
        self.db.commit()
        self.db.refresh(slot)
        return slot

    def get_provider_schedule(
        self,
        provider_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[AppointmentSlot]:
        query = self.db.query(AppointmentSlot).filter(AppointmentSlot.provider_id == provider_id)
        
        if start_date:
            query = query.filter(AppointmentSlot.start_time >= start_date)
        if end_date:
            query = query.filter(AppointmentSlot.end_time <= end_date)
        
        return query.order_by(AppointmentSlot.start_time).all() 