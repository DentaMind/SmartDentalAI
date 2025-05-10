from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

from .base import Base
from .treatment_plan import PriorityLevel

class SuggestionStatus(str, enum.Enum):
    """Status of a treatment suggestion"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    MODIFIED = "modified"
    REJECTED = "rejected"

class ConfidenceLevel(str, enum.Enum):
    """Confidence level of the AI suggestion"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"

class AISuggestionSource(str, enum.Enum):
    """Source of the AI suggestion"""
    XRAY = "xray"
    CLINICAL_NOTES = "clinical_notes"
    PATIENT_HISTORY = "patient_history"
    PERIO_CHART = "perio_chart"
    MULTIMODAL = "multimodal"

class AITreatmentSuggestion(Base):
    """SQLAlchemy model for AI-generated treatment suggestions"""
    __tablename__ = "ai_treatment_suggestions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(String, nullable=False, index=True)
    diagnosis_id = Column(String, ForeignKey("image_diagnosis.id"), index=True)
    finding_id = Column(String, nullable=True, index=True)  # ID of the specific finding within the diagnosis
    
    # Suggestion details
    procedure_code = Column(String)  # CDT code
    procedure_name = Column(String, nullable=False)
    procedure_description = Column(Text)
    tooth_number = Column(String)
    surface = Column(String)
    
    # AI metadata
    confidence = Column(Float, nullable=False)  # 0.0 to 1.0
    confidence_level = Column(Enum(ConfidenceLevel), default=ConfidenceLevel.MEDIUM)
    reasoning = Column(Text, nullable=False)  # AI's reasoning for the suggestion
    alternatives = Column(JSON)  # Alternative treatments
    source = Column(Enum(AISuggestionSource), default=AISuggestionSource.XRAY)
    model_version = Column(String)
    
    # Clinical relevance
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.MEDIUM)
    urgency_days = Column(Integer)  # Recommended treatment within X days
    clinical_benefits = Column(Text)
    potential_complications = Column(Text)
    evidence_citations = Column(JSON)  # Scientific citations backing the suggestion
    
    # Status tracking
    status = Column(Enum(SuggestionStatus), default=SuggestionStatus.PENDING)
    clinician_notes = Column(Text)
    modified_procedure = Column(String)  # If clinician modified the suggestion
    rejection_reason = Column(Text)  # If rejected, why
    clinical_override_reason = Column(Text)  # Reason for any clinical modifications
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    reviewed_at = Column(DateTime(timezone=True))
    reviewed_by = Column(String)  # Clinician ID
    
    # Relationships
    diagnosis = relationship("ImageDiagnosis", foreign_keys=[diagnosis_id])
    
    def __repr__(self):
        return f"<AITreatmentSuggestion {self.id}: {self.procedure_name} for tooth {self.tooth_number}>"

class TreatmentSuggestionGroup(Base):
    """SQLAlchemy model for grouping related treatment suggestions"""
    __tablename__ = "ai_treatment_suggestion_groups"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    condition_category = Column(String)  # e.g., "Caries", "Periodontal", "Endodontic"
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.MEDIUM)
    suggestions = Column(JSON)  # List of suggestion IDs in this group
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<TreatmentSuggestionGroup {self.id}: {self.title}>"

# Pydantic models for API request/response validation

class AITreatmentSuggestionCreate(BaseModel):
    """Pydantic model for creating AI treatment suggestions"""
    patient_id: str
    diagnosis_id: str
    finding_id: Optional[str] = None
    procedure_code: Optional[str] = None
    procedure_name: str
    procedure_description: Optional[str] = None
    tooth_number: Optional[str] = None
    surface: Optional[str] = None
    confidence: float
    confidence_level: ConfidenceLevel = ConfidenceLevel.MEDIUM
    reasoning: str
    alternatives: Optional[List[Dict[str, Any]]] = None
    source: AISuggestionSource = AISuggestionSource.XRAY
    model_version: Optional[str] = None
    priority: PriorityLevel = PriorityLevel.MEDIUM
    urgency_days: Optional[int] = None
    clinical_benefits: Optional[str] = None
    potential_complications: Optional[str] = None
    evidence_citations: Optional[List[Dict[str, str]]] = None

class AITreatmentSuggestionResponse(BaseModel):
    """Pydantic model for AI treatment suggestion responses"""
    id: str
    patient_id: str
    diagnosis_id: str
    finding_id: Optional[str] = None
    procedure_code: Optional[str] = None
    procedure_name: str
    procedure_description: Optional[str] = None
    tooth_number: Optional[str] = None
    surface: Optional[str] = None
    confidence: float
    confidence_level: ConfidenceLevel
    reasoning: str
    alternatives: Optional[List[Dict[str, Any]]] = None
    source: AISuggestionSource
    model_version: Optional[str] = None
    priority: PriorityLevel
    urgency_days: Optional[int] = None
    clinical_benefits: Optional[str] = None
    potential_complications: Optional[str] = None
    evidence_citations: Optional[List[Dict[str, str]]] = None
    status: SuggestionStatus
    clinician_notes: Optional[str] = None
    modified_procedure: Optional[str] = None
    rejection_reason: Optional[str] = None
    clinical_override_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    
    class Config:
        orm_mode = True

class TreatmentSuggestionGroupCreate(BaseModel):
    """Pydantic model for creating treatment suggestion groups"""
    patient_id: str
    title: str
    description: Optional[str] = None
    condition_category: Optional[str] = None
    priority: PriorityLevel = PriorityLevel.MEDIUM
    suggestions: List[str]  # List of suggestion IDs

class TreatmentSuggestionGroupResponse(BaseModel):
    """Pydantic model for treatment suggestion group responses"""
    id: str
    patient_id: str
    title: str
    description: Optional[str] = None
    condition_category: Optional[str] = None
    priority: PriorityLevel
    suggestions: List[str]
    created_at: datetime
    
    class Config:
        orm_mode = True

class TreatmentSuggestionGroupWithDetails(TreatmentSuggestionGroupResponse):
    """Pydantic model for treatment suggestion groups with detailed suggestions"""
    suggestions_details: List[AITreatmentSuggestionResponse]
    
    class Config:
        orm_mode = True

class AITreatmentSuggestionUpdate(BaseModel):
    """Pydantic model for updating AI treatment suggestions"""
    status: Optional[SuggestionStatus] = None
    clinician_notes: Optional[str] = None
    modified_procedure: Optional[str] = None
    rejection_reason: Optional[str] = None
    clinical_override_reason: Optional[str] = None
    priority: Optional[PriorityLevel] = None 