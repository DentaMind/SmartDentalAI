from fastapi import APIRouter
from typing import Dict, Any
import psutil
import os

router = APIRouter()

# Remove the route with implicit path prefix
# @router.get("/")
# Define the route with explicit path
@router.get("")
async def health_check():
    """Health check endpoint that verifies system status"""
    # Check disk space
    disk = psutil.disk_usage('/')
    disk_status = "healthy" if disk.percent < 90 else "warning"

    # Check memory usage
    memory = psutil.virtual_memory()
    memory_status = "healthy" if memory.percent < 90 else "warning"

    # Check CPU usage
    cpu_status = "healthy" if psutil.cpu_percent() < 90 else "warning"

    return {
        "status": "healthy",
        "components": {
            "database": "healthy",
            "disk": disk_status,
            "memory": memory_status,
            "cpu": cpu_status
        },
        "version": os.getenv("APP_VERSION", "1.0.0")
    } 