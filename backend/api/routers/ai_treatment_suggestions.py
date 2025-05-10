"""
AI Treatment Suggestions API

This module provides API endpoints for generating, retrieving, and managing
AI-generated treatment suggestions based on diagnostic findings.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import logging

from ..database import get_db
from ..auth.auth_handler import get_current_user, get_current_clinician
from ..services.ai_treatment_suggestion_service import AITreatmentSuggestionService
from ..models.ai_treatment_suggestion import (
    AITreatmentSuggestionCreate,
    AITreatmentSuggestionResponse,
    AITreatmentSuggestionUpdate,
    TreatmentSuggestionGroupCreate,
    TreatmentSuggestionGroupResponse,
    TreatmentSuggestionGroupWithDetails,
    SuggestionStatus
)
from ..models.user import User

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/ai/treatment-suggestions",
    tags=["ai-treatment-suggestions"],
    responses={404: {"description": "Not found"}}
)

# Endpoints

@router.post("/from-diagnosis/{diagnosis_id}", response_model=Dict[str, Any])
async def generate_suggestions_from_diagnosis(
    diagnosis_id: str = Path(..., description="Diagnosis ID to generate suggestions from"),
    generate_groups: bool = Query(True, description="Whether to group suggestions by condition"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_clinician)
):
    """
    Generate treatment suggestions from a diagnosis
    
    This endpoint generates AI treatment suggestions based on findings in
    a specific diagnosis. Suggestions can be grouped by condition category.
    """
    try:
        service = AITreatmentSuggestionService(db)
        
        # Generate suggestions
        result = await service.generate_suggestions_from_diagnosis(
            diagnosis_id=diagnosis_id,
            generate_groups=generate_groups
        )
        
        # Check for errors
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        
        # Return the suggestions and groups
        return {
            "message": f"Generated {len(result['suggestions'])} suggestions in {len(result['groups'])} groups",
            "suggestions": [
                AITreatmentSuggestionResponse.from_orm(suggestion).dict()
                for suggestion in result["suggestions"]
            ],
            "groups": [
                TreatmentSuggestionGroupResponse.from_orm(group).dict()
                for group in result["groups"]
            ]
        }
    except Exception as e:
        logger.error(f"Error generating suggestions from diagnosis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/patients/{patient_id}", response_model=List[AITreatmentSuggestionResponse])
async def get_suggestions_by_patient(
    patient_id: str = Path(..., description="Patient ID"),
    status: Optional[SuggestionStatus] = Query(None, description="Filter by suggestion status"),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum confidence score"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_clinician)
):
    """
    Get AI treatment suggestions for a patient
    
    This endpoint retrieves AI-generated treatment suggestions for a specific
    patient, with optional filtering by status and confidence level.
    """
    try:
        repository = AITreatmentSuggestionRepository(db)
        
        # Get suggestions
        suggestions = repository.get_suggestions_by_patient(
            patient_id=patient_id,
            status=status,
            min_confidence=min_confidence,
            limit=limit,
            offset=offset
        )
        
        # Convert to response models
        return [AITreatmentSuggestionResponse.from_orm(suggestion) for suggestion in suggestions]
    except Exception as e:
        logger.error(f"Error retrieving suggestions for patient: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/groups/patients/{patient_id}", response_model=List[TreatmentSuggestionGroupResponse])
async def get_suggestion_groups_by_patient(
    patient_id: str = Path(..., description="Patient ID"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_clinician)
):
    """
    Get treatment suggestion groups for a patient
    
    This endpoint retrieves groups of AI-generated treatment suggestions for
    a specific patient.
    """
    try:
        repository = AITreatmentSuggestionRepository(db)
        
        # Get groups
        groups = repository.get_suggestion_groups_by_patient(
            patient_id=patient_id,
            limit=limit,
            offset=offset
        )
        
        # Convert to response models
        return [TreatmentSuggestionGroupResponse.from_orm(group) for group in groups]
    except Exception as e:
        logger.error(f"Error retrieving suggestion groups for patient: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/suggestions/{suggestion_id}", response_model=AITreatmentSuggestionResponse)
async def get_suggestion_by_id(
    suggestion_id: str = Path(..., description="Suggestion ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_clinician)
):
    """
    Get a specific AI treatment suggestion by ID
    
    This endpoint retrieves details of a specific AI-generated treatment
    suggestion.
    """
    try:
        repository = AITreatmentSuggestionRepository(db)
        
        # Get suggestion
        suggestion = repository.get_suggestion_by_id(suggestion_id)
        
        # Check if it exists
        if not suggestion:
            raise HTTPException(status_code=404, detail="Suggestion not found")
        
        # Convert to response model
        return AITreatmentSuggestionResponse.from_orm(suggestion)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving suggestion: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/groups/{group_id}", response_model=TreatmentSuggestionGroupWithDetails)
async def get_suggestion_group_by_id(
    group_id: str = Path(..., description="Group ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_clinician)
):
    """
    Get a treatment suggestion group with detailed suggestions
    
    This endpoint retrieves a treatment suggestion group and its constituent
    suggestions.
    """
    try:
        repository = AITreatmentSuggestionRepository(db)
        
        # Get group
        group = repository.get_suggestion_group_by_id(group_id)
        
        # Check if it exists
        if not group:
            raise HTTPException(status_code=404, detail="Suggestion group not found")
        
        # Get detailed suggestions
        suggestions = []
        for suggestion_id in group.suggestions or []:
            suggestion = repository.get_suggestion_by_id(suggestion_id)
            if suggestion:
                suggestions.append(suggestion)
        
        # Create response with details
        group_response = TreatmentSuggestionGroupResponse.from_orm(group)
        return TreatmentSuggestionGroupWithDetails(
            **group_response.dict(),
            suggestions_details=[
                AITreatmentSuggestionResponse.from_orm(suggestion)
                for suggestion in suggestions
            ]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving suggestion group: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/suggestions/{suggestion_id}", response_model=AITreatmentSuggestionResponse)
async def update_suggestion(
    suggestion_id: str = Path(..., description="Suggestion ID"),
    update_data: AITreatmentSuggestionUpdate = Body(..., description="Update data"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_clinician)
):
    """
    Update an AI treatment suggestion
    
    This endpoint updates the status, notes, or other details of a
    treatment suggestion.
    """
    try:
        service = AITreatmentSuggestionService(db)
        
        # Update suggestion
        updated_suggestion = await service.update_suggestion_status(
            suggestion_id=suggestion_id,
            status=update_data.status,
            clinician_id=str(current_user.id),
            notes=update_data.clinician_notes,
            modified_procedure=update_data.modified_procedure,
            rejection_reason=update_data.rejection_reason,
            clinical_override_reason=update_data.clinical_override_reason
        )
        
        # Check if it exists
        if not updated_suggestion:
            raise HTTPException(status_code=404, detail="Suggestion not found")
        
        # Convert to response model
        return AITreatmentSuggestionResponse.from_orm(updated_suggestion)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating suggestion: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/groups/{group_id}/to-treatment-plan", response_model=Dict[str, Any])
async def convert_group_to_treatment_plan(
    group_id: str = Path(..., description="Group ID"),
    title: Optional[str] = Query(None, description="Title for the treatment plan"),
    description: Optional[str] = Query(None, description="Description for the treatment plan"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_clinician)
):
    """
    Convert a suggestion group to a treatment plan
    
    This endpoint converts an AI suggestion group to a formal treatment plan
    that can be presented to the patient.
    """
    try:
        service = AITreatmentSuggestionService(db)
        
        # Convert to treatment plan
        result = await service.convert_to_treatment_plan(
            suggestion_group_id=group_id,
            title=title,
            description=description
        )
        
        # Check for errors
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        
        # Return success
        return {
            "message": "Successfully converted to treatment plan",
            "treatment_plan_id": str(result["treatment_plan"].id),
            "suggestion_group_id": result["suggestion_group_id"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error converting to treatment plan: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics", response_model=Dict[str, Any])
async def get_suggestion_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_clinician)
):
    """
    Get metrics on AI treatment suggestions
    
    This endpoint provides metrics on the usage and effectiveness of
    AI-generated treatment suggestions.
    """
    try:
        service = AITreatmentSuggestionService(db)
        
        # Get metrics
        metrics = await service.get_metrics()
        
        return metrics
    except Exception as e:
        logger.error(f"Error retrieving suggestion metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Import for repository
from ..repositories.ai_treatment_suggestion_repository import AITreatmentSuggestionRepository 