"""
API data models for insurance validation and benefits tracking.
"""

from typing import List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel, Field

class ProcedureRequest(BaseModel):
    """Single procedure validation request"""
    cdt_code: str = Field(..., description="CDT procedure code")
    tooth_number: Optional[str] = Field(None, description="Tooth number if applicable")
    surfaces: Optional[List[str]] = Field(None, description="Surface selections if applicable")
    quadrant: Optional[int] = Field(None, description="Quadrant number if applicable")
    procedure_cost: Optional[float] = Field(None, description="Procedure cost if known")

class ValidationRequest(BaseModel):
    """Coverage validation request"""
    patient_id: str = Field(..., description="Patient identifier")
    procedures: List[ProcedureRequest] = Field(..., description="List of procedures to validate")
    insurance_id: Optional[str] = Field(None, description="Insurance plan identifier")
    service_date: Optional[datetime] = Field(
        None,
        description="Planned service date (defaults to current date)"
    )

class ProcedureValidationResult(BaseModel):
    """Coverage validation result for a single procedure"""
    cdt_code: str
    description: str
    is_covered: bool
    coverage_percent: float
    estimated_insurance: float
    estimated_patient: float
    requires_preauth: bool
    deductible_applies: bool
    warnings: List[str] = Field(default_factory=list)
    requirements_missing: List[str] = Field(default_factory=list)
    next_eligible_date: Optional[datetime] = None
    alternate_benefit: Optional[Dict[str, str]] = None

class ValidationResponse(BaseModel):
    """Complete coverage validation response"""
    patient_id: str
    insurance_id: Optional[str]
    service_date: datetime
    procedures: List[ProcedureValidationResult]
    total_insurance_portion: float
    total_patient_portion: float
    remaining_benefits: Dict[str, float]
    warnings: List[str] = Field(default_factory=list)

class BenefitsSnapshot(BaseModel):
    """Current benefits usage snapshot"""
    patient_id: str
    insurance_id: str
    benefit_year: int
    annual_maximum: float
    remaining_annual: float
    preventive_used: float
    basic_used: float
    major_used: float
    ortho_lifetime_maximum: Optional[float] = None
    ortho_remaining: Optional[float] = None
    deductible_met: float
    family_deductible_met: Optional[float] = None
    last_update: datetime

class ProcedureHistory(BaseModel):
    """Record of previously performed procedures"""
    patient_id: str
    cdt_code: str
    description: str
    date_of_service: datetime
    tooth_number: Optional[str] = None
    surfaces: Optional[List[str]] = None
    quadrant: Optional[int] = None
    insurance_paid: float
    patient_paid: float
    claim_status: str
    claim_id: Optional[str] = None 