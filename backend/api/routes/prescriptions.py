from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from ..models.prescriptions import (
    Prescription,
    PrescriptionCreate,
    PrescriptionUpdate,
    PrescriptionStatus
)
from ..auth import get_current_user, UserRole
from ..config.database import get_db
from ..services.prescription_service import prescription_service

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])

@router.post("/", response_model=Prescription)
async def create_prescription(
    prescription: PrescriptionCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new prescription"""
    if current_user["role"] not in [UserRole.DOCTOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and admins can create prescriptions"
        )
    
    return prescription_service.create_prescription(
        db=db,
        prescription=prescription,
        created_by=current_user["id"]
    )

@router.get("/{prescription_id}", response_model=Prescription)
async def get_prescription(
    prescription_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a prescription by ID"""
    prescription = prescription_service.get_prescription(db, prescription_id)
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found"
        )
    
    # Check access permissions
    if current_user["role"] not in [UserRole.DOCTOR, UserRole.ADMIN] and prescription.patient_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this prescription"
        )
    
    return prescription

@router.get("/patient/{patient_id}", response_model=List[Prescription])
async def get_patient_prescriptions(
    patient_id: str,
    status: Optional[PrescriptionStatus] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all prescriptions for a patient"""
    if current_user["role"] not in [UserRole.DOCTOR, UserRole.ADMIN] and patient_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view these prescriptions"
        )
    
    return prescription_service.get_patient_prescriptions(db, patient_id, status)

@router.put("/{prescription_id}", response_model=Prescription)
async def update_prescription(
    prescription_id: str,
    prescription: PrescriptionUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a prescription"""
    if current_user["role"] not in [UserRole.DOCTOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and admins can update prescriptions"
        )
    
    existing = prescription_service.get_prescription(db, prescription_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found"
        )
    
    return prescription_service.update_prescription(
        db=db,
        prescription_id=prescription_id,
        prescription=prescription,
        updated_by=current_user["id"]
    )

@router.post("/{prescription_id}/fill", response_model=Prescription)
async def fill_prescription(
    prescription_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a prescription as filled"""
    if current_user["role"] not in [UserRole.PHARMACIST, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only pharmacists and admins can fill prescriptions"
        )
    
    return prescription_service.fill_prescription(
        db=db,
        prescription_id=prescription_id,
        filled_by=current_user["id"]
    )

@router.get("/doctor/{doctor_id}", response_model=List[Prescription])
async def get_doctor_prescriptions(
    doctor_id: str,
    status: Optional[PrescriptionStatus] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all prescriptions written by a doctor"""
    if current_user["role"] not in [UserRole.ADMIN] and doctor_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view these prescriptions"
        )
    
    return prescription_service.get_doctor_prescriptions(db, doctor_id, status)

@router.get("/case/{case_id}", response_model=List[Prescription])
async def get_case_prescriptions(
    case_id: str,
    current_user: dict = Depends(get_current_user)
):
    return prescription_service.get_case_prescriptions(case_id)

@router.get("/", response_model=List[Prescription])
async def get_all_prescriptions(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return prescription_service.get_all_prescriptions() 