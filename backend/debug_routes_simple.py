#!/usr/bin/env python3
"""
Simplified Debug Routes Server for DentaMind Platform
Provides debug endpoints for all APIs to help with testing and development
Port: 8092
"""

import os
import logging
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import datetime
import json

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="DentaMind Debug API (Simple)",
    description="Debug API with test routes for DentaMind Platform",
    version="1.0.0"
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add middleware to log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request path: {request.url.path}")
    response = await call_next(request)
    return response

# Basic health check
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "DentaMind Debug API",
        "version": "1.0.0",
        "time": datetime.datetime.utcnow().isoformat()
    }

# Health check endpoints
@app.get("/health")
@app.get("/api/health")
async def health_check():
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

# Patient API endpoints
@app.get("/api/patients/sample")
async def patient_sample():
    """Get sample patients"""
    return [
        {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "555-1234"
        },
        {
            "id": 2,
            "name": "Jane Smith",
            "email": "jane@example.com",
            "phone": "555-5678"
        },
        {
            "id": 3,
            "name": "Bob Johnson",
            "email": "bob@example.com",
            "phone": "555-9012"
        }
    ]

# Treatment API endpoints
@app.get("/api/treatment/treatment-plans/patient/{patient_id}")
async def treatment_plans(patient_id: str):
    """Get treatment plans for a patient"""
    logger.info(f"Accessing treatment plans for patient {patient_id}")
    return {
        "patient_id": patient_id,
        "treatment_plans": [
            {
                "id": "tp-001",
                "name": "Restorative Plan",
                "created_date": "2023-01-18T14:30:00",
                "status": "active",
                "treatments": [
                    {
                        "id": "tx-001",
                        "tooth": "3",
                        "procedure": "Amalgam filling",
                        "surface": "MOD",
                        "status": "completed",
                        "completed_date": "2023-02-05T09:15:00",
                        "fee": 150.00
                    },
                    {
                        "id": "tx-002",
                        "tooth": "14",
                        "procedure": "Composite filling",
                        "surface": "DO",
                        "status": "planned",
                        "fee": 175.00
                    }
                ],
                "total_fee": 325.00
            }
        ]
    }

# Prescriptions API endpoints
@app.get("/api/prescriptions/patient/{patient_id}")
async def prescriptions(patient_id: str):
    """Get prescriptions for a patient"""
    logger.info(f"Accessing prescriptions for patient {patient_id}")
    return {
        "patient_id": patient_id,
        "prescriptions": [
            {
                "id": "rx-001",
                "medication": "Amoxicillin",
                "dosage": "500mg",
                "frequency": "TID",
                "duration": "7 days",
                "prescribing_doctor": "Dr. Smith",
                "prescription_date": "2023-02-05T11:30:00",
                "reason": "Post-extraction prophylaxis"
            }
        ]
    }

# Run the server
if __name__ == "__main__":
    print("Starting simplified DentaMind Debug Server...")
    port = int(os.environ.get("PORT", 3000))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info") 