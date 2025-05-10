from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session

from api.dependencies.db import get_db
from api.services.scheduler_service import SchedulerService
from api.schemas.scheduling import (
    Appointment, AppointmentCreate, AppointmentUpdate, 
    AppointmentSummary, TimeSlot, AppointmentRescheduleRequest,
    Provider, ProviderCreate, ProviderUpdate,
    Room, RoomCreate, RoomUpdate,
    AppointmentType, AppointmentTypeCreate, AppointmentTypeUpdate,
    WaitingList, WaitingListCreate, WaitingListUpdate,
    CancellationList, CancellationListCreate, CancellationListUpdate,
    Procedure, ProcedureCreate, ProcedureUpdate,
    SchedulerColumn, SchedulerColumnCreate, SchedulerColumnUpdate,
    AvailabilityRequest, AvailabilityResponse, ConflictCheckResult,
    RescheduleOptions
)

router = APIRouter(
    prefix="/scheduling",
    tags=["scheduling"],
    responses={404: {"description": "Not found"}}
)

# ----- Appointments -----

@router.post("/appointments", response_model=Appointment, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment: AppointmentCreate,
    db: Session = Depends(get_db)
):
    """Create a new appointment"""
    scheduler_service = SchedulerService(db)
    return await scheduler_service.create_appointment(appointment)

@router.get("/appointments", response_model=List[AppointmentSummary])
async def get_appointments(
    start_date: datetime = Query(..., description="Start date for appointment range"),
    end_date: datetime = Query(..., description="End date for appointment range"),
    provider_id: Optional[str] = Query(None, description="Filter by provider ID"),
    patient_id: Optional[str] = Query(None, description="Filter by patient ID"),
    status: Optional[str] = Query(None, description="Filter by appointment status"),
    db: Session = Depends(get_db)
):
    """Get a list of appointments within a date range"""
    scheduler_service = SchedulerService(db)
    return await scheduler_service.get_appointments(start_date, end_date, provider_id, patient_id, status)

@router.get("/appointments/{appointment_id}", response_model=Appointment)
async def get_appointment(
    appointment_id: str = Path(..., description="The ID of the appointment to retrieve"),
    db: Session = Depends(get_db)
):
    """Get a specific appointment by ID"""
    scheduler_service = SchedulerService(db)
    appointment = await scheduler_service.get_appointment_by_id(appointment_id)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    return appointment

@router.put("/appointments/{appointment_id}", response_model=Appointment)
async def update_appointment(
    appointment_id: str = Path(..., description="The ID of the appointment to update"),
    appointment_data: AppointmentUpdate = ...,
    db: Session = Depends(get_db)
):
    """Update an existing appointment"""
    scheduler_service = SchedulerService(db)
    updated_appointment = await scheduler_service.update_appointment(appointment_id, appointment_data)
    if not updated_appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    return updated_appointment

@router.delete("/appointments/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_appointment(
    appointment_id: str = Path(..., description="The ID of the appointment to cancel"),
    cancellation_reason: Optional[str] = Query(None, description="Reason for cancellation"),
    db: Session = Depends(get_db)
):
    """Cancel an existing appointment"""
    scheduler_service = SchedulerService(db)
    success = await scheduler_service.cancel_appointment(appointment_id, cancellation_reason)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    return None

@router.post("/appointments/reschedule", response_model=Appointment)
async def reschedule_appointment(
    reschedule_data: AppointmentRescheduleRequest,
    db: Session = Depends(get_db)
):
    """Reschedule an existing appointment to a new time"""
    scheduler_service = SchedulerService(db)
    rescheduled_appointment = await scheduler_service.reschedule_appointment(
        reschedule_data.appointment_id,
        reschedule_data.new_start_time,
        reschedule_data.new_end_time,
        reschedule_data.update_recurrences
    )
    if not rescheduled_appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    return rescheduled_appointment

@router.get("/availability", response_model=Dict[str, List[TimeSlot]])
async def get_availability(
    provider_id: str = Query(..., description="Provider ID to check availability for"),
    start_date: datetime = Query(..., description="Start date for availability search"),
    end_date: Optional[datetime] = Query(None, description="End date for availability search"),
    duration_minutes: int = Query(30, description="Appointment duration in minutes"),
    db: Session = Depends(get_db)
):
    """Get available appointment slots for a provider"""
    scheduler_service = SchedulerService(db)
    return await scheduler_service.get_provider_availability(
        provider_id, start_date, end_date, duration_minutes
    )

@router.post("/check-conflicts", response_model=ConflictCheckResult)
async def check_appointment_conflicts(
    provider_id: str = Query(..., description="Provider ID to check"),
    start_time: datetime = Query(..., description="Appointment start time"),
    end_time: datetime = Query(..., description="Appointment end time"),
    appointment_id: Optional[str] = Query(None, description="Appointment ID to exclude from check"),
    allow_side_booking: bool = Query(False, description="Whether to allow side booking"),
    db: Session = Depends(get_db)
):
    """Check if a proposed appointment time conflicts with anything"""
    scheduler_service = SchedulerService(db)
    return await scheduler_service.check_appointment_conflicts(
        provider_id, start_time, end_time, appointment_id, allow_side_booking
    )

# ----- Providers -----

@router.post("/providers", response_model=Provider, status_code=status.HTTP_201_CREATED)
async def create_provider(
    provider: ProviderCreate,
    db: Session = Depends(get_db)
):
    """Create a new provider"""
    scheduler_service = SchedulerService(db)
    return await scheduler_service.create_provider(provider)

