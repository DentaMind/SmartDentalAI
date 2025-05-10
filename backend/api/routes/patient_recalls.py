from fastapi import APIRouter, Depends, HTTPException, Path, Query, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field

from ..database import get_db
from ..services.patient_recall_service import patient_recall_service
from ..schemas.patient_recall import (
    PatientRecallScheduleCreate,
    PatientRecallScheduleUpdate,
    PatientRecallScheduleResponse,
    PatientRecallScheduleWithHistoryResponse,
    RecallReminderHistoryResponse,
    RecallStatistics,
    BatchRecallScheduleCreate,
    RecallType,
    RecallFrequency,
    RecallStatus,
    RecallHistoryResponse,
    RecallHistoryStatus
)
from ..auth.auth import get_current_user, get_current_patient, User, Patient, get_current_active_staff

router = APIRouter(prefix="/patient-recalls", tags=["patient-recalls"])

# Pydantic models for request/response
class RecallScheduleBase(BaseModel):
    """Base model for recall schedule data"""
    recall_type: str
    due_date: Optional[datetime] = None
    provider_id: Optional[str] = None
    recurrence_pattern: Optional[str] = None
    recurrence_interval: Optional[int] = None
    max_reminders: Optional[int] = None
    last_appointment_date: Optional[datetime] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        orm_mode = True

class RecallScheduleCreate(RecallScheduleBase):
    """Model for creating a new recall schedule"""
    patient_id: str
    
class RecallScheduleUpdate(BaseModel):
    """Model for updating a recall schedule"""
    due_date: Optional[datetime] = None
    provider_id: Optional[str] = None
    recurrence_pattern: Optional[str] = None
    recurrence_interval: Optional[int] = None
    max_reminders: Optional[int] = None
    notes: Optional[str] = None
    active: Optional[bool] = None
    
    class Config:
        orm_mode = True

class RecallScheduleResponse(RecallScheduleBase):
    """Model for recall schedule response"""
    id: str
    patient_id: str
    active: bool
    reminder_sent: bool
    reminder_count: int
    created_at: datetime
    updated_at: datetime
    last_reminded_date: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class HygieneRecallCreate(BaseModel):
    """Simplified model for creating hygiene recalls"""
    patient_id: str
    interval_months: int = Field(6, description="Interval in months (1, 3, 4, 6, or 12)")
    provider_id: Optional[str] = None
    last_appointment_date: Optional[datetime] = None
    notes: Optional[str] = None

class PerioRecallCreate(BaseModel):
    """Simplified model for creating perio maintenance recalls"""
    patient_id: str
    interval_months: int = Field(3, description="Interval in months (usually 3 or 4)")
    provider_id: Optional[str] = None
    last_appointment_date: Optional[datetime] = None
    notes: Optional[str] = None

class ReactivationRecallCreate(BaseModel):
    """Model for creating patient reactivation recalls"""
    patient_id: str
    months_inactive: int = Field(12, description="Months of inactivity before reactivation")
    provider_id: Optional[str] = None
    last_appointment_date: Optional[datetime] = None
    notes: Optional[str] = None

# Routes for recall schedules

