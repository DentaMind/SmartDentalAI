from fastapi import APIRouter, Depends, HTTPException, Body, Query, Path
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

# Import models and schemas (to be created)
from ..models.prescription import Prescription, PrescriptionItem
from ..schemas.prescription import (
    PrescriptionCreate, 
    PrescriptionResponse, 
    PrescriptionItemCreate,
    PrescriptionApprove,
    ValidationWarning
)
from ..dependencies.auth import get_current_user
from ..services.prescription_validator import PrescriptionValidator

router = APIRouter(
    prefix="/prescriptions",
    tags=["prescriptions"],
)

@router.post("/", response_model=PrescriptionResponse)
async def create_prescription(
    prescription: PrescriptionCreate,
    current_user = Depends(get_current_user)
):
    """
    Create a new prescription
    """
    # Ensure provider is set (use current user if not specified)
    if not prescription.provider_id:
        prescription.provider_id = current_user.id
    
    # Generate new ID for prescription
    prescription_id = str(uuid.uuid4())
    
    # Logic to save prescription to database would go here
    
    # For demo purposes, return a mock response
    return {
        "id": prescription_id,
        "patient_id": prescription.patient_id,
        "provider_id": prescription.provider_id,
        "patient_name": "Patient Name",  # This would come from database lookup
        "provider_name": "Provider Name",  # This would come from database lookup
        "prescription_date": prescription.prescription_date,
        "status": "pending",
        "items": prescription.items,
        "treatment_plan_id": prescription.treatment_plan_id,
        "treatment_plan_name": None,  # This would come from database lookup
        "created_at": datetime.now().isoformat(),
        "notes": prescription.notes
    }

@router.get("/{prescription_id}", response_model=PrescriptionResponse)
async def get_prescription(
    prescription_id: str = Path(..., description="The ID of the prescription to get"),
    current_user = Depends(get_current_user)
):
    """
    Get a prescription by ID
    """
    # Logic to retrieve prescription from database would go here
    
    # For demo purposes, return a mock response
    return {
        "id": prescription_id,
        "patient_id": "patient-123",
        "provider_id": "provider-456",
        "patient_name": "John Smith",
        "provider_name": "Dr. Jane Doe",
        "prescription_date": "2023-06-15",
        "status": "pending",
        "items": [
            {
                "id": "item-1",
                "medication_name": "Amoxicillin",
                "dosage": "500mg",
                "form": "Tablet",
                "route": "Oral",
                "frequency": "Every 8 hours",
                "quantity": 21,
                "days_supply": 7,
                "refills": 0,
                "dispense_as_written": False,
                "notes": "Take with food"
            }
        ],
        "treatment_plan_id": "treatment-789",
        "treatment_plan_name": "Dental Caries Treatment",
        "created_at": "2023-06-15T10:00:00",
        "notes": "For dental infection following extraction"
    }

@router.get("/", response_model=List[PrescriptionResponse])
async def list_prescriptions(
    patient_id: Optional[str] = Query(None, description="Filter prescriptions by patient ID"),
    status: Optional[str] = Query(None, description="Filter prescriptions by status"),
    current_user = Depends(get_current_user)
):
    """
    List prescriptions, optionally filtered by patient ID and/or status
    """
    # Logic to retrieve prescriptions from database would go here
    
    # For demo purposes, return a mock response
    prescriptions = [
        {
            "id": "rx-123",
            "patient_id": "patient-123",
            "provider_id": "provider-456",
            "patient_name": "John Smith",
            "provider_name": "Dr. Jane Doe",
            "prescription_date": "2023-06-15",
            "status": "pending",
            "items": [
                {
                    "id": "item-1",
                    "medication_name": "Amoxicillin",
                    "dosage": "500mg",
                    "form": "Tablet",
                    "route": "Oral",
                    "frequency": "Every 8 hours",
                    "quantity": 21,
                    "days_supply": 7,
                    "refills": 0,
                    "dispense_as_written": False,
                    "notes": "Take with food"
                }
            ],
            "treatment_plan_id": "treatment-789",
            "treatment_plan_name": "Dental Caries Treatment",
            "created_at": "2023-06-15T10:00:00",
            "notes": "For dental infection following extraction",
            "has_warnings": True
        }
    ]
    
    # Apply filters
    if patient_id:
        prescriptions = [p for p in prescriptions if p["patient_id"] == patient_id]
    if status:
        prescriptions = [p for p in prescriptions if p["status"] == status]
    
    return prescriptions

@router.post("/{prescription_id}/validate", response_model=dict)
async def validate_prescription(
    prescription_id: str = Path(..., description="The ID of the prescription to validate"),
    current_user = Depends(get_current_user)
):
    """
    Validate a prescription for safety issues
    """
    # Retrieve prescription from database
    # This would be a database lookup in a real implementation
    
    # For demo purposes, generate some warnings
    validator = PrescriptionValidator()
    
    # Mock validation result
    warnings = [
        {
            "message": "Patient has a documented allergy to penicillin. Amoxicillin may cause an allergic reaction.",
            "critical": True
        },
        {
            "message": "Patient is currently taking Warfarin. Monitor for increased bleeding risk.",
            "critical": False
        }
    ]
    
    return {"warnings": warnings}

@router.post("/{prescription_id}/approve")
async def approve_prescription(
    data: PrescriptionApprove,
    prescription_id: str = Path(..., description="The ID of the prescription to approve"),
    current_user = Depends(get_current_user)
):
    """
    Approve a prescription and optionally send it to the pharmacy
    """
    # Validate prescription first
    validator = PrescriptionValidator()
    
    # Mock validation result for demo
    warnings = [
        {
            "message": "Patient has a documented allergy to penicillin. Amoxicillin may cause an allergic reaction.",
            "critical": True
        }
    ]
    
    # If there are critical warnings and override is not set, reject the approval
    if any(w["critical"] for w in warnings) and not data.override_warnings:
        raise HTTPException(
            status_code=400, 
            detail="Prescription has critical warnings that must be overridden to approve"
        )
    
    # Update prescription status in database
    # This would be a database update in a real implementation
    
    return {"status": "success", "message": "Prescription approved successfully"}

@router.post("/{prescription_id}/cancel")
async def cancel_prescription(
    prescription_id: str = Path(..., description="The ID of the prescription to cancel"),
    current_user = Depends(get_current_user)
):
    """
    Cancel a prescription
    """
    # Update prescription status in database
    # This would be a database update in a real implementation
    
    return {"status": "success", "message": "Prescription cancelled successfully"}

@router.delete("/{prescription_id}")
async def delete_prescription(
    prescription_id: str = Path(..., description="The ID of the prescription to delete"),
    current_user = Depends(get_current_user)
):
    """
    Delete a prescription
    """
    # Delete prescription from database
    # This would be a database delete in a real implementation
    
    return {"status": "success", "message": "Prescription deleted successfully"} 