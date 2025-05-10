from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Float, JSON, Text, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from datetime import datetime
from .base import Base
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union

class DiagnosisStatus(str, enum.Enum):
    """Status of an AI-generated diagnosis"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    CORRECTED = "corrected"
    REJECTED = "rejected"
    NEEDS_MORE_INFO = "needs_more_info"

class FeedbackType(str, enum.Enum):
    """Type of feedback"""
    GENERAL = "general"
    CORRECTION = "correction"
    QUESTION = "question"
    ERROR_REPORT = "error_report"

class DiagnosticSeverity(str, enum.Enum):
    """Severity level of a diagnosis"""
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"

class DiagnosticArea(str, enum.Enum):
    """Area of diagnosis (used for categorization)"""
    CARIES = "caries"
    PERIAPICAL = "periapical"
    PERIODONTAL = "periodontal"
    SOFT_TISSUE = "soft_tissue"
    TRAUMA = "trauma"
    ORTHODONTIC = "orthodontic"
    TMJ = "tmj"
    DEVELOPMENTAL = "developmental"
    OTHER = "other"

class UserRole(str, enum.Enum):
    """User roles for access control"""
    DENTIST = "dentist"
    HYGIENIST = "hygienist" 
    ASSISTANT = "assistant"
    ADMIN = "admin"
    SPECIALIST = "specialist"

# SQLAlchemy ORM Models
class DiagnosticFinding(Base):
    """SQLAlchemy model for diagnostic findings"""
    __tablename__ = "diagnostic_findings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(String, nullable=False, index=True)
    tooth_number = Column(Integer, nullable=True, index=True)
    diagnosis = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    area = Column(SQLEnum(DiagnosticArea), nullable=False)
    severity = Column(SQLEnum(DiagnosticSeverity), nullable=True)
    details = Column(JSON, nullable=True)
    image_id = Column(String, nullable=True, index=True)
    ai_generated = Column(Boolean, default=True)
    status = Column(SQLEnum(DiagnosisStatus), default=DiagnosisStatus.PENDING)
    model_version = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String, nullable=False, default="AI Assistant")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    updated_by = Column(String, nullable=True)
    
    # Relationships
    feedback = relationship("DiagnosticFeedback", back_populates="finding", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<DiagnosticFinding {self.id}: {self.diagnosis} (status: {self.status})>"

class DiagnosticFeedback(Base):
    """SQLAlchemy model for provider feedback on diagnostic findings"""
    __tablename__ = "diagnostic_feedback"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    finding_id = Column(UUID(as_uuid=True), ForeignKey("diagnostic_findings.id"), nullable=False)
    feedback_type = Column(SQLEnum(FeedbackType), nullable=False)
    feedback_text = Column(Text, nullable=False)
    correction = Column(String, nullable=True)
    provider_id = Column(String, nullable=False, index=True)
    provider_name = Column(String, nullable=False)
    provider_role = Column(SQLEnum(UserRole), nullable=False)
    is_learning_case = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    finding = relationship("DiagnosticFinding", back_populates="feedback")
    conversation = relationship("FeedbackConversation", back_populates="feedback", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<DiagnosticFeedback {self.id}: {self.feedback_type} for finding {self.finding_id}>"

class FeedbackConversation(Base):
    """SQLAlchemy model for conversation between provider and AI"""
    __tablename__ = "feedback_conversation"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    feedback_id = Column(UUID(as_uuid=True), ForeignKey("diagnostic_feedback.id"), nullable=False)
    sender = Column(String, nullable=False)  # 'provider' or 'ai'
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    feedback = relationship("DiagnosticFeedback", back_populates="conversation")
    
    def __repr__(self):
        return f"<FeedbackConversation {self.id}: from {self.sender}>"

# Pydantic models for API validation
class DiagnosticFindingBase(BaseModel):
    """Base model for diagnostic findings"""
    patient_id: str
    tooth_number: Optional[int] = None
    diagnosis: str
    confidence: float
    area: DiagnosticArea
    severity: Optional[DiagnosticSeverity] = None
    details: Optional[Dict[str, Any]] = None
    image_id: Optional[str] = None
    ai_generated: bool = True
    model_version: Optional[str] = None

class DiagnosticFindingCreate(DiagnosticFindingBase):
    """Model for creating a diagnostic finding"""
    created_by: str = "AI Assistant"

class DiagnosticFindingUpdate(BaseModel):
    """Model for updating a diagnostic finding"""
    status: Optional[DiagnosisStatus] = None
    diagnosis: Optional[str] = None
    confidence: Optional[float] = None
    severity: Optional[DiagnosticSeverity] = None
    details: Optional[Dict[str, Any]] = None
    updated_by: Optional[str] = None

class DiagnosticFindingResponse(DiagnosticFindingBase):
    """Model for diagnostic finding API response"""
    id: str
    status: DiagnosisStatus
    created_at: datetime
    created_by: str
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None
    
    class Config:
        orm_mode = True

class DiagnosticFeedbackBase(BaseModel):
    """Base model for diagnostic feedback"""
    feedback_type: FeedbackType
    feedback_text: str
    correction: Optional[str] = None
    provider_id: str
    provider_name: str
    provider_role: UserRole
    is_learning_case: bool = False

class DiagnosticFeedbackCreate(DiagnosticFeedbackBase):
    """Model for creating diagnostic feedback"""
    pass

class DiagnosticFeedbackResponse(DiagnosticFeedbackBase):
    """Model for diagnostic feedback API response"""
    id: str
    finding_id: str
    created_at: datetime
    
    class Config:
        orm_mode = True

class ConversationMessageCreate(BaseModel):
    """Model for creating a conversation message"""
    sender: str  # 'provider' or 'ai'
    message: str

class ConversationMessageResponse(ConversationMessageCreate):
    """Model for conversation message API response"""
    id: str
    feedback_id: str
    created_at: datetime
    
    class Config:
        orm_mode = True

class AIResponseRequest(BaseModel):
    """Model for requesting an AI response"""
    message: str
    provider_name: str
    provider_role: UserRole

class AIResponseData(BaseModel):
    """Model for AI response data"""
    response: str
    confidence: Optional[float] = None
    references: Optional[List[str]] = None
    alternatives: Optional[List[str]] = None 