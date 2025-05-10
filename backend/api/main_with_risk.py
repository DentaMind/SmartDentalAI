from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import health, risk
# Comment out other routers for now
# from .routes import alerts, telemetry, audit, metrics
# from .services.auto_repair import auto_repair_service
# from .services.auto_tuning import auto_tuning_service
# from .services.root_cause_agent import root_cause_agent
import asyncio

app = FastAPI(
    title="SmartDentalAI API",
    description="API for SmartDentalAI medical risk assessment system",
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

# Include routers
app.include_router(health.router, prefix="/api/health", tags=["health"])
app.include_router(risk.router, prefix="/api/risk", tags=["risk"])
# Comment out other routers
# app.include_router(alerts.router, prefix="/api/alerts", tags=["alerts"])
# app.include_router(telemetry.router, prefix="/api/telemetry", tags=["telemetry"])
# app.include_router(audit.router, prefix="/api/audit", tags=["audit"])
# app.include_router(metrics.router, prefix="/api/metrics", tags=["metrics"])

# Comment out background tasks for now
# @app.on_event("startup")
# async def startup_event():
#     """Start background tasks on application startup."""
#     # Start auto-repair service
#     asyncio.create_task(auto_repair_service.start())
    
#     # Start auto-tuning service
#     asyncio.create_task(auto_tuning_service.start())
    
#     # Start root cause analysis agent
#     asyncio.create_task(root_cause_agent.start())

# @app.on_event("shutdown")
# async def shutdown_event():
#     """Stop background tasks on application shutdown."""
#     await auto_repair_service.stop()
#     await auto_tuning_service.stop()
#     await root_cause_agent.stop()

@app.get("/")
async def root():
    return {"message": "Welcome to SmartDentalAI API"} 