from fastapi import APIRouter, HTTPException, status, Depends, Body
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum
import uuid

router = APIRouter(prefix="/api/risk", tags=["risk"])

class ASAClassification(str, Enum):
    """
    ASA Physical Status Classification System
    https://www.asahq.org/standards-and-guidelines/asa-physical-status-classification-system
    """
    ASA_1 = "ASA_1"  # A normal healthy patient
    ASA_2 = "ASA_2"  # A patient with mild systemic disease
    ASA_3 = "ASA_3"  # A patient with severe systemic disease
    ASA_4 = "ASA_4"  # A patient with severe systemic disease that is a constant threat to life
    ASA_5 = "ASA_5"  # A moribund patient who is not expected to survive without the operation
    ASA_6 = "ASA_6"  # A declared brain-dead patient whose organs are being removed for donor purposes

class RiskLevel(str, Enum):
    """General risk level classification"""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    EXTREME = "extreme"

class MedicalCondition(BaseModel):
    """A medical condition with contextual information"""
    name: str
    details: Optional[str] = None
    controlled: Optional[bool] = None
    medications: Optional[List[str]] = None
    last_episode: Optional[str] = None
    severity: Optional[str] = None

class Medication(BaseModel):
    """Medication details"""
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    purpose: Optional[str] = None

class MedicalHistoryRequest(BaseModel):
    """Request model for medical history assessment"""
    patient_id: str
    conditions: List[MedicalCondition]
    medications: Optional[List[Medication]] = None
    allergies: Optional[List[str]] = None
    surgeries: Optional[List[str]] = None
    family_history: Optional[Dict[str, Any]] = None
    vital_signs: Optional[Dict[str, Any]] = None
    habits: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class RiskAssessment(BaseModel):
    """Response model for risk assessment"""
    assessment_id: str
    patient_id: str
    timestamp: datetime
    asa_classification: ASAClassification
    dental_risk_level: RiskLevel
    anesthesia_risk_level: RiskLevel
    bleeding_risk_level: RiskLevel
    medication_interactions: List[Dict[str, Any]]
    precautions: List[str]
    recommendations: List[str]
    notes: Optional[str] = None

SAMPLE_RISK_ASSESSMENTS = {
    "low_risk": {
        "assessment_id": "risk_low_sample",
        "patient_id": "SAMPLE_PATIENT",
        "timestamp": datetime.utcnow().isoformat(),
        "asa_classification": ASAClassification.ASA_1,
        "dental_risk_level": RiskLevel.LOW,
        "anesthesia_risk_level": RiskLevel.LOW,
        "bleeding_risk_level": RiskLevel.LOW,
        "medication_interactions": [],
        "precautions": [
            "Standard precautions apply"
        ],
        "recommendations": [
            "Proceed with routine dental treatment",
            "No special considerations needed"
        ],
        "notes": "Healthy patient with no significant medical concerns"
    },
    "moderate_risk": {
        "assessment_id": "risk_moderate_sample",
        "patient_id": "SAMPLE_PATIENT",
        "timestamp": datetime.utcnow().isoformat(),
        "asa_classification": ASAClassification.ASA_2,
        "dental_risk_level": RiskLevel.MODERATE,
        "anesthesia_risk_level": RiskLevel.MODERATE,
        "bleeding_risk_level": RiskLevel.LOW,
        "medication_interactions": [
            {
                "medication": "Lisinopril",
                "interaction": "May experience orthostatic hypotension during lengthy procedures",
                "recommendation": "Monitor blood pressure, have patient change positions slowly"
            }
        ],
        "precautions": [
            "Monitor blood pressure before and after procedure",
            "Consider shorter appointments if anxiety is a concern"
        ],
        "recommendations": [
            "Consult with physician if planning surgical procedures",
            "Consider morning appointments"
        ],
        "notes": "Well-controlled hypertension, anxiety disorder"
    },
    "high_risk": {
        "assessment_id": "risk_high_sample",
        "patient_id": "SAMPLE_PATIENT",
        "timestamp": datetime.utcnow().isoformat(),
        "asa_classification": ASAClassification.ASA_3,
        "dental_risk_level": RiskLevel.HIGH,
        "anesthesia_risk_level": RiskLevel.HIGH,
        "bleeding_risk_level": RiskLevel.HIGH,
        "medication_interactions": [
            {
                "medication": "Warfarin",
                "interaction": "Increased bleeding risk during invasive procedures",
                "recommendation": "Check INR within 24 hours before invasive treatment"
            },
            {
                "medication": "Metformin",
                "interaction": "May need to adjust for longer procedures due to hypoglycemia risk",
                "recommendation": "Schedule morning appointments after normal breakfast and medication"
            }
        ],
        "precautions": [
            "Medical consultation required before invasive procedures",
            "Monitor vital signs before, during, and after treatment",
            "Have emergency protocol ready"
        ],
        "recommendations": [
            "Consider antibiotic prophylaxis",
            "Stress reduction protocol recommended",
            "Schedule shorter appointments",
            "Have glucose source available"
        ],
        "notes": "Diabetes with periodic hypoglycemic episodes, on anticoagulation therapy for AFib"
    }
}

