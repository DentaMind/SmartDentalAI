from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum, Float, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from datetime import datetime
from .base import Base
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class FeedbackPriority(str, enum.Enum):
    """Priority level for feedback"""
    LOW = "low"
    MEDIUM = "medium" 
    HIGH = "high"

class CorrectionType(str, enum.Enum):
    """Type of correction needed"""
    FALSE_POSITIVE = "false_positive"
    WRONG_LOCATION = "wrong_location"
    WRONG_CLASSIFICATION = "wrong_classification"
    WRONG_SEVERITY = "wrong_severity"
    OTHER = "other"

# SQLAlchemy ORM Model
class AIFeedback(Base):
    """SQLAlchemy model for storing feedback on AI findings"""
    __tablename__ = "ai_feedback"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    finding_id = Column(String, nullable=False, index=True)
    provider_id = Column(String, nullable=False, index=True)
    patient_id = Column(String, nullable=False, index=True)
    is_correct = Column(Boolean, nullable=False)
    correction_type = Column(Enum(CorrectionType), nullable=True)
    correction_details = Column(Text, nullable=True)
    priority = Column(Enum(FeedbackPriority), default=FeedbackPriority.MEDIUM)
    model_version = Column(String, nullable=True)
    clinic_id = Column(String, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<AIFeedback {self.id}: {'correct' if self.is_correct else 'incorrect'} for finding {self.finding_id}>"

class AIModelMetrics(Base):
    """SQLAlchemy model for storing model performance metrics"""
    __tablename__ = "ai_model_metrics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_version = Column(String, nullable=False, index=True)
    model_type = Column(String, nullable=False)  # e.g., 'caries', 'perio', 'general'
    accuracy = Column(Float, nullable=False)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    false_positives = Column(Integer, nullable=True)
    false_negatives = Column(Integer, nullable=True)
    confusion_matrix = Column(JSON, nullable=True)
    total_samples = Column(Integer, nullable=False)
    training_duration = Column(Float, nullable=True)  # in seconds
    last_trained = Column(DateTime(timezone=True), nullable=False)
    trained_by = Column(String, nullable=True)  # user or system that initiated training
    clinic_id = Column(String, nullable=True, index=True)  # for clinic-specific models
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<AIModelMetrics {self.model_version}: acc={self.accuracy:.2f}, samples={self.total_samples}>"

class AITrainingJob(Base):
    """SQLAlchemy model for tracking AI model training jobs"""
    __tablename__ = "ai_training_jobs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_version = Column(String, nullable=False)
    status = Column(String, nullable=False, default="queued")  # queued, in_progress, completed, failed
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    triggered_by = Column(String, nullable=True)  # user or system that initiated training
    feedback_count = Column(Integer, nullable=False, default=0)  # number of feedback items included
    parameters = Column(JSON, nullable=True)  # hyperparameters and other settings
    error_message = Column(Text, nullable=True)
    metrics_id = Column(UUID(as_uuid=True), ForeignKey("ai_model_metrics.id"), nullable=True)
    clinic_id = Column(String, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship to the metrics produced by this job
    metrics = relationship("AIModelMetrics")
    
    def __repr__(self):
        return f"<AITrainingJob {self.id}: {self.status} for {self.model_version}>"

# Pydantic models for API validation
class AIFeedbackCreate(BaseModel):
    """Pydantic model for creating feedback"""
    finding_id: str
    provider_id: str
    patient_id: str
    is_correct: bool
    correction_type: Optional[CorrectionType] = None
    correction_details: Optional[str] = None
    priority: FeedbackPriority = FeedbackPriority.MEDIUM
    model_version: Optional[str] = None
    clinic_id: Optional[str] = None

class AIFeedbackResponse(BaseModel):
    """Pydantic model for feedback response"""
    id: str
    finding_id: str
    provider_id: str
    is_correct: bool
    correction_type: Optional[CorrectionType] = None
    correction_details: Optional[str] = None
    priority: FeedbackPriority
    created_at: datetime
    
    class Config:
        orm_mode = True

class AIModelMetricsResponse(BaseModel):
    """Pydantic model for model metrics response"""
    id: str
    model_version: str
    model_type: str
    accuracy: float
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    false_positives: Optional[int] = None
    false_negatives: Optional[int] = None
    confusion_matrix: Optional[Dict[str, Any]] = None
    total_samples: int
    last_trained: datetime
    
    class Config:
        orm_mode = True

class AITrainingJobCreate(BaseModel):
    """Pydantic model for creating a training job"""
    model_version: str
    triggered_by: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    clinic_id: Optional[str] = None

class AITrainingJobResponse(BaseModel):
    """Pydantic model for training job response"""
    id: str
    model_version: str
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    triggered_by: Optional[str] = None
    feedback_count: int
    parameters: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime
    
    class Config:
        orm_mode = True

class AITrainingJobUpdate(BaseModel):
    """Pydantic model for updating training job status"""
    status: str
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    metrics_id: Optional[str] = None

# Treatment feedback action types
class FeedbackAction(str, enum.Enum):
    accepted = "accepted"
    rejected = "rejected"
    modified = "modified"

# Modified treatment details
class ModifiedTreatment(BaseModel):
    procedure_name: Optional[str] = None
    procedure_code: Optional[str] = None
    priority: Optional[str] = None

# Base model for treatment feedback
class TreatmentFeedbackBase(BaseModel):
    treatment_suggestion_id: str
    diagnosis_id: str
    patient_id: str
    provider_id: str
    action: FeedbackAction
    confidence: Optional[float] = None
    relevance_score: Optional[float] = None
    evidence_quality_rating: Optional[int] = None
    comment: Optional[str] = None
    modified_treatment: Optional[ModifiedTreatment] = None

# Model for creating treatment feedback
class TreatmentFeedbackCreate(TreatmentFeedbackBase):
    pass

# Model for DB treatment feedback with additional fields
class TreatmentFeedback(TreatmentFeedbackBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# Model for evidence feedback
class EvidenceFeedbackBase(BaseModel):
    evidence_id: str
    treatment_suggestion_id: str
    provider_id: str
    relevance_score: float = Field(..., ge=0.0, le=1.0, description="How relevant the provider found this evidence (0-1)")
    accuracy: int = Field(..., ge=1, le=5, description="How accurate the provider found this evidence (1-5)")
    comment: Optional[str] = None

# Model for creating evidence feedback
class EvidenceFeedbackCreate(EvidenceFeedbackBase):
    pass

# Model for DB evidence feedback with additional fields
class EvidenceFeedback(EvidenceFeedbackBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

# Request model for bulk evidence feedback
class BulkEvidenceFeedback(BaseModel):
    feedback: List[EvidenceFeedbackCreate]

# Response model for bulk operations
class BulkOperationResponse(BaseModel):
    count: int
    success: bool
    message: str

# Response model for feedback summary
class FeedbackSummary(BaseModel):
    total_count: int
    accepted_count: int
    rejected_count: int
    modified_count: int
    confidence_avg: Optional[float] = None
    relevance_score_avg: Optional[float] = None
    evidence_quality_rating_avg: Optional[float] = None

# Response model for evidence feedback summary
class EvidenceFeedbackSummary(BaseModel):
    total_count: int
    relevance_score_avg: float
    accuracy_avg: float
    recent_comments: List[Dict[str, Any]] 