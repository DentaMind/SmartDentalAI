from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, Enum, JSON, DateTime, Table, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.sql import func
import uuid
import enum
from datetime import datetime
from typing import List, Optional

from .base import Base

# Enums for Medical History

class ASAClassification(str, enum.Enum):
    """ASA Physical Status Classification System"""
    CLASS_I = "I"    # Normal healthy patient
    CLASS_II = "II"   # Patient with mild systemic disease
    CLASS_III = "III"  # Patient with severe systemic disease
    CLASS_IV = "IV"   # Patient with severe systemic disease that is a constant threat to life
    CLASS_V = "V"    # Moribund patient who is not expected to survive without the operation
    CLASS_VI = "VI"   # Declared brain-dead patient whose organs are being removed for donor purposes

class AllergyType(str, enum.Enum):
    """Types of allergies"""
    MEDICATION = "MEDICATION"
    FOOD = "FOOD"
    ENVIRONMENTAL = "ENVIRONMENTAL"
    LATEX = "LATEX"
    CONTRAST = "CONTRAST"
    OTHER = "OTHER"

class AllergyReaction(str, enum.Enum):
    """Types of allergic reactions"""
    ANAPHYLAXIS = "ANAPHYLAXIS"
    RASH = "RASH"
    HIVES = "HIVES"
    SWELLING = "SWELLING"
    RESPIRATORY = "RESPIRATORY"
    GI = "GI"
    UNKNOWN = "UNKNOWN"
    OTHER = "OTHER"

class AllergyStatus(str, enum.Enum):
    """Status of an allergy"""
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    RESOLVED = "RESOLVED"

class MedicationType(str, enum.Enum):
    """Types of medications"""
    PRESCRIPTION = "PRESCRIPTION"
    OTC = "OTC"
    HERBAL = "HERBAL"
    SUPPLEMENT = "SUPPLEMENT"
    OTHER = "OTHER"

# Models

class MedicalHistory(Base):
    """Medical history for a patient"""
    __tablename__ = "medical_histories"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    
    # Common medical conditions
    has_heart_disease = Column(Boolean, default=False)
    has_diabetes = Column(Boolean, default=False)
    has_hypertension = Column(Boolean, default=False)
    has_respiratory_disease = Column(Boolean, default=False)
    has_bleeding_disorder = Column(Boolean, default=False)
    current_smoker = Column(Boolean, default=False)
    pregnant = Column(Boolean, default=False)
    
    # Additional fields
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    patient = relationship("Patient", back_populates="medical_history")
    conditions = relationship("MedicalCondition", back_populates="medical_history", cascade="all, delete-orphan")

class MedicalCondition(Base):
    """Specific medical condition for a patient"""
    __tablename__ = "medical_conditions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    medical_history_id = Column(String, ForeignKey("medical_histories.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String, nullable=False)
    icd_code = Column(String)
    severity = Column(String)  # mild, moderate, severe
    is_controlled = Column(Boolean, default=False)
    last_episode = Column(DateTime)
    diagnosis_date = Column(DateTime)
    notes = Column(Text)
    
    # Array of dental considerations related to this condition
    dental_considerations = Column(ARRAY(String), default=[])
    
    # Relationships
    medical_history = relationship("MedicalHistory", back_populates="conditions")

class Allergy(Base):
    """Patient allergy information"""
    __tablename__ = "allergies"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    
    allergen = Column(String, nullable=False)
    type = Column(Enum(AllergyType), default=AllergyType.OTHER)
    reaction = Column(Enum(AllergyReaction), default=AllergyReaction.UNKNOWN)
    severity = Column(String)  # mild, moderate, severe
    status = Column(Enum(AllergyStatus), default=AllergyStatus.ACTIVE)
    onset_date = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    patient = relationship("Patient", back_populates="allergies")

class Medication(Base):
    """Patient medication information"""
    __tablename__ = "medications"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String, nullable=False)
    dosage = Column(String)
    frequency = Column(String)
    type = Column(Enum(MedicationType), default=MedicationType.PRESCRIPTION)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    prescribing_provider = Column(String)
    reason = Column(String)
    
    # Array of dental considerations related to this medication
    dental_considerations = Column(ARRAY(String), default=[])
    
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    patient = relationship("Patient", back_populates="medications")

class MedicalHistoryStatus(Base):
    """Current status of a patient's medical history including ASA classification"""
    __tablename__ = "medical_history_statuses"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    
    asa_classification = Column(Enum(ASAClassification), default=ASAClassification.CLASS_I)
    last_reviewed = Column(DateTime, default=datetime.now)
    status = Column(String, default="current")  # current, outdated, requires_update
    reviewed_by = Column(String)  # Provider who last reviewed the history
    
    # Relationships
    patient = relationship("Patient", back_populates="medical_history_status") 