from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ValidationWarning(BaseModel):
    message: str
    critical: bool = False

class PrescriptionItemCreate(BaseModel):
    medication_name: str
    dosage: str
    form: str
    route: str
    frequency: str
    quantity: int
    days_supply: Optional[int] = None
    refills: int = 0
    dispense_as_written: bool = False
    notes: Optional[str] = None

class PrescriptionItemResponse(PrescriptionItemCreate):
    id: str

class PrescriptionCreate(BaseModel):
    patient_id: str
    provider_id: Optional[str] = None
    prescription_date: str
    notes: Optional[str] = None
    items: List[PrescriptionItemCreate]
    treatment_plan_id: Optional[str] = None

class PrescriptionResponse(BaseModel):
    id: str
    patient_id: str
    provider_id: str
    patient_name: str
    provider_name: str
    prescription_date: str
    status: str
    items: List[PrescriptionItemResponse]
    treatment_plan_id: Optional[str] = None
    treatment_plan_name: Optional[str] = None
    created_at: str
    sent_date: Optional[str] = None
    filled_date: Optional[str] = None
    notes: Optional[str] = None
    has_warnings: Optional[bool] = None

class PrescriptionApprove(BaseModel):
    override_warnings: bool = False

class PrescriptionFilter(BaseModel):
    patient_id: Optional[str] = None
    provider_id: Optional[str] = None
    status: Optional[str] = None
    from_date: Optional[str] = None
    to_date: Optional[str] = None 