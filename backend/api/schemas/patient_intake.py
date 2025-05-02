from pydantic import BaseModel, Field, validator, root_validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, date
from enum import Enum

# Enum schemas 

class GenderEnum(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    UNKNOWN = "unknown"

class InsuranceTypeEnum(str, Enum):
    PRIVATE = "private"
    MEDICARE = "medicare"
    MEDICAID = "medicaid"
    SELF_PAY = "self_pay"
    OTHER = "other"

class AllergyTypeEnum(str, Enum):
    MEDICATION = "MEDICATION"
    FOOD = "FOOD"
    ENVIRONMENTAL = "ENVIRONMENTAL" 
    LATEX = "LATEX"
    CONTRAST = "CONTRAST"
    OTHER = "OTHER"

class AllergyReactionEnum(str, Enum):
    ANAPHYLAXIS = "ANAPHYLAXIS"
    RASH = "RASH"
    HIVES = "HIVES"
    SWELLING = "SWELLING"
    RESPIRATORY = "RESPIRATORY"
    GI = "GI"
    UNKNOWN = "UNKNOWN"
    OTHER = "OTHER"

class AllergyStatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    RESOLVED = "RESOLVED"

class MedicationTypeEnum(str, Enum):
    PRESCRIPTION = "PRESCRIPTION"
    OTC = "OTC"
    HERBAL = "HERBAL"
    SUPPLEMENT = "SUPPLEMENT"
    OTHER = "OTHER"

class ASAClassificationEnum(str, Enum):
    CLASS_I = "I"
    CLASS_II = "II"
    CLASS_III = "III"
    CLASS_IV = "IV"
    CLASS_V = "V"
    CLASS_VI = "VI"

# Base schemas

class MedicalConditionBase(BaseModel):
    name: str
    icd_code: Optional[str] = None
    severity: Optional[str] = "moderate"  # mild, moderate, severe
    is_controlled: Optional[bool] = False
    last_episode: Optional[datetime] = None
    diagnosis_date: Optional[datetime] = None
    notes: Optional[str] = None
    dental_considerations: Optional[List[str]] = Field(default_factory=list)

class AllergyBase(BaseModel):
    allergen: str
    type: AllergyTypeEnum = AllergyTypeEnum.MEDICATION
    reaction: AllergyReactionEnum = AllergyReactionEnum.UNKNOWN
    severity: Optional[str] = "moderate"  # mild, moderate, severe
    status: AllergyStatusEnum = AllergyStatusEnum.ACTIVE
    onset_date: Optional[datetime] = None
    notes: Optional[str] = None

class MedicationBase(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    type: MedicationTypeEnum = MedicationTypeEnum.PRESCRIPTION
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    prescribing_provider: Optional[str] = None
    reason: Optional[str] = None
    dental_considerations: Optional[List[str]] = Field(default_factory=list)
    notes: Optional[str] = None

class MedicalHistoryBase(BaseModel):
    has_heart_disease: Optional[bool] = False
    has_diabetes: Optional[bool] = False
    has_hypertension: Optional[bool] = False
    has_respiratory_disease: Optional[bool] = False
    has_bleeding_disorder: Optional[bool] = False
    current_smoker: Optional[bool] = False
    pregnant: Optional[bool] = False
    notes: Optional[str] = None
    conditions: Optional[List[MedicalConditionBase]] = Field(default_factory=list)

# Create schemas

class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: Union[datetime, date]
    gender: Optional[GenderEnum] = GenderEnum.UNKNOWN
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_id: Optional[str] = None
    insurance_group: Optional[str] = None
    insurance_type: Optional[InsuranceTypeEnum] = None
    preferred_language: Optional[str] = "English"
    preferred_contact_method: Optional[str] = "email"
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    
    # Validate date of birth
    @validator('date_of_birth')
    def validate_dob(cls, v):
        if isinstance(v, date) and not isinstance(v, datetime):
            return datetime.combine(v, datetime.min.time())
        return v
    
    @validator('date_of_birth')
    def check_dob_not_future(cls, v):
        if v > datetime.now():
            raise ValueError("Date of birth cannot be in the future")
        return v

class PatientIntakeCreate(BaseModel):
    patient: PatientCreate
    medical_history: Optional[MedicalHistoryBase] = None
    allergies: Optional[List[AllergyBase]] = Field(default_factory=list)
    medications: Optional[List[MedicationBase]] = Field(default_factory=list)
    
    class Config:
        schema_extra = {
            "example": {
                "patient": {
                    "first_name": "John",
                    "last_name": "Doe",
                    "date_of_birth": "1980-01-15",
                    "gender": "male",
                    "email": "john.doe@example.com",
                    "phone": "555-123-4567",
                    "address": "123 Main St, Anytown, USA",
                    "insurance_provider": "Blue Cross",
                    "insurance_id": "BC123456789",
                    "preferred_language": "English"
                },
                "medical_history": {
                    "has_heart_disease": False,
                    "has_diabetes": True,
                    "current_smoker": False,
                    "conditions": [
                        {
                            "name": "Type 2 Diabetes",
                            "icd_code": "E11.9",
                            "is_controlled": True,
                            "severity": "moderate",
                            "dental_considerations": [
                                "Monitor for delayed healing",
                                "Increased risk of infection"
                            ]
                        }
                    ]
                },
                "allergies": [
                    {
                        "allergen": "Penicillin",
                        "type": "MEDICATION",
                        "reaction": "RASH",
                        "severity": "moderate"
                    }
                ],
                "medications": [
                    {
                        "name": "Metformin",
                        "dosage": "500mg",
                        "frequency": "twice daily",
                        "reason": "Diabetes management"
                    }
                ]
            }
        }

# Response schemas

class MedicalConditionResponse(MedicalConditionBase):
    id: str
    medical_history_id: str
    created_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class AllergyResponse(AllergyBase):
    id: str
    patient_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class MedicationResponse(MedicationBase):
    id: str
    patient_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class MedicalHistoryResponse(MedicalHistoryBase):
    id: str
    patient_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    conditions: List[MedicalConditionResponse] = []
    
    class Config:
        orm_mode = True

class PatientResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    date_of_birth: datetime
    gender: GenderEnum
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_id: Optional[str] = None
    insurance_group: Optional[str] = None
    insurance_type: Optional[InsuranceTypeEnum] = None
    account_number: Optional[str] = None
    registration_date: Optional[datetime] = None
    is_active: bool = True
    preferred_language: Optional[str] = None
    preferred_contact_method: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_visit: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class MedicalAlertResponse(BaseModel):
    type: str  # allergy, medication, medical, asa
    severity: str  # low, medium, high
    description: str
    considerations: Optional[str] = None
    reaction: Optional[str] = None

class PatientMedicalProfileResponse(BaseModel):
    patient: PatientResponse
    medical_history: Optional[MedicalHistoryResponse] = None
    allergies: List[AllergyResponse] = []
    medications: List[MedicationResponse] = []
    asa_classification: Optional[str] = None
    last_reviewed: Optional[datetime] = None
    alerts: List[MedicalAlertResponse] = []
    
    class Config:
        orm_mode = True

# Update schemas

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[GenderEnum] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_id: Optional[str] = None
    insurance_group: Optional[str] = None
    insurance_type: Optional[InsuranceTypeEnum] = None
    is_active: Optional[bool] = None
    preferred_language: Optional[str] = None
    preferred_contact_method: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

class MedicalHistoryUpdate(BaseModel):
    has_heart_disease: Optional[bool] = None
    has_diabetes: Optional[bool] = None
    has_hypertension: Optional[bool] = None
    has_respiratory_disease: Optional[bool] = None
    has_bleeding_disorder: Optional[bool] = None
    current_smoker: Optional[bool] = None
    pregnant: Optional[bool] = None
    notes: Optional[str] = None
    conditions: Optional[List[MedicalConditionBase]] = None 