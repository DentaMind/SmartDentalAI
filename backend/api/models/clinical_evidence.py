from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Text, Enum, Table
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
import enum
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field, HttpUrl

from .base import Base

class EvidenceType(str, enum.Enum):
    """Type of clinical evidence"""
    GUIDELINE = "guideline"  # Clinical practice guidelines
    SYSTEMATIC_REVIEW = "systematic_review"  # Systematic reviews and meta-analyses
    CLINICAL_TRIAL = "clinical_trial"  # Randomized controlled trials
    COHORT_STUDY = "cohort_study"  # Cohort studies
    CASE_CONTROL = "case_control"  # Case-control studies
    CASE_SERIES = "case_series"  # Case series
    EXPERT_OPINION = "expert_opinion"  # Expert opinion

class EvidenceGrade(str, enum.Enum):
    """Evidence quality grading based on GRADE methodology"""
    A = "A"  # High quality evidence
    B = "B"  # Moderate quality evidence
    C = "C"  # Low quality evidence
    D = "D"  # Very low quality evidence

class ClinicalEvidence(Base):
    """SQLAlchemy model for clinical evidence citations"""
    __tablename__ = "clinical_evidence"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Bibliographic information
    title = Column(String, nullable=False)
    authors = Column(String)  # Author names as string, e.g., "Smith J, Johnson K, et al."
    publication = Column(String)  # Journal or guideline name
    publication_date = Column(DateTime)
    doi = Column(String, index=True)  # Digital Object Identifier
    url = Column(String)  # URL to the source
    
    # Classification
    evidence_type = Column(Enum(EvidenceType), nullable=False)
    evidence_grade = Column(Enum(EvidenceGrade), nullable=False)
    
    # Content
    summary = Column(Text)  # Brief summary of the evidence
    recommendations = Column(JSONB)  # Structured recommendations
    
    # Metadata
    specialties = Column(JSONB)  # List of dental specialties this evidence applies to
    conditions = Column(JSONB)  # List of conditions this evidence applies to
    procedures = Column(JSONB)  # List of procedures this evidence applies to
    keywords = Column(JSONB)  # Keywords for searching
    
    # Versioning and timestamps
    version = Column(String)  # Version of the guideline or publication (e.g., "2020 Update")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<ClinicalEvidence {self.id}: {self.title}>"

# Association table for many-to-many relationship between findings and evidence
finding_evidence_association = Table(
    'finding_evidence_association', 
    Base.metadata,
    Column('finding_type', String, nullable=False, index=True),
    Column('evidence_id', UUID(as_uuid=True), ForeignKey('clinical_evidence.id'), nullable=False),
    Column('relevance_score', Float)  # How relevant this evidence is to the finding (0.0 to 1.0)
)

# Association table for many-to-many relationship between treatments and evidence
treatment_evidence_association = Table(
    'treatment_evidence_association', 
    Base.metadata,
    Column('procedure_code', String, nullable=False, index=True),
    Column('evidence_id', UUID(as_uuid=True), ForeignKey('clinical_evidence.id'), nullable=False),
    Column('relevance_score', Float)  # How relevant this evidence is to the treatment (0.0 to 1.0)
)

# Pydantic models for API request/response validation

class EvidenceCitation(BaseModel):
    """Base model for evidence citation information"""
    title: str
    authors: Optional[str] = None
    publication: Optional[str] = None
    publication_date: Optional[datetime] = None
    doi: Optional[str] = None
    url: Optional[str] = None
    evidence_type: EvidenceType
    evidence_grade: EvidenceGrade
    summary: Optional[str] = None
    page_reference: Optional[str] = None  # Page number or section reference
    quote: Optional[str] = None  # Direct quote from the source

class ClinicalEvidenceCreate(BaseModel):
    """Pydantic model for creating clinical evidence"""
    title: str
    authors: Optional[str] = None
    publication: Optional[str] = None
    publication_date: Optional[datetime] = None
    doi: Optional[str] = None
    url: Optional[str] = None
    evidence_type: EvidenceType
    evidence_grade: EvidenceGrade
    summary: Optional[str] = None
    recommendations: Optional[List[Dict[str, Any]]] = None
    specialties: Optional[List[str]] = None
    conditions: Optional[List[str]] = None
    procedures: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    version: Optional[str] = None

class ClinicalEvidenceResponse(BaseModel):
    """Pydantic model for clinical evidence responses"""
    id: str
    title: str
    authors: Optional[str] = None
    publication: Optional[str] = None
    publication_date: Optional[datetime] = None
    doi: Optional[str] = None
    url: Optional[str] = None
    evidence_type: EvidenceType
    evidence_grade: EvidenceGrade
    summary: Optional[str] = None
    recommendations: Optional[List[Dict[str, Any]]] = None
    specialties: Optional[List[str]] = None
    conditions: Optional[List[str]] = None
    procedures: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    version: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class EvidenceAssociationCreate(BaseModel):
    """Pydantic model for creating evidence associations"""
    entity_type: str  # "finding" or "treatment"
    entity_id: str  # Finding type or procedure code
    evidence_id: str
    relevance_score: Optional[float] = 0.7

class FindingEvidenceRequest(BaseModel):
    """Pydantic model for requesting evidence for a finding"""
    finding_type: str
    specialty: Optional[str] = None
    limit: Optional[int] = 5

class TreatmentEvidenceRequest(BaseModel):
    """Pydantic model for requesting evidence for a treatment"""
    procedure_code: str
    finding_type: Optional[str] = None
    specialty: Optional[str] = None
    limit: Optional[int] = 5 