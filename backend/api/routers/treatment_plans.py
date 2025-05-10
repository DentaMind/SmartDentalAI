"""
Treatment Plans Router

This module provides API endpoints for creating, viewing, and managing
treatment plans including versioning and audit capabilities.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, Path, Body, Response
from fastapi.responses import JSONResponse, FileResponse
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
import uuid
import logging
from uuid import UUID

from ..database import AsyncSession, get_db
from ..models.treatment_plan import (
    TreatmentPlanCreate,
    TreatmentPlanUpdate,
    TreatmentPlanResponse,
    TreatmentPlanDetailResponse,
    TreatmentProcedureCreate,
    TreatmentProcedureUpdate,
    TreatmentProcedureResponse,
    TreatmentPlanSummary,
    TreatmentPlanHistoryResponse,
    PlanVersionInfo
)
from ..services.treatment_plan_service import TreatmentPlanService
from ..services.pdf_service import PDFService
from ..auth.dependencies import get_current_user, get_current_active_user, verify_admin

router = APIRouter(
    prefix="/treatment-plans",
    tags=["treatment_plans"],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger(__name__)

@router.post("/", response_model=TreatmentPlanResponse, status_code=201)
async def create_treatment_plan(
    plan_data: TreatmentPlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Create a new treatment plan
    
    Creates a new treatment plan for a patient with initial status 'draft'.
    """
    try:
        # Ensure the user is specified as the creator
        if not plan_data.created_by:
            plan_data.created_by = current_user["id"]
            
        plan = await TreatmentPlanService.create_treatment_plan(db, plan_data)
        return plan
    except Exception as e:
        logger.error(f"Error creating treatment plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create treatment plan: {str(e)}")

