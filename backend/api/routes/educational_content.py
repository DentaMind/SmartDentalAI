from fastapi import APIRouter, Depends, HTTPException, Path, Query, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Optional, Any
import logging

from ..database import get_db
from ..services.educational_content_service import educational_content_service
from ..schemas.educational_content import (
    EducationalContentCreate,
    EducationalContentUpdate,
    EducationalContentResponse,
    ContentFilter,
    EducationalRecommendationsResponse
)
from ..models.educational_content import ContentType, ContentCategory, RiskFactor
from ..auth.auth import get_current_user, get_current_patient, get_current_active_staff, User, Patient

router = APIRouter(prefix="/educational-content", tags=["educational-content"])

logger = logging.getLogger(__name__)

@router.post("", response_model=EducationalContentResponse)
async def create_educational_content(
    content_data: EducationalContentCreate,
    current_user: User = Depends(get_current_active_staff),
    db: Session = Depends(get_db)
):
    """Create a new educational content item (admin only)"""
    try:
        content = await educational_content_service.create_content(
            db=db,
            content_data=content_data,
            created_by=current_user.id
        )
        return content
    except Exception as e:
        logger.error(f"Error creating educational content: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{content_id}", response_model=EducationalContentResponse)
async def get_educational_content(
    content_id: str = Path(..., description="The ID of the educational content"),
    db: Session = Depends(get_db)
):
    """Get a specific educational content item by ID"""
    content = await educational_content_service.get_content(db, content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Educational content not found")
    
    # Increment view count
    await educational_content_service.increment_view_count(db, content_id)
    
    return content

@router.put("/{content_id}", response_model=EducationalContentResponse)
async def update_educational_content(
    content_data: EducationalContentUpdate,
    content_id: str = Path(..., description="The ID of the educational content"),
    current_user: User = Depends(get_current_active_staff),
    db: Session = Depends(get_db)
):
    """Update an existing educational content item (admin only)"""
    content = await educational_content_service.update_content(
        db=db,
        content_id=content_id,
        update_data=content_data
    )
    
    if not content:
        raise HTTPException(status_code=404, detail="Educational content not found")
        
    return content

@router.delete("/{content_id}", response_model=Dict[str, Any])
async def delete_educational_content(
    content_id: str = Path(..., description="The ID of the educational content"),
    current_user: User = Depends(get_current_active_staff),
    db: Session = Depends(get_db)
):
    """Delete an educational content item (admin only)"""
    success = await educational_content_service.delete_content(db, content_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Educational content not found")
        
    return {"success": True, "message": "Educational content deleted"}

@router.get("", response_model=List[EducationalContentResponse])
async def list_educational_content(
    content_type: Optional[ContentType] = Query(None, description="Filter by content type"),
    category: Optional[ContentCategory] = Query(None, description="Filter by category"),
    risk_factor: Optional[List[RiskFactor]] = Query(None, description="Filter by risk factors"),
    is_featured: Optional[bool] = Query(None, description="Filter by featured status"),
    search: Optional[str] = Query(None, description="Search query for title and description"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    skip: int = Query(0, description="Number of items to skip"),
    limit: int = Query(100, description="Maximum number of items to return"),
    db: Session = Depends(get_db)
):
    """List and filter educational content"""
    filters = ContentFilter(
        content_type=content_type,
        category=category,
        risk_factors=risk_factor,
        is_featured=is_featured,
        search_query=search,
        tags=tags
    )
    
    content_list = await educational_content_service.search_content(
        db=db,
        filters=filters,
        skip=skip,
        limit=limit
    )
    
    return content_list

@router.post("/complete/{content_id}", response_model=Dict[str, Any])
async def update_content_completion(
    content_id: str = Path(..., description="The ID of the educational content"),
    completion_percentage: int = Body(..., embed=True, ge=0, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record completion rate for educational content"""
    success = await educational_content_service.update_completion_rate(
        db=db,
        content_id=content_id,
        completion_percentage=completion_percentage
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Educational content not found")
        
    return {"success": True, "message": "Completion rate updated"}

@router.get("/recommendations/patient/{patient_id}", response_model=EducationalRecommendationsResponse)
async def get_patient_recommendations(
    patient_id: str = Path(..., description="The patient ID"),
    limit: int = Query(5, description="Maximum number of recommendations to return"),
    current_user: User = Depends(get_current_active_staff),
    db: Session = Depends(get_db)
):
    """Get educational content recommendations for a specific patient based on risk factors (staff only)"""
    recommendations = await educational_content_service.get_recommended_content(
        db=db,
        patient_id=patient_id,
        limit=limit
    )
    
    return recommendations

@router.get("/recommendations/my", response_model=EducationalRecommendationsResponse)
async def get_my_recommendations(
    limit: int = Query(5, description="Maximum number of recommendations to return"),
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Get personalized educational content recommendations based on patient's risk factors"""
    recommendations = await educational_content_service.get_recommended_content(
        db=db,
        patient_id=current_patient.id,
        limit=limit
    )
    
    return recommendations 