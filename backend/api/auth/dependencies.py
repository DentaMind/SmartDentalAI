from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any, Optional

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Get the current authenticated user
    
    Args:
        token: JWT token from Authorization header
        
    Returns:
        Dictionary with user information
        
    Raises:
        HTTPException: If authentication fails
    """
    # For development/testing purposes, allow requests without authentication
    # In production, you would verify the token here
    if token is None:
        # Return a mock user for development
        return {
            "id": "dev-user-id",
            "username": "dev-user",
            "role": "dentist",
            "permissions": ["read", "write"],
            "is_active": True
        }
    
    # Normally you would decode and verify the token here
    # For now, just return a mock user
    return {
        "id": "mock-user-id",
        "username": "mock-user",
        "role": "dentist",
        "permissions": ["read", "write"],
        "is_active": True
    } 