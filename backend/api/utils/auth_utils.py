"""
Authentication Utilities

This module provides utility functions for authentication, token handling,
and user information extraction.
"""

import jwt
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import os
from fastapi import HTTPException, status

# Get JWT secret from environment variable or use a default for development
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "development_secret_key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a new JWT access token
    
    Args:
        data: Data to encode in the token
        expires_delta: Optional expiration time delta
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    # Set expiration time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Default to 30 minutes
        expire = datetime.utcnow() + timedelta(minutes=30)
        
    to_encode.update({"exp": expire})
    
    # Create and return the encoded token
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def extract_user_from_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Extract user information from a JWT token without raising exceptions
    
    This function is used for audit logging and should not throw exceptions
    if the token is invalid, as we still want to log the request.
    
    Args:
        token: JWT token string
        
    Returns:
        Dictionary with user information or None if token is invalid
    """
    try:
        # Decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Extract user information
        user_id = payload.get("sub")
        if user_id is None:
            return None
            
        # Return user information
        return {
            "user_id": user_id,
            "role": payload.get("role", "unknown"),
            "permissions": payload.get("permissions", []),
            "exp": payload.get("exp")
        }
    except jwt.PyJWTError:
        # Return None if token is invalid (don't raise exception)
        return None

def verify_token(token: str) -> Dict[str, Any]:
    """
    Verify a JWT token and return the payload
    
    Unlike extract_user_from_token, this function raises exceptions
    for invalid tokens and is used for authentication, not just logging.
    
    Args:
        token: JWT token string
        
    Returns:
        Dictionary with token payload
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        # Decode and verify the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Check if token contains required user identifier
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"}
            )
            
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"}
        ) 