from fastapi import APIRouter, HTTPException, Depends, WebSocket
from typing import List, Optional
from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime
from ..services.insurance_claims_service import (
    insurance_claims_service,
    ClaimStatus,
    ClaimType,
    InsuranceClaim,
    ClaimProcedure
)
from ..auth.auth import get_current_user
from ..models.user import UserRole

router = APIRouter()

class ClaimProcedureCreate(BaseModel):
    procedure_code: str
    description: str
    tooth_number: Optional[str] = None
    surface: Optional[str] = None
    fee: Decimal
    date_of_service: str
    provider_id: str
    notes: Optional[str] = None

class InsuranceClaimCreate(BaseModel):
    patient_id: str
    treatment_plan_id: str
    insurance_provider_id: str
    procedures: List[ClaimProcedureCreate]
    claim_type: ClaimType = ClaimType.INITIAL
    notes: Optional[str] = None

class ClaimStatusUpdate(BaseModel):
    status: ClaimStatus
    paid_amount: Optional[Decimal] = None
    denial_reason: Optional[str] = None

class ClaimAppeal(BaseModel):
    appeal_reason: str
    supporting_docs: List[str]

class InsuranceClaimResponse(BaseModel):
    id: str
    patient_id: str
    treatment_plan_id: str
    insurance_provider_id: str
    claim_type: ClaimType
    status: ClaimStatus
    procedures: List[ClaimProcedure]
    total_amount: Decimal
    submitted_date: Optional[str]
    received_date: Optional[str]
    processed_date: Optional[str]
    paid_date: Optional[str]
    paid_amount: Optional[Decimal]
    denial_reason: Optional[str]
    appeal_date: Optional[str]
    appeal_status: Optional[str]
    notes: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True

@router.post("/claims", response_model=InsuranceClaimResponse)
async def create_claim(
    claim_data: InsuranceClaimCreate,
    current_user: UserRole = Depends(get_current_user)
):
    """Create a new insurance claim."""
    try:
        claim = insurance_claims_service.create_claim(
            patient_id=claim_data.patient_id,
            treatment_plan_id=claim_data.treatment_plan_id,
            insurance_provider_id=claim_data.insurance_provider_id,
            procedures=[proc.dict() for proc in claim_data.procedures],
            claim_type=claim_data.claim_type,
            notes=claim_data.notes
        )
        return claim
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/claims/{claim_id}/submit", response_model=InsuranceClaimResponse)
async def submit_claim(
    claim_id: str,
    current_user: UserRole = Depends(get_current_user)
):
    """Submit a claim to the insurance provider."""
    try:
        claim = insurance_claims_service.submit_claim(claim_id)
        return claim
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/claims/{claim_id}/status", response_model=InsuranceClaimResponse)
async def update_claim_status(
    claim_id: str,
    status_update: ClaimStatusUpdate,
    current_user: UserRole = Depends(get_current_user)
):
    """Update claim status and related information."""
    try:
        claim = insurance_claims_service.update_claim_status(
            claim_id=claim_id,
            status=status_update.status,
            paid_amount=status_update.paid_amount,
            denial_reason=status_update.denial_reason
        )
        return claim
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/claims/{claim_id}/appeal", response_model=InsuranceClaimResponse)
async def appeal_claim(
    claim_id: str,
    appeal_data: ClaimAppeal,
    current_user: UserRole = Depends(get_current_user)
):
    """Appeal a denied claim."""
    try:
        claim = insurance_claims_service.appeal_claim(
            claim_id=claim_id,
            appeal_reason=appeal_data.appeal_reason,
            supporting_docs=appeal_data.supporting_docs
        )
        return claim
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/claims/{claim_id}", response_model=InsuranceClaimResponse)
async def get_claim(
    claim_id: str,
    current_user: UserRole = Depends(get_current_user)
):
    """Get a claim by ID."""
    claim = insurance_claims_service.get_claim(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim

@router.get("/patients/{patient_id}/claims", response_model=List[InsuranceClaimResponse])
async def get_patient_claims(
    patient_id: str,
    current_user: UserRole = Depends(get_current_user)
):
    """Get all claims for a patient."""
    return insurance_claims_service.get_patient_claims(patient_id)

@router.get("/treatment-plans/{treatment_plan_id}/claims", response_model=List[InsuranceClaimResponse])
async def get_treatment_plan_claims(
    treatment_plan_id: str,
    current_user: UserRole = Depends(get_current_user)
):
    """Get all claims for a treatment plan."""
    return insurance_claims_service.get_treatment_plan_claims(treatment_plan_id)

@router.get("/claims/status/{status}", response_model=List[InsuranceClaimResponse])
async def get_claims_by_status(
    status: ClaimStatus,
    current_user: UserRole = Depends(get_current_user)
):
    """Get all claims with a specific status."""
    return insurance_claims_service.get_claims_by_status(status)

@router.get("/claims", response_model=List[InsuranceClaimResponse])
async def get_claims_by_date_range(
    start_date: str,
    end_date: str,
    current_user: UserRole = Depends(get_current_user)
):
    """Get all claims within a date range."""
    try:
        return insurance_claims_service.get_claims_by_date_range(start_date, end_date)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/ws/claims/{clinic_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    clinic_id: str,
    current_user: UserRole = Depends(get_current_user)
):
    """WebSocket endpoint for real-time claim updates."""
    if current_user.role not in ['admin', 'financial_manager']:
        await websocket.close(code=1008)  # Policy Violation
        return
    
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            # Handle claim status updates
            if data.get('type') == 'status_update':
                claim_id = data.get('claim_id')
                status = data.get('status')
                if claim_id and status:
                    try:
                        claim = insurance_claims_service.update_claim_status(
                            claim_id=claim_id,
                            status=ClaimStatus(status)
                        )
                        await websocket.send_json({
                            'type': 'status_updated',
                            'claim_id': claim_id,
                            'status': claim.status.value
                        })
                    except Exception as e:
                        await websocket.send_json({
                            'type': 'error',
                            'message': str(e)
                        })
    except Exception:
        await websocket.close() 