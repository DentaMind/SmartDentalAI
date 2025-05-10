from fastapi import APIRouter, Path, Query, File, UploadFile, Body, HTTPException, Depends, Request
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid
import os
import logging
from pathlib import Path as FilePath
from sqlalchemy.orm import Session

# Import settings from config
from ..config.config import settings
from ..database import get_db
from ..services.inference_service import inference_service

# Set up logger
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/diagnostics",
    tags=["diagnostics"],
    responses={404: {"description": "Not found"}}
)

# Pydantic models for data validation
class Finding(BaseModel):
    id: str
    type: str
    description: str
    location: str
    confidence: float
    suggestedTreatments: List[str]

class ImageAnalysisResult(BaseModel):
    id: str
    patientId: str
    imageType: str
    findings: List[Finding]
    confidence: float
    timestamp: datetime = datetime.now()
    imageUrl: Optional[str] = None
    notes: Optional[str] = None

class SaveDiagnosticsRequest(BaseModel):
    analysisId: str
    patientId: str
    findings: List[Finding]
    imageType: str
    confidence: float
    notes: Optional[str] = None

# Mock database
MOCK_ANALYSES = []

# Directory setup for real image storage
UPLOADS_DIR = FilePath(settings.UPLOADED_FILES_PATH) / "analysis"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_image(
    request: Request,
    patientId: str = Body(...),
    imageType: str = Body(...),
    providerId: Optional[str] = Body(None),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Analyze a dental image using AI and return findings
    """
    logger.info(f"Analyzing {imageType} image for patient {patientId}")
    
    # Generate request ID for correlation
    request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))
    
    # Read image data
    contents = await image.read()
    
    # Save uploaded file for reference
    analysis_id = f"analysis_{uuid.uuid4().hex[:8]}"
    save_path = UPLOADS_DIR / f"{patientId}" / f"{analysis_id}.jpg"
    save_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(save_path, "wb") as f:
        f.write(contents)
    
    logger.info(f"Saved image to {save_path}")
    
    # Use the inference service to analyze the image
    result = await inference_service.analyze_xray(
        image_data=contents,
        patient_id=patientId,
        provider_id=providerId,
        image_type=imageType,
        request_id=request_id,
        db=db
    )
    
    # Add image URL to the result
    result["imageUrl"] = f"/api/images/analyses/{patientId}/{analysis_id}.jpg"
    
    # Store analysis in mock database for API consistency
    try:
        # Convert the result to our API format
        findings_list = []
        
        # Extract findings from the result structure
        if result.get("findings"):
            for category, items in result["findings"].items():
                if isinstance(items, list):
                    for item in items:
                        finding_id = f"F{uuid.uuid4().hex[:6]}"
                        finding_type = category.replace("_", " ").title()
                        
                        # Extract location from tooth information if available
                        location = ""
                        if "tooth" in item:
                            tooth_num = item["tooth"]
                            location = f"Tooth #{tooth_num}"
                            
                            # Add more details if available
                            if "surface" in item:
                                location += f" (Surface: {item['surface']})"
                        
                        # Create description
                        description = f"{finding_type}"
                        if "severity" in item:
                            description += f" - {item['severity']} severity"
                        if "material" in item:
                            description += f" - {item['material']}"
                        if "condition" in item:
                            description += f" - {item['condition']} condition"
                        
                        # Calculate confidence
                        confidence = item.get("confidence", 0.8)
                        
                        # Suggested treatments (would be AI-generated in production)
                        treatments = []
                        if category == "caries":
                            treatments = ["Filling", "Restoration"]
                        elif category == "periapical_lesions":
                            treatments = ["Root Canal", "Evaluation"]
                        elif category == "impacted_teeth":
                            treatments = ["Extraction", "Surgical Evaluation"]
                        elif category == "restorations":
                            if item.get("condition") == "defective":
                                treatments = ["Replace Restoration"]
                            else:
                                treatments = ["Monitor"]
                        
                        findings_list.append(Finding(
                            id=finding_id,
                            type=finding_type,
                            description=description,
                            location=location, 
                            confidence=confidence,
                            suggestedTreatments=treatments
                        ))
        
        # Calculate overall confidence
        overall_confidence = result.get("confidence", 0.0) or 0.85
        
        # Create analysis result for our mock database
        analysis_result = ImageAnalysisResult(
            id=result.get("analysis_id", analysis_id),
            patientId=patientId,
            imageType=imageType,
            findings=findings_list,
            confidence=overall_confidence,
            imageUrl=result["imageUrl"],
            timestamp=datetime.now()
        )
        
        # Add to mock database
        MOCK_ANALYSES.append(analysis_result)
        
    except Exception as e:
        logger.error(f"Error converting result to API format: {str(e)}")
        # This doesn't affect the primary response
    
    logger.info(f"Analysis completed for patient {patientId}")
    return result

@router.get("/patient/{patient_id}", response_model=List[ImageAnalysisResult])
async def get_patient_diagnostics(
    patient_id: str = Path(..., description="The patient ID to retrieve diagnostics for")
) -> List[Dict[str, Any]]:
    """
    Get all diagnostic analyses for a specific patient
    """
    # In a real implementation, query database
    # For now, filter mock data
    patient_analyses = [a for a in MOCK_ANALYSES if a.patientId == patient_id]
    
    if not patient_analyses:
        # If no analyses found, return empty list
        return []
    
    return patient_analyses

@router.get("/patient/{patient_id}/latest", response_model=ImageAnalysisResult)
async def get_latest_diagnostic(
    patient_id: str = Path(..., description="The patient ID to retrieve diagnostics for")
) -> Dict[str, Any]:
    """
    Get the most recent diagnostic analysis for a patient
    """
    # In a real implementation, query database with ORDER BY timestamp DESC LIMIT 1
    # For now, filter and sort mock data
    patient_analyses = [a for a in MOCK_ANALYSES if a.patientId == patient_id]
    
    if not patient_analyses:
        raise HTTPException(status_code=404, detail="No diagnostic records found for this patient")
    
    # Sort by timestamp descending and return first
    sorted_analyses = sorted(patient_analyses, key=lambda x: x.timestamp, reverse=True)
    return sorted_analyses[0]

@router.get("/{analysis_id}", response_model=ImageAnalysisResult)
async def get_analysis(
    analysis_id: str = Path(..., description="The analysis ID to retrieve")
) -> Dict[str, Any]:
    """
    Get a specific analysis by ID
    """
    # In a real implementation, query database by ID
    # For now, filter mock data
    analysis = next((a for a in MOCK_ANALYSES if a.id == analysis_id), None)
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return analysis

@router.post("/{analysis_id}/notes", response_model=ImageAnalysisResult)
async def update_analysis_notes(
    analysis_id: str = Path(..., description="The analysis ID to update"),
    notes: str = Body(..., embed=True)
) -> Dict[str, Any]:
    """
    Update notes for a specific analysis
    """
    # In a real implementation, update database
    # For now, update mock data
    analysis = next((a for a in MOCK_ANALYSES if a.id == analysis_id), None)
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Update notes
    analysis.notes = notes
    
    return analysis

@router.post("/save", response_model=ImageAnalysisResult)
async def save_diagnostics(
    request: SaveDiagnosticsRequest
) -> Dict[str, Any]:
    """
    Save diagnostic results with notes
    """
    # Find the analysis result in our mock database
    analysis = next((a for a in MOCK_ANALYSES if a.id == request.analysisId), None)
    
    if analysis:
        # Update existing record
        analysis.notes = request.notes
        return analysis
    else:
        # Create a new analysis record
        analysis = ImageAnalysisResult(
            id=request.analysisId,
            patientId=request.patientId,
            imageType=request.imageType,
            findings=request.findings,
            confidence=request.confidence,
            notes=request.notes
        )
        
        # Add to our mock database
        MOCK_ANALYSES.append(analysis)
        
        return analysis

@router.post("/reanalyze", response_model=Dict[str, Any])
async def reanalyze_image(
    request: Request,
    patientId: str = Body(...),
    imageId: str = Body(...), 
    imageType: str = Body(...),
    providerId: Optional[str] = Body(None),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Re-analyze an existing dental image using the latest AI model
    
    This endpoint is useful for applying updated AI models to previously uploaded images,
    or for comparing results between different model versions.
    """
    logger.info(f"Re-analyzing {imageType} image {imageId} for patient {patientId}")
    
    # Generate request ID for correlation
    request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))
    
    # Find the image path
    image_path = UPLOADS_DIR / f"{patientId}" / f"{imageId}.jpg"
    
    if not image_path.exists():
        raise HTTPException(
            status_code=404, 
            detail=f"Image not found for patient {patientId} with ID {imageId}"
        )
    
    # Read image data
    with open(image_path, "rb") as f:
        contents = f.read()
    
    # Use the inference service to analyze the image
    result = await inference_service.analyze_xray(
        image_data=contents,
        patient_id=patientId,
        provider_id=providerId,
        image_type=imageType,
        request_id=request_id,
        db=db
    )
    
    # Add image URL to the result
    result["imageUrl"] = f"/api/images/analyses/{patientId}/{imageId}.jpg"
    result["reanalyzed"] = True
    result["original_image_id"] = imageId
    
    # Store analysis in mock database for API consistency
    try:
        # Convert the result to our API format (similar to the analyze endpoint)
        findings_list = []
        
        # Extract findings from the result structure
        if result.get("findings"):
            for category, items in result["findings"].items():
                if isinstance(items, list):
                    for item in items:
                        finding_id = f"F{uuid.uuid4().hex[:6]}"
                        finding_type = category.replace("_", " ").title()
                        
                        # Extract location from tooth information if available
                        location = ""
                        if "tooth" in item:
                            tooth_num = item["tooth"]
                            location = f"Tooth #{tooth_num}"
                            
                            # Add more details if available
                            if "surface" in item:
                                location += f" (Surface: {item['surface']})"
                        
                        # Create description
                        description = f"{finding_type}"
                        if "severity" in item:
                            description += f" - {item['severity']} severity"
                        if "material" in item:
                            description += f" - {item['material']}"
                        if "condition" in item:
                            description += f" - {item['condition']} condition"
                        
                        # Calculate confidence
                        confidence = item.get("confidence", 0.8)
                        
                        # Suggested treatments
                        treatments = []
                        if category == "caries":
                            treatments = ["Filling", "Restoration"]
                        elif category == "periapical_lesions":
                            treatments = ["Root Canal", "Evaluation"]
                        elif category == "impacted_teeth":
                            treatments = ["Extraction", "Surgical Evaluation"]
                        elif category == "restorations":
                            if item.get("condition") == "defective":
                                treatments = ["Replace Restoration"]
                            else:
                                treatments = ["Monitor"]
                        
                        findings_list.append(Finding(
                            id=finding_id,
                            type=finding_type,
                            description=description,
                            location=location, 
                            confidence=confidence,
                            suggestedTreatments=treatments
                        ))
        
        # Calculate overall confidence
        overall_confidence = result.get("confidence", 0.0) or 0.85
        
        # Create analysis result for our mock database
        analysis_result = ImageAnalysisResult(
            id=result.get("analysis_id", f"reanalysis_{uuid.uuid4().hex[:8]}"),
            patientId=patientId,
            imageType=imageType,
            findings=findings_list,
            confidence=overall_confidence,
            imageUrl=result["imageUrl"],
            timestamp=datetime.now(),
            notes=f"Re-analyzed with model version {result.get('model_version', '1.0.0')}"
        )
        
        # Add to mock database
        MOCK_ANALYSES.append(analysis_result)
        
    except Exception as e:
        logger.error(f"Error converting reanalysis result to API format: {str(e)}")
        # This doesn't affect the primary response
    
    logger.info(f"Re-analysis completed for patient {patientId} image {imageId}")
    return result 