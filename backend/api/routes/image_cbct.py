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

router = APIRouter(tags=["cbct"])

# Define base directory for storing images
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "attached_assets", "xrays")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_cbct(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    region: Optional[str] = Form(None),  # e.g., "LR_molar", "anterior_maxilla"
    notes: Optional[str] = Form(None)
):
    """
    Upload a CBCT image for 3D analysis
    
    Args:
        file: The CBCT image file (DICOM or image slice)
        patient_id: ID of the patient
        region: Optional region of interest (e.g., LR_molar, anterior_maxilla)
        notes: Optional notes about the image
        
    Returns:
        JSON with upload status and analysis results
    """
    # Check if file is a DICOM file
    is_dicom = file.filename.lower().endswith('.dcm')
    content_type = "application/dicom" if is_dicom else file.content_type
    
    # Validate file type
    if not (is_dicom or content_type.startswith("image/")):
        raise HTTPException(status_code=400, detail="File must be a DICOM or image file")
    
    # Read file content
    contents = await file.read()
    
    # Generate a unique ID for the image
    image_id = f"cbct_{uuid.uuid4().hex[:8]}"
    
    # Determine file extension
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".dcm" if is_dicom else ".jpg"
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
    logger.info(f"Processing CBCT image {image_id} for patient {patient_id}")
    # For DICOM files, we would use a specialized 3D analysis service
    # For now, we'll use the Roboflow service as a placeholder
    result = await roboflow_service.analyze_image_async(contents, file_ext[1:])
    
    # Enhance with CBCT-specific 3D processing
    enhanced_result = enhance_cbct_results(result, region)
    
    # Create a structured response
    response = {
        "status": "success",
        "image_id": image_id,
        "patient_id": patient_id,
        "upload_time": datetime.utcnow().isoformat(),
        "file_path": file_path,
        "modality": "CBCT",
        "region": region,
        "notes": notes,
        "analysis": enhanced_result,
        "summary": generate_cbct_summary(enhanced_result, region)
    }
    
    # In a production system, we would store this in the database
    # For now, we'll save it to a JSON file for persistence
    save_result_to_file(patient_id, image_id, response)
    
    return response

def enhance_cbct_results(result: Dict[str, Any], region: Optional[str] = None) -> Dict[str, Any]:
    """Enhance the results with CBCT-specific 3D processing"""
    
    findings = result.get("findings", {})
    
    # Add CBCT-specific measurements and analysis
    enhanced_findings = findings.copy()
    
    # Add bone density measurement (Hounsfield units)
    if "bone_measurements" not in enhanced_findings:
        enhanced_findings["bone_measurements"] = measure_bone_dimensions(region)
    
    # Add anatomical structure proximity analysis
    if "anatomical_proximity" not in enhanced_findings:
        enhanced_findings["anatomical_proximity"] = analyze_anatomical_proximity(region)
    
    # Add implant planning recommendations if appropriate
    if region and "implant" in region.lower():
        if "implant_planning" not in enhanced_findings:
            enhanced_findings["implant_planning"] = generate_implant_recommendations(region)
    
    # Update the result with enhanced findings
    result["findings"] = enhanced_findings
    
    return result

def measure_bone_dimensions(region: Optional[str] = None) -> Dict[str, Any]:
    """Measure bone dimensions and density (simulated)"""
    
    # In a real implementation, this would analyze the DICOM data
    # For now, we'll return simulated measurements
    
    # Default measurements
    measurements = {
        "width_mm": 9.5,
        "height_mm": 12.0,
        "depth_mm": 8.0,
        "density_hu": 650,  # Hounsfield units
        "cortical_thickness_mm": 1.8
    }
    
    # Adjust measurements based on region if specified
    if region:
        if "maxilla" in region.lower():
            measurements["density_hu"] = 450  # Typically less dense
            measurements["cortical_thickness_mm"] = 1.2
        elif "mandible" in region.lower():
            measurements["density_hu"] = 850  # Typically more dense
            measurements["cortical_thickness_mm"] = 2.0
        
        if "molar" in region.lower():
            measurements["width_mm"] = 11.0
            measurements["height_mm"] = 9.0
        elif "anterior" in region.lower():
            measurements["width_mm"] = 7.5
            measurements["height_mm"] = 16.0
    
    # Calculate volume
    measurements["volume_mm3"] = (
        measurements["width_mm"] * 
        measurements["height_mm"] * 
        measurements["depth_mm"]
    )
    
    # Add bone quality classification based on density
    if measurements["density_hu"] > 1250:
        measurements["bone_quality"] = "Type I - Dense cortical bone"
    elif measurements["density_hu"] > 850:
        measurements["bone_quality"] = "Type II - Thick cortical with dense trabecular bone"
    elif measurements["density_hu"] > 350:
        measurements["bone_quality"] = "Type III - Thin cortical with dense trabecular bone"
    else:
        measurements["bone_quality"] = "Type IV - Thin cortical with low-density trabecular bone"
    
    return measurements

def analyze_anatomical_proximity(region: Optional[str] = None) -> Dict[str, Any]:
    """Analyze proximity to important anatomical structures (simulated)"""
    
    # In a real implementation, this would analyze the DICOM data
    # For now, we'll return simulated measurements
    
    proximity = {
        "structures": []
    }
    
    # Add relevant anatomical structures based on region
    if region:
        if "mandible" in region.lower() and "posterior" in region.lower():
            proximity["structures"].append({
                "name": "inferior_alveolar_nerve",
                "distance_mm": 4.5,
                "direction": "inferior"
            })
        
        if "maxilla" in region.lower() and "posterior" in region.lower():
            proximity["structures"].append({
                "name": "maxillary_sinus",
                "distance_mm": 3.2,
                "direction": "superior"
            })
        
        if "anterior" in region.lower() and "maxilla" in region.lower():
            proximity["structures"].append({
                "name": "nasal_floor",
                "distance_mm": 5.7,
                "direction": "superior"
            })
    
    return proximity

