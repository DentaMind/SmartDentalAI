from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from ..models.health import (
    Immunization,
    ImmunizationType,
    BloodWorkResult,
    BloodWorkType,
    PatientHealthSummary
)
from ..services.health_service import health_service
from ..auth import get_current_user, UserRole

router = APIRouter(prefix="/health", tags=["health"])

@router.get("/summary/{patient_id}", response_model=PatientHealthSummary)
async def get_health_summary(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get health summary for a patient"""
    if current_user["role"] not in [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors, nurses, and admins can view health records"
        )

    summary = health_service.get_patient_health_summary(patient_id)
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No health records found for this patient"
        )
    return summary

@router.post("/immunizations", response_model=Immunization)
async def add_immunization(
    patient_id: str,
    immunization_type: ImmunizationType,
    date_administered: datetime,
    next_due_date: Optional[datetime] = None,
    lot_number: Optional[str] = None,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Add a new immunization record"""
    if current_user["role"] not in [UserRole.DOCTOR, UserRole.NURSE]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and nurses can add immunization records"
        )

    return health_service.add_immunization(
        patient_id=patient_id,
        immunization_type=immunization_type,
        date_administered=date_administered,
        next_due_date=next_due_date,
        lot_number=lot_number,
        administered_by=current_user["id"],
        notes=notes
    )

@router.get("/immunizations/{patient_id}", response_model=List[Immunization])
async def get_immunizations(
    patient_id: str,
    immunization_type: Optional[ImmunizationType] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get immunization history for a patient"""
    if current_user["role"] not in [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors, nurses, and admins can view immunization records"
        )

    return health_service.get_immunization_history(patient_id, immunization_type)

@router.post("/blood-work", response_model=BloodWorkResult)
async def add_blood_work(
    patient_id: str,
    blood_work_type: BloodWorkType,
    date_taken: datetime,
    value: float,
    unit: str,
    reference_range: str,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Add a new blood work result"""
    if current_user["role"] not in [UserRole.DOCTOR, UserRole.NURSE]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and nurses can add blood work results"
        )

    return health_service.add_blood_work(
        patient_id=patient_id,
        blood_work_type=blood_work_type,
        date_taken=date_taken,
        value=value,
        unit=unit,
        reference_range=reference_range,
        uploaded_by=current_user["id"],
        notes=notes
    )

@router.get("/blood-work/{patient_id}", response_model=List[BloodWorkResult])
async def get_blood_work(
    patient_id: str,
    blood_work_type: Optional[BloodWorkType] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get blood work history for a patient"""
    if current_user["role"] not in [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors, nurses, and admins can view blood work results"
        )

    return health_service.get_blood_work_history(patient_id, blood_work_type)

@router.get("/alerts/{patient_id}", response_model=List[str])
async def get_health_alerts(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get health alerts for a patient"""
    if current_user["role"] not in [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors, nurses, and admins can view health alerts"
        )

    return health_service.get_health_alerts(patient_id)

@router.get("/upcoming-immunizations", response_model=dict)
async def get_upcoming_immunizations(
    days_ahead: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Get all immunizations due within the specified number of days"""
    if current_user["role"] not in [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors, nurses, and admins can view upcoming immunizations"
        )

    return health_service.get_upcoming_immunizations(days_ahead) 