@router.get("/patient/{patient_id}", response_model=List[TreatmentPlanResponse])
async def get_patient_treatment_plans(
    patient_id: str,
    status: Optional[List[str]] = Query(None, description="Filter by status"),
    include_procedures: bool = Query(False, description="Include procedures in response"),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Get all treatment plans for a patient
    
    Returns all treatment plans for the specified patient,
    with optional filtering by status.
    """
    try:
        plans = await TreatmentPlanService.get_treatment_plans_for_patient(
            db, patient_id, status, include_procedures
        )
        return plans
    except Exception as e:
        logger.error(f"Error retrieving treatment plans: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve treatment plans: {str(e)}")

@router.get("/{plan_id}", response_model=TreatmentPlanDetailResponse)
async def get_treatment_plan(
    plan_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Get a treatment plan by ID
    
    Returns detailed information about a treatment plan including procedures.
    """
    try:
        plan = await TreatmentPlanService.get_treatment_plan(db, plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail=f"Treatment plan {plan_id} not found")
            
        # Get summary
        summary = await TreatmentPlanService.get_treatment_plan_summary(db, plan_id)
        
        # Construct response
        response = TreatmentPlanDetailResponse.from_orm(plan)
        response.summary = summary
        
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving treatment plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve treatment plan: {str(e)}")

@router.put("/{plan_id}", response_model=TreatmentPlanResponse)
async def update_treatment_plan(
    plan_id: UUID,
    update_data: TreatmentPlanUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Update a treatment plan
    
    Updates a treatment plan with new information.
    Each update creates a new version for audit purposes.
    """
    try:
        plan = await TreatmentPlanService.update_treatment_plan(
            db, plan_id, update_data, current_user["id"]
        )
        if not plan:
            raise HTTPException(status_code=404, detail=f"Treatment plan {plan_id} not found")
        return plan
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating treatment plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update treatment plan: {str(e)}")

@router.post("/{plan_id}/approve", response_model=TreatmentPlanResponse)
async def approve_treatment_plan(
    plan_id: UUID,
    notes: str = Body("", embed=True),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Approve a treatment plan
    
    Changes the status of a treatment plan to 'approved'
    and records who approved it and when.
    """
    try:
        plan = await TreatmentPlanService.approve_treatment_plan(
            db, plan_id, current_user["id"], notes
        )
        if not plan:
            raise HTTPException(status_code=404, detail=f"Treatment plan {plan_id} not found")
        return plan
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error approving treatment plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to approve treatment plan: {str(e)}")

@router.post("/{plan_id}/consent", response_model=TreatmentPlanResponse)
async def sign_consent(
    plan_id: UUID,
    signed_by: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Sign consent for a treatment plan
    
    Records that consent has been signed for a treatment plan,
    changing its status to 'in_progress'.
    """
    try:
        plan = await TreatmentPlanService.sign_consent(db, plan_id, signed_by)
        if not plan:
            raise HTTPException(status_code=404, detail=f"Treatment plan {plan_id} not found")
        return plan
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error signing consent: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to sign consent: {str(e)}")

@router.post("/{plan_id}/complete", response_model=TreatmentPlanResponse)
async def complete_treatment_plan(
    plan_id: UUID,
    notes: str = Body("", embed=True),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Mark a treatment plan as completed
    
    Changes the status of a treatment plan to 'completed'
    if all procedures are completed.
    """
    try:
        plan = await TreatmentPlanService.complete_treatment_plan(
            db, plan_id, current_user["id"], notes
        )
        if not plan:
            raise HTTPException(status_code=404, detail=f"Treatment plan {plan_id} not found")
        return plan
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error completing treatment plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to complete treatment plan: {str(e)}")

@router.post("/procedures", response_model=TreatmentProcedureResponse, status_code=201)
async def add_procedure(
    procedure_data: TreatmentProcedureCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Add a procedure to a treatment plan
    
    Adds a new dental procedure to an existing treatment plan.
    """
    try:
        procedure = await TreatmentPlanService.add_procedure(
            db, procedure_data, current_user["id"]
        )
        return procedure
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error adding procedure: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add procedure: {str(e)}")

@router.put("/procedures/{procedure_id}", response_model=TreatmentProcedureResponse)
async def update_procedure(
    procedure_id: UUID,
    update_data: TreatmentProcedureUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Update a treatment procedure
    
    Updates an existing procedure with new information.
    """
    try:
        procedure = await TreatmentPlanService.update_procedure(
            db, procedure_id, update_data, current_user["id"]
        )
        if not procedure:
            raise HTTPException(status_code=404, detail=f"Procedure {procedure_id} not found")
        return procedure
    except Exception as e:
        logger.error(f"Error updating procedure: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update procedure: {str(e)}")

@router.delete("/procedures/{procedure_id}", status_code=204)
async def delete_procedure(
    procedure_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Delete a treatment procedure
    
    Removes a procedure from a treatment plan.
    """
    try:
        success = await TreatmentPlanService.delete_procedure(
            db, procedure_id, current_user["id"]
        )
        if not success:
            raise HTTPException(status_code=404, detail=f"Procedure {procedure_id} not found")
        return Response(status_code=204)
    except Exception as e:
        logger.error(f"Error deleting procedure: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete procedure: {str(e)}")

@router.get("/{plan_id}/summary", response_model=TreatmentPlanSummary)
async def get_plan_summary(
    plan_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Get summary statistics for a treatment plan
    
    Returns statistical information about a treatment plan,
    including procedure counts, financial data, and progress.
    """
    try:
        summary = await TreatmentPlanService.get_treatment_plan_summary(db, plan_id)
        if not summary:
            raise HTTPException(status_code=404, detail=f"Treatment plan {plan_id} not found or has no procedures")
        return summary
    except Exception as e:
        logger.error(f"Error getting plan summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get plan summary: {str(e)}")

@router.get("/{plan_id}/versions", response_model=List[PlanVersionInfo])
async def get_plan_versions(
    plan_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Get all versions of a treatment plan
    
    Returns information about all versions of a treatment plan.
    """
    try:
        versions = await TreatmentPlanService.get_plan_versions(db, plan_id)
        return versions
    except Exception as e:
        logger.error(f"Error getting plan versions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get plan versions: {str(e)}")

@router.get("/{plan_id}/versions/{version}", response_model=Dict[str, Any])
async def get_plan_version(
    plan_id: UUID,
    version: int,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Get a specific version of a treatment plan
    
    Returns the data for a specific version of a treatment plan.
    """
    try:
        version_data = await TreatmentPlanService.get_plan_version_data(db, plan_id, version)
        if not version_data:
            raise HTTPException(status_code=404, detail=f"Version {version} of treatment plan {plan_id} not found")
        return version_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting plan version: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get plan version: {str(e)}")

@router.get("/{plan_id}/history", response_model=List[TreatmentPlanHistoryResponse])
async def get_plan_history(
    plan_id: UUID,
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Get audit history for a treatment plan
    
    Returns the audit history of actions performed on a treatment plan.
    """
    try:
        history = await TreatmentPlanService.get_plan_audit_history(db, plan_id, limit)
        return history
    except Exception as e:
        logger.error(f"Error getting plan history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get plan history: {str(e)}")

@router.get("/{plan_id}/pdf")
async def generate_treatment_plan_pdf(
    plan_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Generate a PDF of a treatment plan
    
    Creates and returns a PDF document of the treatment plan,
    suitable for printing or sharing with patients.
    """
    try:
        # Get the plan with all details
        plan = await TreatmentPlanService.get_treatment_plan(db, plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail=f"Treatment plan {plan_id} not found")
            
        # Get the pdf service
        pdf_service = PDFService()
        
        # Generate PDF
        pdf_path = await pdf_service.generate_treatment_plan_pdf(plan)
        
        # Clean up the PDF after response is sent
        background_tasks.add_task(pdf_service.cleanup_pdf, pdf_path)
        
        return FileResponse(
            path=pdf_path,
            filename=f"treatment_plan_{plan_id}.pdf",
            media_type="application/pdf"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

@router.post("/ai-suggest")
async def suggest_treatment_plan(
    patient_id: str = Body(...),
    diagnosis_id: Optional[str] = Body(None),
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Get AI-suggested treatment plan
    
    Uses AI to analyze patient data and diagnosis to suggest
    an appropriate treatment plan.
    """
    try:
        result = await TreatmentPlanService.ai_suggest_treatment_plan(
            db, patient_id, diagnosis_id, current_user["id"]
        )
        
        if not result:
            return JSONResponse(
                status_code=404,
                content={"detail": "Unable to generate treatment plan suggestion"}
            )
            
        plan, explanations = result
        
        return {
            "plan_id": str(plan.id),
            "title": plan.title,
            "explanations": explanations
        }
    except Exception as e:
        logger.error(f"Error suggesting treatment plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to suggest treatment plan: {str(e)}") 