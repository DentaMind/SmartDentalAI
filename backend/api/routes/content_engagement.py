from fastapi import APIRouter, Depends, HTTPException, Path, Query, Body, Request
from sqlalchemy.orm import Session
from typing import List, Dict, Optional, Any
from datetime import datetime
import logging

from ..database import get_db
from ..services.content_engagement_service import content_engagement_service
from ..schemas.content_engagement import (
    ContentEngagementCreate,
    ContentEngagementUpdate,
    ContentEngagementResponse,
    SaveContentRequest,
    EngagementAnalytics
)
from ..auth.auth import get_current_user, get_current_patient, get_current_active_staff, User, Patient

router = APIRouter(prefix="/content-engagement", tags=["content-engagement"])

logger = logging.getLogger(__name__)

@router.post("/view", response_model=ContentEngagementResponse)
async def track_content_view(
    request: Request,
    engagement_data: ContentEngagementCreate,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record a content view with user and device information"""
    try:
        # Extract device info from request
        device_info = {
            "device_type": request.headers.get("User-Agent", "").split(" ")[0],
            "browser": request.headers.get("User-Agent", ""),
            "ip_address": request.client.host,
            "session_id": request.cookies.get("session_id", "")
        }
        
        # Set user ID if logged in
        patient_id = engagement_data.patient_id
        staff_id = engagement_data.staff_id
        
        if current_user:
            if hasattr(current_user, 'role') and current_user.role == 'patient':
                patient_id = current_user.id
            else:
                staff_id = current_user.id
        
        # Record view
        engagement = await content_engagement_service.record_view(
            db=db,
            content_id=engagement_data.content_id,
            patient_id=patient_id,
            staff_id=staff_id,
            device_info=device_info
        )
        
        return engagement
    except Exception as e:
        logger.error(f"Error tracking content view: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/update/{engagement_id}", response_model=ContentEngagementResponse)
async def update_content_engagement(
    engagement_id: str = Path(..., description="The ID of the engagement record"),
    update_data: ContentEngagementUpdate = Body(...),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update engagement metrics such as view duration and completion percentage"""
    try:
        engagement = await content_engagement_service.update_engagement(
            db=db,
            engagement_id=engagement_id,
            update_data=update_data
        )
        
        if not engagement:
            raise HTTPException(status_code=404, detail="Engagement record not found")
        
        return engagement
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating engagement: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/save", response_model=Dict[str, Any])
async def save_content_for_patient(
    save_request: SaveContentRequest = Body(...),
    current_user: User = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Save/bookmark content for a patient"""
    try:
        # Only allow saving for the currently logged in patient
        if current_user.id != save_request.patient_id:
            raise HTTPException(status_code=403, detail="Cannot save content for another patient")
        
        success = await content_engagement_service.save_content_for_patient(
            db=db,
            content_id=save_request.content_id,
            patient_id=save_request.patient_id
        )
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to save content")
        
        return {"success": True, "message": "Content saved successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving content: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/unsave", response_model=Dict[str, Any])
async def unsave_content_for_patient(
    save_request: SaveContentRequest = Body(...),
    current_user: User = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Remove saved/bookmarked content for a patient"""
    try:
        # Only allow unsaving for the currently logged in patient
        if current_user.id != save_request.patient_id:
            raise HTTPException(status_code=403, detail="Cannot unsave content for another patient")
        
        success = await content_engagement_service.unsave_content_for_patient(
            db=db,
            content_id=save_request.content_id,
            patient_id=save_request.patient_id
        )
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to unsave content")
        
        return {"success": True, "message": "Content unsaved successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unsaving content: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/saved/{patient_id}", response_model=List[Dict[str, Any]])
async def get_patient_saved_content(
    patient_id: str = Path(..., description="The patient ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all saved/bookmarked content for a patient"""
    try:
        # Allow access if current user is the patient or a staff member
        if (hasattr(current_user, 'role') and current_user.role == 'patient' and 
            current_user.id != patient_id):
            raise HTTPException(status_code=403, detail="Cannot access another patient's saved content")
        
        content_list = await content_engagement_service.get_patient_saved_content(
            db=db,
            patient_id=patient_id
        )
        
        return [content.to_dict() for content in content_list]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting saved content: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/analytics", response_model=EngagementAnalytics)
async def get_content_analytics(
    time_range: Optional[int] = Query(30, description="Time range in days (0 for all time)"),
    current_user: User = Depends(get_current_active_staff),
    db: Session = Depends(get_db)
):
    """Get analytics data for educational content (staff only)"""
    try:
        # Convert time_range 0 to None for all time
        time_range_days = time_range if time_range > 0 else None
        
        analytics = await content_engagement_service.get_content_analytics(
            db=db,
            time_range_days=time_range_days
        )
        
        return analytics
    except Exception as e:
        logger.error(f"Error getting content analytics: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/is-saved/{content_id}/{patient_id}", response_model=Dict[str, bool])
async def check_if_content_is_saved(
    content_id: str = Path(..., description="The content ID"),
    patient_id: str = Path(..., description="The patient ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if content is saved/bookmarked by a patient"""
    try:
        # Allow access if current user is the patient or a staff member
        if (hasattr(current_user, 'role') and current_user.role == 'patient' and 
            current_user.id != patient_id):
            raise HTTPException(status_code=403, detail="Cannot check for another patient")
        
        is_saved = await content_engagement_service.is_content_saved_by_patient(
            db=db,
            content_id=content_id,
            patient_id=patient_id
        )
        
        return {"is_saved": is_saved}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking if content is saved: {e}")
        raise HTTPException(status_code=400, detail=str(e)) 