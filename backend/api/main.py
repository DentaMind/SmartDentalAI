#!/usr/bin/env python3
"""
DentaMind Unified API Server
Dental Practice Management and Diagnostic AI Platform
"""

import os
import logging
import time
from typing import Dict, Any
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from fastapi import WebSocket, WebSocketDisconnect

# Import all routers
from .routers.perio import router as perio_router
from .routers.diagnose import router as diagnose_router
from .routers.image import router as image_router
from .routers.risk import router as risk_router
from .routers.knowledge import router as knowledge_router
from .routers.treatment import router as treatment_router
from .routers.prescriptions import router as prescriptions_router
from .routers.image_fmx import router as image_fmx_router
from .routers.image_pano import router as image_pano_router
from .routers.image_cbct import router as image_cbct_router
from .routers.ai_feedback import router as ai_feedback_router
from .routers.patient_workflow import router as patient_workflow_router
from .routers.insurance_verification import router as insurance_verification_router
from .routers.eprescription import router as eprescription_router
from .routers.ai_training import router as ai_training_router
from .routers.quality_assurance import router as quality_assurance_router
from .routers.clinical_decision_support import router as clinical_decision_support_router
from .routers.patient_intake import router as patient_intake_router
from .routers.scheduling import router as scheduling_router
from .routers.websocket import router as websocket_router
from .routers.ai_diagnostics import router as ai_diagnostics_router
from .routers.api_diagnostics_router import router as api_diagnostics_router
from .routers.ai_treatment_suggestions import router as ai_treatment_suggestions_router

# Import from routers or routes based on your project structure
from .routers import websocket

# Import from services
from .services.websocket_service import handle_websocket_connection

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("api")

# Environment configuration
ENV = os.getenv("ENVIRONMENT", "development")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
DEBUG = ENV != "production"

# Create FastAPI app with appropriate metadata
app = FastAPI(
    title="DentaMind API",
    description="API for DentaMind dental practice management system",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    debug=DEBUG
)

# Configure CORS based on environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ENV == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time to response headers and log requests"""
    start_time = time.time()
    
    # Log request details
    logger.info(f"Request: {request.method} {request.url.path} from {request.client.host}")
    
    response = await call_next(request)
    
    # Calculate processing time
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log response status
    logger.info(f"Response: {response.status_code} in {process_time:.4f}s")
    
    return response

# Define all routers to include
ROUTERS = [
    # Core functionality
    {"router": perio_router, "tags": ["perio"]},
    {"router": diagnose_router, "tags": ["diagnose"]},
    {"router": image_router, "tags": ["image"]},
    {"router": risk_router, "tags": ["risk"]},
    {"router": knowledge_router, "tags": ["knowledge"]},
    {"router": treatment_router, "tags": ["treatment"]},
    {"router": prescriptions_router, "tags": ["prescriptions"]},
    
    # Specialized imaging
    {"router": image_fmx_router, "prefix": "/api/image/fmx", "tags": ["image", "fmx"]},
    {"router": image_pano_router, "prefix": "/api/image/pano", "tags": ["image", "pano"]},
    {"router": image_cbct_router, "prefix": "/api/image/cbct", "tags": ["image", "cbct"]},
    
    # Patient management
    {"router": patient_workflow_router, "tags": ["patient_workflow"]},
    {"router": patient_intake_router, "tags": ["patient_intake"]},
    {"router": scheduling_router, "tags": ["scheduling"]},
    
    # Insurance and prescriptions
    {"router": insurance_verification_router, "tags": ["insurance"]},
    {"router": eprescription_router, "tags": ["prescriptions"]},
    
    # AI and quality assurance
    {"router": ai_feedback_router, "tags": ["ai_feedback"]},
    {"router": ai_training_router, "tags": ["ai_training"]},
    {"router": quality_assurance_router, "tags": ["quality_assurance"]},
    {"router": clinical_decision_support_router, "tags": ["clinical_decision_support"]},
    {"router": ai_diagnostics_router, "tags": ["ai_diagnostics"]},
    {"router": ai_treatment_suggestions_router, "tags": ["ai_treatment_suggestions"]},
    
    # WebSocket for real-time communication
    {"router": websocket_router, "tags": ["websocket"]},
    {"router": api_diagnostics_router, "tags": ["api_diagnostics"]}
]

# Register all routers
for router_config in ROUTERS:
    router = router_config["router"]
    prefix = router_config.get("prefix")
    tags = router_config.get("tags", [])
    
    if prefix:
        app.include_router(router, prefix=prefix, tags=tags)
    else:
        app.include_router(router, tags=tags)
    
    logger.info(f"Registered router: {router_config.get('tags', ['default'])[0]}")

# WebSocket route
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    try:
        await handle_websocket_connection(websocket)
    except WebSocketDisconnect:
        pass

# Include the WebSocket API routes
app.include_router(websocket.router, prefix="/api/ws", tags=["WebSocket"])

# Base endpoints
@app.get("/")
async def root() -> Dict[str, Any]:
    """Root endpoint providing API information"""
    available_modules = [
        "Perio Assessment", 
        "X-ray Diagnostics",
        "Image Analysis",
        "Risk Assessment",
        "Knowledge Base",
        "Prescriptions",
        "Treatment Plans",
        "AI Feedback",
        "Patient Workflow",
        "Insurance Verification",
        "E-Prescriptions",
        "AI Training & Adaptation",
        "Quality Assurance",
        "Clinical Decision Support",
        "Patient Intake & Medical History",
        "Scheduler",
        "WebSocket Communication",
        "AI Treatment Suggestions"
    ]
    
    return {
        "message": "DentaMind API Root",
        "version": "1.0.0",
        "documentation": "/docs",
        "environment": ENV,
        "modules": available_modules
    }

@app.get("/health")
async def health() -> Dict[str, Any]:
    """Health check endpoint for monitoring systems"""
    return {
        "status": "healthy",
        "components": {
            "api": "online",
            "database": "online", 
            "storage": "online"
        },
        "version": "1.0.0",
        "environment": ENV
    }

@app.get("/api/health")
async def api_health() -> Dict[str, Any]:
    """Specialized health check for API gateway integrations"""
    return {
        "status": "healthy",
        "components": {
            "api": "online",
            "database": "online", 
            "storage": "online"
        },
        "version": "1.0.0",
        "environment": ENV
    } 