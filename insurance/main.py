"""
Main FastAPI application.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import routes, integrations
from .database import models
from .database.database import engine

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Dental Insurance API",
    description="Real-time insurance coverage validation and benefits tracking",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Include API routes
app.include_router(routes.router)
app.include_router(integrations.router)

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Dental Insurance API",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    } 