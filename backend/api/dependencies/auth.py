"""
Authentication dependencies for API routes
"""

import logging
from typing import Optional, Union
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from ..database import get_db
from ..config.settings import settings
from ..models.user import User

# Configure OAuth2 with token URL
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

# Configure logging
logger = logging.getLogger(__name__)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the currently authenticated user
    
    Args:
        token: JWT token from authorization header
        db: Database session
        
    Returns:
        User: The authenticated user
        
    Raises:
        HTTPException: If authentication fails
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode JWT token
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY.get_secret_value(), 
            algorithms=[settings.PASSWORD_HASH_ALGORITHM]
        )
        
        # Extract user ID from token
        user_id: str = payload.get("sub")
        if user_id is None:
            logger.warning("Token missing subject claim")
            raise credentials_exception
        
        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            logger.warning(f"User {user_id} not found in database")
            raise credentials_exception
        
        return user
        
    except JWTError as e:
        logger.warning(f"JWT validation error: {str(e)}")
        raise credentials_exception
        
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise credentials_exception

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to get the currently authenticated user, ensuring they are active
    
    Args:
        current_user: The authenticated user from get_current_user
        
    Returns:
        User: The authenticated and active user
        
    Raises:
        HTTPException: If the user is inactive
    """
    if not current_user.is_active:
        logger.warning(f"Inactive user {current_user.id} attempted to access a restricted endpoint")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user

async def get_current_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Dependency to get the currently authenticated user, ensuring they have admin role
    
    Args:
        current_user: The authenticated user from get_current_active_user
        
    Returns:
        User: The authenticated admin user
        
    Raises:
        HTTPException: If the user is not an admin
    """
    if not current_user.is_admin:
        logger.warning(f"Non-admin user {current_user.id} attempted to access an admin-only endpoint")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

async def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Dependency to get the currently authenticated user if available, but does not require auth
    
    Args:
        token: JWT token from authorization header (optional)
        db: Database session
        
    Returns:
        Optional[User]: The authenticated user or None if not authenticated
    """
    if token is None:
        return None
        
    try:
        # Decode JWT token
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY.get_secret_value(), 
            algorithms=[settings.PASSWORD_HASH_ALGORITHM]
        )
        
        # Extract user ID from token
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        
        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        return user
        
    except (JWTError, Exception):
        return None 