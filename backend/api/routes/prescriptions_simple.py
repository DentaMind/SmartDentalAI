from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/prescriptions", tags=["prescriptions"])

# Sample prescriptions data
SAMPLE_PRESCRIPTIONS = [
    {
        "id": "rx-001",
        "patient_id": "patient-123",
        "patient_name": "John Doe",
        "doctor_id": "doc-001",
        "doctor_name": "Dr. Smith",
        "medication": {
            "name": "Amoxicillin",
            "dosage": "500mg",
            "frequency": "3 times daily",
            "duration": "7 days",
            "instructions": "Take with food"
        },
        "created_at": "2023-06-01T10:30:00",
        "status": "active",
        "notes": "For dental infection"
    },
    {
        "id": "rx-002",
        "patient_id": "patient-123",
        "patient_name": "John Doe",
        "doctor_id": "doc-001",
        "doctor_name": "Dr. Smith",
        "medication": {
            "name": "Ibuprofen",
            "dosage": "800mg",
            "frequency": "3 times daily",
            "duration": "5 days",
            "instructions": "Take with food"
        },
        "created_at": "2023-06-01T10:35:00",
        "status": "active",
        "notes": "For pain management"
    }
]

@router.get("/test")
async def test_connection():
    """Simple test endpoint to verify the prescriptions router is working"""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "status": "prescriptions module healthy"
    }

@router.get("/patient/{patient_id}")
async def get_patient_prescriptions(patient_id: str):
    """Get all prescriptions for a patient"""
    prescriptions = [p for p in SAMPLE_PRESCRIPTIONS if p["patient_id"] == patient_id]
    
    if not prescriptions:
        # Return empty list instead of 404 to align with REST principles
        return []
    
    return prescriptions

@router.get("/{prescription_id}")
async def get_prescription(prescription_id: str):
    """Get a specific prescription by ID"""
    for prescription in SAMPLE_PRESCRIPTIONS:
        if prescription["id"] == prescription_id:
            return prescription
    
    raise HTTPException(status_code=404, detail=f"Prescription {prescription_id} not found")

@router.post("/create")
async def create_prescription(prescription: Dict[str, Any]):
    """Create a new prescription (mock implementation)"""
    new_prescription = {
        "id": f"rx-{uuid.uuid4().hex[:8]}",
        "created_at": datetime.utcnow().isoformat(),
        "status": "active",
        **prescription
    }
    
    # In a real implementation, we would save this to a database
    # For now, just return the created prescription
    return {
        "status": "success",
        "message": "Prescription created successfully",
        "prescription": new_prescription
    }

@router.get("/sample")
async def get_sample_prescriptions():
    """Get sample prescriptions for testing"""
    return SAMPLE_PRESCRIPTIONS 