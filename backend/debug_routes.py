#!/usr/bin/env python3
"""
Debug server with simplified routes for the DentaMind API.
This version runs on port 8090 to avoid conflicts with other services.
"""

import logging
import uvicorn
import json
from datetime import datetime
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s:%(name)s:%(message)s'
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="DentaMind Debug API",
    description="Debug API for DentaMind dental practice management platform",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request logger middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests"""
    path = request.url.path
    logger.info(f"Request path: {path}")
    
    # Custom logging for specific endpoints
    if path.startswith("/api/treatment/treatment-plans/patient/"):
        patient_id = path.split("/")[-1]
        logger.info(f"Accessing treatment plans for patient {patient_id}")
    elif path.startswith("/api/prescriptions/patient/"):
        patient_id = path.split("/")[-1]
        logger.info(f"Accessing prescriptions for patient {patient_id}")
    
    response = await call_next(request)
    return response

# Root endpoint
@app.get("/", tags=["general"])
async def root():
    """API root endpoint"""
    return {
        "message": "DentaMind Debug API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "docs_url": "/docs"
    }

# Health check endpoint
@app.get("/health", tags=["general"])
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "components": {
            "database": "healthy",
            "disk": "healthy",
            "memory": "healthy",
            "cpu": "healthy"
        },
        "version": "1.0.0"
    }

@app.get("/api/health", tags=["general"])
async def api_health():
    """API health check endpoint"""
    return {
        "status": "healthy",
        "components": {
            "database": "healthy",
            "disk": "healthy",
            "memory": "healthy",
            "cpu": "healthy"
        },
        "version": "1.0.0"
    }

# Sample patients endpoint
@app.get("/api/patients/sample", tags=["patients"])
async def sample_patients():
    """Sample patients data for testing"""
    return [
        {"id": 1, "name": "John Doe", "email": "john@example.com", "phone": "555-1234"},
        {"id": 2, "name": "Jane Smith", "email": "jane@example.com", "phone": "555-5678"},
        {"id": 3, "name": "Bob Johnson", "email": "bob@example.com", "phone": "555-9012"},
        {"id": 4, "name": "Alice Brown", "email": "alice@example.com", "phone": "555-3456"},
        {"id": 5, "name": "Charlie Davis", "email": "charlie@example.com", "phone": "555-7890"}
    ]

# Treatment plan routes
@app.get("/api/treatment/treatment-plans/patient/{patient_id}", tags=["treatment"])
async def get_treatment_plans(patient_id: str):
    """Get treatment plans for a specific patient"""
    return [
        {
            "id": "tp-001",
            "patient_id": patient_id,
            "patient_name": "John Doe",
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
            "notes": "Initial treatment plan"
        }
    ]

# Prescriptions routes
@app.get("/api/prescriptions/patient/{patient_id}", tags=["prescriptions"])
async def get_patient_prescriptions(patient_id: str):
    """Get prescriptions for a specific patient"""
    return [
        {
            "id": "rx-001",
            "patient_id": patient_id,
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
            "patient_id": patient_id,
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

# Patient diagnosis history
@app.get("/api/diagnose/history/{patient_id}", tags=["diagnose"])
async def get_diagnose_history(patient_id: str):
    """Get diagnosis history for a specific patient"""
    return {
        "patient_id": patient_id,
        "diagnoses": [
            {
                "id": "diag-001",
                "date": "2023-01-15T10:30:00",
                "xray_type": "panoramic",
                "summary": "Moderate caries detected on 18, 46. Periapical lesion on 22."
            },
            {
                "id": "diag-002",
                "date": "2023-06-20T14:45:00",
                "xray_type": "bitewing",
                "summary": "Progression of caries on 46. New incipient caries on 24."
            }
        ]
    }

# Patient perio charts
@app.get("/api/perio/patients/{patient_id}/charts", tags=["perio"])
async def get_perio_charts(patient_id: str):
    """Get periodontal charts for a specific patient"""
    return [
        {
            "id": "pc-001",
            "patient_id": patient_id,
            "exam_date": "2023-05-15T09:30:00",
            "teeth": [
                {
                    "tooth_number": "16",
                    "pocket_depths": {
                        "MB": 3, "B": 2, "DB": 3,
                        "ML": 4, "L": 3, "DL": 4
                    },
                    "recession": {
                        "MB": 0, "B": 0, "DB": 0,
                        "ML": 1, "L": 1, "DL": 2
                    },
                    "mobility": 0,
                    "furcation": {
                        "B": 0, "ML": 0, "MB": 0
                    }
                },
                {
                    "tooth_number": "17",
                    "pocket_depths": {
                        "MB": 4, "B": 3, "DB": 3,
                        "ML": 5, "L": 4, "DL": 4
                    },
                    "recession": {
                        "MB": 0, "B": 0, "DB": 0,
                        "ML": 2, "L": 1, "DL": 2
                    },
                    "mobility": 1,
                    "furcation": {
                        "B": 1, "ML": 0, "MB": 0
                    }
                }
            ]
        }
    ]

# Server start code
if __name__ == "__main__":
    print("Starting DentaMind Debug API server...")
    uvicorn.run(app, host="0.0.0.0", port=8090, log_level="debug") 