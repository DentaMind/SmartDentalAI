"""
Simple test server for DentaMind API
Provides minimal endpoints for testing and development
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import uvicorn
import datetime
import json
import os

# Create FastAPI app
app = FastAPI(
    title="DentaMind Test API",
    description="Minimal test API for DentaMind Platform",
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

# Health check endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "DentaMind Test API",
        "version": "1.0.0",
        "time": datetime.datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "components": {
            "database": "unknown",
            "services": "unknown"
        },
        "version": "1.0.0"
    }

# Sample data endpoints
@app.get("/api/sample/patients")
async def get_sample_patients():
    """Get sample patients"""
    return [
        {
            "id": "1",
            "name": "John Doe",
            "email": "john@example.com"
        },
        {
            "id": "2",
            "name": "Jane Smith",
            "email": "jane@example.com"
        }
    ]

@app.get("/api/sample/diagnoses")
async def get_sample_diagnoses():
    """Get sample diagnoses"""
    return [
        {
            "id": "diag-1",
            "patient_id": "1",
            "date": datetime.datetime.utcnow().isoformat(),
            "findings": "Moderate caries on 18, 46"
        }
    ]

# Run the server
if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 8090))
    print(f"Starting test server on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port) 