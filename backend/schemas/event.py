from typing import List, Dict, Optional
from datetime import datetime
from pydantic import BaseModel, Field, UUID4
from enum import Enum

class EventMetadata(BaseModel):
    """Metadata associated with an event."""
    userId: Optional[int] = None
    sessionId: Optional[str] = None
    deviceInfo: Optional[str] = None
    environment: str = "production"
    version: Optional[str] = None

class Event(BaseModel):
    """Single event model."""
    id: str = Field(..., description="Unique event identifier")
    type: str = Field(..., description="Type of event")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    payload: Dict = Field(..., description="Event data")
    metadata: Optional[EventMetadata] = None

class EventBatch(BaseModel):
    """Batch of events for processing."""
    events: List[Event] = Field(..., min_items=1, max_items=1000)

class EventTypeCount(BaseModel):
    event_type: str
    count: int

class HourlyVolume(BaseModel):
    """Hourly event volume data."""
    hour: datetime
    count: int
    errors: int

class EventStats(BaseModel):
    """Statistics about event processing."""
    total_events: int
    error_events: int
    error_rate: float
    type_distribution: Dict[str, int]
    recent_events_per_minute: float
    peak_events_per_minute: int
    hourly_volumes: List[HourlyVolume]

class EventError(BaseModel):
    """Details about an event that encountered an error."""
    event_id: str
    type: str
    timestamp: datetime
    error_count: int
    last_error: Optional[str]
    payload: Dict

    class Config:
        from_attributes = True

# Response models for the API endpoints
class BatchProcessResponse(BaseModel):
    """Response from batch processing."""
    processed: int
    errors: int
    error_details: Optional[List[str]] = None

class RetryResponse(BaseModel):
    """Response from retry operation."""
    retried_success: int
    still_failed: int

class HealthResponse(BaseModel):
    """Health status of the event processing system."""
    is_healthy: bool = Field(..., description="Whether the system is considered healthy")
    last_hour_events: int = Field(..., description="Number of events processed in the last hour")
    last_hour_errors: int = Field(..., description="Number of errors in the last hour")
    events_per_minute: float = Field(..., description="Current event processing rate") 