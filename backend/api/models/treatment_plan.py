from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Text, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

from .base import Base

class PriorityLevel(str, enum.Enum):
    """Priority level for treatment procedures"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TreatmentPlan(Base):
    """SQLAlchemy model for treatment plans"""
    __tablename__ = "treatment_plans"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(String, nullable=False, index=True)
    diagnosis_id = Column(String, index=True)
    title = Column(String)
    description = Column(Text)
    notes = Column(Text)
    status = Column(String, default="draft")  # draft, approved, in_progress, completed, cancelled
    priority = Column(String, default="medium")
    approved_by = Column(String)
    approved_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Medical information
    medical_alerts = Column(ARRAY(String))
    
    # Financial information
    total_fee = Column(Float, default=0.0)
    insurance_verified = Column(Boolean, default=False)
    insurance_portion = Column(Float, default=0.0)
    patient_portion = Column(Float, default=0.0)
    insurance_notes = Column(Text)
    financial_options = Column(JSON)
    
    # Relationships
    procedures = relationship("TreatmentProcedure", back_populates="treatment_plan", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<TreatmentPlan {self.id}: {self.status}>"

class TreatmentProcedure(Base):
    """SQLAlchemy model for treatment procedures within a plan"""
    __tablename__ = "treatment_procedures"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    treatment_plan_id = Column(UUID(as_uuid=True), ForeignKey("treatment_plans.id"), nullable=False)
    tooth_number = Column(String)
    cdt_code = Column(String)
    procedure_name = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="recommended")  # recommended, approved, scheduled, completed, cancelled
    priority = Column(String, default="medium")
    notes = Column(Text)
    reasoning = Column(Text)  # Reasoning from AI for this procedure
    ai_suggested = Column(Boolean, default=False)
    doctor_approved = Column(Boolean, default=False)
    doctor_reasoning = Column(Text)  # Doctor's reasoning for approving/modifying
    modified_by_doctor = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True))
    scheduled_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Insurance information
    insurance_coverage = Column(Integer)  # Coverage percentage
    insurance_coverage_note = Column(String)
    
    # Relationships
    treatment_plan = relationship("TreatmentPlan", back_populates="procedures")
    
    def __repr__(self):
        return f"<TreatmentProcedure {self.id}: {self.procedure_name} on tooth {self.tooth_number}>"

# Pydantic models for API validation
class TreatmentProcedureCreate(BaseModel):
    """Pydantic model for creating treatment procedures"""
    treatment_plan_id: str
    tooth_number: Optional[str] = None
    cdt_code: Optional[str] = None
    procedure_name: str
    description: Optional[str] = None
    status: str = "recommended"
    priority: str = "medium"
    notes: Optional[str] = None
    reasoning: Optional[str] = None
    ai_suggested: bool = False

class TreatmentPlanCreate(BaseModel):
    """Pydantic model for creating treatment plans"""
    patient_id: str
    diagnosis_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    status: str = "draft"
    priority: str = "medium"
    medical_alerts: Optional[List[str]] = None

class TreatmentProcedureResponse(BaseModel):
    """Pydantic model for treatment procedure response"""
    id: str
    treatment_plan_id: str
    tooth_number: Optional[str] = None
    cdt_code: Optional[str] = None
    procedure_name: str
    description: Optional[str] = None
    status: str
    priority: str
    notes: Optional[str] = None
    reasoning: Optional[str] = None
    ai_suggested: bool
    doctor_approved: bool
    doctor_reasoning: Optional[str] = None
    modified_by_doctor: bool
    insurance_coverage: Optional[int] = None
    insurance_coverage_note: Optional[str] = None
    created_at: datetime
    
    class Config:
        orm_mode = True

class TreatmentPlanResponse(BaseModel):
    """Pydantic model for treatment plan response"""
    id: str
    patient_id: str
    diagnosis_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    status: str
    priority: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    medical_alerts: Optional[List[str]] = None
    total_fee: float
    insurance_verified: bool
    insurance_portion: float
    patient_portion: float
    insurance_notes: Optional[str] = None
    created_at: datetime
    
    class Config:
        orm_mode = True

class TreatmentPlanDetailResponse(TreatmentPlanResponse):
    """Pydantic model for detailed treatment plan response including procedures"""
    procedures: List[TreatmentProcedureResponse]
    financial_options: Optional[Dict[str, Any]] = None
    
    class Config:
        orm_mode = True 