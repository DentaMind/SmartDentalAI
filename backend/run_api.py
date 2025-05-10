#!/usr/bin/env python3
"""
Simple DentaMind API Server for testing connectivity
"""

import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("test-api")

# Create FastAPI app with appropriate metadata
app = FastAPI(
    title="DentaMind Test API",
    description="Test API for DentaMind dental practice management system",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint providing API information"""
    return {
        "message": "DentaMind Test API Root",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "components": {
            "api": "online"
        },
        "version": "1.0.0"
    }

@app.get("/api/patients")
async def get_patients():
    """Get list of patients (test)"""
    return [
        {"id": "P001", "name": "John Doe", "age": 35},
        {"id": "P002", "name": "Jane Smith", "age": 42},
        {"id": "P003", "name": "Robert Johnson", "age": 28}
    ]

@app.get("/api/patients/{patient_id}")
async def get_patient(patient_id: str):
    """Get specific patient details (test)"""
    patients = {
        "P001": {"id": "P001", "name": "John Doe", "age": 35, "email": "john@example.com"},
        "P002": {"id": "P002", "name": "Jane Smith", "age": 42, "email": "jane@example.com"},
        "P003": {"id": "P003", "name": "Robert Johnson", "age": 28, "email": "robert@example.com"}
    }
    
    if patient_id not in patients:
        return {"error": "Patient not found"}
    
    return patients[patient_id]

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("run_api:app", host="0.0.0.0", port=port, reload=True) 