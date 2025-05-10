from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging
from sqlalchemy.orm import Session

from ..models.calendar import AppointmentSlot, Provider
from ..schemas.calendar import AppointmentSlotCreate, ProviderCreate

logger = logging.getLogger(__name__)

class CalendarService:
    def __init__(self, db: Session):
        self.db = db

    def get_available_slots(
        self,
        start_date: datetime,
        end_date: datetime,
        appointment_type: Optional[str] = None,
        provider_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get available appointment slots within the specified date range."""
        try:
            query = self.db.query(AppointmentSlot).filter(
                AppointmentSlot.start_time >= start_date,
                AppointmentSlot.end_time <= end_date,
                AppointmentSlot.is_available == True
            )

            if appointment_type:
                query = query.filter(AppointmentSlot.appointment_type == appointment_type)
            
            if provider_id:
                query = query.filter(AppointmentSlot.provider_id == provider_id)

            slots = query.all()
            
            return [
                {
                    "id": slot.id,
                    "date": slot.start_time.strftime("%Y-%m-%d"),
                    "time": slot.start_time.strftime("%I:%M %p"),
                    "provider": slot.provider.name,
                    "duration": (slot.end_time - slot.start_time).total_seconds() / 60,
                    "type": slot.appointment_type
                }
                for slot in slots
            ]
            
        except Exception as e:
            logger.error(f"Failed to get available slots: {str(e)}")
            return []

    def create_slot(
        self,
        slot_data: AppointmentSlotCreate
    ) -> Optional[AppointmentSlot]:
        """Create a new appointment slot."""
        try:
            slot = AppointmentSlot(**slot_data.dict())
            self.db.add(slot)
            self.db.commit()
            self.db.refresh(slot)
            return slot
        except Exception as e:
            logger.error(f"Failed to create slot: {str(e)}")
            self.db.rollback()
            return None

    def book_slot(
        self,
        slot_id: int,
        patient_id: int,
        appointment_type: str
    ) -> bool:
        """Book an appointment slot."""
        try:
            slot = self.db.query(AppointmentSlot).get(slot_id)
            if not slot or not slot.is_available:
                return False

            slot.is_available = False
            slot.patient_id = patient_id
            slot.appointment_type = appointment_type
            self.db.commit()
            return True
            
        except Exception as e:
            logger.error(f"Failed to book slot: {str(e)}")
            self.db.rollback()
            return False

    def cancel_slot(self, slot_id: int) -> bool:
        """Cancel a booked appointment slot."""
        try:
            slot = self.db.query(AppointmentSlot).get(slot_id)
            if not slot or slot.is_available:
                return False

            slot.is_available = True
            slot.patient_id = None
            self.db.commit()
            return True
            
        except Exception as e:
            logger.error(f"Failed to cancel slot: {str(e)}")
            self.db.rollback()
            return False

    def add_provider(
        self,
        provider_data: ProviderCreate
    ) -> Optional[Provider]:
        """Add a new provider to the calendar system."""
        try:
            provider = Provider(**provider_data.dict())
            self.db.add(provider)
            self.db.commit()
            self.db.refresh(provider)
            return provider
        except Exception as e:
            logger.error(f"Failed to add provider: {str(e)}")
            self.db.rollback()
            return None

    def get_provider_schedule(
        self,
        provider_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Get a provider's schedule within the specified date range."""
        try:
            slots = self.db.query(AppointmentSlot).filter(
                AppointmentSlot.provider_id == provider_id,
                AppointmentSlot.start_time >= start_date,
                AppointmentSlot.end_time <= end_date
            ).all()
            
            return [
                {
                    "id": slot.id,
                    "start_time": slot.start_time,
                    "end_time": slot.end_time,
                    "is_available": slot.is_available,
                    "patient_id": slot.patient_id,
                    "type": slot.appointment_type
                }
                for slot in slots
            ]
            
        except Exception as e:
            logger.error(f"Failed to get provider schedule: {str(e)}")
            return []

# Factory function to create calendar service instance
def get_calendar_service(db: Session) -> CalendarService:
    return CalendarService(db) 