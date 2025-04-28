from fastapi import APIRouter
from datetime import datetime, timedelta
from typing import Dict, Any
from collections import defaultdict

router = APIRouter()

# In-memory storage for events (replace with database in production)
events = []
event_types = defaultdict(int)

def get_event_stats() -> Dict[str, Any]:
    """Get event statistics."""
    now = datetime.utcnow()
    one_hour_ago = now - timedelta(hours=1)
    
    # Filter events from last hour
    recent_events = [e for e in events if e['timestamp'] >= one_hour_ago]
    
    # Calculate error rate
    total_events = len(events)
    error_events = sum(1 for e in events if e.get('status') == 'error')
    error_rate = (error_events / total_events * 100) if total_events > 0 else 0
    
    # Calculate average processing time
    processing_times = [e.get('processing_time', 0) for e in events]
    avg_processing_time = sum(processing_times) / len(processing_times) if processing_times else 0
    
    return {
        "total_events": total_events,
        "events_last_hour": len(recent_events),
        "error_rate": error_rate,
        "avg_processing_time": avg_processing_time,
        "event_types": dict(event_types)
    }

@router.get("/events/stats")
async def get_stats():
    """Endpoint to get event statistics."""
    return get_event_stats() 