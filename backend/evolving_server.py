from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import uvicorn
import psutil
import os
import sys

# Add the current directory to the path to make imports work correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import simplified routers - using explicit paths
from api.routes.health_simple import router as health_router
from api.routes.risk_simple import router as risk_router
from api.routes.treatment_simple import router as treatment_router
from api.routes.prescriptions_simple import router as prescriptions_router

app = FastAPI(
    title="SmartDentalAI API (Evolving)",
    description="Evolving API for SmartDentalAI medical risk assessment system",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include basic routers
app.include_router(health_router, prefix="/api/health", tags=["health"])
app.include_router(risk_router, prefix="/api/risk", tags=["risk"])
app.include_router(treatment_router, prefix="/api/treatment", tags=["treatment"])
app.include_router(prescriptions_router, prefix="/api/prescriptions", tags=["prescriptions"])

# Sample patients route
@app.get("/api/patients/sample")
async def get_sample_patients():
    """Return a list of sample patients"""
    return [
        {"id": 1, "name": "John Doe", "email": "john@example.com", "phone": "555-1234"},
        {"id": 2, "name": "Jane Smith", "email": "jane@example.com", "phone": "555-5678"},
        {"id": 3, "name": "Bob Johnson", "email": "bob@example.com", "phone": "555-9012"}
    ]

@app.get("/")
async def root():
    return {"message": "Welcome to SmartDentalAI API"}

# Run the server
if __name__ == "__main__":
    print("Starting evolving SmartDentalAI API server...")
    uvicorn.run(app, host="0.0.0.0", port=8088) 