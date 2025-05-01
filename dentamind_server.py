#!/usr/bin/env python3
"""
DentaMind Unified API Server
Integrates auth, patient data, and imaging functionality
"""

import os
import logging
import uvicorn
from fastapi import FastAPI, Depends, HTTPException, status, Request, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import base64

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="DentaMind Unified API",
    description="Unified API for DentaMind Platform",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request path: {request.url.path}")
    response = await call_next(request)
    return response

# Auth configuration
SECRET_KEY = os.environ.get("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# Auth utilities
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Pydantic Models for Auth
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class User(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool = True

class UserInDB(User):
    hashed_password: str

# Image Upload Models
class ImageUpload(BaseModel):
    file_name: str
    file_content: Optional[str] = None
    patient_id: Optional[str] = None
    image_type: Optional[str] = None
    notes: Optional[str] = None

# In-memory user database for demo
USERS_DB = {
    "demo@dentamind.com": {
        "id": "user123",
        "email": "demo@dentamind.com",
        "full_name": "Demo User",
        "hashed_password": pwd_context.hash("password123"),
        "role": "DOCTOR",
        "is_active": True,
    },
    "admin@dentamind.com": {
        "id": "user456",
        "email": "admin@dentamind.com",
        "full_name": "Admin User",
        "hashed_password": pwd_context.hash("admin123"),
        "role": "ADMIN",
        "is_active": True,
    }
}

# Auth helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_user(email: str):
    if email in USERS_DB:
        user_dict = USERS_DB[email]
        return UserInDB(**user_dict)
    return None

def authenticate_user(email: str, password: str):
    user = get_user(email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    
    # Set expiration
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, expire

async def get_current_user(token: str = Depends(oauth2_scheme)):
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
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Auth Endpoints
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    token_data = {
        "sub": user.email,
        "role": user.role,
        "id": user.id
    }
    access_token, expires_at = create_access_token(token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_at": expires_at
    }

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# Health check endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "DentaMind Unified API",
        "version": "1.0.0",
        "time": datetime.utcnow().isoformat()
    }

@app.get("/health")
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "components": {
            "database": "healthy",
            "disk": "healthy",
            "memory": "healthy",
            "cpu": "healthy"
        },
        "version": "1.0.0"
    }

# Knowledge API endpoints
@app.get("/api/knowledge/categories")
async def knowledge_categories(current_user: User = Depends(get_current_active_user)):
    """Get knowledge categories"""
    return {
        "categories": [
            "anatomy", "pathology", "treatments", "medications", 
            "procedures", "diagnostics", "materials", "instruments",
            "radiology", "periodontics", "orthodontics", "endodontics",
            "prosthodontics", "oral_surgery", "pediatric_dentistry",
            "implants", "occlusion", "tmj", "cosmetic", "preventive"
        ]
    }

# Patient API endpoints
@app.get("/api/patients/sample")
async def patient_sample(current_user: User = Depends(get_current_active_user)):
    """Get sample patients"""
    return [
        {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "555-1234"
        },
        {
            "id": 2,
            "name": "Jane Smith",
            "email": "jane@example.com",
            "phone": "555-5678"
        },
        {
            "id": 3,
            "name": "Bob Johnson",
            "email": "bob@example.com",
            "phone": "555-9012"
        }
    ]

# Image API Models
class ImageUploadResponse(BaseModel):
    status: str
    image_id: str
    patient_id: str
    upload_time: str
    image_type: str
    notes: Optional[str] = None
    analysis: Optional[Dict[str, Any]] = None

# Image API endpoints 
@app.post("/api/image/upload", response_model=ImageUploadResponse)
async def upload_image(
    file: UploadFile = File(...), 
    patient_id: str = Form("SAMPLE_PATIENT_ID"),
    image_type: str = Form("panoramic"),
    notes: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload a dental X-ray image for analysis
    
    This endpoint accepts an image file and processes it for dental analysis.
    
    - **file**: The image file to upload
    - **patient_id**: ID of the patient
    - **image_type**: Type of image (panoramic, bitewing, periapical, etc.)
    - **notes**: Optional notes about the image
    """
    try:
        # Save file (in production this would go to proper storage)
        contents = await file.read()
        
        # In a real implementation, we would:
        # 1. Save the file to permanent storage
        # 2. Process it through AI models
        # 3. Return actual analysis results
        
        # For demo purposes, we just return mock data
        image_id = f"img_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        
        # Mock analysis results
        analysis = {
            "findings": {
                "caries": [
                    {"tooth": "18", "surface": "O", "confidence": 0.89, "severity": "moderate"},
                    {"tooth": "46", "surface": "MOD", "confidence": 0.95, "severity": "severe"}
                ],
                "restorations": [
                    {"tooth": "36", "surface": "MOD", "material": "amalgam", "condition": "good"},
                    {"tooth": "25", "surface": "DO", "material": "composite", "condition": "marginal defect"}
                ],
                "periapical_lesions": [
                    {"tooth": "22", "diameter_mm": 3.5, "confidence": 0.85}
                ]
            },
            "summary": "Moderate caries found on 18, severe caries on 46. Restoration on 25 shows marginal defect."
        }
        
        return {
            "status": "success",
            "image_id": image_id,
            "patient_id": patient_id,
            "upload_time": datetime.utcnow().isoformat(),
            "image_type": image_type,
            "notes": notes,
            "analysis": analysis
        }
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading image: {str(e)}"
        )

@app.get("/api/image/history/{patient_id}")
async def image_history(patient_id: str, current_user: User = Depends(get_current_active_user)):
    """Get image history for patient"""
    logger.info(f"Accessing image history for patient {patient_id}")
    return [
        {
            "id": "img-001",
            "patient_id": patient_id,
            "upload_date": "2023-01-15T10:30:00",
            "image_type": "panoramic",
            "filename": "pano_20230115.jpg",
            "analyzed": True
        },
        {
            "id": "img-002",
            "patient_id": patient_id,
            "upload_date": "2023-06-20T14:45:00",
            "image_type": "bitewing",
            "filename": "bw_20230620.jpg",
            "analyzed": True
        }
    ]

# Treatment API endpoints
@app.get("/api/treatment/treatment-plans/patient/{patient_id}")
async def treatment_plans(patient_id: str, current_user: User = Depends(get_current_active_user)):
    """Get treatment plans for a patient"""
    logger.info(f"Accessing treatment plans for patient {patient_id}")
    return {
        "patient_id": patient_id,
        "treatment_plans": [
            {
                "id": "tp-001",
                "name": "Restorative Plan",
                "created_date": "2023-01-18T14:30:00",
                "status": "active",
                "treatments": [
                    {
                        "id": "tx-001",
                        "tooth": "3",
                        "procedure": "Amalgam filling",
                        "surface": "MOD",
                        "status": "completed",
                        "completed_date": "2023-02-05T09:15:00",
                        "fee": 150.00
                    },
                    {
                        "id": "tx-002",
                        "tooth": "14",
                        "procedure": "Composite filling",
                        "surface": "DO",
                        "status": "planned",
                        "fee": 175.00
                    }
                ],
                "total_fee": 325.00
            }
        ]
    }

# Diagnosis API models
class DiagnosisResponse(BaseModel):
    id: str
    patient_id: str
    date: str
    image_id: str
    findings: Dict[str, List[Dict[str, Any]]]
    summary: str

# Diagnosis API endpoints
@app.post("/api/diagnose/analyze")
async def analyze_xray(
    file: UploadFile = File(...),
    patient_id: str = Form("SAMPLE_PATIENT_ID"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Analyze a dental X-ray image
    
    This endpoint accepts an X-ray image and returns AI-powered analysis.
    
    - **file**: The X-ray image file to analyze
    - **patient_id**: ID of the patient
    """
    try:
        # Read the file
        contents = await file.read()
        
        # In a real implementation, this would:
        # 1. Process the image through AI models
        # 2. Store the results
        # 3. Return actual findings
        
        # Generate a diagnosis ID
        diagnosis_id = f"diag_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        
        # Mock findings
        findings = {
            "caries": [
                {"tooth": "18", "surface": "O", "confidence": 0.89, "severity": "moderate"},
                {"tooth": "46", "surface": "MOD", "confidence": 0.95, "severity": "severe"}
            ],
            "restorations": [
                {"tooth": "36", "surface": "MOD", "material": "amalgam", "condition": "good"},
                {"tooth": "25", "surface": "DO", "material": "composite", "condition": "marginal defect"}
            ],
            "periapical_lesions": [
                {"tooth": "22", "diameter_mm": 3.5, "confidence": 0.85}
            ]
        }
        
        return {
            "diagnosis": {
                "id": diagnosis_id,
                "patient_id": patient_id,
                "date": datetime.utcnow().isoformat(),
                "image_id": f"img_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                "findings": findings,
                "summary": "Moderate caries found on 18, severe caries on 46. Restoration on 25 shows marginal defect."
            },
            "model_info": {
                "version": "dental-xray-v2.5",
                "confidence": 0.92
            }
        }
    except Exception as e:
        logger.error(f"Error analyzing X-ray: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing X-ray: {str(e)}"
        )

@app.get("/api/diagnose/history/{patient_id}")
async def diagnose_history(patient_id: str, current_user: User = Depends(get_current_active_user)):
    """Get diagnosis history for a patient"""
    logger.info(f"Accessing diagnosis history for patient {patient_id}")
    return {
        "patient_id": patient_id,
        "diagnoses": [
            {
                "id": "diag-001",
                "date": "2023-01-15T10:30:00",
                "xray_type": "panoramic",
                "summary": "Moderate caries detected on 18, 46. Periapical lesion on 22."
            },
            {
                "id": "diag-002",
                "date": "2023-06-20T14:45:00",
                "xray_type": "bitewing",
                "summary": "Incipient caries on 34. Restoration on 25 shows marginal defect."
            },
            {
                "id": "diag-003",
                "date": "2023-11-05T09:15:00",
                "xray_type": "fmx",
                "summary": "Severe caries on 46 has progressed. New periapical lesion on 46 detected."
            }
        ]
    }

# Perio API endpoints
@app.get("/api/perio/patients/{patient_id}/charts")
async def perio_charts(patient_id: str, current_user: User = Depends(get_current_active_user)):
    """Get perio charts for a patient"""
    logger.info(f"Accessing perio charts for patient {patient_id}")
    return [
        {
            "id": "pc-001",
            "patient_id": patient_id,
            "exam_date": "2023-05-15T09:30:00",
            "teeth": [
                {
                    "tooth_number": "16",
                    "pocket_depths": {
                        "MB": 3,
                        "B": 2,
                        "DB": 3,
                        "ML": 4,
                        "L": 3,
                        "DL": 4
                    },
                    "recession": {
                        "MB": 0,
                        "B": 0,
                        "DB": 0,
                        "ML": 1,
                        "L": 1,
                        "DL": 2
                    },
                    "mobility": 1,
                    "bleeding": {
                        "MB": True,
                        "B": False,
                        "DB": True,
                        "ML": True,
                        "L": True,
                        "DL": True
                    }
                }
            ]
        }
    ]

# Prescriptions API endpoints
@app.get("/api/prescriptions/patient/{patient_id}")
async def prescriptions(patient_id: str, current_user: User = Depends(get_current_active_user)):
    """Get prescriptions for a patient"""
    logger.info(f"Accessing prescriptions for patient {patient_id}")
    return {
        "patient_id": patient_id,
        "prescriptions": [
            {
                "id": "rx-001",
                "medication": "Amoxicillin",
                "dosage": "500mg",
                "frequency": "TID",
                "duration": "7 days",
                "prescribing_doctor": "Dr. Smith",
                "prescription_date": "2023-02-05T11:30:00",
                "reason": "Post-extraction prophylaxis"
            }
        ]
    }

# Risk API endpoints
@app.get("/api/risk/history/{patient_id}")
async def risk_history(patient_id: str, current_user: User = Depends(get_current_active_user)):
    """Get risk assessment history for patient"""
    logger.info(f"Accessing risk history for patient {patient_id}")
    return [
        {
            "id": "risk-001",
            "patient_id": patient_id,
            "assessment_date": "2023-01-15T10:30:00",
            "risk_type": "caries",
            "risk_level": "moderate",
            "summary": "Moderate caries risk due to diet and inadequate fluoride exposure."
        },
        {
            "id": "risk-002",
            "patient_id": patient_id,
            "assessment_date": "2023-01-15T10:35:00",
            "risk_type": "periodontal",
            "risk_level": "high",
            "summary": "High periodontal risk due to bleeding on probing and family history."
        }
    ]

# Public endpoints that don't require authentication
@app.get("/api/public/health")
async def public_health():
    """Public health check endpoint that doesn't require authentication"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "auth_required": False
    }

# Main entry point
if __name__ == "__main__":
    print("Starting DentaMind Unified API Server...")
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info") 