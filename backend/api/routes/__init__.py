# Use the simplified version instead of the full version
# from . import risk
from . import risk_simple as risk

from fastapi import APIRouter

from ..routers import (
    users,
    auth,
    patients,
    appointments,
    treatments,
    notifications,
    ai_diagnostics,
    websocket,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(patients.router, prefix="/patients", tags=["Patients"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])
api_router.include_router(treatments.router, prefix="/treatments", tags=["Treatments"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(ai_diagnostics.router, prefix="/ai/diagnostics", tags=["AI Diagnostics"])
api_router.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])

__all__ = ["risk", "api_router"] 