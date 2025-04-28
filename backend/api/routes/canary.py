from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from ..services.canary_deployer import canary_deployer, CanaryConfig

router = APIRouter()

class CanaryConfigRequest(BaseModel):
    traffic_percentage: float
    duration_minutes: int
    success_threshold: float
    metrics_to_monitor: List[str]
    max_error_rate: float
    min_requests: int

@router.get("/canaries", response_model=List[Dict[str, Any]])
async def get_canaries():
    """Get all active canary deployments"""
    return canary_deployer.get_all_canary_statuses()

@router.get("/canaries/{version}", response_model=Dict[str, Any])
async def get_canary(version: str):
    """Get status of a specific canary deployment"""
    status = canary_deployer.get_canary_status(version)
    if not status:
        raise HTTPException(status_code=404, detail=f"Canary deployment for version {version} not found")
    return status

@router.post("/canaries/{version}/start")
async def start_canary(version: str, config: Optional[CanaryConfigRequest] = None):
    """Start a canary deployment for a specific version"""
    if config:
        canary_config = CanaryConfig(
            traffic_percentage=config.traffic_percentage,
            duration_minutes=config.duration_minutes,
            success_threshold=config.success_threshold,
            metrics_to_monitor=config.metrics_to_monitor,
            max_error_rate=config.max_error_rate,
            min_requests=config.min_requests
        )
    else:
        canary_config = None
    
    success = await canary_deployer.start_canary(version, canary_config)
    if not success:
        raise HTTPException(status_code=400, detail=f"Failed to start canary deployment for version {version}")
    
    return {"message": f"Started canary deployment for version {version}"}

@router.post("/canaries/{version}/promote")
async def promote_canary(version: str):
    """Promote a canary deployment to full deployment"""
    success = await canary_deployer.promote_canary(version)
    if not success:
        raise HTTPException(status_code=400, detail=f"Failed to promote canary deployment for version {version}")
    
    return {"message": f"Promoted version {version} to full deployment"}

@router.post("/canaries/{version}/rollback")
async def rollback_canary(version: str, reason: str):
    """Rollback a canary deployment"""
    success = await canary_deployer.rollback_canary(version, reason)
    if not success:
        raise HTTPException(status_code=400, detail=f"Failed to rollback canary deployment for version {version}")
    
    return {"message": f"Rolled back version {version}: {reason}"} 