#!/usr/bin/env python3
"""
Simple mock server for development
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mock-server")

app = FastAPI(title="DentaMind Mock API")

# Configure CORS to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "DentaMind Mock API",
        "version": "1.0.0",
        "documentation": "/docs",
        "environment": "development"
    }

@app.get("/health")
async def health():
    """Health check endpoint for monitoring systems"""
    logger.info("Health check requested")
    return {
        "status": "healthy",
        "components": {
            "api": "online",
            "database": "online", 
            "storage": "online",
            "inference": "mock"
        },
        "model": {
            "type": "mock",
            "version": "1.0.0",
            "mock": True
        },
        "version": "1.0.0",
        "environment": "development"
    }

@app.get("/api/health")
async def api_health():
    """Specialized health check for API gateway integrations"""
    return {
        "status": "healthy",
        "components": {
            "api": "online",
            "database": "online", 
            "storage": "online",
            "inference": "mock"
        },
        "version": "1.0.0",
        "environment": "development"
    }

# Add a mock auth endpoint
@app.post("/api/auth/login")
async def mock_login(request_data: dict):
    """Mock login endpoint"""
    return {
        "token": "mock_token_for_development",
        "user": {
            "id": "mock_user_1",
            "email": request_data.get("email", "user@example.com"),
            "name": "Test User",
            "role": "doctor"
        }
    }

@app.get("/api/user/profile")
async def mock_profile():
    """Mock user profile endpoint"""
    return {
        "id": "mock_user_1",
        "email": "user@example.com",
        "name": "Test User",
        "role": "doctor",
        "practice": "Mock Dental Clinic"
    }

if __name__ == "__main__":
    print("Starting mock server on http://localhost:9000")
    try:
        uvicorn.run(
            app,
            host="127.0.0.1",  # Bind to localhost only for security
            port=9000,
            log_level="info"
        )
    except Exception as e:
        print(f"Error starting server: {e}")
        import sys
        sys.exit(1) 