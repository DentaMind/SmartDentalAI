from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, validator, HttpUrl
from datetime import datetime
from enum import Enum

# Enums from models
from ..models.educational_content import ContentType, ContentCategory, RiskFactor

# Base schema
class EducationalContentBase(BaseModel):
    title: str
    description: str
    content_type: ContentType
    category: ContentCategory
    content_url: Optional[str] = None
    content_text: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration: Optional[str] = None
    author: Optional[str] = None
    source: Optional[str] = None
    priority: Optional[int] = 0
    is_featured: Optional[bool] = False
    tags: Optional[List[str]] = []
    target_risk_factors: Optional[List[RiskFactor]] = []

    @validator('content_url')
    def validate_content_url_by_type(cls, v, values):
        content_type = values.get('content_type')
        if content_type in [ContentType.VIDEO, ContentType.PDF, ContentType.LINK, ContentType.INFOGRAPHIC]:
            if not v:
                raise ValueError(f"content_url is required for content_type {content_type}")
        return v

    @validator('content_text')
    def validate_content_text_by_type(cls, v, values):
        content_type = values.get('content_type')
        if content_type == ContentType.ARTICLE and not v:
            raise ValueError("content_text is required for articles")
        return v

# Create schema
class EducationalContentCreate(EducationalContentBase):
    pass

# Update schema - all fields optional
class EducationalContentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content_type: Optional[ContentType] = None
    category: Optional[ContentCategory] = None
    content_url: Optional[str] = None
    content_text: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration: Optional[str] = None
    author: Optional[str] = None
    source: Optional[str] = None
    priority: Optional[int] = None
    is_featured: Optional[bool] = None
    tags: Optional[List[str]] = None
    target_risk_factors: Optional[List[RiskFactor]] = None

# Response schema
class EducationalContentResponse(EducationalContentBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    view_count: int
    completion_rate: int

    class Config:
        from_attributes = True

# Query parameters for filtering content
class ContentFilter(BaseModel):
    content_type: Optional[ContentType] = None
    category: Optional[ContentCategory] = None
    risk_factors: Optional[List[RiskFactor]] = None
    is_featured: Optional[bool] = None
    search_query: Optional[str] = None
    tags: Optional[List[str]] = None

# Schema for educational recommendations
class EducationalRecommendationsRequest(BaseModel):
    patient_id: str
    risk_factors: List[RiskFactor]
    limit: Optional[int] = 5

class EducationalRecommendation(EducationalContentResponse):
    relevance_score: float = Field(..., description="Score indicating relevance to patient's risk factors")
    recommendation_reason: str = Field(..., description="Explanation for why this content is recommended")

class EducationalRecommendationsResponse(BaseModel):
    patient_id: str
    recommendations: List[EducationalRecommendation]
    risk_factors_identified: List[str] 