#!/usr/bin/env python3
"""
Patient Data Server for DentaMind Platform
Handles patient records, medical history, and treatment data
"""

import os
import json
import logging
import uvicorn
from datetime import datetime
from typing import List, Dict, Optional, Any, Union
from enum import Enum
from pydantic import BaseModel, Field, EmailStr, validator

from fastapi import FastAPI, Depends, HTTPException, status, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
PATIENT_PORT = int(os.environ.get("PATIENT_PORT", 8086))

# Create FastAPI app
app = FastAPI(
    title="DentaMind Patient API",
    description="Patient data API for DentaMind Platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

class AddressBase(BaseModel):
    street: str
    city: str
    state: str
    postal_code: str
    country: str = "USA"

class Address(AddressBase):
    id: str
    address_type: str = "home"
    patient_id: str

class ContactBase(BaseModel):
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

class Contact(ContactBase):
    id: str
    patient_id: str

class InsuranceBase(BaseModel):
    provider: str
    policy_number: str
    group_number: Optional[str] = None
    subscriber_name: Optional[str] = None
    subscriber_dob: Optional[datetime] = None
    subscriber_relationship: Optional[str] = None
    insurance_type: str = "primary"

class Insurance(InsuranceBase):
    id: str
    patient_id: str

class MedicalHistoryBase(BaseModel):
    allergies: List[str] = []
    medications: List[str] = []
    conditions: List[str] = []
    surgeries: List[str] = []
    smoking_status: Optional[str] = None
    alcohol_use: Optional[str] = None
    last_physical_exam: Optional[datetime] = None
    family_history: Optional[Dict[str, List[str]]] = None
    
class MedicalHistory(MedicalHistoryBase):
    id: str
    patient_id: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DentalHistoryBase(BaseModel):
    last_dental_visit: Optional[datetime] = None
    brushing_frequency: Optional[str] = None
    flossing_frequency: Optional[str] = None
    chief_complaint: Optional[str] = None
    previous_dental_treatments: List[str] = []
    dental_fear_level: Optional[int] = None
    gum_issues: List[str] = []
    
class DentalHistory(DentalHistoryBase):
    id: str
    patient_id: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PatientBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: datetime
    gender: Optional[Gender] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    ssn_last_4: Optional[str] = None
    preferred_name: Optional[str] = None
    preferred_pronouns: Optional[str] = None
    
    @validator('ssn_last_4')
    def validate_ssn(cls, v):
        if v and not v.isdigit():
            raise ValueError("SSN last 4 must contain only digits")
        if v and len(v) != 4:
            raise ValueError("SSN last 4 must be exactly 4 digits")
        return v

class PatientCreate(PatientBase):
    address: Optional[AddressBase] = None
    contact: Optional[ContactBase] = None
    insurance: Optional[InsuranceBase] = None
    medical_history: Optional[MedicalHistoryBase] = None
    dental_history: Optional[DentalHistoryBase] = None

class Patient(PatientBase):
    id: str
    status: str = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    address: Optional[Address] = None
    contact: Optional[Contact] = None
    insurance: Optional[List[Insurance]] = None
    medical_history: Optional[MedicalHistory] = None
    dental_history: Optional[DentalHistory] = None
    
    class Config:
        orm_mode = True

class TreatmentStatus(str, Enum):
    PLANNED = "planned"
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELED = "canceled"

class TreatmentBase(BaseModel):
    procedure_code: str
    tooth_number: Optional[str] = None
    surface: Optional[str] = None
    quadrant: Optional[str] = None
    arch: Optional[str] = None
    description: str
    notes: Optional[str] = None
    fee: float
    status: TreatmentStatus = TreatmentStatus.PLANNED
    provider_id: Optional[str] = None

class Treatment(TreatmentBase):
    id: str
    patient_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class TreatmentPlan(BaseModel):
    id: str
    patient_id: str
    name: str
    description: Optional[str] = None
    treatments: List[Treatment]
    total_fee: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Mock database - in a real app this would be a real database
# Initialize with some sample data
PATIENTS_DB = {
    "patient-1": {
        "id": "patient-1",
        "first_name": "John",
        "last_name": "Doe",
        "date_of_birth": "1980-01-15T00:00:00",
        "gender": "male",
        "email": "john.doe@example.com",
        "phone": "555-123-4567",
        "ssn_last_4": "1234",
        "preferred_name": "Johnny",
        "preferred_pronouns": "he/him",
        "status": "active",
        "created_at": "2023-01-01T00:00:00",
        "updated_at": "2023-04-15T00:00:00",
        "address": {
            "id": "addr-1",
            "street": "123 Main St",
            "city": "Anytown",
            "state": "CA",
            "postal_code": "12345",
            "country": "USA",
            "address_type": "home",
            "patient_id": "patient-1"
        },
        "contact": {
            "id": "contact-1",
            "phone": "555-123-4567",
            "email": "john.doe@example.com",
            "emergency_contact_name": "Jane Doe",
            "emergency_contact_phone": "555-987-6543",
            "patient_id": "patient-1"
        },
        "insurance": [
            {
                "id": "ins-1",
                "provider": "Delta Dental",
                "policy_number": "DD123456",
                "group_number": "GRP987",
                "subscriber_name": "John Doe",
                "subscriber_dob": "1980-01-15T00:00:00",
                "subscriber_relationship": "self",
                "insurance_type": "primary",
                "patient_id": "patient-1"
            }
        ],
        "medical_history": {
            "id": "med-1",
            "allergies": ["Penicillin", "Latex"],
            "medications": ["Lisinopril 10mg"],
            "conditions": ["Hypertension"],
            "surgeries": ["Appendectomy 2010"],
            "smoking_status": "Non-smoker",
            "alcohol_use": "Occasional",
            "last_physical_exam": "2023-01-10T00:00:00",
            "family_history": {
                "diabetes": ["Mother"],
                "heart_disease": ["Father"]
            },
            "patient_id": "patient-1",
            "updated_at": "2023-04-15T00:00:00"
        },
        "dental_history": {
            "id": "dent-1",
            "last_dental_visit": "2022-11-10T00:00:00",
            "brushing_frequency": "Twice daily",
            "flossing_frequency": "Daily",
            "chief_complaint": "Sensitivity to cold",
            "previous_dental_treatments": ["Fillings", "Root Canal"],
            "dental_fear_level": 2,
            "gum_issues": ["Occasional bleeding when flossing"],
            "patient_id": "patient-1",
            "updated_at": "2023-04-15T00:00:00"
        }
    },
    "patient-2": {
        "id": "patient-2",
        "first_name": "Jane",
        "last_name": "Smith",
        "date_of_birth": "1975-06-22T00:00:00",
        "gender": "female",
        "email": "jane.smith@example.com",
        "phone": "555-987-6543",
        "ssn_last_4": "5678",
        "preferred_name": "Jane",
        "preferred_pronouns": "she/her",
        "status": "active",
        "created_at": "2023-02-15T00:00:00",
        "updated_at": "2023-04-20T00:00:00",
        "address": {
            "id": "addr-2",
            "street": "456 Oak Ave",
            "city": "Somewhere",
            "state": "NY",
            "postal_code": "54321",
            "country": "USA",
            "address_type": "home",
            "patient_id": "patient-2"
        },
        "contact": {
            "id": "contact-2",
            "phone": "555-987-6543",
            "email": "jane.smith@example.com",
            "emergency_contact_name": "John Smith",
            "emergency_contact_phone": "555-123-4567",
            "patient_id": "patient-2"
        },
        "insurance": [
            {
                "id": "ins-2",
                "provider": "Cigna Dental",
                "policy_number": "CD789012",
                "group_number": "GRP654",
                "subscriber_name": "Jane Smith",
                "subscriber_dob": "1975-06-22T00:00:00",
                "subscriber_relationship": "self",
                "insurance_type": "primary",
                "patient_id": "patient-2"
            }
        ],
        "medical_history": {
            "id": "med-2",
            "allergies": ["Sulfa Drugs"],
            "medications": ["Levothyroxine 50mcg"],
            "conditions": ["Hypothyroidism"],
            "surgeries": ["Cesarean section 2005"],
            "smoking_status": "Former smoker",
            "alcohol_use": "Rarely",
            "last_physical_exam": "2023-02-05T00:00:00",
            "family_history": {
                "thyroid_disease": ["Mother", "Sister"],
                "cancer": ["Father"]
            },
            "patient_id": "patient-2",
            "updated_at": "2023-04-20T00:00:00"
        },
        "dental_history": {
            "id": "dent-2",
            "last_dental_visit": "2022-12-05T00:00:00",
            "brushing_frequency": "Twice daily",
            "flossing_frequency": "Few times a week",
            "chief_complaint": "Cosmetic concerns",
            "previous_dental_treatments": ["Fillings", "Crowns", "Whitening"],
            "dental_fear_level": 4,
            "gum_issues": ["Recession"],
            "patient_id": "patient-2",
            "updated_at": "2023-04-20T00:00:00"
        }
    }
}

TREATMENT_PLANS_DB = {
    "tp-1": {
        "id": "tp-1",
        "patient_id": "patient-1",
        "name": "Restorative Treatment Plan",
        "description": "Treatment for decay and prevention",
        "treatments": [
            {
                "id": "tx-1",
                "patient_id": "patient-1",
                "procedure_code": "D2150",
                "tooth_number": "3",
                "surface": "MOD",
                "description": "Amalgam - two surfaces, primary or permanent",
                "fee": 150.00,
                "status": "completed",
                "provider_id": "provider-1",
                "created_at": "2023-03-01T00:00:00",
                "updated_at": "2023-03-15T00:00:00",
                "completed_at": "2023-03-15T00:00:00"
            },
            {
                "id": "tx-2",
                "patient_id": "patient-1",
                "procedure_code": "D2330",
                "tooth_number": "8",
                "surface": "MF",
                "description": "Resin-based composite - one surface, anterior",
                "fee": 175.00,
                "status": "planned",
                "provider_id": "provider-1",
                "created_at": "2023-03-01T00:00:00",
                "updated_at": "2023-03-01T00:00:00"
            },
            {
                "id": "tx-3",
                "patient_id": "patient-1",
                "procedure_code": "D1110",
                "description": "Prophylaxis - adult",
                "fee": 95.00,
                "status": "scheduled",
                "provider_id": "provider-2",
                "created_at": "2023-03-01T00:00:00",
                "updated_at": "2023-03-10T00:00:00"
            }
        ],
        "total_fee": 420.00,
        "created_at": "2023-03-01T00:00:00",
        "updated_at": "2023-03-15T00:00:00"
    },
    "tp-2": {
        "id": "tp-2",
        "patient_id": "patient-2",
        "name": "Cosmetic Treatment Plan",
        "description": "Smile enhancement",
        "treatments": [
            {
                "id": "tx-4",
                "patient_id": "patient-2",
                "procedure_code": "D2740",
                "tooth_number": "8",
                "description": "Crown - porcelain/ceramic substrate",
                "fee": 1200.00,
                "status": "planned",
                "provider_id": "provider-1",
                "created_at": "2023-04-01T00:00:00",
                "updated_at": "2023-04-01T00:00:00"
            },
            {
                "id": "tx-5",
                "patient_id": "patient-2",
                "procedure_code": "D2740",
                "tooth_number": "9",
                "description": "Crown - porcelain/ceramic substrate",
                "fee": 1200.00,
                "status": "planned",
                "provider_id": "provider-1",
                "created_at": "2023-04-01T00:00:00",
                "updated_at": "2023-04-01T00:00:00"
            },
            {
                "id": "tx-6",
                "patient_id": "patient-2",
                "procedure_code": "D9972",
                "description": "External bleaching - per arch - performed in office",
                "arch": "both",
                "fee": 500.00,
                "status": "planned",
                "provider_id": "provider-2",
                "created_at": "2023-04-01T00:00:00",
                "updated_at": "2023-04-01T00:00:00"
            }
        ],
        "total_fee": 2900.00,
        "created_at": "2023-04-01T00:00:00",
        "updated_at": "2023-04-01T00:00:00"
    }
}

# Routes
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "DentaMind Patient API",
        "documentation": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/patients", response_model=List[Patient])
async def get_patients(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: Optional[str] = None
):
    """Get a list of patients"""
    filtered_patients = []
    
    for patient_id, patient in PATIENTS_DB.items():
        if status and patient["status"] != status:
            continue
        filtered_patients.append(Patient(**patient))
    
    # Apply pagination
    paginated = filtered_patients[offset:offset + limit]
    return paginated

@app.get("/patients/{patient_id}", response_model=Patient)
async def get_patient(patient_id: str):
    """Get a single patient by ID"""
    if patient_id not in PATIENTS_DB:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return Patient(**PATIENTS_DB[patient_id])

@app.get("/patients/{patient_id}/treatment-plans", response_model=List[TreatmentPlan])
async def get_patient_treatment_plans(patient_id: str):
    """Get treatment plans for a patient"""
    if patient_id not in PATIENTS_DB:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    plans = []
    for plan_id, plan in TREATMENT_PLANS_DB.items():
        if plan["patient_id"] == patient_id:
            plans.append(TreatmentPlan(**plan))
    
    return plans

@app.get("/treatment-plans/{plan_id}", response_model=TreatmentPlan)
async def get_treatment_plan(plan_id: str):
    """Get a treatment plan by ID"""
    if plan_id not in TREATMENT_PLANS_DB:
        raise HTTPException(status_code=404, detail="Treatment plan not found")
    
    return TreatmentPlan(**TREATMENT_PLANS_DB[plan_id])

@app.get("/search/patients")
async def search_patients(
    query: str,
    limit: int = Query(10, ge=1, le=100)
):
    """Search for patients by name, email, or ID"""
    results = []
    query = query.lower()
    
    for patient_id, patient in PATIENTS_DB.items():
        if (query in patient_id.lower() or
            query in patient["first_name"].lower() or
            query in patient["last_name"].lower() or
            (patient["email"] and query in patient["email"].lower()) or
            (query in f"{patient['first_name']} {patient['last_name']}".lower())):
            
            # Simplify the response for search results
            results.append({
                "id": patient["id"],
                "first_name": patient["first_name"],
                "last_name": patient["last_name"],
                "date_of_birth": patient["date_of_birth"],
                "email": patient["email"],
                "phone": patient["phone"]
            })
            
            if len(results) >= limit:
                break
    
    return {"results": results, "count": len(results)}

# Error handling
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Main entry point
if __name__ == "__main__":
    logger.info(f"Starting Patient Data Server on port {PATIENT_PORT}")
    uvicorn.run(app, host="0.0.0.0", port=PATIENT_PORT) 