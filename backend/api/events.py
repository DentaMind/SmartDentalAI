from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Security
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy.orm import Session

from services.event_collector import EventCollector, EventData
from services.auth import get_current_user, User
from config import get_settings
from core.auth import require_founder
from core.database import get_db
from services.event_service import EventService
from schemas.event import EventBatch, EventStats, EventError

router = APIRouter(prefix="/api/v1/events", tags=["events"])
settings = get_settings()

# Initialize event collector
event_collector = EventCollector(
    db_url=settings.DATABASE_URL,
    batch_size=100,
    flush_interval=60
)

# Start background processing
event_collector.start_processing()

class EventResponse(BaseModel):
    """Response model for event submission."""
    success: bool
    event_id: str
    message: str

@router.post("/collect", response_model=EventResponse)
async def collect_event(
    event: EventData,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
) -> EventResponse:
    """Collect a learning event."""
    try:
        # Add event to collection queue
        background_tasks.add_task(event_collector.collect_event, event)
        
        return EventResponse(
            success=True,
            event_id=event.session_id,
            message="Event queued for processing"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to collect event: {str(e)}"
        )

@router.get("/stats")
async def get_stats(
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    event_types: Optional[List[str]] = None,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get event statistics."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Only admins can view event statistics"
        )
    
    try:
        stats = await event_collector.get_event_stats(
            start_time=start_time,
            end_time=end_time,
            event_types=event_types
        )
        return stats
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get event stats: {str(e)}"
        )

# Frontend event collection endpoint
@router.post("/frontend/collect")
async def collect_frontend_event(
    event: EventData,
    background_tasks: BackgroundTasks
) -> EventResponse:
    """Collect events from frontend."""
    try:
        # Add CSRF protection here
        
        # Add event to collection queue
        background_tasks.add_task(event_collector.collect_event, event)
        
        return EventResponse(
            success=True,
            event_id=event.session_id,
            message="Frontend event queued for processing"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to collect frontend event: {str(e)}"
        )

@router.post("/batch")
async def process_event_batch(
    batch: EventBatch,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Dict:
    """
    Process a batch of events.
    
    This endpoint accepts a batch of events and processes them in an optimized way.
    Events are validated, stored, and optionally forwarded to real-time processing.
    """
    event_service = EventService(db)
    return await event_service.process_batch(batch.events)

@router.get("/stats", response_model=EventStats)
async def get_event_statistics(
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    event_types: Optional[List[str]] = None,
    db: Session = Depends(get_db),
    current_user = Security(require_founder)
) -> Dict:
    """
    Get event processing statistics.
    
    This endpoint is restricted to founders and provides detailed statistics
    about event processing, including error rates and type distribution.
    """
    event_service = EventService(db)
    return await event_service.get_event_stats(start_time, end_time, event_types)

@router.get("/errors", response_model=List[EventError])
async def get_recent_errors(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Security(require_founder)
) -> List[Dict]:
    """
    Get recent events that encountered errors.
    
    This endpoint is restricted to founders and provides details about
    events that failed processing, including error messages and timestamps.
    """
    event_service = EventService(db)
    return await event_service.get_recent_errors(limit)

@router.post("/retry")
async def retry_failed_events(
    db: Session = Depends(get_db),
    current_user = Security(require_founder)
) -> Dict:
    """
    Retry processing of failed events.
    
    This endpoint is restricted to founders and attempts to reprocess
    events that previously failed. Returns counts of successful and failed retries.
    """
    event_service = EventService(db)
    return await event_service.retry_failed_events() 