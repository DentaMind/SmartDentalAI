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

class VerificationRequest(Base):
    """SQLAlchemy model for insurance verification requests"""
    __tablename__ = "verification_requests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(String, nullable=False, index=True)
    policy_id = Column(UUID(as_uuid=True), ForeignKey("insurance_policies.id"), nullable=True)
    request_date = Column(DateTime(timezone=True), nullable=False, default=datetime.now)
    status = Column(String, nullable=False, default="pending")  # pending, completed, error
    request_type = Column(String, nullable=False)  # eligibility, procedure_coverage, treatment_plan
    procedure_code = Column(String)  # For procedure_coverage requests
    tooth_number = Column(String)    # For procedure_coverage requests
    surfaces = Column(ARRAY(String))  # For procedure_coverage requests
    treatment_plan_id = Column(String)  # For treatment_plan requests
    request_data = Column(JSON)      # Additional request data
    response_data = Column(JSON)     # Raw response data
    error_message = Column(Text)     # For failed requests
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    response = relationship("VerificationResponse", back_populates="request", uselist=False)
    
    def __repr__(self):
        return f"<VerificationRequest {self.id}: {self.request_type}>"

class VerificationResponse(Base):
    """SQLAlchemy model for insurance verification responses"""
    __tablename__ = "verification_responses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    verification_id = Column(UUID(as_uuid=True), ForeignKey("verification_requests.id"), nullable=False, unique=True)
    response_date = Column(DateTime(timezone=True), nullable=False, default=datetime.now)
    coverage_percentage = Column(Integer)  # For procedure_coverage responses
    patient_pays_percentage = Column(Integer)  # For procedure_coverage responses
    deductible_applies = Column(Boolean)
    waiting_period_applies = Column(Boolean, default=False)
    waiting_period_end = Column(String)
    annual_max_applied = Column(Boolean, default=True)
    max_remaining = Column(Float)
    frequency_limitation = Column(String)
    status = Column(String, nullable=False)  # completed, partial, denied
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    request = relationship("VerificationRequest", back_populates="response")
    
    def __repr__(self):
        return f"<VerificationResponse {self.id} for {self.verification_id}>"

# Pydantic models for API validation
class VerificationRequestCreate(BaseModel):
    """Pydantic model for creating verification requests"""
    patient_id: str
    policy_id: Optional[str] = None
    request_type: str
    procedure_code: Optional[str] = None
    tooth_number: Optional[str] = None
    surfaces: Optional[List[str]] = None
    treatment_plan_id: Optional[str] = None
    request_data: Optional[Dict[str, Any]] = None

class VerificationRequestResponse(BaseModel):
    """Pydantic model for verification request response"""
    id: str
    patient_id: str
    policy_id: Optional[str] = None
    request_date: datetime
    status: str
    request_type: str
    procedure_code: Optional[str] = None
    tooth_number: Optional[str] = None
    surfaces: Optional[List[str]] = None
    treatment_plan_id: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    
    class Config:
        orm_mode = True

class VerificationResponseCreate(BaseModel):
    """Pydantic model for creating verification responses"""
    verification_id: str
    coverage_percentage: Optional[int] = None
    patient_pays_percentage: Optional[int] = None
    deductible_applies: Optional[bool] = None
    waiting_period_applies: bool = False
    waiting_period_end: Optional[str] = None
    annual_max_applied: bool = True
    max_remaining: Optional[float] = None
    frequency_limitation: Optional[str] = None
    status: str
    notes: Optional[str] = None

class VerificationResponseModel(BaseModel):
    """Pydantic model for verification response"""
    id: str
    verification_id: str
    response_date: datetime
    coverage_percentage: Optional[int] = None
    patient_pays_percentage: Optional[int] = None
    deductible_applies: Optional[bool] = None
    waiting_period_applies: bool
    waiting_period_end: Optional[str] = None
    annual_max_applied: bool
    max_remaining: Optional[float] = None
    frequency_limitation: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    
    class Config:
        orm_mode = True 