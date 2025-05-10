from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class ContentEngagementBase(BaseModel):
    """Base schema for content engagement tracking"""
    content_id: str
    patient_id: Optional[str] = None
    staff_id: Optional[str] = None
    view_duration_seconds: Optional[int] = 0
    completion_percentage: Optional[int] = 0
    completed: Optional[bool] = False
    device_type: Optional[str] = None
    browser: Optional[str] = None
    ip_address: Optional[str] = None
    session_id: Optional[str] = None

class ContentEngagementCreate(ContentEngagementBase):
    """Schema for creating a new engagement record"""
    pass

class ContentEngagementUpdate(BaseModel):
    """Schema for updating an engagement record"""
    view_duration_seconds: Optional[int] = None
    completion_percentage: Optional[int] = None
    completed: Optional[bool] = None
    bookmarked: Optional[bool] = None
    shared: Optional[bool] = None
    feedback_rating: Optional[int] = None
    feedback_comment: Optional[str] = None

class ContentEngagementResponse(ContentEngagementBase):
    """Schema for engagement record responses"""
    id: str
    view_date: datetime
    bookmarked: bool
    shared: bool
    feedback_rating: Optional[int] = None
    feedback_comment: Optional[str] = None

    class Config:
        from_attributes = True

class SaveContentRequest(BaseModel):
    """Schema for saving/bookmarking content"""
    content_id: str
    patient_id: str

class ContentViewData(BaseModel):
    """Schema for content view data in analytics"""
    id: str
    title: str
    content_type: str
    view_count: int
    completion_rate: int
    average_view_time: int
    risk_factors: List[str]

class RiskFactorStats(BaseModel):
    """Schema for risk factor statistics"""
    risk_factor: str
    content_count: int
    total_views: int
    avg_completion: float

class ViewsByDateData(BaseModel):
    """Schema for views by date data"""
    date: str
    count: int

class ViewsByTypeData(BaseModel):
    """Schema for views by content type data"""
    content_type: str
    count: int

class ViewsByRiskFactorData(BaseModel):
    """Schema for views by risk factor data"""
    risk_factor: str
    count: int

class EngagementAnalytics(BaseModel):
    """Schema for aggregated analytics data"""
    total_views: int
    total_content: int
    total_completed: int
    avg_completion_rate: float
    views_by_date: List[Dict[str, Any]]
    views_by_content_type: List[Dict[str, Any]]
    views_by_risk_factor: List[Dict[str, Any]]
    top_content: List[Dict[str, Any]]
    risk_factor_stats: List[Dict[str, Any]] 