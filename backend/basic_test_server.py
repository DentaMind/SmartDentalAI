#!/usr/bin/env python3
"""
Basic test server to verify FastAPI/Pydantic compatibility
"""
import os
import uvicorn
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="DentaMind Basic Test Server",
    description="Basic test server to verify FastAPI/Pydantic compatibility",
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

# Simple Pydantic model
class HealthStatus(BaseModel):
    status: str
    version: str
    components: Dict[str, str]

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "DentaMind Basic Test Server is running",
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

# Main entry point
if __name__ == "__main__":
    print("Starting Basic Test Server...")
    port = int(os.environ.get("PORT", 8099))  # Use a port that's likely not in use
    logger.info(f"Starting test server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port) 