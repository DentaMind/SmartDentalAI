from fastapi import APIRouter, Depends, HTTPException, WebSocket
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
from ..services.treatment_planner import (
    treatment_planner,
    TreatmentStatus,
    TreatmentPriority,
    TreatmentProcedure,
    TreatmentPlan
)
from ..services.treatment_service import (
    treatment_plan_service,
    TreatmentPlanService,
    TreatmentPlan
)
from ..services.permissions_service import (
    UserRole,
    TreatmentPlanPermission
)
from ..auth.auth import get_current_user, User
from ..services.proposed_edits_service import ProposedEditsService, ProposedEdit, EditStatus
from ..models.treatment import TreatmentPlanCreate, TreatmentPlanUpdate, TreatmentPlanResponse
from ..models.proposed_edits import ProposedEditCreate, ProposedEditResponse, EditReviewRequest

router = APIRouter()
treatment_service = TreatmentPlanService()
proposed_edits_service = ProposedEditsService()

class TreatmentProcedureRequest(BaseModel):
    code: str
    description: str
    tooth_numbers: List[str]
    surfaces: List[str]
    priority: TreatmentPriority
    estimated_duration: int
    estimated_cost: float
    insurance_coverage: Optional[float] = None
    notes: Optional[str] = None

class TreatmentPlanRequest(BaseModel):
    patient_id: str
    procedures: List[TreatmentProcedureRequest]
    notes: Optional[str] = None

class TreatmentPlanUpdateRequest(BaseModel):
    procedures: Optional[List[TreatmentProcedureRequest]] = None
    status: Optional[TreatmentStatus] = None
    notes: Optional[str] = None
    approved_by: Optional[str] = None

class TreatmentPlanCreate(BaseModel):
    patient_id: str
    patient_name: str
    procedures: List[dict]

class TreatmentPlanUpdate(BaseModel):
    procedures: List[dict]

class TreatmentPlanNote(BaseModel):
    note: str

