from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from app.models.canary import (
    StartCanaryRequest,
    CanaryDeployment,
    CanaryEvaluationResponse
)
from app.services.canary_deployment import CanaryDeploymentService
from app.api.deps import get_canary_service

router = APIRouter()

@router.post("/start", response_model=CanaryDeployment)
async def start_canary(
    request: StartCanaryRequest,
    canary_service: CanaryDeploymentService = Depends(get_canary_service)
):
    """Start a new canary deployment."""
    try:
        return await canary_service.start_canary(
            model_type=request.model_type,
            model_version=request.model_version,
            traffic_percentage=request.traffic_percentage,
            evaluation_period_hours=request.evaluation_period_hours
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/active", response_model=List[CanaryDeployment])
async def get_active_canaries(
    canary_service: CanaryDeploymentService = Depends(get_canary_service)
):
    """Get all active canary deployments."""
    try:
        return await canary_service.get_active_canaries()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history", response_model=List[CanaryDeployment])
async def get_canary_history(
    model_type: Optional[str] = None,
    days: int = 30,
    canary_service: CanaryDeploymentService = Depends(get_canary_service)
):
    """Get history of canary deployments."""
    try:
        return await canary_service.get_canary_history(model_type, days)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{model_type}/evaluate", response_model=CanaryEvaluationResponse)
async def evaluate_canary(
    model_type: str,
    canary_service: CanaryDeploymentService = Depends(get_canary_service)
):
    """Evaluate a canary deployment."""
    try:
        return await canary_service.evaluate_canary(model_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 