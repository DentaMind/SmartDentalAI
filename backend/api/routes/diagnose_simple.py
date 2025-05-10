from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Query
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
import os
import json
import base64
from ..services.roboflow_service import roboflow_service

router = APIRouter(prefix="/api/diagnose", tags=["diagnose"])

# Sample data for demo/testing purposes
SAMPLE_DIAGNOSES = [
    {
        "id": "diag-001",
        "patient_id": "TEST123",
        "image_id": "img-001",
        "date": "2023-01-15T10:30:00",
        "xray_type": "panoramic",
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
            ]
        },
        "summary": "Moderate caries detected on 18, 46. Periapical lesion on 22."
    },
    {
        "id": "diag-002",
        "patient_id": "TEST123",
        "image_id": "img-002",
        "date": "2023-06-20T14:45:00",
        "xray_type": "bitewing",
        "findings": {
            "caries": [
                {"tooth": "46", "surface": "MOD", "confidence": 0.92, "severity": "severe"},
                {"tooth": "24", "surface": "D", "confidence": 0.78, "severity": "incipient"}
            ]
        },
        "summary": "Progression of caries on 46. New incipient caries on 24."
    }
]

@router.get("/test")
async def test_connection():
    """Simple test endpoint to verify the diagnose router is working"""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "status": "diagnose module healthy",
        "sample_output": {
            "caries": [
                {"tooth": "18", "surface": "O", "confidence": 0.89, "severity": "moderate"},
                {"tooth": "46", "surface": "MOD", "confidence": 0.95, "severity": "severe"}
            ]
        }
    }

@router.post("/analyze")
async def analyze_xray(
    image: UploadFile = File(...),
    patient_id: str = Form(...),
    xray_type: str = Form(...),  # panoramic, bitewing, periapical
    notes: Optional[str] = Form(None)
):
    """
    Analyze an X-ray image and provide AI-based diagnosis
    
    Args:
        image: The X-ray image file
        patient_id: The patient ID
        xray_type: Type of X-ray (panoramic, bitewing, periapical)
        notes: Optional notes about the image
        
    Returns:
        Diagnosis results
    """
    # Validate X-ray type
    valid_types = ["panoramic", "bitewing", "periapical", "cephalometric", "cbct-slice"]
    if xray_type not in valid_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid X-ray type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Read image data
    content = await image.read()
    
    # Determine file extension from content type
    content_type = image.content_type
    if content_type == "image/jpeg" or content_type == "image/jpg":
        ext = "jpg"
    elif content_type == "image/png":
        ext = "png"
    else:
        ext = "jpg"  # Default fallback
    
    # Save the image (optional, can be removed if you don't want to store)
    image_id = f"img_{uuid.uuid4().hex[:8]}"
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "attached_assets", "xrays", patient_id)
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, f"{image_id}.{ext}")
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Use Roboflow service to analyze the image
    analysis_result = await roboflow_service.analyze_image_async(content, ext)
    
    if not analysis_result.get("success", False):
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "Failed to analyze image",
                "error": analysis_result.get("error", "Unknown error")
            }
        )
    
    # Extract findings
    findings = analysis_result.get("findings", {})
    
    # Generate a summary based on findings
    summary = generate_summary(findings, xray_type)
    
    # Create a diagnosis record
    diagnosis = {
        "id": f"diag_{uuid.uuid4().hex[:8]}",
        "patient_id": patient_id,
        "image_id": image_id,
        "date": datetime.utcnow().isoformat(),
        "xray_type": xray_type,
        "findings": findings,
        "summary": summary,
        "notes": notes
    }
    
    # In a real implementation, we would store this in a database
    # Instead, for this demo, we'll just return it
    
    return {
        "status": "success",
        "diagnosis": diagnosis,
        "model_info": {
            "version": analysis_result.get("model", "unknown")
        }
    }

@router.get("/history/{patient_id}")
async def get_patient_diagnoses(patient_id: str):
    """Get diagnosis history for a patient"""
    # Filter sample diagnoses based on patient ID
    diagnoses = [d for d in SAMPLE_DIAGNOSES if d["patient_id"] == patient_id]
    
    # In a real implementation, we would query the database
    
    return {
        "patient_id": patient_id,
        "diagnoses": diagnoses
    }

@router.get("/sample")
async def get_sample_diagnosis():
    """Get a sample diagnosis for testing"""
    return {
        "patient_id": "SAMPLE_PATIENT",
        "image_id": "SAMPLE_XRAY_001",
        "timestamp": datetime.now().isoformat(),
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
            ]
        }
    }

def generate_summary(findings: Dict[str, List[Dict[str, Any]]], xray_type: str) -> str:
    """Generate a human-readable summary from the AI findings"""
    summary_parts = []
    
    # Process caries
    caries = findings.get("caries", [])
    if caries:
        # Count caries by severity
        caries_by_severity = {"mild": [], "moderate": [], "severe": []}
        for c in caries:
            severity = c.get("severity", "moderate")
            tooth = c.get("tooth", "")
            if tooth:
                caries_by_severity[severity].append(tooth)
        
        # Generate caries summary
        caries_summary = []
        if caries_by_severity["severe"]:
            caries_summary.append(f"Severe caries on teeth {', '.join(caries_by_severity['severe'])}")
        if caries_by_severity["moderate"]:
            caries_summary.append(f"Moderate caries on teeth {', '.join(caries_by_severity['moderate'])}")
        if caries_by_severity["mild"]:
            caries_summary.append(f"Mild caries on teeth {', '.join(caries_by_severity['mild'])}")
        
        if caries_summary:
            summary_parts.append(". ".join(caries_summary))
    
    # Process periapical lesions
    periapical_lesions = findings.get("periapical_lesions", [])
    if periapical_lesions:
        teeth_with_lesions = [pl.get("tooth", "") for pl in periapical_lesions if pl.get("tooth")]
        if teeth_with_lesions:
            summary_parts.append(f"Periapical lesions detected on teeth {', '.join(teeth_with_lesions)}")
    
    # Process impacted teeth
    impacted_teeth = findings.get("impacted_teeth", [])
    if impacted_teeth:
        teeth_impacted = [it.get("tooth", "") for it in impacted_teeth if it.get("tooth")]
        if teeth_impacted:
            summary_parts.append(f"Impacted teeth: {', '.join(teeth_impacted)}")
    
    # Process restorations
    restorations = findings.get("restorations", [])
    if restorations:
        restoration_count = len(restorations)
        if restoration_count > 0:
            summary_parts.append(f"Existing restorations: {restoration_count}")
    
    # If no findings, say so
    if not summary_parts:
        if xray_type == "panoramic":
            return "No significant pathology detected on panoramic radiograph."
        elif xray_type == "bitewing":
            return "No caries or significant pathology detected on bitewing radiographs."
        elif xray_type == "periapical":
            return "No periapical pathology or significant findings detected."
        else:
            return "No significant findings detected."
    
    return " ".join(summary_parts) + "." 