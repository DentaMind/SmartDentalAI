from app.services.canary_deployment import CanaryDeploymentService

# ... existing code ...

async def get_canary_service() -> CanaryDeploymentService:
    """Dependency for getting the canary deployment service."""
    return CanaryDeploymentService() 