def generate_implant_recommendations(region: Optional[str] = None) -> Dict[str, Any]:
    """Generate implant planning recommendations (simulated)"""
    
    # In a real implementation, this would use the CBCT measurements
    # For now, we'll return simulated recommendations
    
    recommendations = {
        "suitable_for_implant": True,
        "augmentation_required": False,
        "recommended_implant_dimensions": {
            "length_mm": 10,
            "diameter_mm": 4.0
        },
        "surgical_approach": "standard",
        "notes": []
    }
    
    # Adjust recommendations based on region
    bone_measurements = measure_bone_dimensions(region)
    proximity = analyze_anatomical_proximity(region)
    
    # Check if bone dimensions are suitable for implants
    if bone_measurements["width_mm"] < 6.0:
        recommendations["suitable_for_implant"] = False
        recommendations["augmentation_required"] = True
        recommendations["notes"].append("Insufficient bone width - lateral augmentation required")
    
    if bone_measurements["height_mm"] < 8.0:
        recommendations["suitable_for_implant"] = False
        recommendations["augmentation_required"] = True
        recommendations["notes"].append("Insufficient bone height - vertical augmentation required")
    
    # Check proximity to vital structures
    for structure in proximity.get("structures", []):
        if structure["distance_mm"] < 2.0:
            recommendations["suitable_for_implant"] = False
            recommendations["notes"].append(
                f"Critical proximity to {structure['name']} ({structure['distance_mm']} mm)"
            )
        elif structure["distance_mm"] < 5.0:
            recommendations["notes"].append(
                f"Close proximity to {structure['name']} ({structure['distance_mm']} mm) - caution advised"
            )
    
    # Adjust implant dimensions based on available bone
    if recommendations["suitable_for_implant"]:
        # Set maximum length to 2mm less than available height
        max_length = min(bone_measurements["height_mm"] - 2, 16)
        # Round down to nearest standard length
        standard_lengths = [6, 8, 10, 11.5, 13, 16]
        for length in standard_lengths:
            if length <= max_length:
                recommendations["recommended_implant_dimensions"]["length_mm"] = length
        
        # Set diameter based on available width
        max_diameter = min(bone_measurements["width_mm"] - 1.5, 5.0)
        # Round down to nearest standard diameter
        standard_diameters = [3.0, 3.5, 4.0, 4.5, 5.0]
        for diameter in standard_diameters:
            if diameter <= max_diameter:
                recommendations["recommended_implant_dimensions"]["diameter_mm"] = diameter
    
    return recommendations

def generate_cbct_summary(result: Dict[str, Any], region: Optional[str] = None) -> Dict[str, Any]:
    """Generate a clinical summary of the CBCT findings"""
    
    findings = result.get("findings", {})
    
    # Create summary structure
    summary = {
        "bone_quality": findings.get("bone_measurements", {}).get("bone_quality", "Unknown"),
        "implant_suitability": "Suitable" if findings.get("implant_planning", {}).get("suitable_for_implant", False) else "Not suitable",
        "significant_findings": []
    }
    
    # Add bone measurements to summary
    bone_measurements = findings.get("bone_measurements", {})
    if bone_measurements:
        summary["significant_findings"].append(
            f"Bone dimensions: {bone_measurements.get('width_mm', 0)}mm (W) × "
            f"{bone_measurements.get('height_mm', 0)}mm (H) × "
            f"{bone_measurements.get('depth_mm', 0)}mm (D)"
        )
        
        summary["significant_findings"].append(
            f"Bone density: {bone_measurements.get('density_hu', 0)} HU "
            f"({bone_measurements.get('bone_quality', 'Unknown')})"
        )
    
    # Add anatomical proximity warnings
    for structure in findings.get("anatomical_proximity", {}).get("structures", []):
        if structure.get("distance_mm", 10) < 5.0:
            summary["significant_findings"].append(
                f"Proximity to {structure.get('name', 'anatomical structure')}: "
                f"{structure.get('distance_mm', 0)}mm {structure.get('direction', '')}"
            )
    
    # Add implant recommendations if available
    implant_planning = findings.get("implant_planning", {})
    if implant_planning:
        if implant_planning.get("suitable_for_implant", False):
            dimensions = implant_planning.get("recommended_implant_dimensions", {})
            summary["significant_findings"].append(
                f"Recommended implant: {dimensions.get('length_mm', 0)}mm × "
                f"{dimensions.get('diameter_mm', 0)}mm"
            )
            
            summary["recommended_treatment"] = (
                f"Place {dimensions.get('length_mm', 0)}mm × "
                f"{dimensions.get('diameter_mm', 0)}mm implant using "
                f"{implant_planning.get('surgical_approach', 'standard')} approach"
            )
        else:
            summary["significant_findings"].append("Not suitable for implant placement")
            
            # Add augmentation notes if available
            if implant_planning.get("augmentation_required", False):
                summary["significant_findings"].append("Bone augmentation required")
                
                for note in implant_planning.get("notes", []):
                    summary["significant_findings"].append(note)
    
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