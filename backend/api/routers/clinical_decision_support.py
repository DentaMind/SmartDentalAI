from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from ..database import get_db
from ..services.clinical_decision_support import ClinicalDecisionSupportService
from ..auth.dependencies import get_current_user, verify_provider_role

router = APIRouter(
    prefix="/api/clinical-support",
    tags=["Clinical Decision Support"],
    responses={404: {"description": "Not found"}}
)

@router.get("/recommendations/{finding_id}")
async def get_treatment_recommendations(
    finding_id: str = Path(..., description="ID of the diagnostic finding"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get treatment recommendations for a diagnostic finding
    
    Args:
        finding_id: ID of the diagnostic finding
        
    Returns:
        Treatment recommendations with references
    """
    # Ensure user is a healthcare provider
    verify_provider_role(current_user)
    
    service = ClinicalDecisionSupportService(db)
    recommendations = await service.get_treatment_recommendations(finding_id)
    
    if "error" in recommendations:
        raise HTTPException(status_code=404, detail=recommendations["error"])
    
    return recommendations

@router.get("/treatment-plan/{patient_id}")
async def get_patient_treatment_plan(
    patient_id: str = Path(..., description="ID of the patient"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Generate a comprehensive treatment plan for a patient based on all findings
    
    Args:
        patient_id: ID of the patient
        
    Returns:
        Comprehensive treatment plan with priorities
    """
    # Ensure user is a healthcare provider
    verify_provider_role(current_user)
    
    service = ClinicalDecisionSupportService(db)
    treatment_plan = await service.get_patient_treatment_plan(patient_id)
    
    return treatment_plan

@router.get("/procedure-guidance/{treatment_name}")
async def get_procedural_guidance(
    treatment_name: str = Path(..., description="Name of the treatment"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get detailed procedural guidance for a treatment
    
    Args:
        treatment_name: Name of the treatment
        
    Returns:
        Detailed procedural guidance
    """
    # Ensure user is a healthcare provider
    verify_provider_role(current_user)
    
    service = ClinicalDecisionSupportService(db)
    guidance = await service.get_procedural_guidance(treatment_name)
    
    return guidance 