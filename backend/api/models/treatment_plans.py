from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class TreatmentPlanStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TreatmentPlanProcedure(BaseModel):
    code: str = Field(..., description="Procedure code")
    description: str = Field(..., description="Procedure description")
    tooth_number: Optional[str] = Field(None, description="Tooth number if applicable")
    surface: Optional[str] = Field(None, description="Tooth surface if applicable")
    cost: float = Field(..., description="Procedure cost")
    insurance_coverage: Optional[float] = Field(None, description="Insurance coverage amount")
    patient_responsibility: Optional[float] = Field(None, description="Patient responsibility amount")
    insurance_covered: bool = Field(default=True, description="Whether the procedure is covered by insurance")

class TreatmentPlan(BaseModel):
    id: str = Field(..., description="Unique identifier for the treatment plan")
    patient_id: str = Field(..., description="ID of the patient")
    doctor_id: str = Field(..., description="ID of the doctor")
    status: TreatmentPlanStatus = Field(default=TreatmentPlanStatus.DRAFT)
    procedures: List[TreatmentPlanProcedure] = Field(default_factory=list)
    total_cost: float = Field(..., description="Total cost of the treatment plan")
    insurance_coverage: Optional[float] = Field(None, description="Total insurance coverage")
    patient_responsibility: Optional[float] = Field(None, description="Total patient responsibility")
    notes: Optional[str] = Field(None, description="Additional notes")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow) 