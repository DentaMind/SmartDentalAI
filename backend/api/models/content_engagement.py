from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Table, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from datetime import datetime

from ..database import Base

class ContentEngagement(Base):
    """Model for tracking user engagement with educational content"""
    __tablename__ = "content_engagement"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Foreign keys
    content_id = Column(String, ForeignKey("educational_content.id"), nullable=False, index=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=True, index=True)
    staff_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    
    # Engagement metrics
    view_date = Column(DateTime(timezone=True), server_default=func.now())
    view_duration_seconds = Column(Integer, default=0)
    completion_percentage = Column(Integer, default=0)  # 0-100
    completed = Column(Boolean, default=False)
    
    # Device and session info
    device_type = Column(String(50), nullable=True)  # mobile, desktop, tablet
    browser = Column(String(100), nullable=True)
    ip_address = Column(String(50), nullable=True)
    session_id = Column(String(100), nullable=True)
    
    # User engagement actions
    bookmarked = Column(Boolean, default=False)
    shared = Column(Boolean, default=False)
    feedback_rating = Column(Integer, nullable=True)  # 1-5 stars
    feedback_comment = Column(Text, nullable=True)

    # Relationships
    content = relationship("EducationalContent", back_populates="engagements")
    patient = relationship("Patient", back_populates="content_engagements")
    
    def __repr__(self):
        return f"<ContentEngagement(id={self.id}, content_id={self.content_id}, patient_id={self.patient_id})>"
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "content_id": self.content_id,
            "patient_id": self.patient_id,
            "staff_id": self.staff_id,
            "view_date": self.view_date.isoformat() if self.view_date else None,
            "view_duration_seconds": self.view_duration_seconds,
            "completion_percentage": self.completion_percentage,
            "completed": self.completed,
            "device_type": self.device_type,
            "browser": self.browser,
            "bookmarked": self.bookmarked,
            "shared": self.shared,
            "feedback_rating": self.feedback_rating,
        } 