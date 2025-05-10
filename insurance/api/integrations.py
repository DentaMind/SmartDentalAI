"""
FastAPI routes for DentaMind integration.
"""

from typing import Dict, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..integrations.dentamind import InsuranceIntegration
from ..database import get_db
from .models import ValidationResponse

router = APIRouter(prefix="/integrations/dentamind")

async def get_integration(db: Session = Depends(get_db)) -> InsuranceIntegration:
    """Get DentaMind integration instance"""
    # TODO: Load config from environment or database
    return InsuranceIntegration(
        dentamind_api_url="http://localhost:3000",
        dentamind_api_key="test_key"
    )

@router.post(
    "/validate-active",
    response_model=ValidationResponse,
    description="Validate coverage for active patient's treatment plan"
)
async def validate_active_patient(
    integration: InsuranceIntegration = Depends(get_integration),
    db: Session = Depends(get_db)
):
    """Validate coverage for active patient"""
    # Get active patient
    patient = await integration.get_active_patient()
    if not patient:
        raise HTTPException(
            status_code=404,
            detail="No active patient found"
        )
        
    # Get treatment plan
    procedures = await integration.get_treatment_plan(patient.id)
    if not procedures:
        raise HTTPException(
            status_code=404,
            detail="No treatment plan found"
        )
        
    # Validate coverage
    validation = await integration.validate_treatment_plan(
        patient.id,
        procedures
    )
    
    # Update treatment plan with coverage info
    await integration.update_treatment_plan_coverage(
        patient.id,
        validation
    )
    
    # Trigger pre-auth if needed
    preauth_needed = [
        proc.cdt_code
        for proc in validation.procedures
        if proc.requires_preauth
    ]
    
    if preauth_needed:
        await integration.trigger_preauth(
            patient.id,
            preauth_needed
        )
        
    return validation

@router.get(
    "/benefits-widget/{patient_id}",
    description="Get data for benefits widget"
)
async def get_benefits_widget(
    patient_id: str,
    integration: InsuranceIntegration = Depends(get_integration),
    db: Session = Depends(get_db)
) -> Dict:
    """Get benefits widget data"""
    return await integration.get_benefits_widget_data(patient_id) 