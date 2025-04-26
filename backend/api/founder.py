from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user, require_admin
from services.metrics_service import MetricsService

router = APIRouter(prefix="/founder", tags=["founder"])

@router.get("/ops-board")
async def get_ops_board_metrics(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get comprehensive metrics for the Founder Ops Board.
    This endpoint is restricted to admin users only.
    
    Returns:
        Dict containing various system metrics and KPIs
    """
    # Ensure user is admin
    require_admin(current_user)
    
    # Collect all metrics
    metrics = {
        "system_health": MetricsService.get_system_health(db),
        "scaling_metrics": MetricsService.get_scaling_metrics(db),
        "learning_metrics": MetricsService.get_learning_metrics(db),
        "deployment_metrics": MetricsService.get_deployment_metrics(db),
        "risk_metrics": MetricsService.get_risk_metrics(db),
    }
    
    return metrics 