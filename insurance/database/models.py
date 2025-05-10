"""
SQLAlchemy models for insurance validation and benefits tracking.
"""

from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Boolean,
    JSON
)
from sqlalchemy.orm import relationship
from .database import Base

class InsurancePlan(Base):
    """Insurance plan configuration"""
    __tablename__ = "insurance_plans"
    
    id = Column(String, primary_key=True)
    payer_id = Column(String, nullable=False)
    plan_name = Column(String, nullable=False)
    group_number = Column(String)
    effective_date = Column(DateTime, nullable=False)
    termination_date = Column(DateTime)
    
    annual_maximum = Column(Float, nullable=False)
    preventive_maximum = Column(Float)
    orthodontic_lifetime_maximum = Column(Float)
    
    deductible_individual = Column(Float, nullable=False)
    deductible_family = Column(Float)
    preventive_deductible_applies = Column(Boolean, default=False)
    
    coverage_rules = Column(JSON, nullable=False)
    frequency_limits = Column(JSON, nullable=False)
    preauth_requirements = Column(JSON, nullable=False)
    alternate_benefits = Column(JSON)

class PatientInsurance(Base):
    """Patient insurance assignment"""
    __tablename__ = "patient_insurance"
    
    id = Column(String, primary_key=True)
    patient_id = Column(String, nullable=False)
    insurance_plan_id = Column(
        String,
        ForeignKey("insurance_plans.id"),
        nullable=False
    )
    subscriber_id = Column(String, nullable=False)
    relationship_to_subscriber = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    
    plan = relationship("InsurancePlan")

class BenefitsUsage(Base):
    """Benefits usage tracking"""
    __tablename__ = "benefits_usage"
    
    id = Column(String, primary_key=True)
    patient_insurance_id = Column(
        String,
        ForeignKey("patient_insurance.id"),
        nullable=False
    )
    benefit_year = Column(Integer, nullable=False)
    
    preventive_used = Column(Float, default=0.0)
    basic_used = Column(Float, default=0.0)
    major_used = Column(Float, default=0.0)
    ortho_used = Column(Float, default=0.0)
    
    deductible_met = Column(Float, default=0.0)
    family_deductible_met = Column(Float, default=0.0)
    
    last_update = Column(DateTime, nullable=False)
    
    insurance = relationship("PatientInsurance")

class ProcedureRecord(Base):
    """Record of performed procedures"""
    __tablename__ = "procedure_records"
    
    id = Column(String, primary_key=True)
    patient_id = Column(String, nullable=False)
    cdt_code = Column(String, nullable=False)
    description = Column(String, nullable=False)
    
    date_of_service = Column(DateTime, nullable=False)
    tooth_number = Column(String)
    surfaces = Column(JSON)  # List of surfaces
    quadrant = Column(Integer)
    
    procedure_cost = Column(Float, nullable=False)
    insurance_paid = Column(Float)
    patient_paid = Column(Float)
    
    claim_status = Column(String)
    claim_id = Column(String)
    
    insurance_id = Column(
        String,
        ForeignKey("patient_insurance.id")
    )
    insurance = relationship("PatientInsurance") 