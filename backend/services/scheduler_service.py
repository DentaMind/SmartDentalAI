from typing import List, Dict, Optional, Set
from datetime import datetime, time, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, text
from fastapi import HTTPException

from models.schedule import Provider, Appointment, TimeOff, Availability, Location
from schemas.schedule import (
    TimeSlot,
    AppointmentRequest,
    AvailabilityResponse,
    ConflictCheckResult,
    RescheduleOptions
)

class SchedulerService:
    def __init__(self, db: Session):
        self.db = db
        self.MIN_SLOT_DURATION = timedelta(minutes=15)  # Minimum bookable slot
        self.MAX_DAYS_AHEAD = 60  # Maximum days to look ahead for availability
        
    def _get_provider_working_hours(
        self,
        provider_id: int,
        location_id: int,
        date: datetime.date
    ) -> List[Dict[str, time]]:
        """Get provider's working hours for a specific date and location."""
        # Get standard availability for the day of week
        day_of_week = date.strftime("%A").lower()
        availability = (
            self.db.query(Availability)
            .filter(
                Availability.provider_id == provider_id,
                Availability.location_id == location_id,
                Availability.day_of_week == day_of_week
            )
            .all()
        )
        
        if not availability:
            return []
            
        return [
            {"start": slot.start_time, "end": slot.end_time}
            for slot in availability
        ]
    
    def _get_provider_time_off(
        self,
        provider_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, datetime]]:
        """Get provider's time off periods within a date range."""
        time_off_periods = (
            self.db.query(TimeOff)
            .filter(
                TimeOff.provider_id == provider_id,
                TimeOff.start_time <= end_date,
                TimeOff.end_time >= start_date
            )
            .all()
        )
        
        return [
            {"start": period.start_time, "end": period.end_time}
            for period in time_off_periods
        ]
    
    def _get_existing_appointments(
        self,
        provider_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, datetime]]:
        """Get provider's existing appointments within a date range."""
        appointments = (
            self.db.query(Appointment)
            .filter(
                Appointment.provider_id == provider_id,
                Appointment.start_time <= end_date,
                Appointment.end_time >= start_date,
                Appointment.status.in_(["scheduled", "confirmed"])
            )
            .all()
        )
        
        return [
            {"start": appt.start_time, "end": appt.end_time}
            for appt in appointments
        ]
    
    def _merge_time_ranges(
        self,
        ranges: List[Dict[str, datetime]]
    ) -> List[Dict[str, datetime]]:
        """Merge overlapping time ranges into continuous blocks."""
        if not ranges:
            return []
            
        # Sort by start time
        sorted_ranges = sorted(ranges, key=lambda x: x["start"])
        merged = [sorted_ranges[0]]
        
        for current in sorted_ranges[1:]:
            previous = merged[-1]
            if current["start"] <= previous["end"]:
                # Ranges overlap, extend previous range if needed
                previous["end"] = max(previous["end"], current["end"])
            else:
                # No overlap, add new range
                merged.append(current)
                
        return merged
    
    def _generate_available_slots(
        self,
        working_hours: List[Dict[str, time]],
        blocked_periods: List[Dict[str, datetime]],
        date: datetime.date,
        duration: timedelta
    ) -> List[TimeSlot]:
        """Generate available time slots considering working hours and blocked periods."""
        available_slots = []
        
        for hours in working_hours:
            start_dt = datetime.combine(date, hours["start"])
            end_dt = datetime.combine(date, hours["end"])
            
            current = start_dt
            while current + duration <= end_dt:
                # Check if slot overlaps with any blocked period
                is_available = True
                for block in blocked_periods:
                    if (
                        current < block["end"] and
                        current + duration > block["start"]
                    ):
                        is_available = False
                        # Jump to end of blocked period
                        current = block["end"]
                        break
                
                if is_available:
                    available_slots.append(
                        TimeSlot(
                            start_time=current,
                            end_time=current + duration
                        )
                    )
                    current += self.MIN_SLOT_DURATION
                
        return available_slots
    
    async def get_available_slots(
        self,
        provider_id: int,
        location_id: int,
        start_date: datetime.date,
        end_date: Optional[datetime.date] = None,
        duration: timedelta = timedelta(minutes=30)
    ) -> Dict[str, List[TimeSlot]]:
        """Get available appointment slots for a provider at a location."""
        # Validate provider and location exist
        provider = self.db.query(Provider).get(provider_id)
        location = self.db.query(Location).get(location_id)
        
        if not provider or not location:
            raise HTTPException(
                status_code=404,
                detail="Provider or location not found"
            )
            
        # Set end date if not provided
        if not end_date:
            end_date = start_date + timedelta(days=self.MAX_DAYS_AHEAD)
            
        # Initialize results
        available_slots = {}
        current_date = start_date
        
        while current_date <= end_date:
            # Get working hours for the day
            working_hours = self._get_provider_working_hours(
                provider_id,
                location_id,
                current_date
            )
            
            if working_hours:
                # Get blocked periods (time off + existing appointments)
                day_start = datetime.combine(current_date, time.min)
                day_end = datetime.combine(current_date, time.max)
                
                time_off = self._get_provider_time_off(
                    provider_id,
                    day_start,
                    day_end
                )
                
                appointments = self._get_existing_appointments(
                    provider_id,
                    day_start,
                    day_end
                )
                
                # Merge all blocked periods
                blocked_periods = self._merge_time_ranges(
                    time_off + appointments
                )
                
                # Generate available slots
                slots = self._generate_available_slots(
                    working_hours,
                    blocked_periods,
                    current_date,
                    duration
                )
                
                if slots:
                    available_slots[current_date.isoformat()] = slots
            
            current_date += timedelta(days=1)
            
        return available_slots
    
    async def check_slot_conflicts(
        self,
        provider_id: int,
        start_time: datetime,
        end_time: datetime,
        exclude_appointment_id: Optional[int] = None
    ) -> ConflictCheckResult:
        """Check if a time slot has any conflicts."""
        # Check working hours
        day_of_week = start_time.strftime("%A").lower()
        availability = (
            self.db.query(Availability)
            .filter(
                Availability.provider_id == provider_id,
                Availability.day_of_week == day_of_week
            )
            .all()
        )
        
        is_within_hours = False
        for slot in availability:
            slot_start = datetime.combine(start_time.date(), slot.start_time)
            slot_end = datetime.combine(start_time.date(), slot.end_time)
            if start_time >= slot_start and end_time <= slot_end:
                is_within_hours = True
                break
                
        if not is_within_hours:
            return ConflictCheckResult(
                has_conflict=True,
                conflict_type="outside_working_hours"
            )
            
        # Check time off
        time_off = (
            self.db.query(TimeOff)
            .filter(
                TimeOff.provider_id == provider_id,
                TimeOff.start_time < end_time,
                TimeOff.end_time > start_time
            )
            .first()
        )
        
        if time_off:
            return ConflictCheckResult(
                has_conflict=True,
                conflict_type="provider_time_off"
            )
            
        # Check existing appointments
        appointment_query = (
            self.db.query(Appointment)
            .filter(
                Appointment.provider_id == provider_id,
                Appointment.start_time < end_time,
                Appointment.end_time > start_time,
                Appointment.status.in_(["scheduled", "confirmed"])
            )
        )
        
        if exclude_appointment_id:
            appointment_query = appointment_query.filter(
                Appointment.id != exclude_appointment_id
            )
            
        existing_appointment = appointment_query.first()
        
        if existing_appointment:
            return ConflictCheckResult(
                has_conflict=True,
                conflict_type="existing_appointment",
                conflicting_appointment_id=existing_appointment.id
            )
            
        return ConflictCheckResult(has_conflict=False)
    
    async def suggest_reschedule_slots(
        self,
        appointment_id: int,
        max_suggestions: int = 5
    ) -> RescheduleOptions:
        """Suggest alternative slots for rescheduling an appointment."""
        # Get the appointment details
        appointment = self.db.query(Appointment).get(appointment_id)
        if not appointment:
            raise HTTPException(
                status_code=404,
                detail="Appointment not found"
            )
            
        # Calculate appointment duration
        duration = appointment.end_time - appointment.start_time
        
        # Get available slots for next 7 days
        start_date = datetime.now().date()
        end_date = start_date + timedelta(days=7)
        
        available_slots = await self.get_available_slots(
            appointment.provider_id,
            appointment.location_id,
            start_date,
            end_date,
            duration
        )
        
        # Flatten slots and sort by start time
        all_slots = []
        for day_slots in available_slots.values():
            all_slots.extend(day_slots)
            
        sorted_slots = sorted(all_slots, key=lambda x: x.start_time)
        
        return RescheduleOptions(
            original_appointment_id=appointment_id,
            suggested_slots=sorted_slots[:max_suggestions]
        ) 