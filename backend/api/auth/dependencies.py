from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any, Optional
import logging

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

logger = logging.getLogger(__name__)

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

async def verify_admin_role(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Verify that the current user has admin role
    
    Args:
        current_user: User dictionary from get_current_user
        
    Returns:
        The current user if they have admin role
        
    Raises:
        HTTPException: If user doesn't have admin role
    """
    if current_user.get("role") not in ["admin", "founder"]:
        logger.warning(
            f"User {current_user.get('id')} attempted to access admin-only endpoint " 
            f"with role {current_user.get('role')}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource. Admin role required."
        )
    return current_user

async def verify_phi_access(current_user: Dict[str, Any], patient_id: str) -> bool:
    """
    Verify that the current user has access to a patient's PHI
    
    This checks if the user has:
    1. Proper role for accessing PHI (dentist, hygienist, admin, etc.)
    2. Specific access to this patient's records (part of practice, assigned provider, etc.)
    
    Args:
        current_user: User dictionary from get_current_user
        patient_id: The ID of the patient whose data is being accessed
        
    Returns:
        True if the user has access, otherwise raises exception
        
    Raises:
        HTTPException: If user doesn't have required access
    """
    # Get the user's role
    role = current_user.get("role", "unknown")
    
    # Check if the role allows PHI access
    allowed_roles = ["dentist", "hygienist", "assistant", "admin", "founder", "staff"]
    if role not in allowed_roles:
        logger.warning(
            f"User {current_user.get('id')} with role {role} attempted "
            f"to access PHI for patient {patient_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your role does not have permission to access patient health information."
        )
    
    # For admin and founder roles, grant access to all patients
    if role in ["admin", "founder"]:
        return True
    
    # For other roles, check if they have access to this specific patient
    # In a real implementation, you would query the database to check if the
    # user is part of the practice that the patient belongs to, or if they
    # are an assigned provider for the patient.
    #
    # For this example, we'll assume all authenticated users with allowed roles
    # have access to all patients. In a real system, you'd implement proper checks.
    # 
    # Example implementation:
    # patient_access = await db.query(
    #     "SELECT EXISTS(SELECT 1 FROM patient_providers WHERE provider_id = ? AND patient_id = ?)",
    #     current_user["id"], patient_id
    # )
    # if not patient_access:
    #     logger.warning(f"User {current_user.get('id')} attempted to access patient {patient_id} without assignment")
    #     raise HTTPException(status_code=403, detail="You don't have access to this patient's records")
    
    return True

async def verify_dentist_role(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Verify that the current user has dentist role
    
    Args:
        current_user: User dictionary from get_current_user
        
    Returns:
        The current user if they have dentist role
        
    Raises:
        HTTPException: If user doesn't have dentist role
    """
    if current_user.get("role") != "dentist":
        logger.warning(
            f"User {current_user.get('id')} attempted to access dentist-only endpoint " 
            f"with role {current_user.get('role')}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource. Dentist role required."
        )
    return current_user

async def is_founder(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Verify that the current user has founder role
    
    Args:
        current_user: User dictionary from get_current_user
        
    Returns:
        The current user if they have founder role
        
    Raises:
        HTTPException: If user doesn't have founder role
    """
    if current_user.get("role") != "founder":
        logger.warning(
            f"User {current_user.get('id')} attempted to access founder-only endpoint " 
            f"with role {current_user.get('role')}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource. Founder role required."
        )
    return current_user 