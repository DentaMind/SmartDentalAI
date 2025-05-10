from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Dict, List, Optional, Any
import uuid
from datetime import datetime

from ..database import get_db
from ..services.insurance_verification_service import get_insurance_verification_service
from ..models.insurance import InsurancePolicyResponse, InsuranceCompanyResponse, BenefitSummaryResponse
from ..auth.dependencies import get_current_user

router = APIRouter(
    prefix="/api/insurance",
    tags=["Insurance Verification"]
)

@router.get("/verify/{patient_id}", response_model=Dict[str, Any])
async def verify_patient_insurance(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Verify patient insurance coverage and return policy details"""
    insurance_service = get_insurance_verification_service(db)
    
    try:
        verification_result = await insurance_service.verify_patient_insurance(patient_id)
        return verification_result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifying insurance: {str(e)}"
        )

@router.get("/coverage/{patient_id}/{cdt_code}", response_model=Dict[str, Any])
async def verify_procedure_coverage(
    patient_id: str,
    cdt_code: str,
    tooth_number: Optional[str] = None,
    surfaces: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Verify coverage for a specific procedure with optional tooth and surface information"""
    insurance_service = get_insurance_verification_service(db)
    
    # Parse surfaces if provided
    surface_list = surfaces.split(",") if surfaces else None
    
    try:
        coverage_result = await insurance_service.verify_procedure_coverage(
            patient_id,
            cdt_code,
            tooth_number,
            surface_list
        )
        return coverage_result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifying procedure coverage: {str(e)}"
        )

@router.get("/treatment-plan/{treatment_plan_id}", response_model=Dict[str, Any])
async def verify_treatment_plan(
    treatment_plan_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Verify insurance coverage for an entire treatment plan"""
    insurance_service = get_insurance_verification_service(db)
    
    try:
        verification_result = await insurance_service.verify_treatment_plan(treatment_plan_id)
        return verification_result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifying treatment plan: {str(e)}"
        )

@router.get("/financial-options/{treatment_plan_id}", response_model=Dict[str, Any])
async def get_financial_options(
    treatment_plan_id: str,
    include_payment_plans: bool = True,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Generate financial options for a treatment plan, including payment plans"""
    insurance_service = get_insurance_verification_service(db)
    
    try:
        options = await insurance_service.generate_financial_options(
            treatment_plan_id,
            include_payment_plans
        )
        return options
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating financial options: {str(e)}"
        ) 