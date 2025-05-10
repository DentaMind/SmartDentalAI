from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Text, ARRAY, Table
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field, validator

from .base import Base

class PriorityLevel(str, enum.Enum):
    """Priority level for treatment procedures"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"
    
class PlanPhase(str, enum.Enum):
    """Treatment plan phases"""
    URGENT = "urgent"
    PHASE_1 = "phase_1"
    PHASE_2 = "phase_2"
    MAINTENANCE = "maintenance"

class PlanStatus(str, enum.Enum):
    """Treatment plan status"""
    DRAFT = "draft"
    PROPOSED = "proposed"
    APPROVED = "approved"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    
class ProcedureStatus(str, enum.Enum):
    """Procedure status"""
    RECOMMENDED = "recommended"
    PLANNED = "planned"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Versioning table for treatment plans
treatment_plan_versions = Table(
    'treatment_plan_versions',
    Base.metadata,
    Column('treatment_plan_id', UUID(as_uuid=True), ForeignKey('treatment_plans.id'), primary_key=True),
    Column('version', Integer, primary_key=True),
    Column('data', JSON, nullable=False),
    Column('created_by', String, nullable=False),
    Column('created_at', DateTime(timezone=True), server_default=func.now()),
    Column('notes', Text)
)

class TreatmentPlan(Base):
    """SQLAlchemy model for treatment plans"""
    __tablename__ = "treatment_plans"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(String, nullable=False, index=True)
    diagnosis_id = Column(String, index=True)
    title = Column(String)
    description = Column(Text)
    notes = Column(Text)
    status = Column(String, default="draft")  # draft, proposed, approved, in_progress, completed, cancelled
    priority = Column(String, default="medium")
    
    # Versioning
    current_version = Column(Integer, default=1)
    
    # Provider information
    created_by = Column(String, nullable=False)
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
    
    # Consent information
    consent_signed = Column(Boolean, default=False)
    consent_signed_by = Column(String)
    consent_signed_at = Column(DateTime(timezone=True))
    
    # AI information
    ai_assisted = Column(Boolean, default=False)
    ai_model_version = Column(String)
    ai_confidence_score = Column(Float)
    
    # Audit trail
    last_modified_by = Column(String)
    
    # Relationships
    procedures = relationship("TreatmentProcedure", back_populates="treatment_plan", cascade="all, delete-orphan")
    history = relationship("TreatmentPlanAudit", back_populates="treatment_plan", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<TreatmentPlan {self.id}: {self.status}>"
        
    def create_version(self, session, created_by, notes=None):
        """Create a new version of this treatment plan"""
        version_data = {
            'patient_id': self.patient_id,
            'diagnosis_id': self.diagnosis_id,
            'title': self.title,
            'description': self.description,
            'notes': self.notes,
            'status': self.status,
            'priority': self.priority,
            'medical_alerts': self.medical_alerts,
            'total_fee': self.total_fee,
            'insurance_verified': self.insurance_verified,
            'insurance_portion': self.insurance_portion,
            'patient_portion': self.patient_portion,
            'insurance_notes': self.insurance_notes,
            'financial_options': self.financial_options,
            'procedures': [
                {
                    'id': str(proc.id),
                    'tooth_number': proc.tooth_number,
                    'cdt_code': proc.cdt_code,
                    'procedure_name': proc.procedure_name,
                    'description': proc.description,
                    'status': proc.status,
                    'priority': proc.priority,
                    'phase': proc.phase,
                    'fee': proc.fee,
                    'insurance_coverage': proc.insurance_coverage,
                    'insurance_coverage_note': proc.insurance_coverage_note
                }
                for proc in self.procedures
            ]
        }
        
        stmt = treatment_plan_versions.insert().values(
            treatment_plan_id=self.id,
            version=self.current_version,
            data=version_data,
            created_by=created_by,
            notes=notes
        )
        
        session.execute(stmt)
        self.current_version += 1
        self.last_modified_by = created_by
        session.flush()

class TreatmentPlanAudit(Base):
    """Audit trail for treatment plans"""
    __tablename__ = "treatment_plan_audit"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    treatment_plan_id = Column(UUID(as_uuid=True), ForeignKey("treatment_plans.id"), nullable=False)
    action = Column(String, nullable=False)  # created, updated, deleted, status_changed
    action_by = Column(String, nullable=False)
    action_at = Column(DateTime(timezone=True), server_default=func.now())
    details = Column(JSON)
    
    # Relationship
    treatment_plan = relationship("TreatmentPlan", back_populates="history")

class TreatmentProcedure(Base):
    """SQLAlchemy model for treatment procedures within a plan"""
    __tablename__ = "treatment_procedures"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    treatment_plan_id = Column(UUID(as_uuid=True), ForeignKey("treatment_plans.id"), nullable=False)
    tooth_number = Column(String)
    cdt_code = Column(String)
    procedure_name = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="recommended")  # recommended, planned, scheduled, in_progress, completed, cancelled
    priority = Column(String, default="medium")
    phase = Column(String, default="phase_1")  # urgent, phase_1, phase_2, maintenance
    fee = Column(Float, default=0.0)
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
    
    # Clinical data
    surfaces = Column(ARRAY(String))
    quadrant = Column(String)
    arch = Column(String)
    
    # Pre-authorization
    preauth_required = Column(Boolean, default=False)
    preauth_status = Column(String)
    preauth_date = Column(DateTime(timezone=True))
    
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
    status: ProcedureStatus = ProcedureStatus.RECOMMENDED
    priority: PriorityLevel = PriorityLevel.MEDIUM
    phase: PlanPhase = PlanPhase.PHASE_1
    fee: float = 0.0
    notes: Optional[str] = None
    reasoning: Optional[str] = None
    ai_suggested: bool = False
    surfaces: Optional[List[str]] = None
    quadrant: Optional[str] = None
    arch: Optional[str] = None
    preauth_required: bool = False

class TreatmentPlanCreate(BaseModel):
    """Pydantic model for creating treatment plans"""
    patient_id: str
    diagnosis_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    status: PlanStatus = PlanStatus.DRAFT
    priority: PriorityLevel = PriorityLevel.MEDIUM
    medical_alerts: Optional[List[str]] = None
    created_by: str
    ai_assisted: bool = False
    ai_model_version: Optional[str] = None
    ai_confidence_score: Optional[float] = None

class TreatmentProcedureUpdate(BaseModel):
    """Pydantic model for updating treatment procedures"""
    status: Optional[ProcedureStatus] = None
    priority: Optional[PriorityLevel] = None
    phase: Optional[PlanPhase] = None
    fee: Optional[float] = None
    notes: Optional[str] = None
    doctor_reasoning: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    preauth_required: Optional[bool] = None
    preauth_status: Optional[str] = None
    surfaces: Optional[List[str]] = None
    insurance_coverage: Optional[int] = None
    insurance_coverage_note: Optional[str] = None

class TreatmentPlanUpdate(BaseModel):
    """Pydantic model for updating treatment plans"""
    title: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[PlanStatus] = None
    priority: Optional[PriorityLevel] = None
    medical_alerts: Optional[List[str]] = None
    insurance_verified: Optional[bool] = None
    insurance_notes: Optional[str] = None
    financial_options: Optional[Dict[str, Any]] = None
    
    @validator('status')
    def validate_status_transition(cls, value, values, **kwargs):
        if value == PlanStatus.APPROVED:
            raise ValueError("Use the approve_plan endpoint to approve a plan")
        if value == PlanStatus.COMPLETED:
            raise ValueError("Use the complete_plan endpoint to mark a plan as completed")
        return value

class PlanVersionInfo(BaseModel):
    """Pydantic model for treatment plan version information"""
    treatment_plan_id: str
    version: int
    created_by: str
    created_at: datetime
    notes: Optional[str] = None
    
    class Config:
        orm_mode = True

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
    phase: str
    fee: float
    notes: Optional[str] = None
    reasoning: Optional[str] = None
    ai_suggested: bool
    doctor_approved: bool
    doctor_reasoning: Optional[str] = None
    modified_by_doctor: bool
    insurance_coverage: Optional[int] = None
    insurance_coverage_note: Optional[str] = None
    surfaces: Optional[List[str]] = None
    quadrant: Optional[str] = None
    arch: Optional[str] = None
    preauth_required: bool
    preauth_status: Optional[str] = None
    created_at: datetime
    
    class Config:
        orm_mode = True

class TreatmentPlanSummary(BaseModel):
    """Pydantic model for treatment plan summary statistics"""
    total_procedures: int
    procedures_by_phase: Dict[str, int]
    procedures_by_status: Dict[str, int]
    total_treatment_fee: float
    total_insurance_coverage: float
    total_patient_responsibility: float
    procedures_requiring_preauth: int
    completed_procedures: int
    progress_percentage: float  # Percentage of procedures completed

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
    current_version: int
    created_by: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    medical_alerts: Optional[List[str]] = None
    total_fee: float
    insurance_verified: bool
    insurance_portion: float
    patient_portion: float
    insurance_notes: Optional[str] = None
    consent_signed: bool
    consent_signed_by: Optional[str] = None
    consent_signed_at: Optional[datetime] = None
    ai_assisted: bool
    ai_model_version: Optional[str] = None
    ai_confidence_score: Optional[float] = None
    created_at: datetime
    
    class Config:
        orm_mode = True

class TreatmentPlanDetailResponse(TreatmentPlanResponse):
    """Pydantic model for detailed treatment plan response including procedures"""
    procedures: List[TreatmentProcedureResponse]
    financial_options: Optional[Dict[str, Any]] = None
    summary: Optional[TreatmentPlanSummary] = None
    
    class Config:
        orm_mode = True

class TreatmentPlanHistoryResponse(BaseModel):
    """Pydantic model for treatment plan audit history"""
    id: int
    treatment_plan_id: str
    action: str
    action_by: str
    action_at: datetime
    details: Optional[Dict[str, Any]] = None
    
    class Config:
        orm_mode = True 