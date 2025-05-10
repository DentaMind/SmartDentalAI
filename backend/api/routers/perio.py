from fastapi import APIRouter, Path
from typing import Dict, Any

router = APIRouter(
    prefix="/api/perio",
    tags=["perio"],
    responses={404: {"description": "Not found"}}
)

@router.get("/")
async def get_perio_root() -> Dict[str, Any]:
    """Root endpoint for perio module"""
    return {
        "message": "Perio module API",
        "endpoints": [
            "/api/perio/health",
            "/api/perio/assessment/{patient_id}"
        ]
    }

@router.get("/health")
async def get_perio_health() -> Dict[str, Any]:
    """Health check endpoint for perio module"""
    return {
        "status": "healthy",
        "message": "Perio module is operational"
    }

@router.get("/assessment/{patient_id}")
async def get_perio_assessment(
    patient_id: str = Path(..., description="Patient ID"),
) -> Dict[str, Any]:
    """Get perio assessment for a patient"""
    # Placeholder implementation
    return {
        "patient_id": patient_id,
        "status": "No assessment found",
        "message": "This is a placeholder. Actual implementation pending."
    } 