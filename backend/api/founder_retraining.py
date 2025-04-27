from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

from database import get_db
from models.learning_insights import AlertType
from services.model_retraining_service import ModelRetrainingService
from services.notification_service import NotificationService
from auth.founder import get_founder_user
from config import Settings, get_settings

router = APIRouter(prefix="/founder/retraining", tags=["founder"])

class RetrainingThresholdUpdate(BaseModel):
    diagnosis_accuracy: Optional[float] = None
    treatment_stability: Optional[float] = None
    billing_accuracy: Optional[float] = None
    min_samples: Optional[int] = None

class ManualRetrainingRequest(BaseModel):
    model_type: str
    reason: str
    force: bool = False  # Bypass normal checks

@router.get("/status")
async def get_retraining_status(
    db: Session = Depends(get_db),
    _: dict = Depends(get_founder_user)
) -> Dict[str, Any]:
    """Get current status of model retraining system."""
    service = ModelRetrainingService(
        db=db,
        notification_service=NotificationService(get_settings()),
        settings=get_settings()
    )
    
    # Get retraining history
    history = await service.get_retraining_history(days=30)
    
    # Calculate metrics for each model type
    metrics = {}
    for model_type in ['diagnosis', 'treatment', 'billing']:
        type_history = [h for h in history if h['model_type'] == model_type]
        if type_history:
            latest = type_history[0]
            metrics[model_type] = {
                'last_retrained': latest['completed_at'],
                'status': latest['status'],
                'performance': latest.get('performance_metrics', {}),
                'retraining_count_30d': len(type_history)
            }
    
    return {
        'metrics': metrics,
        'history': history
    }

@router.put("/thresholds")
async def update_retraining_thresholds(
    thresholds: RetrainingThresholdUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_founder_user)
) -> Dict[str, Any]:
    """Update model retraining thresholds."""
    settings = get_settings()
    
    if thresholds.diagnosis_accuracy is not None:
        settings.retraining_thresholds.diagnosis_accuracy = thresholds.diagnosis_accuracy
    if thresholds.treatment_stability is not None:
        settings.retraining_thresholds.treatment_stability = thresholds.treatment_stability
    if thresholds.billing_accuracy is not None:
        settings.retraining_thresholds.billing_accuracy = thresholds.billing_accuracy
    if thresholds.min_samples is not None:
        settings.retraining_thresholds.min_samples = thresholds.min_samples
    
    return {
        "message": "Retraining thresholds updated successfully",
        "thresholds": settings.retraining_thresholds.dict()
    }

@router.post("/trigger/{alert_type}")
async def trigger_retraining(
    alert_type: AlertType,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: dict = Depends(get_founder_user)
) -> Dict[str, Any]:
    """Trigger model retraining for a specific alert type."""
    service = ModelRetrainingService(
        db=db,
        notification_service=NotificationService(get_settings()),
        settings=get_settings()
    )
    
    # Start retraining in background
    background_tasks.add_task(service.trigger_retraining, alert_type)
    
    return {
        "message": f"Retraining triggered for {alert_type}",
        "status": "pending"
    }

@router.post("/manual")
async def manual_retraining(
    request: ManualRetrainingRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _: dict = Depends(get_founder_user)
) -> Dict[str, Any]:
    """Manually trigger model retraining with custom parameters."""
    service = ModelRetrainingService(
        db=db,
        notification_service=NotificationService(get_settings()),
        settings=get_settings()
    )
    
    # Map model type to alert type
    model_to_alert = {
        'diagnosis': AlertType.DIAGNOSIS_ACCURACY,
        'treatment': AlertType.TREATMENT_STABILITY,
        'billing': AlertType.BILLING_ACCURACY
    }
    
    alert_type = model_to_alert.get(request.model_type)
    if not alert_type:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model type. Must be one of: {', '.join(model_to_alert.keys())}"
        )
    
    # If force=True, bypass normal checks
    if request.force:
        background_tasks.add_task(service.trigger_retraining, alert_type)
        return {
            "message": f"Forced retraining triggered for {request.model_type}",
            "status": "pending"
        }
    
    # Otherwise, evaluate need first
    evaluation = await service.evaluate_retraining_need(alert_type)
    if not evaluation['should_retrain'] and not request.force:
        return {
            "message": f"Retraining not needed for {request.model_type}",
            "reason": evaluation['reason'],
            "metrics": evaluation.get('metrics')
        }
    
    background_tasks.add_task(service.trigger_retraining, alert_type)
    return {
        "message": f"Retraining triggered for {request.model_type}",
        "status": "pending",
        "evaluation": evaluation
    }

@router.get("/history")
async def get_retraining_history(
    days: int = 30,
    model_type: Optional[str] = None,
    db: Session = Depends(get_db),
    _: dict = Depends(get_founder_user)
) -> List[Dict[str, Any]]:
    """Get history of model retraining events."""
    service = ModelRetrainingService(
        db=db,
        notification_service=NotificationService(get_settings()),
        settings=get_settings()
    )
    
    history = await service.get_retraining_history(days)
    
    if model_type:
        history = [h for h in history if h['model_type'] == model_type]
    
    return history 