from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from services.treatment_plan_service import TreatmentPlanService
from models.treatment_plan import TreatmentStatus
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/treatment-plan", tags=["treatment-plan"])

class ConsentSignRequest(BaseModel):
    """Request model for signing consent."""
    signed_by: str
    signature_data: str  # Base64 encoded signature image

class ConsentResponse(BaseModel):
    """Response model for consent data."""
    signed_by: str
    signed_at: datetime
    signature_data: str
    ip_address: str
    status: str

@router.post("/{plan_id}/sign-consent", response_model=ConsentResponse)
def sign_consent(
    plan_id: int,
    consent_data: ConsentSignRequest,
    request: Request,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ConsentResponse:
    """
    Sign consent for a treatment plan.
    
    Args:
        plan_id: ID of the treatment plan
        consent_data: Consent signing data
        request: FastAPI request object for IP address
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        Updated consent data
    """
    service = TreatmentPlanService(db)
    
    # Get client's IP address
    ip_address = request.client.host
    
    # Sign the consent
    plan = service.sign_consent(
        plan_id=plan_id,
        signed_by=consent_data.signed_by,
        signature_data=consent_data.signature_data,
        ip_address=ip_address,
        user_id=current_user.id
    )
    
    # Return consent data
    return ConsentResponse(
        signed_by=plan.consent_signed_by,
        signed_at=plan.consent_signed_at,
        signature_data=plan.consent_signature_data,
        ip_address=plan.consent_ip_address,
        status=plan.status.value
    )

@router.get("/{plan_id}/consent", response_model=ConsentResponse)
def get_consent(
    plan_id: int,
    db: Session = Depends(get_db)
) -> ConsentResponse:
    """
    Get consent data for a treatment plan.
    
    Args:
        plan_id: ID of the treatment plan
        db: Database session
        
    Returns:
        Consent data
    """
    service = TreatmentPlanService(db)
    consent_data = service.get_consent_data(plan_id)
    return ConsentResponse(**consent_data) 