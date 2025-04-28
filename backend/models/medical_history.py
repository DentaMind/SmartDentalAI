from typing import List, Optional, Dict, Union
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, validator, constr

class ASAClassification(str, Enum):
    """ASA Physical Status Classification System"""
    ASA_I = "ASA I"  # Healthy patient
    ASA_II = "ASA II"  # Mild systemic disease
    ASA_III = "ASA III"  # Severe systemic disease
    ASA_IV = "ASA IV"  # Severe systemic disease that is a constant threat to life
    ASA_V = "ASA V"  # Moribund patient not expected to survive without operation
    ASA_VI = "ASA VI"  # Brain-dead patient (organ donor)

    def __str__(self):
        return self.value

class BloodworkValue(BaseModel):
    """Bloodwork test result"""
    test_name: str
    value: float
    unit: str
    reference_range: str
    timestamp: Optional[datetime] = None
    is_abnormal: Optional[bool] = None
    clinical_significance: Optional[str] = None

    @validator("test_name")
    def validate_test_name(cls, v):
        if not v:
            raise ValueError("Test name cannot be empty")
        return v

    @validator("value")
    def validate_value(cls, v):
        if v < 0:
            raise ValueError("Value cannot be negative")
        return v

class Medication(BaseModel):
    """Patient medication information"""
    name: str
    generic_name: Optional[str] = None
    dosage: str
    frequency: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: bool = True
    drug_class: str
    dental_considerations: List[str] = Field(default_factory=list)
    contraindications: List[str] = Field(default_factory=list)

    @validator("name")
    def validate_name(cls, v):
        if not v:
            raise ValueError("Medication name cannot be empty")
        return v

    @validator("drug_class")
    def validate_drug_class(cls, v):
        if not v:
            raise ValueError("Drug class cannot be empty")
        return v

class MedicalCondition(BaseModel):
    """Patient medical condition"""
    name: str
    icd_code: Optional[str] = None
    severity: str  # mild, moderate, severe
    is_controlled: bool
    last_exacerbation: Optional[datetime] = None
    treatment_plan: Optional[str] = None
    dental_considerations: List[str] = Field(default_factory=list)

    @validator("name")
    def validate_name(cls, v):
        if not v:
            raise ValueError("Condition name cannot be empty")
        return v

    @validator("severity")
    def validate_severity(cls, v):
        valid_severities = ["mild", "moderate", "severe"]
        if v.lower() not in valid_severities:
            raise ValueError(f"Severity must be one of: {', '.join(valid_severities)}")
        return v.lower()

class DentalHistory(BaseModel):
    """Patient dental history"""
    last_cleaning: Optional[datetime] = None
    last_xrays: Optional[datetime] = None
    previous_treatments: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    complications: List[str] = Field(default_factory=list)

class MedicalHistory(BaseModel):
    """Complete medical history record"""
    patient_id: Optional[str] = None
    conditions: List[MedicalCondition] = Field(default_factory=list)
    medications: List[Medication] = Field(default_factory=list)
    bloodwork: List[BloodworkValue] = Field(default_factory=list)
    dental_history: Optional[DentalHistory] = None
    asa_classification: Optional[ASAClassification] = None
    last_updated: datetime = Field(default_factory=datetime.now)
    risk_factors: List[str] = Field(default_factory=list)
    requires_medical_clearance: bool = False
    medical_clearance_notes: Optional[str] = None

class RiskAssessment(BaseModel):
    """Risk assessment results"""
    patient_id: Optional[str] = None
    risk_level: str  # low, medium, high
    asa_classification: ASAClassification
    risk_factors: List[str]
    medication_interactions: List[str]
    bloodwork_concerns: List[str]
    epinephrine_risk: str  # green, yellow, red
    max_epinephrine_dose: Optional[float] = None
    requires_medical_clearance: bool
    treatment_modifications: List[str]
    recommendations: List[str]
    reasoning: Optional[str] = None
    concerns: Optional[List[str]] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.now)

# Request models that match the test data structure
class MedicalConditionRequest(MedicalCondition):
    pass

class MedicationRequest(Medication):
    pass

class BloodworkRequest(BloodworkValue):
    pass

class DentalHistoryRequest(DentalHistory):
    pass

class MedicalHistoryRequest(BaseModel):
    """Request model for medical history"""
    patient_id: str = Field(..., description="Patient identifier")
    conditions: List[MedicalConditionRequest] = Field(default_factory=list)
    medications: List[MedicationRequest] = Field(default_factory=list)
    bloodwork: List[BloodworkRequest] = Field(default_factory=list)
    dental_history: Optional[DentalHistoryRequest] = None
    risk_factors: List[str] = Field(default_factory=list)
    asa_classification: Optional[ASAClassification] = None

    @validator("conditions")
    def validate_conditions(cls, v):
        if not isinstance(v, list):
            raise ValueError("Conditions must be a list")
        return v

    @validator("medications")
    def validate_medications(cls, v):
        if not isinstance(v, list):
            raise ValueError("Medications must be a list")
        return v

    @validator("bloodwork")
    def validate_bloodwork(cls, v):
        if not isinstance(v, list):
            raise ValueError("Bloodwork must be a list")
        return v 