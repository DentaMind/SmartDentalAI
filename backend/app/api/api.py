from fastapi import APIRouter
from app.api.endpoints import diagnosis, treatment, billing, canary

api_router = APIRouter()

# ... existing code ...

api_router.include_router(
    canary.router,
    prefix="/canary",
    tags=["canary"]
) 