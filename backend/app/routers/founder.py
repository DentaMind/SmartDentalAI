from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from app.models.retraining import RetrainingMetrics, RetrainingStatus, RetrainingHistoryEvent
from app.services.retraining import RetrainingService
from app.services.auth import get_current_founder
from app.models.user import User

router = APIRouter()

class RetrainingThresholds(BaseModel):
    diagnosis_accuracy: Optional[float] = None
    treatment_stability: Optional[float] = None
    billing_accuracy: Optional[float] = None
    min_samples: Optional[int] = None

class ManualRetrainingRequest(BaseModel):
    model_type: str
    reason: str
    force: Optional[bool] = False

@router.get("/retraining/status", response_model=RetrainingStatus)
async def get_retraining_status(current_user: User = Depends(get_current_founder)):
    """Get current status of all models and their retraining metrics."""
    try:
        service = RetrainingService()
        status = await service.get_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/retraining/thresholds")
async def update_retraining_thresholds(
    thresholds: RetrainingThresholds,
    current_user: User = Depends(get_current_founder)
):
    """Update retraining thresholds for model performance monitoring."""
    try:
        service = RetrainingService()
        await service.update_thresholds(thresholds.dict(exclude_none=True))
        return {"message": "Thresholds updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/retraining/manual")
async def trigger_manual_retraining(
    request: ManualRetrainingRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_founder)
):
    """Manually trigger retraining for a specific model."""
    try:
        service = RetrainingService()
        # Validate model type
        if request.model_type not in ["diagnosis", "treatment", "billing"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid model type. Must be one of: diagnosis, treatment, billing"
            )
        
        # Add retraining task to background tasks
        background_tasks.add_task(
            service.trigger_retraining,
            model_type=request.model_type,
            reason=request.reason,
            force=request.force,
            triggered_by=current_user.id
        )
        
        return {"message": f"Retraining of {request.model_type} model initiated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/retraining/history", response_model=List[RetrainingHistoryEvent])
async def get_retraining_history(
    days: int = 30,
    model_type: Optional[str] = None,
    current_user: User = Depends(get_current_founder)
):
    """Get retraining history for the specified period and model type."""
    try:
        service = RetrainingService()
        history = await service.get_history(
            days=days,
            model_type=model_type
        )
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 