from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from sqlalchemy.orm import Session
from typing import Dict, List, Optional, Any
import uuid
from datetime import datetime

from ..database import get_db
from ..services.eprescription_service import get_eprescription_service
from ..models.prescription import PrescriptionStatus
from ..auth.dependencies import get_current_user

router = APIRouter(
    prefix="/api/prescriptions",
    tags=["E-Prescriptions"]
)

@router.post("/create", response_model=Dict[str, Any])
async def create_prescription(
    data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new prescription with optional medication items.
    
    If treatment_plan_id is provided, it will link the prescription to a treatment plan.
    """
    eprescription_service = get_eprescription_service(db)
    
    try:
        prescription = await eprescription_service.create_prescription(
            patient_id=data.get("patient_id"),
            provider_id=current_user.id,
            treatment_plan_id=data.get("treatment_plan_id"),
            items=data.get("items"),
            notes=data.get("notes")
        )
        
        return {
            "status": "success",
            "message": "Prescription created successfully",
            "prescription_id": str(prescription.id)
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating prescription: {str(e)}"
        )

@router.post("/validate/{prescription_id}", response_model=Dict[str, Any])
async def validate_prescription(
    prescription_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Validate a prescription for safety concerns before sending.
    
    Checks for contraindications with patient medical history, current medications,
    age, pregnancy status, and potential drug interactions.
    """
    eprescription_service = get_eprescription_service(db)
    
    try:
        is_safe, warnings = await eprescription_service.validate_prescription_safety(prescription_id)
        
        return {
            "status": "success",
            "is_safe": is_safe,
            "warnings": warnings,
            "critical_warnings": [w for w in warnings if "CRITICAL" in w]
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error validating prescription: {str(e)}"
        )

@router.post("/approve-and-send/{prescription_id}", response_model=Dict[str, Any])
async def approve_and_send_prescription(
    prescription_id: str,
    override_warnings: bool = False,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Approve and send a prescription to the pharmacy.
    
    Performs safety validation before sending. If critical safety concerns are found,
    the prescription will not be sent unless override_warnings is set to true.
    """
    eprescription_service = get_eprescription_service(db)
    
    try:
        result = await eprescription_service.approve_and_send_prescription(
            prescription_id=prescription_id,
            provider_id=current_user.id,
            override_warnings=override_warnings
        )
        
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending prescription: {str(e)}"
        )

@router.get("/patient/{patient_id}", response_model=List[Dict[str, Any]])
async def get_patient_prescriptions(
    patient_id: str,
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get prescriptions for a specific patient.
    
    If active_only is true, only returns prescriptions with status pending, approved, or sent.
    """
    eprescription_service = get_eprescription_service(db)
    
    try:
        prescriptions = await eprescription_service.get_patient_prescriptions(
            patient_id=patient_id,
            active_only=active_only
        )
        
        return prescriptions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving prescriptions: {str(e)}"
        )

@router.post("/update-status/{prescription_id}", response_model=Dict[str, Any])
async def update_prescription_status(
    prescription_id: str,
    status: str = Body(..., embed=True),
    notes: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Update the status of a prescription.
    
    Valid statuses are: pending, approved, sent, filled, cancelled, declined
    """
    # Validate status
    valid_statuses = [s.value for s in PrescriptionStatus]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    eprescription_service = get_eprescription_service(db)
    
    try:
        prescription = await eprescription_service.update_prescription_status(
            prescription_id=prescription_id,
            status=status,
            notes=notes
        )
        
        return {
            "status": "success",
            "message": f"Prescription status updated to {status}",
            "prescription_id": prescription_id
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating prescription status: {str(e)}"
        )

@router.post("/from-treatment-plan/{treatment_plan_id}", response_model=Dict[str, Any])
async def generate_prescriptions_from_treatment_plan(
    treatment_plan_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generate prescriptions based on procedures in a treatment plan.
    
    Automatically determines required medications based on planned procedures
    and patient medical history.
    """
    eprescription_service = get_eprescription_service(db)
    
    try:
        prescriptions = await eprescription_service.generate_prescriptions_from_treatment_plan(
            treatment_plan_id=treatment_plan_id,
            provider_id=current_user.id
        )
        
        return {
            "status": "success",
            "message": f"Generated {len(prescriptions)} prescriptions from treatment plan",
            "prescription_ids": [str(p.id) for p in prescriptions],
            "treatment_plan_id": treatment_plan_id
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating prescriptions: {str(e)}"
        ) 