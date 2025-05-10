from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import os
import io
import aiofiles
from ..services.roboflow_service import roboflow_service

router = APIRouter(prefix="/api/image", tags=["image"])

# Define base directory for storing images
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "attached_assets", "xrays")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/test")
async def test_connection():
    """Simple test endpoint to verify the image router is working"""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "status": "image module healthy"
    }

@router.post("/upload")
async def upload_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    image_type: str = Form(...),  # 'panoramic', 'bitewing', 'periapical'
    notes: Optional[str] = Form(None)
):
    """
    Upload a dental X-ray image for analysis
    
    Args:
        file: The image file
        patient_id: ID of the patient
        image_type: Type of X-ray (panoramic, bitewing, periapical)
        notes: Optional notes about the image
        
    Returns:
        JSON with upload status and analysis results
    """
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read file content
    contents = await file.read()
    
    # Generate a unique ID for the image
    image_id = f"img_{uuid.uuid4().hex[:8]}"
    
    # Determine file extension
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    if not file_ext.startswith("."):
        file_ext = f".{file_ext}"
    
    # Create patient directory if it doesn't exist
    patient_dir = os.path.join(UPLOAD_DIR, patient_id)
    os.makedirs(patient_dir, exist_ok=True)
    
    # Save file
    file_path = os.path.join(patient_dir, f"{image_id}{file_ext}")
    async with aiofiles.open(file_path, 'wb') as out_file:
        await out_file.write(contents)
    
    # Process image asynchronously
    result = await roboflow_service.analyze_image_async(contents, file_ext[1:])
    
    # Store analysis in DB (in real implementation)
    # For now, we just return the result
    
    return {
        "status": "success",
        "image_id": image_id,
        "patient_id": patient_id,
        "upload_time": datetime.utcnow().isoformat(),
        "file_path": file_path,
        "image_type": image_type,
        "notes": notes,
        "analysis": result
    }

@router.get("/analyze/{image_id}")
async def analyze_existing_image(image_id: str, patient_id: str):
    """
    Analyze an existing image by ID
    
    Args:
        image_id: ID of the saved image
        patient_id: ID of the patient
        
    Returns:
        Analysis results
    """
    # Find the image file
    patient_dir = os.path.join(UPLOAD_DIR, patient_id)
    if not os.path.exists(patient_dir):
        raise HTTPException(status_code=404, detail=f"No images found for patient {patient_id}")
    
    # Look for any file starting with the image ID
    files = os.listdir(patient_dir)
    matching_files = [f for f in files if f.startswith(image_id)]
    
    if not matching_files:
        raise HTTPException(status_code=404, detail=f"Image {image_id} not found")
    
    # Use the first matching file
    image_file = os.path.join(patient_dir, matching_files[0])
    
    # Read the file
    with open(image_file, 'rb') as f:
        content = f.read()
    
    # Get file extension
    file_ext = os.path.splitext(image_file)[1]
    if file_ext.startswith("."):
        file_ext = file_ext[1:]
    
    # Analyze the image
    result = roboflow_service.analyze_image(content, file_ext)
    
    return {
        "image_id": image_id,
        "patient_id": patient_id,
        "analysis_time": datetime.utcnow().isoformat(),
        "analysis": result
    }

@router.get("/history/{patient_id}")
async def get_patient_image_history(patient_id: str):
    """Get the image upload history for a patient"""
    patient_dir = os.path.join(UPLOAD_DIR, patient_id)
    
    # If patient directory doesn't exist, return empty list
    if not os.path.exists(patient_dir):
        return {"patient_id": patient_id, "images": []}
    
    # List all files in patient directory
    files = os.listdir(patient_dir)
    
    # Extract image information from filenames
    images = []
    for file in files:
        if file.startswith("img_") or file.startswith("xray_"):
            image_id = os.path.splitext(file)[0]
            file_path = os.path.join(patient_dir, file)
            file_stat = os.stat(file_path)
            images.append({
                "image_id": image_id,
                "filename": file,
                "date": datetime.fromtimestamp(file_stat.st_mtime).isoformat(),
                "size_bytes": file_stat.st_size
            })
    
    return {
        "patient_id": patient_id,
        "images": sorted(images, key=lambda x: x["date"], reverse=True)
    }

@router.get("/sample")
async def get_sample_analysis():
    """Get a sample image analysis for testing"""
    return {
        "image_id": "img-001",
        "patient_id": "SAMPLE_PATIENT",
        "upload_date": datetime.utcnow().isoformat(),
        "type": "panoramic",
        "analysis_complete": True,
        "analysis_results": {
            "findings": {
                "caries": [
                    {"tooth": "18", "surface": "O", "confidence": 0.89, "severity": "moderate"},
                    {"tooth": "46", "surface": "MOD", "confidence": 0.95, "severity": "severe"}
                ],
                "periapical_lesions": [
                    {"tooth": "22", "confidence": 0.92, "diameter_mm": 4.5}
                ],
                "impacted_teeth": [
                    {"tooth": "38", "confidence": 0.97, "angulation": "mesioangular"}
                ],
                "restorations": [
                    {"tooth": "16", "surface": "OD", "type": "amalgam", "confidence": 0.98},
                    {"tooth": "36", "surface": "MOD", "type": "composite", "confidence": 0.94}
                ]
            },
            "timestamp": datetime.utcnow().isoformat(),
            "success": True
        }
    } 