@router.get("/test")
async def test_connection():
    """Simple test endpoint to verify the risk assessment router is working"""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "status": "risk assessment module healthy",
        "asa_classifications": [classification.value for classification in ASAClassification],
        "risk_levels": [level.value for level in RiskLevel]
    }

@router.post("/assess", response_model=RiskAssessment)
async def assess_medical_risk(history: MedicalHistoryRequest):
    """
    Assess patient medical risk based on medical history
    
    Args:
        history: Patient medical history information
    """
    try:
        # In a real implementation, this would:
        # 1. Analyze the medical history
        # 2. Apply risk assessment algorithms
        # 3. Generate personalized recommendations
        
        # For the mock implementation, we'll return different sample assessments
        # based on the number of conditions
        
        risk_level = "low_risk"
        if len(history.conditions) >= 3:
            risk_level = "high_risk"
        elif len(history.conditions) >= 1:
            risk_level = "moderate_risk"
            
        assessment = SAMPLE_RISK_ASSESSMENTS[risk_level].copy()
        assessment["patient_id"] = history.patient_id
        assessment["assessment_id"] = f"risk_{uuid.uuid4().hex[:8]}"
        assessment["timestamp"] = datetime.utcnow().isoformat()
        
        # Add custom notes based on specific conditions
        condition_notes = []
        for condition in history.conditions:
            if condition.name.lower() in ["diabetes", "diabetes mellitus"]:
                condition_notes.append(f"Patient has {condition.name}. Consider glucose monitoring.")
            elif "hypertension" in condition.name.lower():
                condition_notes.append(f"Patient has {condition.name}. Monitor blood pressure.")
                
        if condition_notes:
            assessment["notes"] = ". ".join(condition_notes)
            
        return assessment
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk assessment failed: {str(e)}")

@router.get("/history/{patient_id}")
async def get_risk_history(patient_id: str):
    """Get risk assessment history for a patient"""
    # In a real implementation, this would query the database
    return {
        "patient_id": patient_id,
        "assessments": [
            {
                "assessment_id": f"risk_98765abc",
                "date": "2023-10-15T09:30:00",
                "asa_classification": ASAClassification.ASA_2,
                "dental_risk_level": RiskLevel.MODERATE,
                "summary": "Moderate risk due to controlled hypertension and anxiety"
            },
            {
                "assessment_id": f"risk_54321def",
                "date": "2024-02-22T14:15:00",
                "asa_classification": ASAClassification.ASA_2,
                "dental_risk_level": RiskLevel.MODERATE,
                "summary": "Moderate risk due to controlled hypertension and anxiety"
            }
        ]
    }

@router.get("/sample/{risk_level}")
async def get_sample_assessment(risk_level: str):
    """Get a sample risk assessment by risk level"""
    if risk_level not in SAMPLE_RISK_ASSESSMENTS:
        valid_levels = ", ".join(SAMPLE_RISK_ASSESSMENTS.keys())
        raise HTTPException(status_code=404, detail=f"Risk level '{risk_level}' not found. Valid options: {valid_levels}")
    
    return SAMPLE_RISK_ASSESSMENTS[risk_level]

@router.get("/asa-classification")
async def get_asa_classification():
    """Get ASA classification guidelines"""
    return {
        "classifications": [
            {
                "class": "ASA I",
                "description": "Normal healthy patient",
                "examples": "No organic, physiological, or psychiatric disturbance"
            },
            {
                "class": "ASA II",
                "description": "Patient with mild systemic disease",
                "examples": "Well-controlled hypertension, diabetes"
            },
            {
                "class": "ASA III",
                "description": "Patient with severe systemic disease",
                "examples": "Poorly controlled hypertension, diabetes with complications"
            },
            {
                "class": "ASA IV",
                "description": "Patient with severe systemic disease that is a constant threat to life",
                "examples": "Recent myocardial infarction, severe COPD"
            },
            {
                "class": "ASA V",
                "description": "Moribund patient who is not expected to survive without the operation",
                "examples": "Ruptured abdominal aortic aneurysm, massive trauma"
            }
        ]
    } 