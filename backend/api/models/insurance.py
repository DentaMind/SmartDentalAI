from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Date, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from datetime import datetime, date
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

from .base import Base

class PlanType(str, enum.Enum):
    PPO = "ppo"
    HMO = "hmo"
    PREMIER = "premier"
    CAPITATION = "capitation"
    DISCOUNT = "discount"
    SAVINGS = "savings"
    INDEMNITY = "indemnity"
    MEDICAID = "medicaid"
    MEDICARE = "medicare"

class InsuranceCompany(Base):
    """SQLAlchemy model for insurance companies"""
    __tablename__ = "insurance_companies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    address = Column(String)
    phone = Column(String)
    email = Column(String)
    website = Column(String)
    payor_id = Column(String)  # Used for electronic claims
    supports_electronic_claims = Column(Boolean, default=True)
    supports_electronic_attachments = Column(Boolean, default=False)
    supports_realtime_eligibility = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    policies = relationship("InsurancePolicy", back_populates="company")
    
    def __repr__(self):
        return f"<InsuranceCompany {self.name}>"

class InsurancePolicy(Base):
    """SQLAlchemy model for patient insurance policies"""
    __tablename__ = "insurance_policies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(String, nullable=False, index=True)
    subscriber_id = Column(String, nullable=False)  # May be same as patient or different (e.g., spouse or parent)
    policy_number = Column(String, nullable=False)
    group_number = Column(String)
    company_id = Column(UUID(as_uuid=True), ForeignKey("insurance_companies.id"))
    company_name = Column(String, nullable=False)  # Denormalized for convenience
    plan_type = Column(Enum(PlanType), nullable=False)
    is_primary = Column(Boolean, default=True)
    status = Column(String, default="active")  # active, inactive, expired
    effective_date = Column(Date)
    expiration_date = Column(Date)
    subscriber_name = Column(String)
    subscriber_dob = Column(Date)
    relationship_to_subscriber = Column(String)  # self, spouse, child, other
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    company = relationship("InsuranceCompany", back_populates="policies")
    benefit_summary = relationship("BenefitSummary", back_populates="policy", uselist=False)
    
    def __repr__(self):
        return f"<InsurancePolicy {self.policy_number} - {self.company_name}>"

class BenefitSummary(Base):
    """SQLAlchemy model for insurance benefit summaries"""
    __tablename__ = "benefit_summaries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policy_id = Column(UUID(as_uuid=True), ForeignKey("insurance_policies.id"), nullable=False, unique=True)
    annual_maximum = Column(Float, default=1500.00)
    remaining_benefit = Column(Float)
    deductible = Column(Float, default=50.00)
    deductible_met = Column(Float, default=0.00)
    family_deductible = Column(Float)
    family_deductible_met = Column(Float, default=0.00)
    preventive_coverage = Column(Integer, default=100)  # percentage
    basic_coverage = Column(Integer, default=80)        # percentage
    major_coverage = Column(Integer, default=50)        # percentage
    ortho_coverage = Column(Integer, default=0)         # percentage
    ortho_lifetime_maximum = Column(Float, default=0.00)
    ortho_remaining_benefit = Column(Float, default=0.00)
    waiting_periods = Column(JSON)  # e.g., {"major": "6 months", "ortho": "12 months"}
    exclusions = Column(JSON)       # e.g., ["implants", "cosmetic procedures"]
    frequency_limitations = Column(JSON)  # e.g., {"D0120": "2 per year", "D0210": "1 per 3 years"}
    benefit_period = Column(String, default="calendar_year")  # calendar_year or benefit_year
    benefit_period_start = Column(Date)
    benefit_period_end = Column(Date)
    last_verification_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    policy = relationship("InsurancePolicy", back_populates="benefit_summary")
    
    def __repr__(self):
        return f"<BenefitSummary for policy {self.policy_id}>"


# Pydantic models for API validation
class InsuranceCompanyCreate(BaseModel):
    """Pydantic model for creating insurance companies"""
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    payor_id: Optional[str] = None
    supports_electronic_claims: bool = True
    supports_electronic_attachments: bool = False
    supports_realtime_eligibility: bool = False

class InsuranceCompanyResponse(BaseModel):
    """Pydantic model for insurance company response"""
    id: str
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    payor_id: Optional[str] = None
    supports_electronic_claims: bool
    supports_electronic_attachments: bool
    supports_realtime_eligibility: bool
    
    class Config:
        orm_mode = True

class InsurancePolicyCreate(BaseModel):
    """Pydantic model for creating insurance policies"""
    patient_id: str
    subscriber_id: str
    policy_number: str
    group_number: Optional[str] = None
    company_id: str
    company_name: str
    plan_type: PlanType
    is_primary: bool = True
    status: str = "active"
    effective_date: Optional[date] = None
    expiration_date: Optional[date] = None
    subscriber_name: Optional[str] = None
    subscriber_dob: Optional[date] = None
    relationship_to_subscriber: Optional[str] = None

class InsurancePolicyResponse(BaseModel):
    """Pydantic model for insurance policy response"""
    id: str
    patient_id: str
    subscriber_id: str
    policy_number: str
    group_number: Optional[str] = None
    company_id: str
    company_name: str
    plan_type: PlanType
    is_primary: bool
    status: str
    effective_date: Optional[date] = None
    expiration_date: Optional[date] = None
    subscriber_name: Optional[str] = None
    subscriber_dob: Optional[date] = None
    relationship_to_subscriber: Optional[str] = None
    created_at: datetime
    
    class Config:
        orm_mode = True

class BenefitSummaryCreate(BaseModel):
    """Pydantic model for creating benefit summaries"""
    policy_id: str
    annual_maximum: float = 1500.00
    remaining_benefit: Optional[float] = None
    deductible: float = 50.00
    deductible_met: float = 0.00
    family_deductible: Optional[float] = None
    family_deductible_met: Optional[float] = None
    preventive_coverage: int = 100
    basic_coverage: int = 80
    major_coverage: int = 50
    ortho_coverage: int = 0
    ortho_lifetime_maximum: float = 0.00
    ortho_remaining_benefit: float = 0.00
    waiting_periods: Optional[Dict[str, str]] = None
    exclusions: Optional[List[str]] = None
    frequency_limitations: Optional[Dict[str, str]] = None
    benefit_period: str = "calendar_year"
    benefit_period_start: Optional[date] = None
    benefit_period_end: Optional[date] = None
    last_verification_date: Optional[datetime] = None

class BenefitSummaryResponse(BaseModel):
    """Pydantic model for benefit summary response"""
    id: str
    policy_id: str
    annual_maximum: float
    remaining_benefit: Optional[float] = None
    deductible: float
    deductible_met: float
    preventive_coverage: int
    basic_coverage: int
    major_coverage: int
    ortho_coverage: int
    ortho_lifetime_maximum: float
    waiting_periods: Optional[Dict[str, str]] = None
    exclusions: Optional[List[str]] = None
    benefit_period: str
    last_verification_date: Optional[datetime] = None
    
    class Config:
        orm_mode = True 