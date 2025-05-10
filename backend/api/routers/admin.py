"""
Admin router providing API endpoints for system configuration and monitoring.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import random

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    responses={404: {"description": "Not found"}}
)

@router.get("/ai-config", response_model=Dict[str, Any])
async def get_ai_config() -> Dict[str, Any]:
    """
    Get the current AI system configuration
    """
    # Mock configuration data
    return {
        "useMockData": True,
        "modelType": "mock",
        "maxConcurrentRequests": 5,
        "confidenceThreshold": 0.7
    }

@router.post("/ai-config", response_model=Dict[str, Any])
async def update_ai_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update the AI system configuration
    """
    # In a real implementation, this would save to a database or config file
    return {
        "success": True,
        "message": "Configuration updated successfully",
        "config": config
    }

@router.get("/ai-metrics", response_model=Dict[str, Any])
async def get_ai_metrics(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    model_type: Optional[str] = Query(None),
) -> Dict[str, Any]:
    """
    Get AI system performance metrics
    """
    # Generate some mock data for demonstration
    daily_inferences = {}
    now = datetime.now()
    for i in range(30):
        date = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_inferences[date] = random.randint(30, 100)
    
    return {
        "totalInferences": 1247,
        "averageLatency": 342.5,
        "successRate": 97.2,
        "averageConfidence": 0.83,
        "modelUsage": {
            "mock": 825,
            "onnx": 312,
            "pytorch": 110
        },
        "feedbackSummary": {
            "accepted": 562,
            "modified": 87,
            "rejected": 25
        },
        "inferencesByType": {
            "panoramic": 425,
            "bitewing": 732,
            "periapical": 90
        },
        "dailyInferences": daily_inferences
    } 