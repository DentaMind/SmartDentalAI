from fastapi import APIRouter, Depends, HTTPException, status, Body, Path, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import logging

# Use absolute imports to avoid module not found errors
from backend.api.database import get_db
from backend.api.services.patient_intake_service import PatientIntakeService
from backend.api.schemas.patient_intake import (
    PatientIntakeCreate,
    PatientCreate,
    PatientResponse,
    PatientMedicalProfileResponse,
    MedicalHistoryResponse,
    MedicalAlertResponse,
    AllergyResponse,
    MedicationResponse,
    PatientUpdate,
    MedicalHistoryUpdate,
    AISuggestionRequest,
    AISuggestionResponse
)
from backend.api.auth.dependencies import get_current_user, get_current_active_user
from backend.api.models.patient import Patient
from backend.api.models.patient_intake import PatientIntakeForm, PatientIntakeAISuggestion, PatientIntakeVersioning

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/patient-intake",
    tags=["Patient Intake"],
    responses={404: {"description": "Not found"}}
)

@router.post("/register", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def register_new_patient(
    intake_data: PatientIntakeCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Register a new patient with optional medical history, allergies, and medications
    """
    try:
        service = PatientIntakeService(db)
        
        # Process patient data into the expected format for the service
        patient_data = intake_data.patient.dict()
        if intake_data.medical_history:
            patient_data["medical_history"] = intake_data.medical_history.dict()
        if intake_data.allergies:
            patient_data["allergies"] = [allergy.dict() for allergy in intake_data.allergies]
        if intake_data.medications:
            patient_data["medications"] = [med.dict() for med in intake_data.medications]
            
        patient = await service.process_new_patient(patient_data)
        return patient
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.get("/patient/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: str = Path(..., description="ID of the patient to retrieve"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get a patient's basic information
    """
    # Get patient from database
    patient = db.query("Patient").filter_by(id=patient_id).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    return patient

@router.get("/patient/{patient_id}/medical-profile", response_model=PatientMedicalProfileResponse)
async def get_patient_medical_profile(
    patient_id: str = Path(..., description="ID of the patient"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get a patient's complete medical profile including history, 
    allergies, medications, and alerts
    """
    try:
        service = PatientIntakeService(db)
        medical_profile = await service.get_patient_medical_profile(patient_id)
        
        # Check if patient exists
        if not medical_profile.get("patient_id"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
            
        return medical_profile
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.put("/patient/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_data: PatientUpdate,
    patient_id: str = Path(..., description="ID of the patient to update"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Update a patient's basic information
    """
    # Get patient from database
    patient = db.query("Patient").filter_by(id=patient_id).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Update patient fields
    patient_update_data = patient_data.dict(exclude_none=True)
    for key, value in patient_update_data.items():
        setattr(patient, key, value)
    
    # Update timestamps
    patient.updated_at = datetime.now()
    
    try:
        db.commit()
        db.refresh(patient)
        return patient
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.put("/patient/{patient_id}/medical-history", response_model=MedicalHistoryResponse)
async def update_medical_history(
    medical_data: MedicalHistoryUpdate,
    patient_id: str = Path(..., description="ID of the patient"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Update a patient's medical history
    """
    try:
        service = PatientIntakeService(db)
        
        # Convert Pydantic model to dict for service
        medical_update_data = medical_data.dict(exclude_none=True)
        
        # Update medical history
        updated_history = await service.update_medical_history(
            patient_id, 
            medical_update_data
        )
        
        return updated_history
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.post("/patient/{patient_id}/allergies", response_model=List[AllergyResponse])
async def add_patient_allergies(
    allergies: List[AllergyResponse],
    patient_id: str = Path(..., description="ID of the patient"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Add allergies to a patient's record
    """
    try:
        service = PatientIntakeService(db)
        
        # Convert Pydantic models to dicts for service
        allergies_data = [allergy.dict() for allergy in allergies]
        
        # Add allergies
        added_allergies = await service.add_patient_allergies(
            patient_id, 
            allergies_data
        )
        
        return added_allergies
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.post("/patient/{patient_id}/medications", response_model=List[MedicationResponse])
async def add_patient_medications(
    medications: List[MedicationResponse],
    patient_id: str = Path(..., description="ID of the patient"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Add medications to a patient's record
    """
    try:
        service = PatientIntakeService(db)
        
        # Convert Pydantic models to dicts for service
        medications_data = [med.dict() for med in medications]
        
        # Add medications
        added_medications = await service.add_patient_medications(
            patient_id, 
            medications_data
        )
        
        return added_medications
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.get("/patient/{patient_id}/alerts", response_model=List[MedicalAlertResponse])
async def get_patient_alerts(
    patient_id: str = Path(..., description="ID of the patient"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get medical alerts for a patient
    """
    try:
        service = PatientIntakeService(db)
        alerts = await service.generate_medical_alerts(patient_id)
        return alerts
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.post("/check-medication-allergies", response_model=Optional[Dict[str, Any]])
async def check_medication_allergies(
    patient_id: str = Query(..., description="ID of the patient"),
    medication_name: str = Query(..., description="Name of the medication to check"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Check if a patient is allergic to a specific medication
    """
    try:
        service = PatientIntakeService(db)
        allergy = await service.check_medication_allergies(patient_id, medication_name)
        return allergy  # Returns None if no allergy found
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.post("/{patient_id}", status_code=status.HTTP_201_CREATED, response_model=Dict[str, Any])
async def create_patient_intake(
    patient_id: str = Path(..., description="The ID of the patient"),
    intake_data: Dict[str, Any] = Body(..., description="The patient intake form data"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Create a new patient intake form.
    
    This endpoint stores the comprehensive patient intake form data,
    including personal information, medical history, insurance details, etc.
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )
    
    # Create intake form record
    form_id = str(uuid.uuid4())
    intake_form = PatientIntakeForm(
        id=form_id,
        patient_id=patient_id,
        personal_info=intake_data.get("personal_info", {}),
        medical_history=intake_data.get("medical_history"),
        dental_history=intake_data.get("dental_history"),
        insurance_info=intake_data.get("insurance_info"),
        emergency_contact=intake_data.get("emergency_contact"),
        consent=intake_data.get("consent", False),
        is_completed=intake_data.get("is_completed", False),
        completion_date=datetime.now() if intake_data.get("is_completed", False) else None,
        created_by=current_user.id,
        submitted_ip=intake_data.get("client_ip")
    )
    
    db.add(intake_form)
    
    # Create initial version record
    version = PatientIntakeVersioning(
        id=str(uuid.uuid4()),
        intake_form_id=form_id,
        version_num=1,
        form_data=intake_data,
        changed_fields=None,  # First version has no changes
        changed_by=current_user.id,
        comment="Initial intake form submission"
    )
    
    db.add(version)
    db.commit()
    
    return {
        "status": "success",
        "message": "Patient intake form created successfully",
        "intake_id": form_id
    }

@router.get("/{patient_id}", response_model=Dict[str, Any])
async def get_patient_intake(
    patient_id: str = Path(..., description="The ID of the patient"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve the latest patient intake form for a patient.
    
    Returns the most recent intake form with all its data.
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )
    
    # Get the latest intake form
    intake_form = db.query(PatientIntakeForm)\
        .filter(PatientIntakeForm.patient_id == patient_id)\
        .order_by(PatientIntakeForm.created_at.desc())\
        .first()
    
    if not intake_form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No intake form found for patient with ID {patient_id}"
        )
    
    # Get form versions for history
    versions = db.query(PatientIntakeVersioning)\
        .filter(PatientIntakeVersioning.intake_form_id == intake_form.id)\
        .order_by(PatientIntakeVersioning.version_num.desc())\
        .all()
    
    version_history = [{
        "version": v.version_num,
        "created_at": v.created_at,
        "changed_by": v.changed_by,
        "comment": v.comment
    } for v in versions]
    
    # Get AI suggestions if any
    ai_suggestions = db.query(PatientIntakeAISuggestion)\
        .filter(PatientIntakeAISuggestion.intake_form_id == intake_form.id)\
        .order_by(PatientIntakeAISuggestion.created_at.desc())\
        .first()
    
    result = {
        "id": intake_form.id,
        "patient_id": intake_form.patient_id,
        "personal_info": intake_form.personal_info,
        "medical_history": intake_form.medical_history,
        "dental_history": intake_form.dental_history,
        "insurance_info": intake_form.insurance_info,
        "emergency_contact": intake_form.emergency_contact,
        "consent": intake_form.consent,
        "is_completed": intake_form.is_completed,
        "completion_date": intake_form.completion_date,
        "created_at": intake_form.created_at,
        "updated_at": intake_form.updated_at,
        "version_history": version_history,
        "has_ai_suggestions": ai_suggestions is not None
    }
    
    return result

@router.put("/{patient_id}", response_model=Dict[str, Any])
async def update_patient_intake(
    patient_id: str = Path(..., description="The ID of the patient"),
    intake_data: Dict[str, Any] = Body(..., description="The updated patient intake form data"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Update an existing patient intake form.
    
    Each update creates a new version in the versioning system for audit and tracking.
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )
    
    # Get the latest intake form
    intake_form = db.query(PatientIntakeForm)\
        .filter(PatientIntakeForm.patient_id == patient_id)\
        .order_by(PatientIntakeForm.created_at.desc())\
        .first()
    
    if not intake_form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"No intake form found for patient with ID {patient_id}"
        )
    
    # Determine what fields are changing
    changed_fields = {}
    for field in ["personal_info", "medical_history", "dental_history", "insurance_info", "emergency_contact"]:
        if field in intake_data and intake_data[field] != getattr(intake_form, field):
            changed_fields[field] = True
    
    # Update the intake form
    for field in ["personal_info", "medical_history", "dental_history", "insurance_info", "emergency_contact", "consent"]:
        if field in intake_data:
            setattr(intake_form, field, intake_data[field])
    
    # Update completion status if provided
    if "is_completed" in intake_data:
        intake_form.is_completed = intake_data["is_completed"]
        if intake_data["is_completed"] and not intake_form.completion_date:
            intake_form.completion_date = datetime.now()
    
    intake_form.updated_at = datetime.now()
    intake_form.updated_by = current_user.id
    
    # Get latest version number
    latest_version = db.query(PatientIntakeVersioning)\
        .filter(PatientIntakeVersioning.intake_form_id == intake_form.id)\
        .order_by(PatientIntakeVersioning.version_num.desc())\
        .first()
    
    new_version_num = (latest_version.version_num + 1) if latest_version else 1
    
    # Create new version record
    version = PatientIntakeVersioning(
        id=str(uuid.uuid4()),
        intake_form_id=intake_form.id,
        version_num=new_version_num,
        form_data=intake_data,
        changed_fields=changed_fields,
        changed_by=current_user.id,
        comment=intake_data.get("version_comment", "Updated intake form")
    )
    
    db.add(version)
    db.commit()
    
    return {
        "status": "success",
        "message": "Patient intake form updated successfully",
        "intake_id": intake_form.id,
        "version": new_version_num
    }

@router.post("/{patient_id}/ai-suggest", response_model=AISuggestionResponse)
async def generate_ai_suggestions(
    patient_id: str = Path(..., description="The ID of the patient"),
    request: AISuggestionRequest = Body(..., description="Current form data for AI to analyze"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generate AI-assisted suggestions for the patient intake form.
    
    This analyzes the current form data and provides intelligent suggestions for
    missing or inconsistent information, based on medical knowledge and patterns.
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )
    
    # Get the latest intake form if it exists
    intake_form = db.query(PatientIntakeForm)\
        .filter(PatientIntakeForm.patient_id == patient_id)\
        .order_by(PatientIntakeForm.created_at.desc())\
        .first()
    
    if not intake_form:
        # We'll create a mock intake form ID for the suggestions
        # In a real implementation, you might want to create the form first
        intake_form_id = str(uuid.uuid4())
    else:
        intake_form_id = intake_form.id
    
    # In a real implementation, you would:
    # 1. Call your AI model service
    # 2. Process the suggestions
    # 3. Return scored and ranked suggestions
    
    # For this example, we'll create sample suggestions
    # In a production system, replace this with real AI model calls
    
    # Mock suggestions based on current data
    suggestions = {}
    confidence = 0.85
    reasoning = "Based on the provided information and medical best practices."
    
    # Some example suggestion logic
    current_data = request.current_form_data
    
    medical_history = current_data.get("medical_history", {})
    if medical_history:
        # Check for diabetes and add related considerations
        if medical_history.get("has_diabetes"):
            if "conditions" not in suggestions:
                suggestions["conditions"] = []
            
            # If they have diabetes but no specific conditions mentioning it
            has_diabetes_condition = False
            for condition in medical_history.get("conditions", []):
                if "diabet" in condition.get("name", "").lower():
                    has_diabetes_condition = True
                    break
            
            if not has_diabetes_condition:
                suggestions["conditions"] = [{
                    "name": "Type 2 Diabetes Mellitus",
                    "icd_code": "E11.9",
                    "is_controlled": True,
                    "dental_considerations": [
                        "Monitor for delayed healing",
                        "Increased risk of infection",
                        "Consider shorter appointment intervals"
                    ]
                }]
    
    # Generate more suggestions based on known medical correlations
    # This would be much more sophisticated in a real implementation
    
    # Save the AI suggestion to the database
    ai_suggestion = PatientIntakeAISuggestion(
        id=str(uuid.uuid4()),
        intake_form_id=intake_form_id,
        patient_id=patient_id,
        suggestions=suggestions,
        ai_model_version="v1.0",  # This would be your actual model version
        confidence_score=confidence,
        reasoning=reasoning,
        fields_considered=list(current_data.keys())
    )
    
    db.add(ai_suggestion)
    db.commit()
    
    return AISuggestionResponse(
        suggestions=suggestions,
        confidence_score=confidence,
        reasoning=reasoning
    )

@router.get("/{patient_id}/ai-suggest", response_model=Dict[str, Any])
async def get_ai_suggestions(
    patient_id: str = Path(..., description="The ID of the patient"),
    intake_id: Optional[str] = Query(None, description="Optional specific intake form ID"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve the latest AI suggestions for a patient's intake form.
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )
    
    # Get the specific intake form if ID provided, otherwise get latest
    if intake_id:
        intake_form = db.query(PatientIntakeForm)\
            .filter(PatientIntakeForm.id == intake_id, PatientIntakeForm.patient_id == patient_id)\
            .first()
        
        if not intake_form:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Intake form with ID {intake_id} not found for patient {patient_id}"
            )
    else:
        intake_form = db.query(PatientIntakeForm)\
            .filter(PatientIntakeForm.patient_id == patient_id)\
            .order_by(PatientIntakeForm.created_at.desc())\
            .first()
        
        if not intake_form:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No intake form found for patient with ID {patient_id}"
            )
    
    # Get the latest AI suggestion for this intake form
    ai_suggestion = db.query(PatientIntakeAISuggestion)\
        .filter(PatientIntakeAISuggestion.intake_form_id == intake_form.id)\
        .order_by(PatientIntakeAISuggestion.created_at.desc())\
        .first()
    
    if not ai_suggestion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No AI suggestions found for intake form with ID {intake_form.id}"
        )
    
    return {
        "id": ai_suggestion.id,
        "intake_form_id": ai_suggestion.intake_form_id,
        "patient_id": ai_suggestion.patient_id,
        "suggestions": ai_suggestion.suggestions,
        "confidence_score": ai_suggestion.confidence_score,
        "reasoning": ai_suggestion.reasoning,
        "created_at": ai_suggestion.created_at,
        "ai_model_version": ai_suggestion.ai_model_version,
        "fields_considered": ai_suggestion.fields_considered,
        "feedback": ai_suggestion.feedback,
        "applied_suggestions": ai_suggestion.applied_suggestions
    }

@router.post("/{patient_id}/ai-suggest/{suggestion_id}/feedback", response_model=Dict[str, Any])
async def provide_ai_suggestion_feedback(
    patient_id: str = Path(..., description="The ID of the patient"),
    suggestion_id: str = Path(..., description="The ID of the AI suggestion"),
    feedback_data: Dict[str, Any] = Body(..., description="Feedback on the AI suggestions"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Provide feedback on AI suggestions to improve future recommendations.
    
    This endpoint allows healthcare providers to indicate which suggestions were
    helpful, which were not, and why, to continuously improve the AI.
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found"
        )
    
    # Get the AI suggestion
    ai_suggestion = db.query(PatientIntakeAISuggestion)\
        .filter(PatientIntakeAISuggestion.id == suggestion_id, PatientIntakeAISuggestion.patient_id == patient_id)\
        .first()
    
    if not ai_suggestion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI suggestion with ID {suggestion_id} not found for patient {patient_id}"
        )
    
    # Update the suggestion with feedback
    ai_suggestion.feedback = feedback_data.get("feedback", {})
    ai_suggestion.applied_suggestions = feedback_data.get("applied_suggestions", {})
    
    db.commit()
    
    return {
        "status": "success",
        "message": "Feedback recorded successfully",
        "suggestion_id": suggestion_id
    } 