from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class ClaimStatus(str, Enum):
    SUBMITTED = "SUBMITTED"
    PAID = "PAID"
    DENIED = "DENIED"
    APPEALED = "APPEALED"

class ClaimProcedure(BaseModel):
    code: str = Field(..., description="Procedure code")
    description: str = Field(..., description="Procedure description")
    amount: float = Field(..., description="Procedure amount")

class ClaimAppeal(BaseModel):
    reason: str = Field(..., description="Reason for appeal")
    additional_info: Optional[str] = Field(None, description="Additional information for appeal")

class InsuranceClaim(BaseModel):
    id: str = Field(..., description="Claim ID")
    claim_number: str = Field(..., description="Claim number")
    patient_id: str = Field(..., description="Patient ID")
    patient_name: str = Field(..., description="Patient name")
    submission_date: datetime = Field(..., description="Claim submission date")
    status: ClaimStatus = Field(..., description="Claim status")
    total_amount: float = Field(..., description="Total claim amount")
    procedures: List[ClaimProcedure] = Field(..., description="List of procedures")
    payment_date: Optional[datetime] = Field(None, description="Payment date")
    payment_amount: Optional[float] = Field(None, description="Payment amount")
    denial_reason: Optional[str] = Field(None, description="Reason for denial")
    appeal_reason: Optional[str] = Field(None, description="Reason for appeal")
    appeal_date: Optional[datetime] = Field(None, description="Appeal date")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class InsuranceClaimCreate(BaseModel):
    claim_number: str = Field(..., description="Claim number")
    patient_id: str = Field(..., description="Patient ID")
    patient_name: str = Field(..., description="Patient name")
    procedures: List[ClaimProcedure] = Field(..., description="List of procedures")
    total_amount: float = Field(..., description="Total claim amount")

class InsuranceClaimUpdate(BaseModel):
    status: Optional[ClaimStatus] = Field(None, description="Claim status")
    payment_amount: Optional[float] = Field(None, description="Payment amount")
    denial_reason: Optional[str] = Field(None, description="Reason for denial") 