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

router = APIRouter(tags=["pano"])

# Define base directory for storing images
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "attached_assets", "xrays")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_panoramic(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    notes: Optional[str] = Form(None)
):
    """
    Upload a panoramic X-ray image for analysis
    
    Args:
        file: The panoramic X-ray image file
        patient_id: ID of the patient
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
    image_id = f"pano_{uuid.uuid4().hex[:8]}"
    
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
    logger.info(f"Processing panoramic image {image_id} for patient {patient_id}")
    result = await roboflow_service.analyze_image_async(contents, file_ext[1:])
    
    # Enhance with panoramic-specific processing
    enhanced_result = enhance_panoramic_results(result)
    
    # Create a structured response
    response = {
        "status": "success",
        "image_id": image_id,
        "patient_id": patient_id,
        "upload_time": datetime.utcnow().isoformat(),
        "file_path": file_path,
        "modality": "Panoramic",
        "notes": notes,
        "analysis": enhanced_result,
        "summary": generate_panoramic_summary(enhanced_result)
    }
    
    # In a production system, we would store this in the database
    # For now, we'll save it to a JSON file for persistence
    save_result_to_file(patient_id, image_id, response)
    
    return response

def enhance_panoramic_results(result: Dict[str, Any]) -> Dict[str, Any]:
    """Enhance the results with panoramic-specific processing"""
    
    findings = result.get("findings", {})
    
    # Add panoramic-specific analysis
    enhanced_findings = findings.copy()
    
    # Add TMJ analysis (simulated for demonstration)
    if "tmj_findings" not in enhanced_findings:
        enhanced_findings["tmj_findings"] = analyze_tmj(findings)
    
    # Add sinus assessment
    if "sinus_findings" not in enhanced_findings:
        enhanced_findings["sinus_findings"] = analyze_sinuses(findings)
    
    # Add orthognathic profile analysis
    if "orthognathic_profile" not in enhanced_findings:
        enhanced_findings["orthognathic_profile"] = analyze_orthognathic_profile(findings)
    
    # Update the result with enhanced findings
    result["findings"] = enhanced_findings
    
    return result

def analyze_tmj(findings: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze temporo-mandibular joint (TMJ) from findings"""
    
    # Wilkes classification of TMJ disorders
    # In a real implementation, this would use actual measurements and diagnostics
    
    # Default to normal TMJ (for demonstration)
    tmj_assessment = {
        "right_joint": {
            "condition": "normal",
            "disc_position": "normal",
            "evidence_of_degeneration": "none",
            "wilkes_classification": "Stage 0 - Normal"
        },
        "left_joint": {
            "condition": "normal", 
            "disc_position": "normal",
            "evidence_of_degeneration": "none",
            "wilkes_classification": "Stage 0 - Normal"
        },
        "notes": ["No signs of TMJ disorder observed"]
    }
    
    # In a real implementation, we would analyze the image to detect TMJ abnormalities
    # For now, this is just a placeholder
    
    return tmj_assessment

def analyze_sinuses(findings: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze maxillary sinuses from findings"""
    
    # Default to normal sinuses (for demonstration)
    sinus_assessment = {
        "right_maxillary_sinus": {
            "condition": "normal",
            "mucosal_thickening": "none",
            "fluid_level": "none"
        },
        "left_maxillary_sinus": {
            "condition": "normal",
            "mucosal_thickening": "none",
            "fluid_level": "none"
        },
        "notes": ["No sinus pathology observed"]
    }
    
    # In a real implementation, we would analyze the image to detect sinus abnormalities
    # For now, this is just a placeholder
    
    return sinus_assessment

def analyze_orthognathic_profile(findings: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze orthognathic profile from findings"""
    
    # Default to normal profile (for demonstration)
    profile_assessment = {
        "mandibular_symmetry": "symmetrical",
        "condylar_height": {
            "right": 20,
            "left": 20,
            "difference_percent": 0
        },
        "ramus_height": {
            "right": 45,
            "left": 45,
            "difference_percent": 0
        },
        "gonial_angle": {
            "right": 130,
            "left": 130,
            "average": 130
        },
        "skeletal_pattern": "Mesofacial (balanced growth pattern)"
    }
    
    # In a real implementation, we would analyze the image to measure these parameters
    # For now, this is just a placeholder
    
    return profile_assessment

def generate_panoramic_summary(result: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a clinical summary of the panoramic findings"""
    
    findings = result.get("findings", {})
    
    # Count findings by category
    summary = {
        "caries_count": len(findings.get("caries", [])),
        "periapical_lesions_count": len(findings.get("periapical_lesions", [])),
        "impacted_teeth_count": len(findings.get("impacted_teeth", [])),
        "significant_findings": []
    }
    
    # Add TMJ findings to summary if abnormal
    tmj_findings = findings.get("tmj_findings", {})
    if tmj_findings:
        right_joint = tmj_findings.get("right_joint", {})
        left_joint = tmj_findings.get("left_joint", {})
        
        if right_joint.get("condition") != "normal":
            summary["significant_findings"].append(
                f"Right TMJ: {right_joint.get('condition')}, "
                f"Wilkes classification: {right_joint.get('wilkes_classification')}"
            )
        
        if left_joint.get("condition") != "normal":
            summary["significant_findings"].append(
                f"Left TMJ: {left_joint.get('condition')}, "
                f"Wilkes classification: {left_joint.get('wilkes_classification')}"
            )
    
    # Add sinus findings to summary if abnormal
    sinus_findings = findings.get("sinus_findings", {})
    if sinus_findings:
        right_sinus = sinus_findings.get("right_maxillary_sinus", {})
        left_sinus = sinus_findings.get("left_maxillary_sinus", {})
        
        if right_sinus.get("condition") != "normal":
            summary["significant_findings"].append(
                f"Right maxillary sinus: {right_sinus.get('condition')}"
            )
        
        if left_sinus.get("condition") != "normal":
            summary["significant_findings"].append(
                f"Left maxillary sinus: {left_sinus.get('condition')}"
            )
    
    # Add high-confidence caries to significant findings
    for caries in findings.get("caries", []):
        if caries.get("confidence", 0) > 0.8:
            summary["significant_findings"].append(
                f"Caries on tooth {caries.get('tooth', 'unknown')}, {caries.get('surface', '')} surface"
            )
    
    # Add impacted teeth to significant findings
    for impacted in findings.get("impacted_teeth", []):
        if impacted.get("confidence", 0) > 0.7:
            summary["significant_findings"].append(
                f"Impacted tooth {impacted.get('tooth', 'unknown')}, "
                f"angulation: {impacted.get('angulation', 'unknown')}"
            )
    
    # Add orthognathic profile summary if asymmetric
    orthognathic = findings.get("orthognathic_profile", {})
    if orthognathic and orthognathic.get("mandibular_symmetry") != "symmetrical":
        summary["significant_findings"].append(
            f"Mandibular asymmetry: {orthognathic.get('mandibular_symmetry')}"
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