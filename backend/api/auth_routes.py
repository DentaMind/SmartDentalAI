from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import os
import json
from ..auth import create_access_token, get_current_user

router = APIRouter(tags=["auth"])

# In-memory user database for demo purposes
# In a real application, this would use a database
USERS = {
    "demo@dentamind.com": {
        "id": "user-123",
        "email": "demo@dentamind.com",
        "username": "demo",
        "full_name": "Demo User",
        "password": "password123",  # In production, this would be hashed
        "role": "DOCTOR"
    },
    "admin@dentamind.com": {
        "id": "user-456",
        "email": "admin@dentamind.com",
        "username": "admin",
        "full_name": "Admin User",
        "password": "admin123",  # In production, this would be hashed
        "role": "ADMIN_DENTIST"
    }
}

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    role: Optional[str] = None

class UserLogin(UserBase):
    password: str

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Find the user by username (which can be email in our case)
    user = None
    for email, user_data in USERS.items():
        if user_data["username"] == form_data.username or email == form_data.username:
            user = user_data
            break
    
    if not user or user["password"] != form_data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    token_data = {
        "sub": user["id"],
        "role": user["role"]
    }
    
    # Token expires in 30 minutes
    access_token = create_access_token(
        data=token_data,
        expires_delta=timedelta(minutes=30)
    )
    
    # Remove sensitive information
    user_response = user.copy()
    user_response.pop("password", None)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return current_user 