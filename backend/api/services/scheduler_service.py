from typing import List, Dict, Optional, Any, Union, Set
from datetime import datetime, time, timedelta
from fastapi import HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, text, desc
import uuid
import logging

from api.models.scheduling import (
    Appointment, Provider, ProviderAvailability, Room, 
    AppointmentType, Procedure, AppointmentProcedure,
    WaitingList, CancellationList, SchedulerColumn,
    AppointmentStatus, RecurrenceFrequency, ProviderRole
)
from api.schemas.scheduling import (
    TimeSlot, AvailabilityRequest, AvailabilityResponse,
    ConflictCheckResult, RescheduleOptions, AppointmentSummary,
    AppointmentCreate, AppointmentUpdate, AppointmentRescheduleRequest,
    PatientQuickInfo, SchedulerSettings
)

logger = logging.getLogger(__name__)

class SchedulerService:
    """Service for managing dental appointments and provider scheduling"""
    
    def __init__(self, db: Session):
        self.db = db
        self.MIN_SLOT_DURATION_MINUTES = 15  # Minimum bookable slot
        self.MAX_DAYS_AHEAD = 90  # Maximum days to look ahead for availability
        
    def _time_str_to_minutes(self, time_str: str) -> int:
        """Convert HH:MM time string to minutes since midnight"""
        hours, minutes = map(int, time_str.split(':'))
        return hours * 60 + minutes
        
    def _minutes_to_time_str(self, minutes: int) -> str:
        """Convert minutes since midnight to HH:MM time string"""
        hours = minutes // 60
        mins = minutes % 60
        return f"{hours:02d}:{mins:02d}"
        
    def _round_to_increment(self, dt: datetime, increment_minutes: int = 15) -> datetime:
        """Round a datetime to the nearest increment"""
        minutes = dt.hour * 60 + dt.minute
        rounded_minutes = round(minutes / increment_minutes) * increment_minutes
        
        return dt.replace(
            hour=rounded_minutes // 60,
            minute=rounded_minutes % 60,
            second=0,
            microsecond=0
        )
    
    def _get_provider_working_hours(
        self,
        provider_id: str,
        date: datetime.date
    ) -> List[Dict[str, str]]:
        """Get provider's working hours for a specific date"""
        # Get standard availability for the day of week (0=Monday, 6=Sunday)
        day_of_week = date.weekday()
        
        # Check for exception availability first (provider took specific day off or has special hours)
        exception_hours = (
            self.db.query(ProviderAvailability)
            .filter(
                ProviderAvailability.provider_id == provider_id,
                ProviderAvailability.is_exception == True,
                func.date(ProviderAvailability.exception_date) == date
            )
            .all()
        )
        
        if exception_hours:
            return [
                {"start": slot.start_time, "end": slot.end_time}
                for slot in exception_hours
            ]
            
        # Fall back to regular schedule if no exceptions
        availability = (
            self.db.query(ProviderAvailability)
            .filter(
                ProviderAvailability.provider_id == provider_id,
                ProviderAvailability.day_of_week == day_of_week,
                ProviderAvailability.is_exception == False
            )
            .all()
        )
        
        return [
            {"start": slot.start_time, "end": slot.end_time}
            for slot in availability
        ]
    
    def _get_existing_appointments(
        self,
        provider_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, datetime]]:
        """Get provider's existing appointments within a date range"""
        appointments = (
            self.db.query(Appointment)
            .filter(
                Appointment.provider_id == provider_id,
                Appointment.start_time < end_date,
                Appointment.end_time > start_date,
                Appointment.status.in_([
                    AppointmentStatus.SCHEDULED, 
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.CHECKED_IN,
                    AppointmentStatus.IN_PROGRESS
                ])
            )
            .all()
        )
        
        return [
            {"start": appt.start_time, "end": appt.end_time, "id": appt.id}
            for appt in appointments
        ]
    
    def _generate_available_slots(
        self,
        working_hours: List[Dict[str, str]],
        blocked_periods: List[Dict[str, datetime]],
        date: datetime.date,
        duration_minutes: int,
        side_booking_allowed: bool = False,
        max_side_bookings: int = 0
    ) -> List[TimeSlot]:
        """Generate available time slots considering working hours and blocked periods"""
        available_slots = []
        
        for hours in working_hours:
            # Convert string times to datetime objects
            start_hour, start_minute = map(int, hours["start"].split(':'))
            end_hour, end_minute = map(int, hours["end"].split(':'))
            
            start_dt = datetime.combine(date, time(start_hour, start_minute))
            end_dt = datetime.combine(date, time(end_hour, end_minute))
            
            # Round start time up to nearest increment
            minutes_since_midnight = start_dt.hour * 60 + start_dt.minute
            remainder = minutes_since_midnight % self.MIN_SLOT_DURATION_MINUTES
            if remainder > 0:
                start_dt = start_dt + timedelta(minutes=self.MIN_SLOT_DURATION_MINUTES - remainder)
                
            current = start_dt
            slot_duration = timedelta(minutes=duration_minutes)
            
            while current + slot_duration <= end_dt:
                # Skip this slot if it's in the past
                if current < datetime.now():
                    current += timedelta(minutes=self.MIN_SLOT_DURATION_MINUTES)
                    continue
                    
                # Check if slot overlaps with any blocked period
                overlapping_periods = []
                for block in blocked_periods:
                    if (current < block["end"] and current + slot_duration > block["start"]):
                        overlapping_periods.append(block)
                
                # Handle side booking logic
                if side_booking_allowed and overlapping_periods:
                    # Only allow side booking if within limits and not already at capacity
                    side_bookings_in_slot = len(overlapping_periods)
                    if side_bookings_in_slot < max_side_bookings:
                        available_slots.append(
                            TimeSlot(
                                start_time=current,
                                end_time=current + slot_duration,
                                is_side_booking=True,
                                overlapping_appointments=[p["id"] for p in overlapping_periods]
                            )
                        )
                elif not overlapping_periods:
                    # Regular available slot (no conflicts)
                    available_slots.append(
                        TimeSlot(
                            start_time=current,
                            end_time=current + slot_duration,
                            is_side_booking=False
                        )
                    )
                
                # Move to next potential slot
                current += timedelta(minutes=self.MIN_SLOT_DURATION_MINUTES)
                
        return available_slots
    
    async def get_provider_availability(
        self,
        provider_id: str,
        start_date: datetime,
        end_date: Optional[datetime] = None,
        duration_minutes: int = 30
    ) -> Dict[str, List[TimeSlot]]:
        """Get available slots for a specific provider"""
        # Validate provider exists
        provider = self.db.query(Provider).filter(Provider.id == provider_id).first()
        if not provider:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Provider not found"
            )
        
        # Set end date if not provided
        if not end_date:
            end_date = start_date + timedelta(days=self.MAX_DAYS_AHEAD)
            
        # Get side booking settings for this provider
        side_booking_allowed = provider.max_side_bookings > 0
        max_side_bookings = provider.max_side_bookings
            
        # Initialize results
        available_slots = {}
        current_date = start_date.date()
        end_date_val = end_date.date()
        
        while current_date <= end_date_val:
            # Get working hours for the day
            working_hours = self._get_provider_working_hours(
                provider_id,
                current_date
            )
            
            if working_hours:
                # Get blocked periods (existing appointments)
                day_start = datetime.combine(current_date, time.min)
                day_end = datetime.combine(current_date, time.max)
                
                existing_appointments = self._get_existing_appointments(
                    provider_id,
                    day_start,
                    day_end
                )
                
                # Generate available slots
                slots = self._generate_available_slots(
                    working_hours,
                    existing_appointments,
                    current_date,
                    duration_minutes,
                    side_booking_allowed,
                    max_side_bookings
                )
                
                if slots:
                    available_slots[current_date.isoformat()] = slots
            
            current_date += timedelta(days=1)
            
        return available_slots
        
    async def check_appointment_conflicts(
        self,
        provider_id: str,
        start_time: datetime,
        end_time: datetime,
        exclude_appointment_id: Optional[str] = None,
        allow_side_booking: bool = False
    ) -> ConflictCheckResult:
        """Check if an appointment conflicts with provider schedule or other appointments"""
        # Validate provider exists
        provider = self.db.query(Provider).filter(Provider.id == provider_id).first()
        if not provider:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Provider not found"
            )
            
        # 1. Check if appointment is within provider's working hours
        day_of_week = start_time.weekday()  # 0=Monday, 6=Sunday
        date = start_time.date()
        
        # Check for exception days first
        exception_hours = (
            self.db.query(ProviderAvailability)
            .filter(
                ProviderAvailability.provider_id == provider_id,
                ProviderAvailability.is_exception == True,
                func.date(ProviderAvailability.exception_date) == date
            )
            .all()
        )
        
        # If there are exceptions but no records, provider is off this day
        if not exception_hours and self.db.query(ProviderAvailability).filter(
            ProviderAvailability.provider_id == provider_id,
            ProviderAvailability.is_exception == True,
            func.date(ProviderAvailability.exception_date) == date
        ).count() > 0:
            return ConflictCheckResult(
                has_conflict=True,
                conflict_type="provider_not_available",
                conflict_reason="Provider is not scheduled to work on this date"
            )
            
        # Use standard availability if no exceptions
        availability = exception_hours if exception_hours else (
            self.db.query(ProviderAvailability)
            .filter(
                ProviderAvailability.provider_id == provider_id,
                ProviderAvailability.day_of_week == day_of_week,
                ProviderAvailability.is_exception == False
            )
            .all()
        )
        
        if not availability:
            return ConflictCheckResult(
                has_conflict=True,
                conflict_type="provider_not_available",
                conflict_reason="Provider does not have working hours on this day"
            )
            
        # Check if appointment is within any of the provider's available time slots
        is_within_hours = False
        for slot in availability:
            slot_start = self._time_str_to_minutes(slot.start_time)
            slot_end = self._time_str_to_minutes(slot.end_time)
            
            appt_start_minutes = start_time.hour * 60 + start_time.minute
            appt_end_minutes = end_time.hour * 60 + end_time.minute
            
            if slot_start <= appt_start_minutes and slot_end >= appt_end_minutes:
                is_within_hours = True
                break
                
        if not is_within_hours:
            return ConflictCheckResult(
                has_conflict=True,
                conflict_type="outside_working_hours",
                conflict_reason="Appointment falls outside provider's working hours"
            )
            
        # 2. Check for conflicts with existing appointments
        appointment_query = (
            self.db.query(Appointment)
            .filter(
                Appointment.provider_id == provider_id,
                Appointment.start_time < end_time,
                Appointment.end_time > start_time,
                Appointment.status.in_([
                    AppointmentStatus.SCHEDULED, 
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.CHECKED_IN,
                    AppointmentStatus.IN_PROGRESS
                ])
            )
        )
        
        if exclude_appointment_id:
            appointment_query = appointment_query.filter(
                Appointment.id != exclude_appointment_id
            )
            
        existing_appointments = appointment_query.all()
        
        # If side-booking is allowed, check how many concurrent appointments
        if allow_side_booking and existing_appointments:
            side_bookings_count = len(existing_appointments)
            
            # Only allow if we're not exceeding the provider's side booking capacity
            if side_bookings_count < provider.max_side_bookings:
                return ConflictCheckResult(
                    has_conflict=False,
                    is_side_booking=True,
                    side_booking_count=side_bookings_count + 1,
                    overlapping_appointments=[appt.id for appt in existing_appointments]
                )
            else:
                return ConflictCheckResult(
                    has_conflict=True,
                    conflict_type="exceeds_side_booking_limit",
                    conflict_reason=f"Provider only allows {provider.max_side_bookings} concurrent appointments"
                )
        elif existing_appointments:
            return ConflictCheckResult(
                has_conflict=True,
                conflict_type="existing_appointment",
                conflicting_appointment_id=existing_appointments[0].id
            )
            
        # No conflicts found
        return ConflictCheckResult(has_conflict=False)
        
    async def create_appointment(
        self,
        appointment_data: AppointmentCreate
    ) -> Appointment:
        """Create a new appointment with associated procedures"""
        # Validate appointment type exists
        appointment_type = self.db.query(AppointmentType).filter(
            AppointmentType.id == appointment_data.appointment_type_id
        ).first()
        
        if not appointment_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment type not found"
            )
            
        # Round start and end times to 15-minute increments
        start_time = self._round_to_increment(appointment_data.start_time)
        end_time = self._round_to_increment(appointment_data.end_time)
        
        # Check duration is valid (must be multiple of 15 minutes)
        duration = (end_time - start_time).total_seconds() / 60
        if duration % self.MIN_SLOT_DURATION_MINUTES != 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Appointment duration must be a multiple of {self.MIN_SLOT_DURATION_MINUTES} minutes"
            )
            
        # If provider specified, check for conflicts
        if appointment_data.provider_id:
            conflict_check = await self.check_appointment_conflicts(
                appointment_data.provider_id,
                start_time,
                end_time,
                allow_side_booking=appointment_data.is_side_booking
            )
            
            if conflict_check.has_conflict:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Appointment conflict: {conflict_check.conflict_reason or conflict_check.conflict_type}"
                )
                
            # Update side booking information if applicable
            appointment_data.is_side_booking = getattr(conflict_check, 'is_side_booking', False)
            if appointment_data.is_side_booking and getattr(conflict_check, 'overlapping_appointments', None):
                # Set parent appointment to the first overlapping one
                appointment_data.parent_appointment_id = conflict_check.overlapping_appointments[0]
                
        # Create new appointment
        new_appointment = Appointment(
            id=str(uuid.uuid4()),
            patient_id=appointment_data.patient_id,
            provider_id=appointment_data.provider_id,
            appointment_type_id=appointment_data.appointment_type_id,
            room_id=appointment_data.room_id,
            scheduler_column_id=appointment_data.scheduler_column_id,
            start_time=start_time,
            end_time=end_time,
            status=appointment_data.status,
            is_side_booking=appointment_data.is_side_booking,
            parent_appointment_id=appointment_data.parent_appointment_id,
            notes=appointment_data.notes,
            location=appointment_data.location,
            room_number=appointment_data.room_number,
            patient_quick_info=appointment_data.patient_quick_info.dict() if appointment_data.patient_quick_info else None,
            is_recurring=appointment_data.is_recurring,
            recurrence_frequency=appointment_data.recurrence_frequency,
            recurrence_pattern=appointment_data.recurrence_pattern,
            recurrence_group_id=appointment_data.recurrence_group_id or str(uuid.uuid4()) if appointment_data.is_recurring else None,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        self.db.add(new_appointment)
        
        # Create associated procedures if any
        if appointment_data.procedures:
            for proc_data in appointment_data.procedures:
                new_procedure = AppointmentProcedure(
                    id=str(uuid.uuid4()),
                    appointment_id=new_appointment.id,
                    procedure_id=proc_data.procedure_id,
                    procedure_code=proc_data.procedure_code,
                    procedure_name=proc_data.procedure_name,
                    tooth_number=proc_data.tooth_number,
                    surface=proc_data.surface,
                    quadrant=proc_data.quadrant,
                    estimated_time=proc_data.estimated_time,
                    notes=proc_data.notes,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                self.db.add(new_procedure)
        
        # Handle recurring appointments if enabled
        if appointment_data.is_recurring and appointment_data.recurrence_pattern:
            # Implementation for recurring appointments would go here
            # This would involve generating future appointments based on the recurrence pattern
            pass
                
        self.db.commit()
        self.db.refresh(new_appointment)
        
        return new_appointment 