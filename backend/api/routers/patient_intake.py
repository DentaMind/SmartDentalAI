from fastapi import APIRouter, Depends, HTTPException, status, Body, Path, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

# Use absolute imports to avoid module not found errors
from backend.api.database import get_db
from backend.api.services.patient_intake_service import PatientIntakeService
from backend.api.schemas.patient_intake import (
    PatientIntakeCreate,
    PatientCreate,
    PatientResponse,
    PatientMedicalProfileResponse,
    MedicalHistoryResponse,
    MedicalAlertResponse,
    AllergyResponse,
    MedicationResponse,
    PatientUpdate,
    MedicalHistoryUpdate
)
from backend.api.auth.dependencies import get_current_user

router = APIRouter(
    prefix="/api/patient-intake",
    tags=["Patient Intake"],
    responses={404: {"description": "Not found"}}
)

@router.post("/register", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def register_new_patient(
    intake_data: PatientIntakeCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Register a new patient with optional medical history, allergies, and medications
    """
    try:
        service = PatientIntakeService(db)
        
        # Process patient data into the expected format for the service
        patient_data = intake_data.patient.dict()
        if intake_data.medical_history:
            patient_data["medical_history"] = intake_data.medical_history.dict()
        if intake_data.allergies:
            patient_data["allergies"] = [allergy.dict() for allergy in intake_data.allergies]
        if intake_data.medications:
            patient_data["medications"] = [med.dict() for med in intake_data.medications]
            
        patient = await service.process_new_patient(patient_data)
        return patient
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.get("/patient/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: str = Path(..., description="ID of the patient to retrieve"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get a patient's basic information
    """
    # Get patient from database
    patient = db.query("Patient").filter_by(id=patient_id).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    return patient

@router.get("/patient/{patient_id}/medical-profile", response_model=PatientMedicalProfileResponse)
async def get_patient_medical_profile(
    patient_id: str = Path(..., description="ID of the patient"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get a patient's complete medical profile including history, 
    allergies, medications, and alerts
    """
    try:
        service = PatientIntakeService(db)
        medical_profile = await service.get_patient_medical_profile(patient_id)
        
        # Check if patient exists
        if not medical_profile.get("patient_id"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
            
        return medical_profile
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.put("/patient/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_data: PatientUpdate,
    patient_id: str = Path(..., description="ID of the patient to update"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Update a patient's basic information
    """
    # Get patient from database
    patient = db.query("Patient").filter_by(id=patient_id).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Update patient fields
    patient_update_data = patient_data.dict(exclude_none=True)
    for key, value in patient_update_data.items():
        setattr(patient, key, value)
    
    # Update timestamps
    patient.updated_at = datetime.now()
    
    try:
        db.commit()
        db.refresh(patient)
        return patient
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.put("/patient/{patient_id}/medical-history", response_model=MedicalHistoryResponse)
async def update_medical_history(
    medical_data: MedicalHistoryUpdate,
    patient_id: str = Path(..., description="ID of the patient"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Update a patient's medical history
    """
    try:
        service = PatientIntakeService(db)
        
        # Convert Pydantic model to dict for service
        medical_update_data = medical_data.dict(exclude_none=True)
        
        # Update medical history
        updated_history = await service.update_medical_history(
            patient_id, 
            medical_update_data
        )
        
        return updated_history
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.post("/patient/{patient_id}/allergies", response_model=List[AllergyResponse])
async def add_patient_allergies(
    allergies: List[AllergyResponse],
    patient_id: str = Path(..., description="ID of the patient"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Add allergies to a patient's record
    """
    try:
        service = PatientIntakeService(db)
        
        # Convert Pydantic models to dicts for service
        allergies_data = [allergy.dict() for allergy in allergies]
        
        # Add allergies
        added_allergies = await service.add_patient_allergies(
            patient_id, 
            allergies_data
        )
        
        return added_allergies
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.post("/patient/{patient_id}/medications", response_model=List[MedicationResponse])
async def add_patient_medications(
    medications: List[MedicationResponse],
    patient_id: str = Path(..., description="ID of the patient"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Add medications to a patient's record
    """
    try:
        service = PatientIntakeService(db)
        
        # Convert Pydantic models to dicts for service
        medications_data = [med.dict() for med in medications]
        
        # Add medications
        added_medications = await service.add_patient_medications(
            patient_id, 
            medications_data
        )
        
        return added_medications
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.get("/patient/{patient_id}/alerts", response_model=List[MedicalAlertResponse])
async def get_patient_alerts(
    patient_id: str = Path(..., description="ID of the patient"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get medical alerts for a patient
    """
    try:
        service = PatientIntakeService(db)
        alerts = await service.generate_medical_alerts(patient_id)
        return alerts
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.post("/check-medication-allergies", response_model=Optional[Dict[str, Any]])
async def check_medication_allergies(
    patient_id: str = Query(..., description="ID of the patient"),
    medication_name: str = Query(..., description="Name of the medication to check"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Check if a patient is allergic to a specific medication
    """
    try:
        service = PatientIntakeService(db)
        allergy = await service.check_medication_allergies(patient_id, medication_name)
        return allergy  # Returns None if no allergy found
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        ) 