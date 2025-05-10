from fastapi import APIRouter, HTTPException, Depends, Query, Response
from typing import List, Optional
from datetime import datetime
from ..services.insurance_claims_service import InsuranceClaimsService
from ..models.claims import InsuranceClaim, ClaimAppeal, ClaimStatus
from ..models.treatment_plans import TreatmentPlan
from ..auth.dependencies import get_current_user, check_role
import csv
from io import StringIO

router = APIRouter(prefix="/api/claims", tags=["claims"])

@router.get("/", response_model=List[InsuranceClaim])
async def get_claims(
    status: Optional[ClaimStatus] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    search_text: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all claims with optional filtering"""
    check_role(current_user, ["admin", "financial_manager", "insurance_coordinator"])
    
    try:
        claims = await InsuranceClaimsService.get_claims(
            status=status,
            start_date=start_date,
            end_date=end_date,
            search_text=search_text
        )
        return claims
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{claim_id}", response_model=InsuranceClaim)
async def get_claim(
    claim_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a single claim by ID"""
    check_role(current_user, ["admin", "financial_manager", "insurance_coordinator"])
    
    try:
        claim = await InsuranceClaimsService.get_claim(claim_id)
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        return claim
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=InsuranceClaim)
async def create_claim(
    claim: InsuranceClaim,
    current_user: dict = Depends(get_current_user)
):
    """Create a new claim"""
    check_role(current_user, ["admin", "financial_manager", "insurance_coordinator"])
    
    try:
        new_claim = await InsuranceClaimsService.create_claim(claim)
        return new_claim
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{claim_id}/submit", response_model=InsuranceClaim)
async def submit_claim(
    claim_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Submit a claim for processing"""
    check_role(current_user, ["admin", "financial_manager", "insurance_coordinator"])
    
    try:
        claim = await InsuranceClaimsService.submit_claim(claim_id)
        return claim
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{claim_id}/status", response_model=InsuranceClaim)
async def update_claim_status(
    claim_id: str,
    status: ClaimStatus,
    payment_amount: Optional[float] = None,
    denial_reason: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Update claim status"""
    check_role(current_user, ["admin", "financial_manager"])
    
    try:
        claim = await InsuranceClaimsService.update_claim_status(
            claim_id,
            status,
            payment_amount,
            denial_reason
        )
        return claim
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{claim_id}/appeal", response_model=InsuranceClaim)
async def appeal_claim(
    claim_id: str,
    appeal: ClaimAppeal,
    current_user: dict = Depends(get_current_user)
):
    """Submit an appeal for a denied claim"""
    check_role(current_user, ["admin", "financial_manager", "insurance_coordinator"])
    
    try:
        claim = await InsuranceClaimsService.appeal_claim(claim_id, appeal)
        return claim
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/patient/{patient_id}", response_model=List[InsuranceClaim])
async def get_patient_claims(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all claims for a specific patient"""
    check_role(current_user, ["admin", "financial_manager", "insurance_coordinator"])
    
    try:
        claims = await InsuranceClaimsService.get_patient_claims(patient_id)
        return claims
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/treatment-plan/{treatment_plan_id}", response_model=List[InsuranceClaim])
async def get_treatment_plan_claims(
    treatment_plan_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all claims associated with a treatment plan"""
    check_role(current_user, ["admin", "financial_manager", "insurance_coordinator"])
    
    try:
        claims = await InsuranceClaimsService.get_treatment_plan_claims(treatment_plan_id)
        return claims
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export")
async def export_claims(
    status: Optional[ClaimStatus] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: dict = Depends(get_current_user)
):
    """Export claims to CSV"""
    check_role(current_user, ["admin", "financial_manager"])
    
    try:
        claims = await InsuranceClaimsService.get_claims(
            status=status,
            start_date=start_date,
            end_date=end_date
        )
        
        # Create CSV content
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            "Claim Number", "Patient Name", "Submission Date", "Status",
            "Total Amount", "Payment Date", "Payment Amount", "Denial Reason"
        ])
        
        # Write data
        for claim in claims:
            writer.writerow([
                claim.claim_number,
                claim.patient_name,
                claim.submission_date,
                claim.status,
                claim.total_amount,
                claim.payment_date,
                claim.payment_amount,
                claim.denial_reason
            ])
        
        # Return CSV file
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={
                "Content-Disposition": "attachment; filename=claims_export.csv"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/from-treatment-plan", response_model=InsuranceClaim)
async def create_claim_from_treatment_plan(
    treatment_plan: TreatmentPlan,
    insurance_provider_id: str,
    claim_number: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Create a new claim from a treatment plan"""
    check_role(current_user, ["admin", "financial_manager", "insurance_coordinator"])
    
    try:
        claim = await InsuranceClaimsService.create_claim_from_treatment_plan(
            treatment_plan,
            insurance_provider_id,
            claim_number
        )
        return claim
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 