#!/usr/bin/env python3
"""
Simplified Debug Routes Server for DentaMind Platform
Provides debug endpoints for all APIs to help with testing and development
Port: 3000
"""

import os
import logging
import uvicorn
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Dict, List, Optional, Any
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

# Auth endpoints
@app.post("/token")
async def get_token(username: str = None, password: str = None):
    """Simplified authentication endpoint for testing"""
    # Basic auth verification for demo/test accounts
    if (username == "demo@dentamind.com" and password == "password123") or \
       (username == "admin@dentamind.com" and password == "admin123"):
        # Generate mock token
        expiration = datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
        return {
            "access_token": "mocktoken123456789",
            "token_type": "bearer",
            "expires_at": expiration.isoformat()
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

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

# Knowledge API endpoints
@app.get("/api/knowledge/categories")
async def knowledge_categories():
    """Get knowledge categories"""
    return {
        "categories": [
            "anatomy", "pathology", "treatments", "medications", 
            "procedures", "diagnostics", "materials", "instruments",
            "radiology", "periodontics", "orthodontics", "endodontics"
        ]
    }

# Diagnostic endpoint to test if server is working
@app.get("/debug/status")
async def debug_status():
    """Diagnostic endpoint with system information"""
    import platform
    import sys
    
    return {
        "status": "operational",
        "server_time": datetime.datetime.utcnow().isoformat(),
        "python_version": sys.version,
        "platform": platform.platform(),
        "endpoints_available": len(app.routes)
    }

# Run the server
if __name__ == "__main__":
    print("Starting simplified DentaMind Debug Server...")
    port = int(os.environ.get("PORT", 3000))
    uvicorn.run(app, host="0.0.0.0", port=port) 