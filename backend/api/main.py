#!/usr/bin/env python3
"""
DentaMind Unified API Server
Dental Practice Management and Diagnostic AI Platform
"""

import os
import logging
import time
from typing import Dict, Any
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from fastapi.responses import JSONResponse
from datetime import datetime

# Use relative imports instead of absolute paths
from .config.config import settings, setup_logging, ensure_directories

# Import middleware
from .middleware.request_id_middleware import RequestIDMiddleware
from .middleware.audit_log import setup_audit_logging
from .middleware.logging_middleware import LoggingMiddleware
from .middleware.auth_middleware import AuthMiddleware

# Import all routers
from .routers.perio import router as perio_router
from .routers.patients import router as patients_router
from .routers.diagnostics import router as diagnostics_router
from .routers.treatments import router as treatments_router
from .routers.admin import router as admin_router
from .routers.patient_intake import router as patient_intake_router
from .routes.notifications import router as notifications_router
from .routes.patient_notifications import router as patient_notifications_router
from .routes.patient_recalls import router as patient_recalls_router
from .routes.educational_content import router as educational_content_router
from .routes.content_engagement import router as content_engagement_router
from .routers import (
    users,
    appointments,
    imaging,
    diagnosis,
    treatment_plans,
    security_alerts
)
# Do not import the websocket router - causes import errors
# from .routers import websocket  # This line is causing import errors, keep it commented out

# Import services
from .services.inference_service import inference_service
from .services.notification_scheduler_service import notification_scheduler_service
from .services.seed_educational_content import seed_educational_content

# Import contract sync, generator, and coverage reporting
from .utils.contract_sync import setup_contract_sync
from .utils.ts_contract_generator import setup_contract_generator
from .utils.contract_coverage import setup_coverage_reporting

# Set up logging and ensure directories exist
setup_logging()
ensure_directories()

# Get logger for this module
logger = logging.getLogger("api")

# Create logs directory if it doesn't exist
os.makedirs("logs", exist_ok=True)

# Startup and shutdown event handlers
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: setup any connections or resources
    logger.info("Starting up DentaMind API")
    
    # Database setup would go here in a real application
    
    yield
    
    # Shutdown: clean up any resources
    logger.info("Shutting down DentaMind API")

# Create FastAPI app with appropriate metadata
app = FastAPI(
    title="DentaMind API",
    description="API for DentaMind dental practice management system",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    debug=settings.DEBUG,
    lifespan=lifespan
)

# Configure CORS based on environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS if settings.ENV == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request ID middleware
app.add_middleware(RequestIDMiddleware)

# Set up audit logging middleware
setup_audit_logging(app)

# Add custom middleware
app.add_middleware(LoggingMiddleware)
app.add_middleware(AuthMiddleware)

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
    {"router": patients_router, "tags": ["patients"]},
    {"router": diagnostics_router, "tags": ["diagnostics"]},
    {"router": treatments_router, "tags": ["treatments"]},
    {"router": admin_router, "tags": ["admin"]},
    {"router": patient_intake_router, "tags": ["patient-intake"]},
    {"router": notifications_router, "tags": ["notifications"]},
    {"router": patient_notifications_router, "tags": ["patient-notifications"]},
    {"router": patient_recalls_router, "tags": ["patient-recalls"]},
    {"router": educational_content_router, "tags": ["educational-content"]},
    {"router": content_engagement_router, "tags": ["content-engagement"]},
    {"router": users.router, "tags": ["users"]},
    {"router": appointments.router, "tags": ["appointments"]},
    {"router": imaging.router, "tags": ["imaging"]},
    {"router": diagnosis.router, "tags": ["diagnosis"]},
    {"router": treatment_plans.router, "tags": ["treatment-plans"]},
    {"router": security_alerts.router, "tags": ["security-alerts"]},
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

# Try to load generated routers if in development mode
if settings.ENV.lower() == "development":
    try:
        from .routers.generated import load_generated_routers
        generated_routers = load_generated_routers()
        
        for router_info in generated_routers:
            app.include_router(router_info["router"], tags=router_info["tags"])
            logger.info(f"Registered generated router: {router_info['name']}")
    except ImportError:
        logger.warning("No generated routers found or could not load generated routers")
    except Exception as e:
        logger.error(f"Error loading generated routers: {str(e)}")

