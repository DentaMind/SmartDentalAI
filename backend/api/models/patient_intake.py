from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Integer, Text, Float, ARRAY
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from datetime import datetime

from ..database import Base

class PatientIntakeForm(Base):
    """
    Patient intake form model to store comprehensive intake information
    in a structured but flexible format.
    
    This uses JSONB columns for maximum flexibility while maintaining 
    queryability of important fields.
    """
    __tablename__ = "patient_intake_forms"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Core data fields using JSONB for flexible schemas
    personal_info = Column(JSONB, nullable=False)
    medical_history = Column(JSONB, nullable=True)
    dental_history = Column(JSONB, nullable=True)
    insurance_info = Column(JSONB, nullable=True)
    emergency_contact = Column(JSONB, nullable=True)
    
    # Form status fields
    consent = Column(Boolean, default=False, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    completion_date = Column(DateTime, nullable=True)
    
    # Audit fields
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by = Column(String, nullable=True)
    updated_by = Column(String, nullable=True)
    submitted_ip = Column(String, nullable=True)
    
    # Relationships
    patient = relationship("Patient", back_populates="intake_forms")
    ai_suggestions = relationship("PatientIntakeAISuggestion", back_populates="intake_form", cascade="all, delete-orphan")
    versions = relationship("PatientIntakeVersioning", back_populates="intake_form", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<PatientIntakeForm(id={self.id}, patient_id={self.patient_id}, created_at={self.created_at})>"


class PatientIntakeAISuggestion(Base):
    """
    Stores AI-generated suggestions for patient intake forms.
    
    This allows tracking which suggestions were made, their confidence levels,
    and which ones were accepted by healthcare providers.
    """
    __tablename__ = "patient_intake_ai_suggestions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    intake_form_id = Column(String, ForeignKey("patient_intake_forms.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # AI suggestion data
    suggestions = Column(JSONB, nullable=False)
    ai_model_version = Column(String, nullable=True)
    confidence_score = Column(Float, nullable=True)
    reasoning = Column(Text, nullable=True)
    fields_considered = Column(ARRAY(String), nullable=True)
    
    # Audit and tracking
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    feedback = Column(JSONB, nullable=True)  # Store provider feedback on suggestions
    applied_suggestions = Column(JSONB, nullable=True)  # Which suggestions were applied
    
    # Relationships
    intake_form = relationship("PatientIntakeForm", back_populates="ai_suggestions")
    patient = relationship("Patient")
    
    def __repr__(self):
        return f"<PatientIntakeAISuggestion(id={self.id}, form_id={self.intake_form_id})>"


class PatientIntakeVersioning(Base):
    """
    Tracks changes to patient intake forms over time.
    
    Each time a form is updated, a new version record is created with the complete
    form data at that point, along with metadata about what changed and why.
    """
    __tablename__ = "patient_intake_versioning"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    intake_form_id = Column(String, ForeignKey("patient_intake_forms.id", ondelete="CASCADE"), nullable=False, index=True)
    version_num = Column(Integer, nullable=False)
    
    # Version data
    form_data = Column(JSONB, nullable=False)  # Complete snapshot of form at this version
    changed_fields = Column(JSONB, nullable=True)  # Which fields changed from previous version
    
    # Audit fields
    changed_by = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    comment = Column(Text, nullable=True)
    
    # Relationships
    intake_form = relationship("PatientIntakeForm", back_populates="versions")
    
    def __repr__(self):
        return f"<PatientIntakeVersioning(form_id={self.intake_form_id}, version={self.version_num})>" 