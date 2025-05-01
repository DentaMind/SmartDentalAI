from typing import List, Optional, Dict, Union
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, field_validator, constr

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

class TestResult(BaseModel):
    test_name: str = Field(..., description="Name of the test")
    value: float = Field(..., description="Test result value")
    unit: str = Field(..., description="Unit of measurement")
    reference_range: str = Field(..., description="Normal reference range")
    date: datetime = Field(..., description="Date of test")
    notes: Optional[str] = Field(None, description="Additional notes")

    @field_validator("test_name")
    @classmethod
    def validate_test_name(cls, v):
        if not v.strip():
            raise ValueError("Test name cannot be empty")
        return v.strip()

    @field_validator("value")
    @classmethod
    def validate_value(cls, v):
        if v < 0:
            raise ValueError("Test value cannot be negative")
        return v

class Medication(BaseModel):
    """Patient medication information"""
    name: str = Field(..., description="Name of medication")
    generic_name: Optional[str] = None
    dosage: str = Field(..., description="Dosage information")
    frequency: str = Field(..., description="Frequency of administration")
    start_date: datetime = Field(..., description="Start date of medication")
    end_date: Optional[datetime] = None
    is_active: bool = True
    drug_class: str = Field(..., description="Drug classification")
    dental_considerations: List[str] = Field(default_factory=list)
    contraindications: List[str] = Field(default_factory=list)
    prescribing_doctor: str = Field(..., description="Name of prescribing doctor")
    notes: Optional[str] = Field(None, description="Additional notes")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError("Medication name cannot be empty")
        return v.strip()

    @field_validator("drug_class")
    @classmethod
    def validate_drug_class(cls, v):
        if not v.strip():
            raise ValueError("Drug class cannot be empty")
        return v.strip()

class MedicalCondition(BaseModel):
    """Patient medical condition"""
    name: str = Field(..., description="Name of condition")
    icd_code: Optional[str] = None
    severity: str = Field(..., description="Severity level")
    is_controlled: bool
    last_exacerbation: Optional[datetime] = None
    treatment_plan: Optional[str] = None
    dental_considerations: List[str] = Field(default_factory=list)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError("Condition name cannot be empty")
        return v.strip()

    @field_validator("severity")
    @classmethod
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
    patient_id: str = Field(..., description="Patient ID")
    conditions: List[MedicalCondition] = Field(default_factory=list, description="List of medical conditions")
    medications: List[Medication] = Field(default_factory=list, description="List of medications")
    bloodwork: List[TestResult] = Field(default_factory=list, description="List of bloodwork results")
    dental_history: Optional[DentalHistory] = None
    asa_classification: Optional[ASAClassification] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    risk_factors: List[str] = Field(default_factory=list)
    requires_medical_clearance: bool = False
    medical_clearance_notes: Optional[str] = None

    @field_validator("conditions")
    @classmethod
    def validate_conditions(cls, v):
        if not isinstance(v, list):
            raise ValueError("Conditions must be a list")
        return v

    @field_validator("medications")
    @classmethod
    def validate_medications(cls, v):
        if not isinstance(v, list):
            raise ValueError("Medications must be a list")
        return v

    @field_validator("bloodwork")
    @classmethod
    def validate_bloodwork(cls, v):
        if not isinstance(v, list):
            raise ValueError("Bloodwork must be a list")
        return v

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

class BloodworkRequest(TestResult):
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

    @field_validator("conditions")
    @classmethod
    def validate_conditions(cls, v):
        if not isinstance(v, list):
            raise ValueError("Conditions must be a list")
        return v

    @field_validator("medications")
    @classmethod
    def validate_medications(cls, v):
        if not isinstance(v, list):
            raise ValueError("Medications must be a list")
        return v

    @field_validator("bloodwork")
    @classmethod
    def validate_bloodwork(cls, v):
        if not isinstance(v, list):
            raise ValueError("Bloodwork must be a list")
        return v 