# Startup event to preload models
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Initializing inference service...")
    try:
        # Pre-load models to avoid cold start
        await inference_service.load_models()
        logger.info(f"Inference service initialized with model type: {inference_service.model_type}")
    except Exception as e:
        logger.error(f"Error initializing inference service: {str(e)}")
        logger.warning("Using mock inference in fallback mode")
    
    # Start notification scheduler
    logger.info("Starting notification scheduler service...")
    try:
        await notification_scheduler_service.start()
        logger.info("Notification scheduler service started successfully")
    except Exception as e:
        logger.error(f"Error starting notification scheduler: {str(e)}")
    
    # Seed educational content
    logger.info("Checking and seeding educational content...")
    try:
        seeded = await seed_educational_content()
        if seeded:
            logger.info("Educational content seeded successfully")
        else:
            logger.info("Educational content already exists or seeding failed")
    except Exception as e:
        logger.error(f"Error seeding educational content: {str(e)}")
    
    logger.info("Application startup complete")

# Shutdown event to clean up resources
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    logger.info("Application shutting down...")
    
    # Stop notification scheduler
    try:
        await notification_scheduler_service.stop()
        logger.info("Notification scheduler stopped")
    except Exception as e:
        logger.error(f"Error stopping notification scheduler: {str(e)}")

    logger.info("Application shutdown complete")

# Base endpoints
@app.get("/")
async def root() -> Dict[str, Any]:
    """Root endpoint providing API information"""
    available_modules = [
        "Perio Assessment", 
        "Patients Management",
        "Diagnostics & Treatment Suggestions"
    ]
    
    return {
        "message": "DentaMind API Root",
        "version": "1.0.0",
        "documentation": "/docs",
        "environment": settings.ENV,
        "modules": available_modules,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health() -> Dict[str, Any]:
    """Health check endpoint for monitoring systems"""
    return {
        "status": "healthy",
        "components": {
            "api": "online",
            "database": "online", 
            "storage": "online",
            "inference": "online" if not inference_service.use_mock else "mock",
            "notification_scheduler": "online" if notification_scheduler_service.is_running else "offline"
        },
        "model": {
            "type": inference_service.model_type,
            "version": inference_service.model_version,
            "mock": inference_service.use_mock
        },
        "version": "1.0.0",
        "environment": settings.ENV,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/health")
async def api_health() -> Dict[str, Any]:
    """Specialized health check for API gateway integrations"""
    return {
        "status": "healthy",
        "components": {
            "api": "online",
            "database": "online", 
            "storage": "online",
            "inference": "online" if not inference_service.use_mock else "mock",
            "notification_scheduler": "online" if notification_scheduler_service.is_running else "offline"
        },
        "version": "1.0.0",
        "environment": settings.ENV
    }

@app.get("/api/ping")
async def ping():
    """Simple health check"""
    return {"status": "ok", "timestamp": time.time()}

# Setup contract sync for development mode
setup_contract_sync(app)

# Setup contract generator for development mode
setup_contract_generator(app)

# Setup contract coverage reporting
setup_coverage_reporting(app)

# Custom OpenAPI schema endpoint to include contract validation info
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # Add info about contract validation
    openapi_schema["info"]["x-contract-validation"] = {
        "enabled": os.getenv("DENTAMIND_ENV", "development").lower() == "development",
        "tools": [
            {
                "name": "Contract Violation Reporting",
                "endpoint": "/api/_dev/contracts/violations",
                "description": "Get all contract violations detected during runtime"
            },
            {
                "name": "Missing Endpoints Detector",
                "endpoint": "/api/_dev/contracts/missing-endpoints",
                "description": "Get all endpoints defined in frontend but missing in backend"
            },
            {
                "name": "Contract Generator",
                "endpoint": "/api/_dev/contracts/generate",
                "description": "Generate backend code from frontend contracts"
            },
            {
                "name": "Coverage Report",
                "endpoint": "/api/_dev/coverage/report",
                "description": "Get API contract coverage report"
            },
            {
                "name": "Coverage Report (HTML)",
                "endpoint": "/api/_dev/coverage/report/html",
                "description": "Get API contract coverage report as HTML"
            }
        ]
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again later."},
    ) 