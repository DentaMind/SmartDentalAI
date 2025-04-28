from typing import List, Optional, Dict, Union
from datetime import datetime
from pydantic import BaseModel, Field
from backend.models.medical_history import ASAClassification

class BloodworkRequest(BaseModel):
    """Bloodwork test request schema"""
    test_name: str
    value: float
    unit: str
    reference_range: str
    timestamp: Optional[datetime] = None
    is_abnormal: Optional[bool] = None

class MedicationRequest(BaseModel):
    """Medication request schema"""
    name: str
    generic_name: Optional[str] = None
    dosage: str
    frequency: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: bool = True
    drug_class: str
    dental_considerations: List[str] = Field(default_factory=list)

class MedicalConditionRequest(BaseModel):
    """Medical condition request schema"""
    name: str
    icd_code: Optional[str] = None
    severity: str  # mild, moderate, severe
    is_controlled: bool
    last_exacerbation: Optional[datetime] = None
    treatment_plan: Optional[str] = None
    dental_considerations: List[str] = Field(default_factory=list)

class DentalHistoryRequest(BaseModel):
    """Dental history request schema"""
    last_cleaning: Optional[datetime] = None
    last_xrays: Optional[datetime] = None
    previous_treatments: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    complications: List[str] = Field(default_factory=list)

class RiskEvaluationRequest(BaseModel):
    """Complete risk evaluation request schema"""
    patient_id: Optional[str] = None
    conditions: List[MedicalConditionRequest] = Field(default_factory=list)
    medications: List[MedicationRequest] = Field(default_factory=list)
    bloodwork: List[BloodworkRequest] = Field(default_factory=list)
    dental_history: Optional[DentalHistoryRequest] = None
    risk_factors: List[str] = Field(default_factory=list)

class EpinephrineCheckRequest(BaseModel):
    """Epinephrine safety check request schema"""
    asa_classification: Optional[ASAClassification] = None
    conditions: List[MedicalConditionRequest] = Field(default_factory=list)
    medications: List[MedicationRequest] = Field(default_factory=list)

class MedicationCheckRequest(BaseModel):
    """Medication interaction check request schema"""
    medications: List[MedicationRequest] = Field(default_factory=list)

class RiskAssessmentResponse(BaseModel):
    """Risk assessment response schema"""
    patient_id: Optional[str] = None
    asa_classification: ASAClassification
    risk_factors: List[str]
    medication_interactions: List[str]
    bloodwork_concerns: List[str]
    epinephrine_risk: str  # green, yellow, red
    max_epinephrine_dose: Optional[float] = None
    requires_medical_clearance: bool
    treatment_modifications: List[str]
    recommendations: List[str]
    timestamp: datetime = Field(default_factory=datetime.now)

class EpinephrineCheckResponse(BaseModel):
    """Epinephrine safety check response schema"""
    risk_level: str  # green, yellow, red
    max_dose: Optional[float] = None
    recommendations: List[str]
    contraindications: List[str]

class MedicationCheckResponse(BaseModel):
    """Medication interaction check response schema"""
    interactions: List[str]
    recommendations: List[str]
    contraindications: List[str]

class ASAClassificationResponse(BaseModel):
    """ASA classification response schema"""
    classification: ASAClassification
    reasoning: List[str]
    recommendations: List[str] 