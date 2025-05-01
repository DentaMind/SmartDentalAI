from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from api.models.scheduling import Procedure, ProcedureCategory
from api.services.procedure_service import ProcedureService
from api.dependencies import get_db
from pydantic import BaseModel, Field
import uuid

router = APIRouter(prefix="/procedures", tags=["procedures"])

# Pydantic models for request/response
class ProcedureBase(BaseModel):
    code: str = Field(..., description="ADA procedure code")
    name: str = Field(..., description="Procedure name")
    description: str = Field(..., description="Procedure description")
    category: ProcedureCategory = Field(..., description="Procedure category")
    default_duration_minutes: int = Field(..., description="Default duration in minutes")

class ProcedureCreate(ProcedureBase):
    pass

class ProcedureUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ProcedureCategory] = None
    default_duration_minutes: Optional[int] = None
    is_active: Optional[bool] = None

class ProcedureResponse(ProcedureBase):
    id: uuid.UUID
    is_active: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class ProcedureRequirements(BaseModel):
    pre_operative: List[str]
    post_operative: List[str]
    equipment: List[str]
    staff_requirements: int
    room_requirements: List[str]

class ProcedureStatistics(BaseModel):
    total_procedures: int
    active_procedures: int
    category_counts: Dict[str, int]

@router.get("/", response_model=List[ProcedureResponse])
async def list_procedures(
    query: Optional[str] = None,
    category: Optional[ProcedureCategory] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """List all procedures with optional filtering."""
    service = ProcedureService(db)
    procedures = await service.search_procedures(query, category, active_only)
    return procedures

@router.get("/{procedure_id}", response_model=ProcedureResponse)
async def get_procedure(
    procedure_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Get a specific procedure by ID."""
    service = ProcedureService(db)
    procedure = await service.get_procedure_by_id(str(procedure_id))
    if not procedure:
        raise HTTPException(status_code=404, detail="Procedure not found")
    return procedure

@router.get("/code/{code}", response_model=ProcedureResponse)
async def get_procedure_by_code(
    code: str,
    db: Session = Depends(get_db)
):
    """Get a procedure by its ADA code."""
    service = ProcedureService(db)
    procedure = await service.get_procedure_by_code(code)
    if not procedure:
        raise HTTPException(status_code=404, detail="Procedure not found")
    return procedure

@router.post("/", response_model=ProcedureResponse)
async def create_procedure(
    procedure: ProcedureCreate,
    db: Session = Depends(get_db)
):
    """Create a new procedure."""
    service = ProcedureService(db)
    try:
        new_procedure = await service.create_procedure(
            code=procedure.code,
            name=procedure.name,
            description=procedure.description,
            category=procedure.category,
            default_duration_minutes=procedure.default_duration_minutes
        )
        return new_procedure
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{procedure_id}", response_model=ProcedureResponse)
async def update_procedure(
    procedure_id: uuid.UUID,
    procedure: ProcedureUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing procedure."""
    service = ProcedureService(db)
    updated_procedure = await service.update_procedure(
        str(procedure_id),
        **procedure.model_dump(exclude_unset=True)
    )
    if not updated_procedure:
        raise HTTPException(status_code=404, detail="Procedure not found")
    return updated_procedure

@router.delete("/{procedure_id}")
async def deactivate_procedure(
    procedure_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Deactivate a procedure (soft delete)."""
    service = ProcedureService(db)
    success = await service.deactivate_procedure(str(procedure_id))
    if not success:
        raise HTTPException(status_code=404, detail="Procedure not found")
    return {"message": "Procedure deactivated successfully"}

@router.get("/{procedure_id}/requirements", response_model=ProcedureRequirements)
async def get_procedure_requirements(
    procedure_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Get special requirements for a procedure."""
    service = ProcedureService(db)
    requirements = await service.get_procedure_requirements(str(procedure_id))
    if not requirements:
        raise HTTPException(status_code=404, detail="Procedure not found")
    return requirements

@router.get("/{procedure_id}/duration/{provider_id}")
async def get_provider_duration(
    procedure_id: uuid.UUID,
    provider_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Get expected duration for a provider performing a procedure."""
    service = ProcedureService(db)
    try:
        duration = await service.get_provider_duration(
            str(procedure_id),
            str(provider_id)
        )
        return {"duration_minutes": duration}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{procedure_id}/duration/{provider_id}")
async def update_provider_duration(
    procedure_id: uuid.UUID,
    provider_id: uuid.UUID,
    actual_duration: int = Query(..., gt=0),
    db: Session = Depends(get_db)
):
    """Update a provider's duration tracking for a procedure."""
    service = ProcedureService(db)
    try:
        profile = await service.update_provider_duration(
            str(procedure_id),
            str(provider_id),
            actual_duration
        )
        return {
            "message": "Duration updated successfully",
            "profile": {
                "average_duration_minutes": profile.average_duration_minutes,
                "duration_modifier": profile.duration_modifier,
                "total_procedures": profile.total_procedures
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/statistics", response_model=ProcedureStatistics)
async def get_procedure_statistics(
    db: Session = Depends(get_db)
):
    """Get statistics about procedures."""
    service = ProcedureService(db)
    return await service.get_procedure_statistics() 