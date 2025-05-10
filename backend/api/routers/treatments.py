from fastapi import APIRouter, Path, Query, Body, HTTPException, Depends, Request
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import uuid
import logging
from datetime import datetime
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.inference_service import inference_service

# Import settings from config
from ..config.config import settings

# Set up logger
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/treatments",
    tags=["treatments"],
    responses={404: {"description": "Not found"}}
)

# Pydantic models
class Finding(BaseModel):
    id: str
    type: str
    description: str
    location: str
    confidence: float
    suggestedTreatments: List[str]

class ClinicalEvidence(BaseModel):
    id: str
    title: str
    authors: str
    journal: str
    publication_date: str
    link: str
    evidence_strength: int
    key_findings: str

class TreatmentOption(BaseModel):
    id: str
    name: str
    description: str
    success_rate: float
    recommended_for: List[str]
    contraindications: List[str]
    clinical_evidence: List[ClinicalEvidence]
    cost_range: str
    avg_recovery_time: str
    procedure_time: str
    insurance_coverage_likelihood: str

class TreatmentSuggestion(BaseModel):
    id: str
    diagnosis_id: str
    procedure_name: str
    procedure_code: Optional[str] = None
    tooth_number: Optional[str] = None
    confidence: float
    reasoning: str
    priority: str = "medium"
    
class TreatmentGroup(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    priority: str
    suggestions: List[str]  # List of suggestion IDs
    
class TreatmentSuggestionsResponse(BaseModel):
    suggestions: List[TreatmentSuggestion]
    groups: List[TreatmentGroup]
    
class TreatmentFeedback(BaseModel):
    suggestion_id: str
    status: str  # accepted, modified, rejected
    provider_id: str
    notes: Optional[str] = None
    modified_procedure: Optional[str] = None
    rejection_reason: Optional[str] = None

# Mock treatment data (would come from a real database in production)
MOCK_TREATMENT_DATA = {
    "Cavity": [
        {
            "id": "T001",
            "name": "Composite Filling",
            "description": "Tooth-colored resin material bonded to the tooth to restore the damaged area.",
            "success_rate": 0.92,
            "recommended_for": ["Small to medium cavities", "Visible teeth where aesthetics matter"],
            "contraindications": ["Very large cavities", "Patients with heavy bruxism"],
            "clinical_evidence": [
                {
                    "id": "CE001",
                    "title": "Long-term clinical evaluation of composite resin restorations",
                    "authors": "Johnson et al.",
                    "journal": "Journal of Dental Research",
                    "publication_date": "2021-05-15",
                    "link": "https://example.com/research/composite-eval",
                    "evidence_strength": 4,
                    "key_findings": "92% success rate over 5 years for posterior composite restorations"
                }
            ],
            "cost_range": "$150-$300 per tooth",
            "avg_recovery_time": "Immediate",
            "procedure_time": "30-60 minutes",
            "insurance_coverage_likelihood": "high"
        }
    ],
    "Periapical Radiolucency": [
        {
            "id": "T003",
            "name": "Root Canal Therapy",
            "description": "Removal of infected pulp tissue, cleaning of canal system, and filling with inert material to prevent reinfection.",
            "success_rate": 0.89,
            "recommended_for": ["Irreversible pulpitis", "Necrotic pulp with periapical pathology", "Tooth that can be restored"],
            "contraindications": ["Severely fractured teeth", "Advanced periodontal disease", "Teeth with poor restorative prognosis"],
            "clinical_evidence": [
                {
                    "id": "CE004",
                    "title": "Success rates of endodontic treatment and factors influencing outcomes",
                    "authors": "Rodriguez et al.",
                    "journal": "Journal of Endodontics",
                    "publication_date": "2019-07-22",
                    "link": "https://example.com/research/endo-success",
                    "evidence_strength": 4,
                    "key_findings": "89% success rate at 5 years with proper restoration after treatment"
                }
            ],
            "cost_range": "$700-$1,500 per tooth",
            "avg_recovery_time": "1-2 weeks for tissue healing",
            "procedure_time": "60-90 minutes (may require multiple visits)",
            "insurance_coverage_likelihood": "medium"
        }
    ],
    "Bone Loss": [
        {
            "id": "T005",
            "name": "Scaling and Root Planing",
            "description": "Deep cleaning procedure to remove plaque and tartar from below the gumline and smooth root surfaces.",
            "success_rate": 0.75,
            "recommended_for": ["Early to moderate periodontitis", "Horizontal bone loss", "Non-surgical approach"],
            "contraindications": ["Advanced bone loss", "Furcation involvements", "Complex anatomical factors"],
            "clinical_evidence": [
                {
                    "id": "CE006",
                    "title": "Non-surgical periodontal therapy outcomes in horizontal bone loss cases",
                    "authors": "Martinez & Kumar",
                    "journal": "Journal of Periodontology",
                    "publication_date": "2020-04-17",
                    "link": "https://example.com/research/srp-outcomes",
                    "evidence_strength": 4,
                    "key_findings": "Effective at arresting bone loss progression in 75% of moderate cases with proper maintenance"
                }
            ],
            "cost_range": "$200-$300 per quadrant",
            "avg_recovery_time": "2-3 weeks for gum healing",
            "procedure_time": "45-60 minutes per quadrant",
            "insurance_coverage_likelihood": "high"
        }
    ]
}

@router.post("/suggest/{diagnosis_id}", response_model=Dict[str, Any])
async def suggest_treatments(
    request: Request,
    diagnosis_id: str = Path(..., description="The diagnosis ID to suggest treatments for"),
    patient_id: str = Body(...),
    provider_id: Optional[str] = Body(None),
    findings: Optional[Dict[str, Any]] = Body(None),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Generate AI treatment suggestions based on a diagnosis
    """
    logger.info(f"Generating treatment suggestions for diagnosis {diagnosis_id}, patient {patient_id}")
    
    # Generate request ID for correlation
    request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))
    
    # Use the inference service to generate treatment suggestions
    result = await inference_service.suggest_treatments(
        diagnosis_id=diagnosis_id,
        patient_id=patient_id,
        findings=findings or {},
        provider_id=provider_id,
        request_id=request_id,
        db=db
    )
    
    logger.info(f"Treatment suggestions generated with {len(result.get('suggestions', []))} suggestions")
    return result

@router.post("/feedback", response_model=Dict[str, Any])
async def submit_treatment_feedback(
    request: Request,
    feedback: TreatmentFeedback = Body(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Submit feedback on a treatment suggestion
    """
    logger.info(f"Submitting feedback for treatment suggestion {feedback.suggestion_id}")
    
    # Generate request ID for correlation
    request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))
    
    # Use AI treatment suggestion service to update the status
    from ..services.ai_treatment_suggestion_service import AITreatmentSuggestionService
    treatment_service = AITreatmentSuggestionService(db)
    
    try:
        updated_suggestion = await treatment_service.update_suggestion_status(
            suggestion_id=feedback.suggestion_id,
            status=feedback.status,
            clinician_id=feedback.provider_id,
            notes=feedback.notes,
            modified_procedure=feedback.modified_procedure,
            rejection_reason=feedback.rejection_reason
        )
        
        if not updated_suggestion:
            raise HTTPException(status_code=404, detail="Treatment suggestion not found")
        
        # Log feedback event with audit service
        from ..services.audit_service import AuditService
        from ..models.ai_treatment_suggestion import SuggestionStatus
        
        # Convert status string to enum value
        status_enum = feedback.status
        
        # Log feedback
        await AuditService.log_feedback(
            db=db,
            provider_id=feedback.provider_id,
            resource_type="treatment_suggestion",
            resource_id=feedback.suggestion_id,
            rating=5 if status_enum == SuggestionStatus.ACCEPTED else 
                  3 if status_enum == SuggestionStatus.MODIFIED else 1,
            comments=feedback.notes,
            is_used_for_training=True,  # Use feedback for training by default
            request_id=request_id
        )
        
        return {
            "success": True,
            "status": "Feedback recorded",
            "suggestion_id": feedback.suggestion_id
        }
        
    except Exception as e:
        logger.exception(f"Error updating suggestion status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating suggestion: {str(e)}")