@router.post("", response_model=PatientRecallScheduleResponse)
async def create_recall_schedule(
    recall_data: PatientRecallScheduleCreate,
    current_user: User = Depends(get_current_active_staff),
    db: Session = Depends(get_db)
):
    """Create a new patient recall schedule"""
    try:
        recall = await patient_recall_service.create_recall_schedule(
            db=db,
            recall_data=recall_data,
            created_by=current_user.id
        )
        return recall
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/hygiene", response_model=RecallScheduleResponse)
async def create_hygiene_recall(
    recall: HygieneRecallCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a standard hygiene recall for a patient"""
    try:
        # Validate interval
        if recall.interval_months not in [1, 3, 4, 6, 12]:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid interval ({recall.interval_months}). Must be 1, 3, 4, 6, or 12 months."
            )
        
        # Create the hygiene recall
        result = await patient_recall_service.create_standard_hygiene_recall(
            db=db,
            patient_id=recall.patient_id,
            interval_months=recall.interval_months,
            provider_id=recall.provider_id,
            last_appointment_date=recall.last_appointment_date
        )
        
        # Add notes if provided
        if recall.notes:
            result.notes = recall.notes
            db.commit()
            
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/perio", response_model=RecallScheduleResponse)
async def create_perio_recall(
    recall: PerioRecallCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a periodontal maintenance recall for a patient"""
    try:
        # Validate interval
        if recall.interval_months not in [3, 4, 6]:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid interval ({recall.interval_months}). Must be 3, 4, or 6 months."
            )
        
        # Create the perio recall
        result = await patient_recall_service.create_perio_maintenance_recall(
            db=db,
            patient_id=recall.patient_id,
            interval_months=recall.interval_months,
            provider_id=recall.provider_id,
            last_appointment_date=recall.last_appointment_date
        )
        
        # Add notes if provided
        if recall.notes:
            result.notes = recall.notes
            db.commit()
            
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reactivation", response_model=RecallScheduleResponse)
async def create_reactivation_recall(
    recall: ReactivationRecallCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a patient reactivation recall"""
    try:
        # Create the reactivation recall
        result = await patient_recall_service.create_reactivation_recall(
            db=db,
            patient_id=recall.patient_id,
            months_inactive=recall.months_inactive,
            provider_id=recall.provider_id,
            last_appointment_date=recall.last_appointment_date
        )
        
        # Add notes if provided
        if recall.notes:
            result.notes = recall.notes
            db.commit()
            
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/patient/{patient_id}", response_model=List[PatientRecallScheduleResponse])
async def get_patient_recall_schedules(
    patient_id: str = Path(..., description="The ID of the patient"),
    active_only: bool = Query(False, description="Only return active recall schedules"),
    recall_type: Optional[RecallType] = Query(None, description="Filter by recall type"),
    current_user: User = Depends(get_current_active_staff),
    db: Session = Depends(get_db)
):
    """Get all recall schedules for a patient"""
    recalls = await patient_recall_service.get_recall_schedules_by_patient(
        db=db,
        patient_id=patient_id,
        active_only=active_only,
        recall_type=recall_type
    )
    return recalls

@router.get("/my-recalls", response_model=List[PatientRecallScheduleResponse])
async def get_my_recalls(
    active_only: bool = Query(True, description="Only return active recalls"),
    recall_type: Optional[str] = Query(None, description="Filter by recall type"),
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Get all recall schedules for the authenticated patient"""
    try:
        recalls = await patient_recall_service.get_patient_recall_schedules(
            db=db,
            patient_id=current_patient.id,
            active_only=active_only,
            recall_type=recall_type
        )
        return recalls
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{recall_id}", response_model=PatientRecallScheduleWithHistoryResponse)
async def get_recall_schedule(
    recall_id: str = Path(..., description="The ID of the recall schedule"),
    current_user: User = Depends(get_current_active_staff),
    db: Session = Depends(get_db)
):
    """Get a specific recall schedule by ID"""
    recall = await patient_recall_service.get_recall_schedule(db, recall_id)
    if not recall:
        raise HTTPException(status_code=404, detail="Recall schedule not found")
    
    # Get reminder history
    history = await patient_recall_service.get_reminder_history(db, recall_id)
    
    # Combine recall with history
    response = PatientRecallScheduleWithHistoryResponse.from_orm(recall)
    response.reminder_history = [RecallReminderHistoryResponse.from_orm(h) for h in history]
    
    return response

@router.put("/{recall_id}", response_model=PatientRecallScheduleResponse)
async def update_recall_schedule(
    recall_data: PatientRecallScheduleUpdate,
    recall_id: str = Path(..., description="The ID of the recall schedule"),
    current_user: User = Depends(get_current_active_staff),
    db: Session = Depends(get_db)
):
    """Update an existing recall schedule"""
    recall = await patient_recall_service.update_recall_schedule(
        db=db,
        schedule_id=recall_id,
        update_data=recall_data
    )
    
    if not recall:
        raise HTTPException(status_code=404, detail="Recall schedule not found")
        
    return recall

@router.delete("/{recall_id}", response_model=dict)
async def delete_recall_schedule(
    recall_id: str = Path(..., description="The ID of the recall schedule"),
    current_user: User = Depends(get_current_active_staff),
    db: Session = Depends(get_db)
):
    """Delete a recall schedule"""
    success = await patient_recall_service.delete_recall_schedule(db, recall_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Recall schedule not found")
        
    return {"success": True, "message": "Recall schedule deleted"}

@router.post("/batch", response_model=Dict[str, Any])
async def create_batch_recall_schedules(
    batch_data: BatchRecallScheduleCreate,
    current_user: User = Depends(get_current_active_staff),
    db: Session = Depends(get_db)
):
    """Create recall schedules for multiple patients at once"""
    results = await patient_recall_service.create_batch_recall_schedules(
        db=db,
        batch_data=batch_data,
        created_by=current_user.id
    )
    
    return results

@router.get("/due", response_model=List[PatientRecallScheduleResponse])
async def get_due_recalls(
    days_ahead: int = Query(30, description="Number of days ahead to check"),
    recall_type: Optional[RecallType] = Query(None, description="Filter by recall type"),
    provider_id: Optional[str] = Query(None, description="Filter by provider ID"),
    current_user: User = Depends(get_current_active_staff),
    db: Session = Depends(get_db)
):
    """Get recalls that are due within a specified number of days"""
    recalls = await patient_recall_service.get_due_recalls(
        db=db,
        days_ahead=days_ahead,
        recall_type=recall_type,
        provider_id=provider_id
    )
    
    return recalls

@router.get("/statistics", response_model=RecallStatistics)
async def get_recall_statistics(
    current_user: User = Depends(get_current_active_staff),
    db: Session = Depends(get_db)
):
    """Get statistics about recall schedules"""
    stats = await patient_recall_service.get_recall_statistics(db)
    return stats

@router.post("/send-reminders", response_model=Dict[str, Any])
async def process_recall_reminders(
    current_user: User = Depends(get_current_active_staff),
    db: Session = Depends(get_db)
):
    """Manually trigger processing of all due recall reminders"""
    results = await patient_recall_service.process_recall_reminders(db)
    return results

@router.get("/patient/{patient_id}/history", response_model=List[RecallHistoryResponse])
async def get_patient_recall_history(
    patient_id: str = Path(..., description="The ID of the patient"),
    limit: int = Query(50, description="Maximum number of history items to return"),
    skip: int = Query(0, description="Number of items to skip"),
    current_user: User = Depends(get_current_active_staff),
    db: Session = Depends(get_db)
):
    """Get recall history for a patient, including completed, missed and scheduled appointments"""
    try:
        # Get recall history from the service
        history = await patient_recall_service.get_patient_recall_history(
            db=db,
            patient_id=patient_id,
            limit=limit,
            skip=skip
        )
        
        # If no history is found, return an empty list (not an error)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 