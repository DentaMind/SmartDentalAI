from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from datetime import timedelta
from ..services.training_orchestrator import training_orchestrator, TrainingPriority, DeploymentStatus
from pydantic import BaseModel

router = APIRouter()

class TrainingScheduleRequest(BaseModel):
    name: str
    priority: str
    interval_days: int
    metrics_threshold: Dict[str, float]
    resource_allocation: Dict[str, Any] = None
    advanced_conditions: Dict[str, Any] = None
    notification_channels: List[str] = None

class VersionRollbackRequest(BaseModel):
    version: str
    reason: str

@router.get("/schedules", response_model=List[Dict[str, Any]])
async def get_schedules():
    """Get all training schedules and their status"""
    return training_orchestrator.get_schedule_status()

@router.post("/schedules")
async def add_schedule(schedule: TrainingScheduleRequest):
    """Add a new training schedule"""
    try:
        priority = TrainingPriority[schedule.priority.upper()]
        interval = timedelta(days=schedule.interval_days)
        
        training_orchestrator.add_schedule(
            schedule.name,
            priority,
            interval,
            schedule.metrics_threshold,
            schedule.resource_allocation,
            schedule.advanced_conditions,
            schedule.notification_channels
        )
        return {"message": f"Schedule {schedule.name} added successfully"}
    except KeyError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid priority. Must be one of: {[p.name for p in TrainingPriority]}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/schedules/{name}/toggle")
async def toggle_schedule(name: str):
    """Toggle a schedule's active status"""
    if name not in training_orchestrator.schedules:
        raise HTTPException(status_code=404, detail=f"Schedule {name} not found")
    
    schedule = training_orchestrator.schedules[name]
    schedule.is_active = not schedule.is_active
    return {"message": f"Schedule {name} {'activated' if schedule.is_active else 'deactivated'}"}

@router.delete("/schedules/{name}")
async def delete_schedule(name: str):
    """Delete a training schedule"""
    if name not in training_orchestrator.schedules:
        raise HTTPException(status_code=404, detail=f"Schedule {name} not found")
    
    del training_orchestrator.schedules[name]
    return {"message": f"Schedule {name} deleted successfully"}

@router.post("/schedules/{name}/trigger")
async def trigger_schedule(name: str):
    """Manually trigger a training schedule"""
    if name not in training_orchestrator.schedules:
        raise HTTPException(status_code=404, detail=f"Schedule {name} not found")
    
    schedule = training_orchestrator.schedules[name]
    await training_orchestrator._evaluate_training_needs(name, schedule)
    return {"message": f"Training evaluation triggered for {name}"}

@router.get("/jobs/history", response_model=List[Dict[str, Any]])
async def get_job_history(limit: int = 100):
    """Get training job history"""
    return training_orchestrator.get_job_history(limit)

@router.get("/jobs/active", response_model=List[Dict[str, Any]])
async def get_active_jobs():
    """Get currently active training jobs"""
    return training_orchestrator.get_active_jobs()

@router.post("/jobs/{job_id}/cancel")
async def cancel_job(job_id: str):
    """Cancel a running training job"""
    if job_id not in training_orchestrator.active_jobs:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    await training_orchestrator._cancel_job(job_id, "Manually cancelled")
    return {"message": f"Job {job_id} cancelled successfully"}

@router.get("/versions", response_model=List[Dict[str, Any]])
async def get_versions():
    """Get all model versions and their status"""
    return training_orchestrator.get_version_status()

@router.post("/versions/{version}/rollback")
async def rollback_version(version: str, request: VersionRollbackRequest):
    """Rollback a model version"""
    success = await training_orchestrator.rollback_version(version)
    if not success:
        raise HTTPException(status_code=404, detail=f"Version {version} not found")
    
    return {"message": f"Version {version} rolled back successfully"}

@router.get("/versions/{version}/metrics")
async def get_version_metrics(version: str):
    """Get metrics for a specific model version"""
    if version not in training_orchestrator.model_versions:
        raise HTTPException(status_code=404, detail=f"Version {version} not found")
    
    model_version = training_orchestrator.model_versions[version]
    return {
        "version": model_version.version,
        "metrics": model_version.metrics,
        "canary_performance": model_version.canary_performance,
        "deployment_status": model_version.deployment_status.name
    } 