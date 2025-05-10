from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user, require_admin
from services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("")
async def get_system_alerts(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """
    Get all active system alerts.
    This endpoint is restricted to admin users only.
    
    Returns:
        List of alert objects sorted by severity and timestamp
    """
    # Ensure user is admin
    require_admin(current_user)
    
    return AlertService.get_all_alerts(db) 