from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, Enum, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from datetime import datetime

from .base import Base

class Gender(str, enum.Enum):
    """Patient gender"""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    UNKNOWN = "unknown"

class InsuranceType(str, enum.Enum):
    """Types of insurance"""
    PRIVATE = "private"
    MEDICARE = "medicare"
    MEDICAID = "medicaid"
    SELF_PAY = "self_pay"
    OTHER = "other"

class Patient(Base):
    """Patient information model"""
    __tablename__ = "patients"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Basic information
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    date_of_birth = Column(DateTime, nullable=False)
    gender = Column(Enum(Gender), default=Gender.UNKNOWN)
    
    # Contact information
    email = Column(String)
    phone = Column(String)
    address = Column(String)
    
    # Insurance information
    insurance_provider = Column(String)
    insurance_id = Column(String)
    insurance_group = Column(String)
    insurance_type = Column(Enum(InsuranceType), default=InsuranceType.OTHER)
    
    # Account information
    account_number = Column(String, unique=True)
    registration_date = Column(DateTime, default=datetime.now)
    
    # Status and metadata
    is_active = Column(Boolean, default=True)
    preferred_language = Column(String, default="English")
    preferred_contact_method = Column(String, default="email")
    emergency_contact_name = Column(String)
    emergency_contact_phone = Column(String)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    last_visit = Column(DateTime)
    
    # Relationships
    medical_history = relationship("MedicalHistory", back_populates="patient", uselist=False, cascade="all, delete-orphan")
    allergies = relationship("Allergy", back_populates="patient", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="patient", cascade="all, delete-orphan")
    medical_history_status = relationship("MedicalHistoryStatus", back_populates="patient", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Patient {self.first_name} {self.last_name}, DOB: {self.date_of_birth}>" 