@router.post("/treatment-plans", response_model=TreatmentPlan)
async def create_treatment_plan(
    plan: TreatmentPlanCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new treatment plan"""
    try:
        return treatment_plan_service.create_treatment_plan(
            patient_id=plan.patient_id,
            patient_name=plan.patient_name,
            procedures=plan.procedures,
            user_id=current_user.id,
            user_role=current_user.role
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/treatment-plans/{plan_id}", response_model=TreatmentPlan)
async def update_treatment_plan(
    plan_id: str,
    plan: TreatmentPlanUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update an existing treatment plan"""
    try:
        return treatment_plan_service.update_treatment_plan(
            plan_id=plan_id,
            procedures=plan.procedures,
            user_id=current_user.id,
            user_role=current_user.role
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/treatment-plans/{plan_id}/approve", response_model=TreatmentPlan)
async def approve_treatment_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user)
):
    """Approve a treatment plan"""
    try:
        return treatment_plan_service.approve_treatment_plan(
            plan_id=plan_id,
            user_id=current_user.id,
            user_role=current_user.role
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/treatment-plans/{plan_id}/notes", response_model=TreatmentPlan)
async def add_treatment_plan_note(
    plan_id: str,
    note: TreatmentPlanNote,
    current_user: User = Depends(get_current_user)
):
    """Add a note to a treatment plan"""
    try:
        return treatment_plan_service.add_note(
            plan_id=plan_id,
            note=note.note,
            user_id=current_user.id,
            user_role=current_user.role
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/treatment-plans/{plan_id}/lock", response_model=TreatmentPlan)
async def lock_treatment_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user)
):
    """Lock a treatment plan"""
    try:
        return treatment_plan_service.lock_treatment_plan(
            plan_id=plan_id,
            user_id=current_user.id,
            user_role=current_user.role
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/treatment-plans/{plan_id}", response_model=TreatmentPlan)
async def get_treatment_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific treatment plan"""
    plan = treatment_plan_service.get_treatment_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")
    return plan

@router.get("/treatment-plans/patient/{patient_id}", response_model=List[TreatmentPlan])
async def get_patient_treatment_plans(
    patient_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all treatment plans for a patient"""
    return treatment_plan_service.get_patient_treatment_plans(patient_id)

@router.delete("/treatment-plans/{plan_id}")
async def delete_treatment_plan(plan_id: str):
    success = treatment_planner.delete_treatment_plan(plan_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Treatment plan {plan_id} not found")
    return {"message": f"Treatment plan {plan_id} deleted successfully"}

@router.post("/treatment-plans/{plan_id}/propose-edit", response_model=ProposedEditResponse)
async def propose_edit(
    plan_id: str,
    edit: ProposedEditCreate,
    current_user: dict = Depends(get_current_user)
):
    """Propose changes to a treatment plan."""
    try:
        # Verify plan exists and is not locked
        plan = treatment_service.get_treatment_plan(plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail="Treatment plan not found")
        if plan.is_locked:
            raise HTTPException(status_code=400, detail="Treatment plan is locked")

        # Create proposed edit
        proposed_edit = proposed_edits_service.propose_edit(
            treatment_plan_id=plan_id,
            proposed_by=current_user["id"],
            reason=edit.reason,
            changes=edit.changes
        )

        # Add to plan's proposed edits
        plan.proposed_edits.append(proposed_edit.id)
        treatment_service.update_treatment_plan(
            plan_id=plan_id,
            updates={"proposed_edits": plan.proposed_edits},
            user_id=current_user["id"],
            user_role=UserRole(current_user["role"])
        )

        return ProposedEditResponse(
            id=proposed_edit.id,
            treatment_plan_id=proposed_edit.treatment_plan_id,
            proposed_by=proposed_edit.proposed_by,
            proposed_at=proposed_edit.proposed_at,
            status=proposed_edit.status,
            reason=proposed_edit.reason,
            changes=proposed_edit.changes
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/treatment-plans/{plan_id}/review-edit/{edit_id}", response_model=ProposedEditResponse)
async def review_edit(
    plan_id: str,
    edit_id: str,
    review: EditReviewRequest,
    current_user: dict = Depends(get_current_user)
):
    """Review a proposed edit."""
    try:
        # Verify user has permission to review
        if current_user["role"] not in [UserRole.DOCTOR, UserRole.ADMIN]:
            raise HTTPException(status_code=403, detail="Only doctors can review edits")

        # Review the edit
        edit = proposed_edits_service.review_edit(
            edit_id=edit_id,
            reviewed_by=current_user["id"],
            status=EditStatus(review.status),
            review_notes=review.notes
        )

        # If approved, apply changes to the plan
        if edit.status == EditStatus.APPROVED:
            treatment_service.update_treatment_plan(
                plan_id=plan_id,
                updates=edit.changes,
                user_id=current_user["id"],
                user_role=UserRole(current_user["role"])
            )

        return ProposedEditResponse(
            id=edit.id,
            treatment_plan_id=edit.treatment_plan_id,
            proposed_by=edit.proposed_by,
            proposed_at=edit.proposed_at,
            status=edit.status,
            reason=edit.reason,
            changes=edit.changes,
            reviewed_by=edit.reviewed_by,
            reviewed_at=edit.reviewed_at,
            review_notes=edit.review_notes
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/treatment-plans/{plan_id}/proposed-edits", response_model=List[ProposedEditResponse])
async def get_proposed_edits(
    plan_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all proposed edits for a treatment plan."""
    try:
        edits = proposed_edits_service.get_edits_by_plan(plan_id)
        return [
            ProposedEditResponse(
                id=edit.id,
                treatment_plan_id=edit.treatment_plan_id,
                proposed_by=edit.proposed_by,
                proposed_at=edit.proposed_at,
                status=edit.status,
                reason=edit.reason,
                changes=edit.changes,
                reviewed_by=edit.reviewed_by,
                reviewed_at=edit.reviewed_at,
                review_notes=edit.review_notes
            )
            for edit in edits
        ]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/treatment-plans/{plan_id}/lock-financials")
async def lock_financial_fields(
    plan_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Lock financial fields after claim submission."""
    try:
        # Verify user has permission
        if current_user["role"] not in [UserRole.DOCTOR, UserRole.ADMIN]:
            raise HTTPException(status_code=403, detail="Only doctors can lock financial fields")

        # Lock financial fields
        plan = treatment_service.lock_financial_fields(plan_id)
        return {"message": "Financial fields locked successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.websocket("/ws/treatment-plans/{plan_id}/edits")
async def websocket_endpoint(
    websocket: WebSocket,
    plan_id: str,
    current_user: dict = Depends(get_current_user)
):
    """WebSocket endpoint for real-time edit notifications."""
    await websocket.accept()
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except Exception as e:
        await websocket.close() 