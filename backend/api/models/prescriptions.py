from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class PrescriptionStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    FILLED = "filled"
    EXPIRED = "expired"
    CANCELLED = "cancelled"

class Medication(BaseModel):
    name: str = Field(..., description="Name of the medication")
    dosage: str = Field(..., description="Dosage information")
    frequency: str = Field(..., description="How often to take the medication")
    route: str = Field(..., description="Route of administration")
    duration: str = Field(..., description="Duration of treatment")
    instructions: Optional[str] = Field(None, description="Additional instructions")
    refills: int = Field(0, description="Number of refills allowed")

class PrescriptionBase(BaseModel):
    patient_id: str = Field(..., description="ID of the patient")
    medications: List[Medication] = Field(..., description="List of prescribed medications")
    notes: Optional[str] = Field(None, description="Additional notes")
    status: PrescriptionStatus = Field(PrescriptionStatus.DRAFT, description="Status of the prescription")

class PrescriptionCreate(PrescriptionBase):
    pass

class PrescriptionUpdate(BaseModel):
    medications: Optional[List[Medication]] = None
    notes: Optional[str] = None
    status: Optional[PrescriptionStatus] = None

class Prescription(PrescriptionBase):
    id: str = Field(..., description="Unique identifier for the prescription")
    created_at: datetime = Field(..., description="When the prescription was created")
    updated_at: datetime = Field(..., description="When the prescription was last updated")
    created_by: str = Field(..., description="ID of the doctor who created the prescription")
    updated_by: Optional[str] = Field(None, description="ID of the user who last updated the prescription")
    filled_by: Optional[str] = Field(None, description="ID of the pharmacist who filled the prescription")
    filled_at: Optional[datetime] = Field(None, description="When the prescription was filled")
    expires_at: datetime = Field(..., description="When the prescription expires")

    class Config:
        from_attributes = True 