from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from ..services.pre_auth_service import pre_auth_service, PreAuthStatus, PreAuthRequest, PreAuthHistoryEntry

router = APIRouter()

class PreAuthRequestCreate(BaseModel):
    treatment_plan_id: str
    procedure_code: str
    insurance_provider: str
    notes: Optional[str] = None

class PreAuthRequestUpdate(BaseModel):
    status: PreAuthStatus
    notes: Optional[str] = None
    reference_number: Optional[str] = None

class PreAuthRequestResponse(BaseModel):
    id: str
    treatment_plan_id: str
    procedure_code: str
    status: PreAuthStatus
    submitted_date: str
    response_date: Optional[str]
    insurance_provider: str
    reference_number: Optional[str]
    notes: Optional[str]
    history: List[dict]

    class Config:
        orm_mode = True

@router.post("/pre-auth", response_model=PreAuthRequestResponse)
async def create_pre_auth_request(request: PreAuthRequestCreate):
    """Create a new pre-authorization request."""
    try:
        pre_auth_request = pre_auth_service.create_request(
            treatment_plan_id=request.treatment_plan_id,
            procedure_code=request.procedure_code,
            insurance_provider=request.insurance_provider,
            notes=request.notes
        )
        return pre_auth_request
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pre-auth/{request_id}", response_model=PreAuthRequestResponse)
async def get_pre_auth_request(request_id: str):
    """Get a specific pre-authorization request by ID."""
    request = pre_auth_service.get_request(request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Pre-authorization request not found")
    return request

@router.get("/pre-auth/treatment-plan/{treatment_plan_id}", response_model=List[PreAuthRequestResponse])
async def get_pre_auth_requests_by_treatment_plan(treatment_plan_id: str):
    """Get all pre-authorization requests for a specific treatment plan."""
    return pre_auth_service.get_requests_by_treatment_plan(treatment_plan_id)

@router.put("/pre-auth/{request_id}", response_model=PreAuthRequestResponse)
async def update_pre_auth_request(request_id: str, update: PreAuthRequestUpdate):
    """Update the status of a pre-authorization request."""
    request = pre_auth_service.update_status(
        request_id=request_id,
        new_status=update.status,
        notes=update.notes
    )
    if not request:
        raise HTTPException(status_code=404, detail="Pre-authorization request not found")
    return request

@router.get("/pre-auth", response_model=List[PreAuthRequestResponse])
async def get_all_pre_auth_requests():
    """Get all pre-authorization requests."""
    return pre_auth_service.get_all_requests()

@router.get("/pre-auth/status/{status}", response_model=List[PreAuthRequestResponse])
async def get_pre_auth_requests_by_status(status: PreAuthStatus):
    """Get all pre-authorization requests with a specific status."""
    return pre_auth_service.get_requests_by_status(status)

@router.get("/pre-auth/provider/{provider}", response_model=List[PreAuthRequestResponse])
async def get_pre_auth_requests_by_provider(provider: str):
    """Get all pre-authorization requests for a specific insurance provider."""
    return pre_auth_service.get_requests_by_insurance_provider(provider) 