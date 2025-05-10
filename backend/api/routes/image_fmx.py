from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import os
import logging
import json
from ..services.roboflow_service import roboflow_service

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(tags=["fmx"])

# Define base directory for storing images
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "attached_assets", "xrays")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_fmx(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    tooth_number: Optional[str] = Form(None),
    notes: Optional[str] = Form(None)
):
    """
    Upload an FMX (Full Mouth X-ray) image for analysis
    
    Args:
        file: The image file
        patient_id: ID of the patient
        tooth_number: Optional tooth number in standard notation
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
    image_id = f"fmx_{uuid.uuid4().hex[:8]}"
    
    # Determine file extension
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    if not file_ext.startswith("."):
        file_ext = f".{file_ext}"
    
    # Create patient directory if it doesn't exist
    patient_dir = os.path.join(UPLOAD_DIR, patient_id)
    os.makedirs(patient_dir, exist_ok=True)
    
    # Save file
    file_path = os.path.join(patient_dir, f"{image_id}{file_ext}")
    with open(file_path, 'wb') as out_file:
        out_file.write(contents)
    
    # Process image
    logger.info(f"Processing FMX image {image_id} for patient {patient_id}")
    result = await roboflow_service.analyze_image_async(contents, file_ext[1:])
    
    # Enhance with FMX-specific processing
    enhanced_result = enhance_fmx_results(result, tooth_number)
    
    # Create a structured response with clinical categorization
    response = {
        "status": "success",
        "image_id": image_id,
        "patient_id": patient_id,
        "upload_time": datetime.utcnow().isoformat(),
        "file_path": file_path,
        "modality": "FMX",
        "tooth_number": tooth_number,
        "notes": notes,
        "analysis": enhanced_result,
        "summary": generate_fmx_summary(enhanced_result, tooth_number)
    }
    
    # In a production system, we would store this in the database
    # For now, we'll save it to a JSON file for persistence
    save_result_to_file(patient_id, image_id, response)
    
    return response

def enhance_fmx_results(result: Dict[str, Any], tooth_number: Optional[str] = None) -> Dict[str, Any]:
    """Enhance the results with FMX-specific processing"""
    
    findings = result.get("findings", {})
    
    # If tooth number is provided, filter findings to only show relevant ones
    if tooth_number:
        for category in findings:
            findings[category] = [
                finding for finding in findings[category] 
                if finding.get("tooth") == tooth_number
            ]
    
    # Classify caries according to G.V. Black classification
    if "caries" in findings:
        for caries in findings["caries"]:
            caries["black_classification"] = classify_caries_black(
                caries.get("surface", ""), 
                caries.get("tooth", "")
            )
    
    return result

def classify_caries_black(surface: str, tooth: str) -> str:
    """Classify caries according to G.V. Black classification"""
    
    # Class I: Pit and fissure caries of the occlusal surfaces
    if surface in ["O", "OL", "OB"]:
        return "Class I"
    
    # Class II: Caries of the proximal surfaces of posterior teeth
    if any(s in surface for s in ["M", "D"]) and int(tooth) > 13 if tooth.isdigit() else False:
        return "Class II"
    
    # Class III: Caries of the proximal surfaces of anterior teeth without incisal edge
    if any(s in surface for s in ["M", "D"]) and int(tooth) <= 13 if tooth.isdigit() else False:
        if "I" not in surface:
            return "Class III"
    
    # Class IV: Caries of the proximal surfaces of anterior teeth with incisal edge
    if any(s in surface for s in ["M", "D", "I"]) and int(tooth) <= 13 if tooth.isdigit() else False:
        if "I" in surface:
            return "Class IV"
    
    # Class V: Caries of the gingival third of the facial or lingual surface
    if any(s in surface for s in ["B", "L", "F"]) and "G" in surface:
        return "Class V"
    
    # Class VI: Caries of the incisal edge or cusp tip
    if surface in ["I", "C"]:
        return "Class VI"
    
    # Default if we can't classify
    return "Unclassified"

def generate_fmx_summary(result: Dict[str, Any], tooth_number: Optional[str] = None) -> Dict[str, Any]:
    """Generate a clinical summary of the FMX findings"""
    
    findings = result.get("findings", {})
    
    # Count findings by category
    summary = {
        "caries_count": len(findings.get("caries", [])),
        "periapical_lesions_count": len(findings.get("periapical_lesions", [])),
        "restorations_count": len(findings.get("restorations", [])),
        "significant_findings": []
    }
    
    # Add high-confidence caries to significant findings
    for caries in findings.get("caries", []):
        if caries.get("confidence", 0) > 0.8:
            finding = f"Caries on tooth {caries.get('tooth', 'unknown')}, {caries.get('surface', '')} surface"
            if caries.get("black_classification"):
                finding += f" ({caries.get('black_classification')})"
            summary["significant_findings"].append(finding)
    
    # Add periapical lesions to significant findings
    for lesion in findings.get("periapical_lesions", []):
        if lesion.get("confidence", 0) > 0.7:
            summary["significant_findings"].append(
                f"Periapical lesion on tooth {lesion.get('tooth', 'unknown')}, "
                f"approx. {lesion.get('diameter_mm', 0)}mm in diameter"
            )
    
    return summary

def save_result_to_file(patient_id: str, image_id: str, data: Dict[str, Any]) -> None:
    """Save analysis result to a JSON file"""
    
    # Create a directory for storing analysis results
    results_dir = os.path.join(UPLOAD_DIR, patient_id, "analysis")
    os.makedirs(results_dir, exist_ok=True)
    
    # Save to file
    file_path = os.path.join(results_dir, f"{image_id}_analysis.json")
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    logger.info(f"Saved analysis results to {file_path}") 