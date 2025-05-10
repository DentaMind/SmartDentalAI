from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from services.event_service import EventService
from schemas.event import Event, EventBatch, BatchProcessResponse, EventStats, EventError, RetryResponse, HealthResponse
from auth.dependencies import get_current_user, is_founder

router = APIRouter(prefix="/api/v1/events", tags=["events"])

@router.post("/batch", response_model=BatchProcessResponse)
async def process_event_batch(
    events: EventBatch,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user)  # Ensure user is authenticated
):
    """Process a batch of events."""
    service = EventService(db)
    result = await service.process_batch(events.events)
    return BatchProcessResponse(**result)

@router.get("/stats", response_model=EventStats)
async def get_event_statistics(
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    event_types: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
    _: dict = Depends(is_founder)  # Founder-only endpoint
):
    """Get statistics about event processing."""
    service = EventService(db)
    return await service.get_event_stats(start_time, end_time, event_types)

@router.get("/errors", response_model=List[EventError])
async def get_error_events(
    limit: int = Query(100, gt=0, le=1000),
    db: Session = Depends(get_db),
    _: dict = Depends(is_founder)  # Founder-only endpoint
):
    """Get details about recent events that encountered errors."""
    service = EventService(db)
    return await service.get_recent_errors(limit)

@router.post("/retry", response_model=RetryResponse)
async def retry_failed_events(
    db: Session = Depends(get_db),
    _: dict = Depends(is_founder)  # Founder-only endpoint
):
    """Attempt to reprocess events that previously failed."""
    service = EventService(db)
    return await service.retry_failed_events()

@router.get("/health", response_model=HealthResponse)
async def check_event_system_health(
    db: Session = Depends(get_db),
    _: dict = Depends(is_founder)  # Founder-only endpoint
):
    """Check the health of the event processing system."""
    service = EventService(db)
    
    # Get events in the last hour
    hour_ago = datetime.utcnow() - timedelta(hours=1)
    recent_stats = await service.get_event_stats(start_time=hour_ago)
    
    # System is healthy if:
    # 1. We've received events in the last hour
    # 2. Error rate is below 5%
    is_healthy = (
        recent_stats.total_events > 0 and
        recent_stats.error_rate < 0.05
    )
    
    return HealthResponse(
        is_healthy=is_healthy,
        last_hour_events=recent_stats.total_events,
        last_hour_errors=recent_stats.error_events,
        events_per_minute=recent_stats.recent_events_per_minute
    ) 