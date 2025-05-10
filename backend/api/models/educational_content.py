from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, Table, DateTime, Enum, JSON, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from datetime import datetime

from ..database import Base

class ContentType(str, enum.Enum):
    """Types of educational content"""
    ARTICLE = "article"
    VIDEO = "video"
    PDF = "pdf"
    INFOGRAPHIC = "infographic"
    LINK = "link"

class ContentCategory(str, enum.Enum):
    """Categories for educational content"""
    GENERAL = "general"
    ORAL_HYGIENE = "oral_hygiene"
    PERIODONTAL = "periodontal"
    RESTORATIVE = "restorative"
    ENDODONTIC = "endodontic"
    SURGICAL = "surgical"
    PREVENTIVE = "preventive"
    ORTHODONTIC = "orthodontic"
    PEDIATRIC = "pediatric"
    NUTRITION = "nutrition"
    SMOKING_CESSATION = "smoking_cessation"
    DIABETES = "diabetes"

class RiskFactor(str, enum.Enum):
    """Risk factors that educational content can target"""
    SMOKING = "smoking"
    DIABETES = "diabetes"
    POOR_HYGIENE = "poor_hygiene"
    HEART_DISEASE = "heart_disease"
    PERIODONTAL_DISEASE = "periodontal_disease"
    CARIES_RISK = "caries_risk"
    PREGNANCY = "pregnancy"
    HIGH_BLOOD_PRESSURE = "high_blood_pressure"
    IMMUNOCOMPROMISED = "immunocompromised"
    DENTAL_ANXIETY = "dental_anxiety"

# Association table for many-to-many relationship between content and risk factors
content_risk_factors = Table(
    "content_risk_factors",
    Base.metadata,
    Column("content_id", String, ForeignKey("educational_content.id"), primary_key=True),
    Column("risk_factor", String, nullable=False, primary_key=True)
)

# Association table for patient saved content
patient_saved_content = Table(
    "patient_saved_content",
    Base.metadata,
    Column("patient_id", String, ForeignKey("patients.id"), primary_key=True),
    Column("content_id", String, ForeignKey("educational_content.id"), primary_key=True),
    Column("saved_at", DateTime(timezone=True), server_default=func.now())
)

class EducationalContent(Base):
    """Educational content model"""
    __tablename__ = "educational_content"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    content_type = Column(Enum(ContentType), nullable=False)
    category = Column(Enum(ContentCategory), nullable=False)
    
    # Content depends on type
    content_url = Column(String(512), nullable=True)  # For videos, pdfs, links
    content_text = Column(Text, nullable=True)  # For articles
    thumbnail_url = Column(String(512), nullable=True)
    
    # Metadata
    duration = Column(String(50), nullable=True)  # e.g., "5 min read", "3:45" for video
    author = Column(String(100), nullable=True)
    source = Column(String(100), nullable=True)
    
    # Content relevance and display
    priority = Column(Integer, default=0)  # Higher numbers = higher priority
    is_featured = Column(Boolean, default=False)
    tags = Column(ARRAY(String), nullable=True)
    
    # timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Targeting metadata
    target_risk_factors = relationship(
        "RiskFactor", 
        secondary=content_risk_factors,
        backref="related_content"
    )
    
    # Usage metrics
    view_count = Column(Integer, default=0)
    completion_rate = Column(Integer, default=0)  # Percentage
    
    # Relationships
    engagements = relationship("ContentEngagement", back_populates="content", cascade="all, delete-orphan")
    saved_by_patients = relationship(
        "Patient",
        secondary=patient_saved_content,
        backref="saved_content"
    )
    
    def __repr__(self):
        return f"<EducationalContent(id={self.id}, title='{self.title}', content_type={self.content_type})>"
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "content_type": self.content_type,
            "category": self.category,
            "content_url": self.content_url,
            "thumbnail_url": self.thumbnail_url,
            "duration": self.duration,
            "author": self.author,
            "source": self.source,
            "priority": self.priority,
            "is_featured": self.is_featured,
            "tags": self.tags,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "target_risk_factors": [rf for rf in self.target_risk_factors],
            "view_count": self.view_count,
            "completion_rate": self.completion_rate
        } 