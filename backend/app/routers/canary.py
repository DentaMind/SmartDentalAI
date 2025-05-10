from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional
from datetime import datetime

from app.models.canary import (
    CanaryDeployment,
    StartCanaryRequest,
    CanaryEvaluationResponse,
    CanaryThresholds
)
from app.services.canary_deployment import CanaryDeploymentService
from app.services.auth import get_current_founder
from app.models.user import User
from app.core.config import settings

router = APIRouter(prefix="/canary", tags=["canary"])

@router.post("/start", response_model=CanaryDeployment)
async def start_canary_deployment(
    request: StartCanaryRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_founder)
) -> CanaryDeployment:
    """Start a new canary deployment for a model version."""
    try:
        service = CanaryDeploymentService()
        
        # Use defaults from settings if not specified
        traffic_percentage = request.traffic_percentage or settings.canary_thresholds.default_traffic_percentage
        evaluation_period = request.evaluation_period_hours or settings.canary_thresholds.default_evaluation_hours
        
        result = await service.start_canary(
            model_type=request.model_type,
            model_version=request.model_version,
            traffic_percentage=traffic_percentage,
            evaluation_period_hours=evaluation_period
        )
        
        # Schedule evaluation task
        background_tasks.add_task(
            service.evaluate_canary,
            model_type=request.model_type
        )
        
        return CanaryDeployment(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/active", response_model=List[CanaryDeployment])
async def get_active_canaries(
    current_user: User = Depends(get_current_founder)
) -> List[CanaryDeployment]:
    """Get all currently active canary deployments."""
    try:
        service = CanaryDeploymentService()
        canaries = await service.get_active_canaries()
        return [CanaryDeployment(**c) for c in canaries]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history", response_model=List[CanaryDeployment])
async def get_canary_history(
    model_type: Optional[str] = None,
    days: int = 30,
    current_user: User = Depends(get_current_founder)
) -> List[CanaryDeployment]:
    """Get history of canary deployments."""
    try:
        service = CanaryDeploymentService()
        history = await service.get_canary_history(
            model_type=model_type,
            days=days
        )
        return [CanaryDeployment(**h) for h in history]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/evaluate/{model_type}", response_model=CanaryEvaluationResponse)
async def evaluate_canary(
    model_type: str,
    current_user: User = Depends(get_current_founder)
) -> CanaryEvaluationResponse:
    """Manually trigger evaluation of an active canary deployment."""
    try:
        service = CanaryDeploymentService()
        result = await service.evaluate_canary(model_type)
        return CanaryEvaluationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/thresholds", response_model=CanaryThresholds)
async def get_canary_thresholds(
    current_user: User = Depends(get_current_founder)
) -> CanaryThresholds:
    """Get current canary deployment thresholds."""
    return settings.canary_thresholds

@router.put("/thresholds", response_model=CanaryThresholds)
async def update_canary_thresholds(
    thresholds: CanaryThresholds,
    current_user: User = Depends(get_current_founder)
) -> CanaryThresholds:
    """Update canary deployment thresholds."""
    try:
        settings.canary_thresholds = thresholds
        return thresholds
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 