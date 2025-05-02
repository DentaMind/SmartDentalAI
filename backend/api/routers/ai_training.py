from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from ..database import get_db
from ..services.ai_training_pipeline import AITrainingPipelineService
from ..services.practice_ai_adaptation import PracticeAIAdaptationService
from ..auth.dependencies import get_current_user, verify_admin_role

router = APIRouter(
    prefix="/api/ai-training",
    tags=["AI Training"],
    responses={404: {"description": "Not found"}}
)

# AI Training Pipeline endpoints

@router.get("/jobs")
async def get_training_jobs(
    status: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get AI training jobs with optional filtering
    
    Args:
        status: Optional status filter
        limit: Maximum number of jobs to return
        skip: Number of jobs to skip
        
    Returns:
        List of training jobs
    """
    # Only admins can view training jobs
    verify_admin_role(current_user)
    
    service = AITrainingPipelineService(db)
    jobs = await service.get_training_jobs(status, limit, skip)
    
    return {
        "total": len(jobs),
        "jobs": jobs
    }

@router.post("/jobs")
async def create_training_job(
    model_version: str,
    feedback_ids: Optional[List[str]] = None,
    parameters: Optional[Dict[str, Any]] = None,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Create a new AI training job
    
    Args:
        model_version: Target model version
        feedback_ids: Optional list of specific feedback IDs to use
        parameters: Optional training parameters
        
    Returns:
        Created training job
    """
    # Only admins can create training jobs
    verify_admin_role(current_user)
    
    service = AITrainingPipelineService(db)
    job = await service.create_training_job(
        target_model_version=model_version,
        feedback_ids=feedback_ids,
        parameters=parameters,
        triggered_by=current_user.get("username", "system")
    )
    
    return job

@router.get("/metrics")
async def get_model_metrics(
    model_version: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get AI model metrics
    
    Args:
        model_version: Optional specific model version
        limit: Maximum number of models to return
        
    Returns:
        List of model metrics
    """
    # Only admins can view model metrics
    verify_admin_role(current_user)
    
    service = AITrainingPipelineService(db)
    metrics = await service.get_model_metrics(model_version, limit)
    
    return {
        "total": len(metrics),
        "metrics": metrics
    }

@router.post("/schedule-training")
async def schedule_training(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Schedule a new training job if needed
    
    Returns:
        Created training job or status
    """
    # Only admins can schedule training
    verify_admin_role(current_user)
    
    service = AITrainingPipelineService(db)
    job = await service.start_scheduled_training()
    
    if job:
        return {
            "status": "scheduled",
            "job": job
        }
    else:
        return {
            "status": "not_needed",
            "message": "No training needed at this time"
        }

@router.post("/deploy/{model_version}")
async def deploy_model(
    model_version: str = Path(..., description="The model version to deploy"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Deploy a model version to production
    
    Args:
        model_version: The model version to deploy
        
    Returns:
        Deployment status
    """
    # Only admins can deploy models
    verify_admin_role(current_user)
    
    service = AITrainingPipelineService(db)
    deployment = await service.deploy_model(model_version)
    
    return deployment

# Practice AI Adaptation endpoints

@router.get("/practice/{practice_id}/patterns")
async def get_practice_correction_patterns(
    practice_id: str = Path(..., description="ID of the practice"),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get patterns of corrections for a specific practice
    
    Args:
        practice_id: ID of the practice
        limit: Maximum number of corrections to analyze
        
    Returns:
        Analysis of correction patterns
    """
    # Admin role or practice ownership should be verified here
    # This is a simplified example
    
    service = PracticeAIAdaptationService(db)
    patterns = await service.get_practice_correction_patterns(practice_id, limit)
    
    return patterns

@router.post("/practice/{practice_id}/adaptation")
async def create_practice_adaptation(
    practice_id: str = Path(..., description="ID of the practice"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Create a practice-specific adaptation of the global model
    
    Args:
        practice_id: ID of the practice
        
    Returns:
        Information about the practice adaptation
    """
    # Admin role or practice ownership should be verified here
    # This is a simplified example
    
    service = PracticeAIAdaptationService(db)
    adaptation = await service.create_practice_adaptation(practice_id)
    
    return adaptation

@router.get("/practice/{practice_id}/adaptation")
async def get_practice_adaptation(
    practice_id: str = Path(..., description="ID of the practice"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get the current adaptation for a practice
    
    Args:
        practice_id: ID of the practice
        
    Returns:
        Current practice adaptation
    """
    # Admin role or practice ownership should be verified here
    # This is a simplified example
    
    service = PracticeAIAdaptationService(db)
    adaptation = await service.get_practice_adaptation(practice_id)
    
    if not adaptation:
        raise HTTPException(status_code=404, detail="No adaptation found for this practice")
    
    return adaptation

@router.put("/practice/{practice_id}/adaptation")
async def update_practice_adaptation(
    practice_id: str = Path(..., description="ID of the practice"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Update an existing practice adaptation
    
    Args:
        practice_id: ID of the practice
        
    Returns:
        Updated practice adaptation
    """
    # Admin role or practice ownership should be verified here
    # This is a simplified example
    
    service = PracticeAIAdaptationService(db)
    adaptation = await service.update_practice_adaptation(practice_id)
    
    return adaptation

@router.get("/practice/{practice_id}/impact")
async def get_adaptation_impact(
    practice_id: str = Path(..., description="ID of the practice"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get metrics showing the impact of practice-specific adaptation
    
    Args:
        practice_id: ID of the practice
        
    Returns:
        Metrics comparing global model vs practice-adapted model
    """
    # Admin role or practice ownership should be verified here
    # This is a simplified example
    
    service = PracticeAIAdaptationService(db)
    impact = await service.get_adaptation_impact(practice_id)
    
    return impact

@router.get("/practices/metrics")
async def get_all_practices_metrics(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get adaptation metrics for all practices
    
    Args:
        limit: Maximum number of practices to return
        
    Returns:
        List of practice adaptation metrics
    """
    # Only admins can view all practices metrics
    verify_admin_role(current_user)
    
    service = PracticeAIAdaptationService(db)
    metrics = await service.get_all_practices_metrics(limit)
    
    return {
        "total": len(metrics),
        "practices": metrics
    }

@router.delete("/practice/{practice_id}/adaptation")
async def reset_practice_adaptation(
    practice_id: str = Path(..., description="ID of the practice"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Reset a practice adaptation to use the global model
    
    Args:
        practice_id: ID of the practice
        
    Returns:
        Status of the operation
    """
    # Admin role or practice ownership should be verified here
    # This is a simplified example
    
    service = PracticeAIAdaptationService(db)
    result = await service.reset_practice_adaptation(practice_id)
    
    return result 