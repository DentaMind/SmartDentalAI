from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..models.calendar import Provider, AppointmentSlot
from ..schemas.calendar import ProviderCreate, AppointmentSlotCreate

def create_provider(db: Session, provider: ProviderCreate) -> Provider:
    db_provider = Provider(
        name=provider.name,
        specialty=provider.specialty,
        email=provider.email,
        phone=provider.phone
    )
    db.add(db_provider)
    db.commit()
    db.refresh(db_provider)
    return db_provider

def get_provider(db: Session, provider_id: int) -> Optional[Provider]:
    return db.query(Provider).filter(Provider.id == provider_id).first()

def get_providers(db: Session, skip: int = 0, limit: int = 100) -> List[Provider]:
    return db.query(Provider).offset(skip).limit(limit).all()

def update_provider(
    db: Session, provider_id: int, provider: ProviderCreate
) -> Optional[Provider]:
    db_provider = get_provider(db, provider_id)
    if db_provider:
        for key, value in provider.dict().items():
            setattr(db_provider, key, value)
        db.commit()
        db.refresh(db_provider)
    return db_provider

def delete_provider(db: Session, provider_id: int) -> bool:
    db_provider = get_provider(db, provider_id)
    if db_provider:
        db.delete(db_provider)
        db.commit()
        return True
    return False

def create_appointment_slot(
    db: Session, slot: AppointmentSlotCreate
) -> AppointmentSlot:
    db_slot = AppointmentSlot(
        provider_id=slot.provider_id,
        start_time=slot.start_time,
        end_time=slot.end_time,
        appointment_type=slot.appointment_type
    )
    db.add(db_slot)
    db.commit()
    db.refresh(db_slot)
    return db_slot

def get_appointment_slot(
    db: Session, slot_id: int
) -> Optional[AppointmentSlot]:
    return db.query(AppointmentSlot).filter(AppointmentSlot.id == slot_id).first()

def get_provider_slots(
    db: Session, provider_id: int, start_time: datetime, end_time: datetime
) -> List[AppointmentSlot]:
    return (
        db.query(AppointmentSlot)
        .filter(
            AppointmentSlot.provider_id == provider_id,
            AppointmentSlot.start_time >= start_time,
            AppointmentSlot.end_time <= end_time
        )
        .all()
    )

def update_appointment_slot(
    db: Session, slot_id: int, slot: AppointmentSlotCreate
) -> Optional[AppointmentSlot]:
    db_slot = get_appointment_slot(db, slot_id)
    if db_slot:
        for key, value in slot.dict().items():
            setattr(db_slot, key, value)
        db.commit()
        db.refresh(db_slot)
    return db_slot

def delete_appointment_slot(db: Session, slot_id: int) -> bool:
    db_slot = get_appointment_slot(db, slot_id)
    if db_slot:
        db.delete(db_slot)
        db.commit()
        return True
    return False

def book_appointment_slot(
    db: Session, slot_id: int, patient_id: int, notes: Optional[str] = None
) -> Optional[AppointmentSlot]:
    db_slot = get_appointment_slot(db, slot_id)
    if db_slot and db_slot.is_available:
        db_slot.is_available = False
        db_slot.patient_id = patient_id
        db_slot.notes = notes
        db.commit()
        db.refresh(db_slot)
        return db_slot
    return None

def cancel_appointment_slot(db: Session, slot_id: int) -> Optional[AppointmentSlot]:
    db_slot = get_appointment_slot(db, slot_id)
    if db_slot and not db_slot.is_available:
        db_slot.is_available = True
        db_slot.patient_id = None
        db_slot.notes = None
        db.commit()
        db.refresh(db_slot)
        return db_slot
    return None 