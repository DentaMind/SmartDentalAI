from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/treatment", tags=["treatment"])

class TreatmentProcedure(BaseModel):
    id: str
    code: str
    description: str
    tooth_numbers: List[str]
    surfaces: List[str]
    priority: str
    estimated_cost: float
    insurance_coverage: Optional[float] = None
    notes: Optional[str] = None

class TreatmentPlan(BaseModel):
    id: str
    patient_id: str
    patient_name: str
    created_at: datetime
    status: str
    procedures: List[TreatmentProcedure]
    notes: Optional[str] = None

@router.get("/test")
async def test_connection():
    """Simple test endpoint to verify the treatment router is working"""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "status": "treatment module healthy"
    }

@router.get("/treatment-plans/patient/{patient_id}", response_model=List[TreatmentPlan])
async def get_patient_treatment_plans(patient_id: str):
    """Get all treatment plans for a patient"""
    # Sample data that would normally come from a database
    return [
        {
            "id": "tp-001",
            "patient_id": patient_id,
            "patient_name": "John Doe",
            "created_at": datetime.now(),
            "status": "DRAFT",
            "procedures": [
                {
                    "id": "proc-001",
                    "code": "D1110",
                    "description": "Prophylaxis - adult",
                    "tooth_numbers": [],
                    "surfaces": [],
                    "priority": "HIGH",
                    "estimated_cost": 120.00,
                    "insurance_coverage": 100.00,
                    "notes": "Standard cleaning"
                },
                {
                    "id": "proc-002",
                    "code": "D2150",
                    "description": "Amalgam - two surfaces",
                    "tooth_numbers": ["14"],
                    "surfaces": ["O", "D"],
                    "priority": "MEDIUM",
                    "estimated_cost": 210.00,
                    "insurance_coverage": 150.00,
                    "notes": "Moderate decay"
                }
            ],
            "notes": "Initial treatment plan"
        }
    ]

@router.get("/treatment-plans/{plan_id}", response_model=TreatmentPlan)
async def get_treatment_plan(plan_id: str):
    """Get a specific treatment plan"""
    # This would normally fetch from a database
    if plan_id == "tp-001":
        return {
            "id": plan_id,
            "patient_id": "patient-001",
            "patient_name": "John Doe",
            "created_at": datetime.now(),
            "status": "DRAFT",
            "procedures": [
                {
                    "id": "proc-001",
                    "code": "D1110",
                    "description": "Prophylaxis - adult",
                    "tooth_numbers": [],
                    "surfaces": [],
                    "priority": "HIGH",
                    "estimated_cost": 120.00,
                    "insurance_coverage": 100.00,
                    "notes": "Standard cleaning"
                }
            ],
            "notes": "Initial treatment plan"
        }
    else:
        raise HTTPException(status_code=404, detail="Treatment plan not found")

@router.get("/sample")
async def get_sample_treatment_plan():
    """Get a sample treatment plan for testing"""
    return {
        "id": "tp-sample",
        "patient_id": "SAMPLE_PATIENT",
        "patient_name": "Sample Patient",
        "created_at": datetime.now().isoformat(),
        "status": "DRAFT",
        "procedures": [
            {
                "id": "proc-001",
                "code": "D1110",
                "description": "Prophylaxis - adult",
                "tooth_numbers": [],
                "surfaces": [],
                "priority": "HIGH",
                "estimated_cost": 120.00,
                "insurance_coverage": 100.00,
                "notes": "Standard cleaning"
            },
            {
                "id": "proc-002",
                "code": "D2150",
                "description": "Amalgam - two surfaces",
                "tooth_numbers": ["14"],
                "surfaces": ["O", "D"],
                "priority": "MEDIUM",
                "estimated_cost": 210.00,
                "insurance_coverage": 150.00,
                "notes": "Moderate decay"
            }
        ],
        "notes": "Sample treatment plan"
    } 