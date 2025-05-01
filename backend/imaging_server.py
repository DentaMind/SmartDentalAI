#!/usr/bin/env python3
"""
Imaging Server for DentaMind Platform
Handles dental imaging analysis for FMX, Panoramic, and CBCT scans
"""

import os
import json
import logging
import shutil
import uvicorn
import uuid
import base64
from datetime import datetime
from typing import List, Dict, Optional, Any, Union
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from enum import Enum
from pydantic import BaseModel, Field

# Try to import the unified_image_analyzer if available
try:
    from api.unified_image_analyzer import UnifiedImageAnalyzer
    unified_analyzer = UnifiedImageAnalyzer()
except ImportError:
    unified_analyzer = None
    logging.warning("Could not import UnifiedImageAnalyzer. Using mock analysis instead.")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
IMAGING_PORT = int(os.environ.get("IMAGING_PORT", 8087))
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "attached_assets", "xrays")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Create FastAPI app
app = FastAPI(
    title="DentaMind Imaging API",
    description="Dental imaging API for DentaMind Platform",
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
class ImageModality(str, Enum):
    FMX = "fmx"  # Full mouth X-ray
    PANORAMIC = "panoramic"  # Panoramic X-ray
    CBCT = "cbct"  # Cone beam computed tomography
    BITEWING = "bitewing"  # Bitewing X-ray
    PERIAPICAL = "periapical"  # Periapical X-ray

class ImageUploadRequest(BaseModel):
    patient_id: str
    modality: ImageModality
    notes: Optional[str] = None
    region: Optional[str] = None  # For CBCT: maxilla, mandible, tmj, etc.
    tooth_number: Optional[str] = None
    quadrant: Optional[str] = None
    
class ImageAnalysisResult(BaseModel):
    id: str
    patient_id: str
    image_id: str
    file_path: str
    modality: ImageModality
    analysis_timestamp: datetime = Field(default_factory=datetime.utcnow)
    findings: Dict[str, Any]
    summary: str
    clinical_notes: Optional[str] = None

# Mock database for storing analysis results
IMAGE_ANALYSIS_DB = {}

# Utility functions
def save_image_file(file: UploadFile, patient_id: str, modality: str) -> str:
    """Save an uploaded image file to disk"""
    # Create patient directory if it doesn't exist
    patient_dir = os.path.join(UPLOAD_DIR, patient_id)
    os.makedirs(patient_dir, exist_ok=True)
    
    # Generate a unique filename
    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    image_id = f"{patient_id}-{modality}-{timestamp}"
    
    # Get file extension
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".jpg"  # Default extension
    
    # Full file path
    file_path = os.path.join(patient_dir, f"{image_id}{ext}")
    
    # Save file
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    return file_path, image_id

def mock_analyze_image(image_path: str, modality: str, options: Dict[str, Any] = None) -> Dict[str, Any]:
    """Generate mock analysis results when the real analyzer is not available"""
    options = options or {}
    patient_id = options.get("patient_id", "unknown")
    
    # Generate different results based on modality
    if modality == ImageModality.FMX:
        findings = {
            "quadrants": {
                "UR": {"teeth": {"1": {"findings": ["caries - distal"], "severity": "moderate"}}},
                "UL": {"teeth": {"12": {"findings": ["periapical lesion"], "severity": "mild"}}},
                "LL": {"teeth": {"20": {"findings": ["caries - occlusal"], "severity": "severe"}}},
                "LR": {"teeth": {"29": {"findings": ["restoration - amalgam"], "condition": "good"}}}
            },
            "caries_count": 2,
            "restoration_count": 1,
            "periapical_lesion_count": 1
        }
        summary = "FMX analysis shows 2 carious lesions, 1 periapical lesion, and 1 restoration."
        
    elif modality == ImageModality.PANORAMIC:
        findings = {
            "tmj": {
                "right": {"finding": "Normal condylar position", "wilkes_classification": "I"},
                "left": {"finding": "Slight anterior displacement", "wilkes_classification": "II"}
            },
            "teeth": {
                "impacted": ["#1", "#16", "#17", "#32"],
                "missing": ["#19"],
                "restorations": ["#3", "#14", "#30"]
            },
            "pathology": {
                "radiolucent_areas": [{"location": "Left mandible", "size_mm": 4.5}]
            }
        }
        summary = "Panoramic analysis shows asymmetric TMJ findings, 4 impacted teeth, 1 missing tooth, and a 4.5mm radiolucent area in the left mandible."
        
    elif modality == ImageModality.CBCT:
        region = options.get("region", "maxilla")
        findings = {
            "region": region,
            "bone_density": {
                "average_hu": 750,
                "areas_of_concern": [{"location": "posterior left maxilla", "hu_value": 320}]
            },
            "nerve_proximity": {
                "iad_left_mm": 2.5,
                "iad_right_mm": 3.1
            },
            "sinus_proximity": {
                "maxillary_sinus_mm": 1.8
            },
            "implant_sites": [
                {"tooth_position": "14", "available_bone_height_mm": 12.5, "available_bone_width_mm": 6.2}
            ]
        }
        summary = f"CBCT analysis of {region} region shows suitable implant site at position #14 with adequate bone dimensions."
        
    else:  # Generic fallback
        findings = {
            "automatic_detection": {
                "caries": [{"tooth": "3", "surface": "M", "confidence": 0.85}],
                "restorations": [{"tooth": "19", "surface": "MOD", "material": "amalgam", "confidence": 0.92}]
            }
        }
        summary = "Image analysis detected potential findings that should be clinically verified."
    
    # Add mock confidence scores
    findings["ai_confidence"] = 0.87
    
    return {
        "success": True,
        "findings": findings,
        "summary": summary,
        "clinical_notes": "These are AI-generated findings that require clinical verification."
    }

# Routes
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "DentaMind Imaging API",
        "documentation": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/image/upload", response_model=ImageAnalysisResult)
async def upload_image(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    modality: ImageModality = Form(...),
    notes: Optional[str] = Form(None),
    region: Optional[str] = Form(None),
    tooth_number: Optional[str] = Form(None),
    quadrant: Optional[str] = Form(None)
):
    """General endpoint for uploading and analyzing dental images"""
    try:
        # Save uploaded file
        file_path, image_id = save_image_file(file, patient_id, modality.value)
        logger.info(f"Saved image {image_id} to {file_path}")
        
        # Prepare analysis options
        options = {
            "patient_id": patient_id,
            "region": region,
            "tooth_number": tooth_number,
            "quadrant": quadrant,
            "notes": notes
        }
        
        # Analyze image
        if unified_analyzer:
            # Use the unified analyzer if available
            analysis_result = unified_analyzer.analyze_image(file_path, modality.value, patient_id, options)
        else:
            # Use mock analysis if no analyzer available
            analysis_result = mock_analyze_image(file_path, modality.value, options)
        
        # Create a result record
        result_id = f"analysis-{uuid.uuid4().hex[:8]}"
        result = {
            "id": result_id,
            "patient_id": patient_id,
            "image_id": image_id,
            "file_path": file_path,
            "modality": modality,
            "analysis_timestamp": datetime.utcnow(),
            "findings": analysis_result["findings"],
            "summary": analysis_result.get("summary", "Analysis completed"),
            "clinical_notes": analysis_result.get("clinical_notes", notes)
        }
        
        # Store the result
        IMAGE_ANALYSIS_DB[result_id] = result
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.post("/api/image/fmx/upload", response_model=ImageAnalysisResult)
async def upload_fmx(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    notes: Optional[str] = Form(None),
    tooth_number: Optional[str] = Form(None),
    quadrant: Optional[str] = Form(None)
):
    """Specialized endpoint for FMX (Full Mouth X-ray) analysis"""
    return await upload_image(
        file=file,
        patient_id=patient_id,
        modality=ImageModality.FMX,
        notes=notes,
        region=None,
        tooth_number=tooth_number,
        quadrant=quadrant
    )

@app.post("/api/image/panoramic/upload", response_model=ImageAnalysisResult)
async def upload_panoramic(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    notes: Optional[str] = Form(None)
):
    """Specialized endpoint for Panoramic X-ray analysis"""
    return await upload_image(
        file=file,
        patient_id=patient_id,
        modality=ImageModality.PANORAMIC,
        notes=notes,
        region=None,
        tooth_number=None,
        quadrant=None
    )

@app.post("/api/image/cbct/upload", response_model=ImageAnalysisResult)
async def upload_cbct(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    region: str = Form(...),  # Required for CBCT
    notes: Optional[str] = Form(None)
):
    """Specialized endpoint for CBCT (Cone Beam CT) analysis"""
    return await upload_image(
        file=file,
        patient_id=patient_id,
        modality=ImageModality.CBCT,
        notes=notes,
        region=region,
        tooth_number=None,
        quadrant=None
    )

@app.get("/api/image/analysis/{analysis_id}", response_model=ImageAnalysisResult)
async def get_analysis(analysis_id: str):
    """Retrieve a specific analysis result by ID"""
    if analysis_id not in IMAGE_ANALYSIS_DB:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return IMAGE_ANALYSIS_DB[analysis_id]

@app.get("/api/image/patient/{patient_id}", response_model=List[ImageAnalysisResult])
async def get_patient_images(
    patient_id: str,
    modality: Optional[ImageModality] = None,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get all images for a specific patient"""
    results = []
    
    for analysis_id, analysis in IMAGE_ANALYSIS_DB.items():
        if analysis["patient_id"] == patient_id:
            if modality and analysis["modality"] != modality:
                continue
            results.append(analysis)
    
    # Sort by timestamp (newest first)
    results.sort(key=lambda x: x["analysis_timestamp"], reverse=True)
    
    # Apply pagination
    paginated = results[offset:offset + limit]
    
    return paginated

@app.get("/api/image/sample/{modality}")
async def get_sample_analysis(modality: ImageModality):
    """Get a sample analysis result for demo purposes"""
    # Generate a mock analysis based on the requested modality
    sample_result = mock_analyze_image("sample.jpg", modality, {"patient_id": "SAMPLE"})
    
    return {
        "id": f"sample-{modality}",
        "patient_id": "SAMPLE",
        "image_id": f"sample-{modality}-image",
        "modality": modality,
        "analysis_timestamp": datetime.utcnow(),
        "findings": sample_result["findings"],
        "summary": sample_result["summary"],
        "clinical_notes": "This is a sample analysis for demonstration purposes."
    }

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
    logger.info(f"Starting Imaging Server on port {IMAGING_PORT}")
    uvicorn.run(app, host="0.0.0.0", port=IMAGING_PORT) 