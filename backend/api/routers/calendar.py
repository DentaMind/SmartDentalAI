from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..dependencies import get_db
from ..services.calendar import CalendarService
from ..crud import calendar as crud
from ..schemas.calendar import (
    Provider,
    ProviderCreate,
    AppointmentSlot,
    AppointmentSlotCreate,
    SlotBooking
)

router = APIRouter(prefix="/calendar", tags=["calendar"])

@router.post("/providers", response_model=Provider, status_code=status.HTTP_201_CREATED)
def create_provider(provider: ProviderCreate, db: Session = Depends(get_db)):
    return crud.create_provider(db, provider)

@router.get("/providers", response_model=List[Provider])
def read_providers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_providers(db, skip, limit)

@router.get("/providers/{provider_id}", response_model=Provider)
def read_provider(provider_id: int, db: Session = Depends(get_db)):
    db_provider = crud.get_provider(db, provider_id)
    if db_provider is None:
        raise HTTPException(status_code=404, detail="Provider not found")
    return db_provider

@router.put("/providers/{provider_id}", response_model=Provider)
def update_provider(
    provider_id: int, provider: ProviderCreate, db: Session = Depends(get_db)
):
    db_provider = crud.update_provider(db, provider_id, provider)
    if db_provider is None:
        raise HTTPException(status_code=404, detail="Provider not found")
    return db_provider

@router.delete("/providers/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_provider(provider_id: int, db: Session = Depends(get_db)):
    if not crud.delete_provider(db, provider_id):
        raise HTTPException(status_code=404, detail="Provider not found")

@router.post("/slots", response_model=AppointmentSlot, status_code=status.HTTP_201_CREATED)
def create_appointment_slot(slot: AppointmentSlotCreate, db: Session = Depends(get_db)):
    return crud.create_appointment_slot(db, slot)

@router.get("/slots/{slot_id}", response_model=AppointmentSlot)
def read_appointment_slot(slot_id: int, db: Session = Depends(get_db)):
    db_slot = crud.get_appointment_slot(db, slot_id)
    if db_slot is None:
        raise HTTPException(status_code=404, detail="Appointment slot not found")
    return db_slot

@router.get("/providers/{provider_id}/slots", response_model=List[AppointmentSlot])
def read_provider_slots(
    provider_id: int,
    start_time: datetime,
    end_time: datetime,
    db: Session = Depends(get_db)
):
    return crud.get_provider_slots(db, provider_id, start_time, end_time)

@router.put("/slots/{slot_id}", response_model=AppointmentSlot)
def update_appointment_slot(
    slot_id: int, slot: AppointmentSlotCreate, db: Session = Depends(get_db)
):
    db_slot = crud.update_appointment_slot(db, slot_id, slot)
    if db_slot is None:
        raise HTTPException(status_code=404, detail="Appointment slot not found")
    return db_slot

@router.delete("/slots/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment_slot(slot_id: int, db: Session = Depends(get_db)):
    if not crud.delete_appointment_slot(db, slot_id):
        raise HTTPException(status_code=404, detail="Appointment slot not found")

@router.post("/slots/{slot_id}/book", response_model=AppointmentSlot)
def book_appointment_slot(
    slot_id: int, booking: SlotBooking, db: Session = Depends(get_db)
):
    db_slot = crud.book_appointment_slot(db, slot_id, booking.patient_id, booking.notes)
    if db_slot is None:
        raise HTTPException(
            status_code=400,
            detail="Appointment slot not available or not found"
        )
    return db_slot

@router.post("/slots/{slot_id}/cancel", response_model=AppointmentSlot)
def cancel_appointment_slot(slot_id: int, db: Session = Depends(get_db)):
    db_slot = crud.cancel_appointment_slot(db, slot_id)
    if db_slot is None:
        raise HTTPException(
            status_code=400,
            detail="Appointment slot not booked or not found"
        )
    return db_slot

@router.get("/slots", response_model=List[AppointmentSlot])
def get_available_slots(
    provider_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    appointment_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    service = CalendarService(db)
    return service.get_available_slots(provider_id, start_date, end_date, appointment_type)

@router.get("/providers/{provider_id}/schedule", response_model=List[AppointmentSlot])
def get_provider_schedule(
    provider_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    service = CalendarService(db)
    return service.get_provider_schedule(provider_id, start_date, end_date) 