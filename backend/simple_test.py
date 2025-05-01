#!/usr/bin/env python3
"""
Simple test server for DentaMind platform
"""
import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional

# Create FastAPI app
app = FastAPI(
    title="DentaMind Test Server",
    description="Simple test server to verify environment",
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

# Define a simple model
class HealthStatus(BaseModel):
    status: str
    version: str
    components: Dict[str, str]

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "DentaMind Simple Test Server is running",
        "status": "OK"
    }

# Health check endpoint
@app.get("/health", response_model=HealthStatus)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "components": {
            "database": "healthy",
            "api": "healthy",
            "storage": "healthy"
        }
    }

# Patient sample endpoint
@app.get("/api/patients/sample")
async def get_sample_patients():
    """Get sample patients data"""
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
        }
    ]

# Main entry point
if __name__ == "__main__":
    print("Starting Simple Test Server...")
    port = int(os.environ.get("PORT", 8085))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info") 