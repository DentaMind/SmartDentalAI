from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class PrescriptionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"

class PrescriptionBase(BaseModel):
    patient_id: str = Field(..., description="ID of the patient")
    case_id: str = Field(..., description="ID of the case")
    medication: str = Field(..., description="Name of the medication")
    dosage: str = Field(..., description="Dosage instructions")
    frequency: str = Field(..., description="Frequency of administration")
    duration: str = Field(..., description="Duration of prescription")
    notes: Optional[str] = Field(None, description="Additional notes")

class PrescriptionCreate(PrescriptionBase):
    pass

class PrescriptionUpdate(BaseModel):
    status: Optional[PrescriptionStatus] = None
    notes: Optional[str] = None

class Prescription(PrescriptionBase):
    id: str = Field(..., description="Unique identifier for the prescription")
    doctor_id: str = Field(..., description="ID of the prescribing doctor")
    status: PrescriptionStatus = Field(PrescriptionStatus.PENDING, description="Current status of the prescription")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")

    class Config:
        from_attributes = True 