@router.post("/create-treatment-plan/{group_id}", response_model=Dict[str, Any])
async def create_treatment_plan(
    group_id: str = Path(..., description="The suggestion group ID to convert to a treatment plan"),
    title: Optional[str] = Body(None),
    description: Optional[str] = Body(None),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Convert a suggestion group to a formal treatment plan
    """
    logger.info(f"Converting suggestion group {group_id} to treatment plan")
    
    # Use AI treatment suggestion service
    from ..services.ai_treatment_suggestion_service import AITreatmentSuggestionService
    treatment_service = AITreatmentSuggestionService(db)
    
    try:
        result = await treatment_service.convert_to_treatment_plan(
            suggestion_group_id=group_id,
            title=title,
            description=description
        )
        
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        
        return {
            "success": True,
            "treatment_plan_id": str(result["treatment_plan"].id),
            "suggestion_group_id": result["suggestion_group_id"]
        }
        
    except Exception as e:
        logger.exception(f"Error creating treatment plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating treatment plan: {str(e)}")

@router.get("/evidence/{treatment_id}", response_model=List[ClinicalEvidence])
async def get_clinical_evidence(treatment_id: str) -> List[Dict[str, Any]]:
    """
    Get detailed clinical evidence for a specific treatment
    """
    logger.info(f"Fetching clinical evidence for treatment ID {treatment_id}")
    
    # Search for treatment in mock data
    for condition, treatments in MOCK_TREATMENT_DATA.items():
        for treatment in treatments:
            if treatment["id"] == treatment_id:
                logger.info(f"Found {len(treatment['clinical_evidence'])} evidence items")
                return treatment["clinical_evidence"]
    
    # If not found
    logger.warning(f"Treatment ID {treatment_id} not found")
    raise HTTPException(status_code=404, detail="Treatment not found") 