"""
FastAPI routes for insurance validation and benefits tracking.
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from .models import (
    ValidationRequest,
    ValidationResponse,
    ProcedureValidationResult,
    BenefitsSnapshot,
    ProcedureHistory
)
from ..coverage_validator import (
    CoverageValidator,
    BenefitsUsed
)
from ..payer_config import (
    InsurancePlan,
    create_default_plan
)
from ..cdt_codes import get_cdt_code
from database import get_db

router = APIRouter(prefix="/insurance")

async def get_patient_insurance(
    patient_id: str,
    db: Session
) -> Optional[InsurancePlan]:
    """Get patient's insurance plan"""
    # TODO: Replace with actual DB lookup
    return create_default_plan(
        payer_id="TEST01",
        plan_name="Test PPO Plan",
        group_number="12345"
    )

async def get_patient_benefits(
    patient_id: str,
    insurance_id: str,
    db: Session
) -> BenefitsUsed:
    """Get patient's current benefits usage"""
    # TODO: Replace with actual DB lookup
    return BenefitsUsed()

async def get_procedure_history(
    patient_id: str,
    db: Session
) -> List[ProcedureHistory]:
    """Get patient's procedure history"""
    # TODO: Replace with actual DB lookup
    return []

@router.post("/validate", response_model=ValidationResponse)
async def validate_coverage(
    request: ValidationRequest,
    db: Session = Depends(get_db)
):
    """
    Validate insurance coverage for procedures
    
    Args:
        request: Validation request with procedures to check
        db: Database session
        
    Returns:
        Validation response with coverage details
    """
    # Get patient's insurance plan
    plan = await get_patient_insurance(request.patient_id, db)
    if not plan:
        raise HTTPException(
            status_code=404,
            detail="Patient insurance plan not found"
        )
        
    # Get benefits usage and history
    benefits = await get_patient_benefits(
        request.patient_id,
        plan.payer_id,
        db
    )
    history = await get_procedure_history(request.patient_id, db)
    
    # Create validator
    validator = CoverageValidator(
        plan=plan,
        benefits_used=benefits,
        procedure_history=history,
        effective_date=plan.effective_date
    )
    
    # Validate each procedure
    results = []
    total_insurance = 0.0
    total_patient = 0.0
    warnings = []
    
    for proc in request.procedures:
        # Get CDT code details
        cdt = get_cdt_code(proc.cdt_code)
        if not cdt:
            warnings.append(f"Invalid CDT code: {proc.cdt_code}")
            continue
            
        # Use default fee if not provided
        cost = proc.procedure_cost or cdt.base_fee
        
        # Validate coverage
        validation = validator.validate_coverage(
            cdt_code=proc.cdt_code,
            procedure_cost=cost,
            tooth_number=proc.tooth_number,
            surfaces=proc.surfaces,
            quadrant=proc.quadrant,
            service_date=request.service_date
        )
        
        # Calculate next eligible date if frequency exceeded
        next_eligible = None
        if validation.frequency_exceeded and validation.warnings:
            # Parse frequency message
            # Example: "Frequency limit exceeded: 2 per 1 years"
            for warning in validation.warnings:
                if "Frequency limit exceeded" in warning:
                    # TODO: Implement proper date calculation
                    next_eligible = datetime.now()
                    break
                    
        # Check for alternate benefits
        alternate = None
        if validation.alternate_benefit_code:
            alt_cdt = get_cdt_code(validation.alternate_benefit_code)
            if alt_cdt:
                alternate = {
                    "code": alt_cdt.code,
                    "description": alt_cdt.description
                }
                
        # Create result
        result = ProcedureValidationResult(
            cdt_code=proc.cdt_code,
            description=cdt.description,
            is_covered=validation.is_covered,
            coverage_percent=validation.coverage_percent * 100,
            estimated_insurance=validation.insurance_portion,
            estimated_patient=validation.patient_portion,
            requires_preauth=validation.requires_preauth,
            deductible_applies=validation.deductible_applies,
            warnings=validation.warnings,
            requirements_missing=validation.requirements_missing,
            next_eligible_date=next_eligible,
            alternate_benefit=alternate
        )
        
        results.append(result)
        total_insurance += validation.insurance_portion
        total_patient += validation.patient_portion
        
    # Get remaining benefits
    remaining = {
        "annual": plan.annual_maximum - benefits.basic_used - benefits.major_used,
        "preventive": (
            plan.preventive_maximum - benefits.preventive_used
            if plan.preventive_maximum
            else None
        ),
        "ortho": (
            plan.orthodontic_lifetime_maximum - benefits.ortho_used
            if plan.orthodontic_lifetime_maximum
            else None
        )
    }
    
    return ValidationResponse(
        patient_id=request.patient_id,
        insurance_id=plan.payer_id,
        service_date=request.service_date or datetime.now(),
        procedures=results,
        total_insurance_portion=total_insurance,
        total_patient_portion=total_patient,
        remaining_benefits=remaining,
        warnings=warnings
    )

@router.get("/benefits/{patient_id}", response_model=BenefitsSnapshot)
async def get_benefits_snapshot(
    patient_id: str,
    db: Session = Depends(get_db)
):
    """Get current benefits snapshot for a patient"""
    # Get patient's insurance plan
    plan = await get_patient_insurance(patient_id, db)
    if not plan:
        raise HTTPException(
            status_code=404,
            detail="Patient insurance plan not found"
        )
        
    # Get benefits usage
    benefits = await get_patient_benefits(patient_id, plan.payer_id, db)
    
    return BenefitsSnapshot(
        patient_id=patient_id,
        insurance_id=plan.payer_id,
        benefit_year=datetime.now().year,
        annual_maximum=plan.annual_maximum,
        remaining_annual=(
            plan.annual_maximum
            - benefits.basic_used
            - benefits.major_used
        ),
        preventive_used=benefits.preventive_used,
        basic_used=benefits.basic_used,
        major_used=benefits.major_used,
        ortho_lifetime_maximum=plan.orthodontic_lifetime_maximum,
        ortho_remaining=(
            plan.orthodontic_lifetime_maximum - benefits.ortho_used
            if plan.orthodontic_lifetime_maximum
            else None
        ),
        deductible_met=50.0,  # TODO: Calculate from history
        last_update=datetime.now()
    )

@router.get(
    "/history/{patient_id}",
    response_model=List[ProcedureHistory]
)
async def get_patient_procedure_history(
    patient_id: str,
    db: Session = Depends(get_db)
):
    """Get procedure history for a patient"""
    history = await get_procedure_history(patient_id, db)
    return history 