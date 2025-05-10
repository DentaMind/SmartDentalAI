#!/usr/bin/env python3
"""
Simplified server specifically for testing the knowledge base API.
"""

from fastapi import FastAPI, Request
import uvicorn
import os
import sys
import logging

# Make sure the parent directory is in the path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="DentaMind Knowledge Server",
    description="API server for DentaMind knowledge and diagnosis systems",
    version="1.0.0"
)

# Debug middleware to log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request path: {request.url.path}")
    response = await call_next(request)
    return response

@app.get("/")
def root():
    return {
        "message": "Welcome to DentaMind Knowledge Server",
        "version": "1.0.0",
        "api_docs": "/docs",
        "available_modules": [
            "Knowledge Base", 
            "X-ray Diagnosis", 
            "Periodontal Analysis"
        ]
    }

# Import routers
from api.routes.knowledge_simple import router as knowledge_router
from api.routes.diagnose_simple import router as diagnose_router
from api.routes.perio_simple import router as perio_router

# Include routers
app.include_router(knowledge_router, tags=["knowledge"])
app.include_router(diagnose_router)
app.include_router(perio_router)

# Health check endpoint
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "components": {
            "knowledge_module": "online",
            "diagnosis_module": "online",
            "perio_module": "online"
        },
        "version": "1.0.0"
    }

# Create data directories if they don't exist
os.makedirs(os.path.join(os.path.dirname(__file__), 'data', 'knowledge'), exist_ok=True)

if __name__ == "__main__":
    logger.info("Starting DentaMind Knowledge Server...")
    uvicorn.run(app, host="0.0.0.0", port=8091) 