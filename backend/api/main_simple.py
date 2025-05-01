from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import risk_simple as risk
from .routes import health_simple as health

app = FastAPI(
    title="SmartDentalAI API",
    description="API for SmartDentalAI medical risk assessment system",
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

# Include routers
app.include_router(health.router, prefix="/api/health", tags=["health"])
app.include_router(risk.router, prefix="/api/risk", tags=["risk"])

@app.get("/")
async def root():
    return {"message": "Welcome to SmartDentalAI API"} 