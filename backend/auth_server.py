#!/usr/bin/env python3
"""
Authentication Server for DentaMind Platform
Handles user authentication, token issuance, and verification
"""

import os
import json
import logging
import uvicorn
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, EmailStr, Field

from fastapi import Depends, FastAPI, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from jose import JWTError, jwt
from passlib.context import CryptContext

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
AUTH_PORT = int(os.environ.get("AUTH_PORT", 8085))
SECRET_KEY = os.environ.get("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.environ.get("REFRESH_TOKEN_EXPIRE_DAYS", 7))

# Password context for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 password bearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Create FastAPI app
app = FastAPI(
    title="DentaMind Auth API",
    description="Authentication API for DentaMind Platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_at: datetime

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "USER"
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str
    username: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        orm_mode = True

class UserInDB(User):
    hashed_password: str
    refresh_tokens: List[str] = []

# Mock database for demo purposes
# In production, use a real database
USERS_DB = {
    "demo@dentamind.com": {
        "id": "user-123",
        "username": "demo",
        "email": "demo@dentamind.com",
        "full_name": "Demo User",
        "hashed_password": pwd_context.hash("password123"),
        "role": "DOCTOR",
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "refresh_tokens": []
    },
    "admin@dentamind.com": {
        "id": "user-456",
        "username": "admin",
        "email": "admin@dentamind.com",
        "full_name": "Admin User",
        "hashed_password": pwd_context.hash("admin123"),
        "role": "ADMIN",
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "refresh_tokens": []
    },
    "patient@dentamind.com": {
        "id": "user-789",
        "username": "patient",
        "email": "patient@dentamind.com",
        "full_name": "Patient User",
        "hashed_password": pwd_context.hash("patient123"),
        "role": "PATIENT",
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "refresh_tokens": []
    }
}

# Utility functions
def verify_password(plain_password, hashed_password):
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Hash a password"""
    return pwd_context.hash(password)

def get_user(email: str):
    """Get a user by email"""
    if email in USERS_DB:
        user_dict = USERS_DB[email]
        return UserInDB(**user_dict)
    return None

def authenticate_user(email: str, password: str):
    """Authenticate a user"""
    user = get_user(email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create an access token"""
    to_encode = data.copy()
    
    # Set expiration
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, expire

def create_refresh_token(data: dict):
    """Create a refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get the current user from a token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username, role=payload.get("role"))
    except JWTError:
        raise credentials_exception
    
    user = get_user(token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    """Get the current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Routes
@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "DentaMind Authentication API",
        "documentation": "/docs"
    }

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login endpoint to get an access token"""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_data = {
        "sub": user.email,
        "role": user.role,
        "id": user.id
    }
    access_token, expires_at = create_access_token(access_token_data)
    
    # Create refresh token
    refresh_token_data = {
        "sub": user.email,
        "type": "refresh"
    }
    refresh_token = create_refresh_token(refresh_token_data)
    
    # Store refresh token (in a real app, store in DB)
    if user.email in USERS_DB:
        USERS_DB[user.email]["refresh_tokens"].append(refresh_token)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_at": expires_at
    }

@app.post("/refresh", response_model=Token)
async def refresh_token(token: str = Depends(oauth2_scheme)):
    """Refresh an access token using a refresh token"""
    try:
        # Decode token without verifying expiration
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
        
        # Check if it's a refresh token
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get user
        username = payload.get("sub")
        user = get_user(username)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if the refresh token is in the user's refresh tokens
        if token not in USERS_DB[username]["refresh_tokens"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token revoked or invalid",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create new access token
        access_token_data = {
            "sub": user.email,
            "role": user.role,
            "id": user.id
        }
        access_token, expires_at = create_access_token(access_token_data)
        
        # Create new refresh token
        refresh_token_data = {
            "sub": user.email,
            "type": "refresh"
        }
        new_refresh_token = create_refresh_token(refresh_token_data)
        
        # Update stored refresh tokens
        if username in USERS_DB:
            USERS_DB[username]["refresh_tokens"].remove(token)
            USERS_DB[username]["refresh_tokens"].append(new_refresh_token)
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_at": expires_at
        }
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

@app.post("/logout")
async def logout(token: str = Depends(oauth2_scheme), current_user: User = Depends(get_current_user)):
    """Logout endpoint to revoke tokens"""
    # In a real app, you would revoke the token from the database
    # Here we just remove the refresh token from the list
    if current_user.email in USERS_DB:
        USERS_DB[current_user.email]["refresh_tokens"] = []
    
    return {"message": "Successfully logged out"}

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return current_user

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_active_user)):
    """Get all users (admin only)"""
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view all users"
        )
    
    users = []
    for email, user_data in USERS_DB.items():
        user_dict = user_data.copy()
        if "hashed_password" in user_dict:
            del user_dict["hashed_password"]
        if "refresh_tokens" in user_dict:
            del user_dict["refresh_tokens"]
        users.append(User(**user_dict))
    
    return users

# Error handling
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Main entry point
if __name__ == "__main__":
    logger.info(f"Starting Authentication Server on port {AUTH_PORT}")
    uvicorn.run(app, host="0.0.0.0", port=AUTH_PORT) 