from typing import Dict, Optional
from datetime import datetime
from pydantic import BaseModel

from models.alert import AlertType, AlertSeverity, AlertStatus

class AlertResponse(BaseModel):
    """Response model for alerts."""
    id: int
    type: AlertType
    severity: AlertSeverity
    status: AlertStatus
    title: str
    description: str
    metadata: Optional[Dict]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class AlertStats(BaseModel):
    """Statistics about system alerts."""
    total_alerts: int
    alerts_by_type: Dict[AlertType, int]
    alerts_by_severity: Dict[AlertSeverity, int]
    active_alerts: int 