@router.get("/providers", response_model=List[Provider])
async def get_providers(
    role: Optional[str] = Query(None, description="Filter by provider role"),
    is_active: bool = Query(True, description="Filter by active status"),
    db: Session = Depends(get_db)
):
    """Get all providers, optionally filtered by role"""
    scheduler_service = SchedulerService(db)
    return await scheduler_service.get_providers(role, is_active)

@router.get("/providers/{provider_id}", response_model=Provider)
async def get_provider(
    provider_id: str = Path(..., description="The ID of the provider to retrieve"),
    db: Session = Depends(get_db)
):
    """Get a specific provider by ID"""
    scheduler_service = SchedulerService(db)
    provider = await scheduler_service.get_provider_by_id(provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider not found"
        )
    return provider

@router.put("/providers/{provider_id}", response_model=Provider)
async def update_provider(
    provider_id: str = Path(..., description="The ID of the provider to update"),
    provider_data: ProviderUpdate = ...,
    db: Session = Depends(get_db)
):
    """Update an existing provider"""
    scheduler_service = SchedulerService(db)
    updated_provider = await scheduler_service.update_provider(provider_id, provider_data)
    if not updated_provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider not found"
        )
    return updated_provider

# ----- Rooms -----

@router.post("/rooms", response_model=Room, status_code=status.HTTP_201_CREATED)
async def create_room(
    room: RoomCreate,
    db: Session = Depends(get_db)
):
    """Create a new room"""
    scheduler_service = SchedulerService(db)
    return await scheduler_service.create_room(room)

@router.get("/rooms", response_model=List[Room])
async def get_rooms(
    is_active: bool = Query(True, description="Filter by active status"),
    db: Session = Depends(get_db)
):
    """Get all rooms"""
    scheduler_service = SchedulerService(db)
    return await scheduler_service.get_rooms(is_active)

# ----- Appointment Types -----

@router.post("/appointment-types", response_model=AppointmentType, status_code=status.HTTP_201_CREATED)
async def create_appointment_type(
    appointment_type: AppointmentTypeCreate,
    db: Session = Depends(get_db)
):
    """Create a new appointment type"""
    scheduler_service = SchedulerService(db)
    return await scheduler_service.create_appointment_type(appointment_type)

@router.get("/appointment-types", response_model=List[AppointmentType])
async def get_appointment_types(
    is_active: bool = Query(True, description="Filter by active status"),
    db: Session = Depends(get_db)
):
    """Get all appointment types"""
    scheduler_service = SchedulerService(db)
    return await scheduler_service.get_appointment_types(is_active)

# ----- Procedures -----

@router.post("/procedures", response_model=Procedure, status_code=status.HTTP_201_CREATED)
async def create_procedure(
    procedure: ProcedureCreate,
    db: Session = Depends(get_db)
):
    """Create a new procedure"""
    scheduler_service = SchedulerService(db)
    return await scheduler_service.create_procedure(procedure)

@router.get("/procedures", response_model=List[Procedure])
async def get_procedures(
    category: Optional[str] = Query(None, description="Filter by procedure category"),
    is_active: bool = Query(True, description="Filter by active status"),
    db: Session = Depends(get_db)
):
    """Get all procedures, optionally filtered by category"""
    scheduler_service = SchedulerService(db)
    return await scheduler_service.get_procedures(category, is_active)

# ----- Waiting List -----

@router.post("/waiting-list", response_model=WaitingList, status_code=status.HTTP_201_CREATED)
async def add_to_waiting_list(
    waiting_list_item: WaitingListCreate,
    db: Session = Depends(get_db)
):
    """Add a patient to the waiting list"""
    scheduler_service = SchedulerService(db)
    return await scheduler_service.add_to_waiting_list(waiting_list_item)

@router.get("/waiting-list", response_model=List[WaitingList])
async def get_waiting_list(
    is_filled: bool = Query(False, description="Filter by filled status"),
    db: Session = Depends(get_db)
):
    """Get all waiting list entries"""
    scheduler_service = SchedulerService(db)
    return await scheduler_service.get_waiting_list(is_filled)

# ----- Cancellation List -----

@router.post("/cancellation-list", response_model=CancellationList, status_code=status.HTTP_201_CREATED)
async def add_to_cancellation_list(
    cancellation_list_item: CancellationListCreate,
    db: Session = Depends(get_db)
):
    """Add a patient to the cancellation notification list"""
    scheduler_service = SchedulerService(db)
    return await scheduler_service.add_to_cancellation_list(cancellation_list_item)

@router.get("/cancellation-list", response_model=List[CancellationList])
async def get_cancellation_list(
    is_active: bool = Query(True, description="Filter by active status"),
    db: Session = Depends(get_db)
):
    """Get all cancellation list entries"""
    scheduler_service = SchedulerService(db)
    return await scheduler_service.get_cancellation_list(is_active)

# ----- Scheduler Columns -----

@router.post("/columns", response_model=SchedulerColumn, status_code=status.HTTP_201_CREATED)
async def create_scheduler_column(
    column: SchedulerColumnCreate,
    db: Session = Depends(get_db)
):
    """Create a new scheduler column"""
    scheduler_service = SchedulerService(db)
    return await scheduler_service.create_scheduler_column(column)

@router.get("/columns", response_model=List[SchedulerColumn])
async def get_scheduler_columns(
    is_active: bool = Query(True, description="Filter by active status"),
    db: Session = Depends(get_db)
):
    """Get all scheduler columns"""
    scheduler_service = SchedulerService(db)
    return await scheduler_service.get_scheduler_columns(is_active)
