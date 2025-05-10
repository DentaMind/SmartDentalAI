from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import numpy as np
from pydantic import BaseModel
from ..services.metrics import get_metric_history, get_system_metrics, get_performance_metrics
from ..auth import get_current_user

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

class MetricData(BaseModel):
    timestamp: str
    value: float

class MetricDetails(BaseModel):
    name: str
    description: str
    unit: str
    data: List[MetricData]
    statistics: Dict[str, float]
    significantChanges: List[Dict[str, Any]]

# Mock data for demonstration
MOCK_METRICS = {
    "accuracy": {
        "name": "Model Accuracy",
        "description": "The accuracy of the model's predictions",
        "unit": "%",
        "data": [],
        "statistics": {
            "mean": 0.0,
            "median": 0.0,
            "stdDev": 0.0,
            "min": 0.0,
            "max": 0.0
        },
        "significantChanges": []
    },
    "precision": {
        "name": "Model Precision",
        "description": "The precision of the model's predictions",
        "unit": "%",
        "data": [],
        "statistics": {
            "mean": 0.0,
            "median": 0.0,
            "stdDev": 0.0,
            "min": 0.0,
            "max": 0.0
        },
        "significantChanges": []
    },
    "recall": {
        "name": "Model Recall",
        "description": "The recall of the model's predictions",
        "unit": "%",
        "data": [],
        "statistics": {
            "mean": 0.0,
            "median": 0.0,
            "stdDev": 0.0,
            "min": 0.0,
            "max": 0.0
        },
        "significantChanges": []
    }
}

def generate_mock_data(metric_name: str, start_date: str, end_date: str) -> List[MetricData]:
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)
    days = (end - start).days
    
    data = []
    for i in range(days):
        date = start + timedelta(days=i)
        # Generate random values with some trend
        value = np.random.normal(0.8, 0.1) + 0.01 * i
        value = max(0, min(1, value))  # Clamp between 0 and 1
        data.append(MetricData(
            timestamp=date.isoformat(),
            value=value
        ))
    return data

def calculate_statistics(data: List[MetricData]) -> Dict[str, float]:
    values = [d.value for d in data]
    return {
        "mean": float(np.mean(values)),
        "median": float(np.median(values)),
        "stdDev": float(np.std(values)),
        "min": float(np.min(values)),
        "max": float(np.max(values))
    }

def detect_significant_changes(data: List[MetricData]) -> List[Dict[str, Any]]:
    if len(data) < 2:
        return []
    
    changes = []
    for i in range(1, len(data)):
        prev_value = data[i-1].value
        curr_value = data[i].value
        change = curr_value - prev_value
        percentage = (change / prev_value) * 100 if prev_value != 0 else 0
        
        # Consider changes greater than 5% as significant
        if abs(percentage) > 5:
            changes.append({
                "timestamp": data[i].timestamp,
                "change": float(change),
                "percentage": float(percentage)
            })
    return changes

@router.get("/")
async def get_available_metrics(current_user: dict = Depends(get_current_user)):
    """Get list of available metrics"""
    return {
        "metrics": [
            "cpu_usage",
            "memory_usage",
            "disk_usage",
            "response_time",
            "error_rate",
            "request_rate"
        ]
    }

@router.get("/{metric_name}")
async def get_metric_details(
    metric_name: str,
    start_date: str,
    end_date: str,
    current_user: dict = Depends(get_current_user)
):
    """Get historical data for a specific metric"""
    try:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        days = (end - start).days
        
        history = get_metric_history(metric_name, days)
        return {
            "metric": metric_name,
            "history": history,
            "start_date": start_date,
            "end_date": end_date
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

@router.get("/{metric_name}/correlations")
async def get_metric_correlations(
    metric_name: str,
    current_user: dict = Depends(get_current_user)
):
    """Get correlations between this metric and other system metrics"""
    # For demonstration, return some sample correlations
    return {
        "correlations": {
            "cpu_usage": 0.75,
            "memory_usage": 0.65,
            "disk_usage": 0.25,
            "response_time": 0.85
        }
    }

async def get_event_details(
    event_id: str,
    include_context: bool = True
) -> Dict[str, Any]:
    """Get detailed information about a specific event."""
    try:
        # Get the event from the database
        event = await get_event_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Get context if requested
        context = {}
        if include_context:
            # Get metrics before and after the event
            before_time = event['timestamp'] - timedelta(hours=1)
            after_time = event['timestamp'] + timedelta(hours=1)
            
            context = {
                'pre_event_metrics': await get_metric_details(
                    event['metric'],
                    start_time=before_time,
                    end_time=event['timestamp']
                ),
                'post_event_metrics': await get_metric_details(
                    event['metric'],
                    start_time=event['timestamp'],
                    end_time=after_time
                ),
                'related_events': await get_related_events(event_id)
            }
        
        return {
            'event': event,
            'context': context
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/event/{event_id}")
async def get_event_details_endpoint(
    event_id: str,
    include_context: bool = True
):
    """Get detailed information about a specific event."""
    return await get_event_details(event_id, include_context) 