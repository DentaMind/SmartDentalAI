from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body, Query, Path
from sqlalchemy.orm import Session
from typing import Dict, List, Optional, Any
import json
from datetime import datetime
import uuid

from ..database import get_db
from ..services.patient_workflow_service import get_patient_workflow_service
from ..services.clinical_notes_service import ClinicalNotesService
from ..auth.dependencies import get_current_user

router = APIRouter(
    prefix="/api/patient-workflow",
    tags=["Patient Workflow"]
)

# Helper function to get the clinical notes service
def get_notes_service(db: Session = Depends(get_db)) -> ClinicalNotesService:
    return ClinicalNotesService(db)

@router.post("/patient/intake")
async def process_patient_intake(
    patient_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Process a new patient intake form, creating the patient profile,
    medical history, and related records.
    """
    workflow_service = get_patient_workflow_service(db)
    
    try:
        patient = await workflow_service.process_new_patient(patient_data)
        return {
            "status": "success",
            "message": "Patient intake processed successfully",
            "patient_id": patient.id
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing patient intake: {str(e)}"
        )

@router.post("/xray/analyze/{patient_id}")
async def analyze_xray(
    patient_id: str,
    xray_file: UploadFile = File(...),
    xray_type: str = Form("bitewing"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Analyze a dental X-ray using Roboflow AI, update the patient's
    restorative chart, and generate findings.
    """
    # In a real implementation, this would:
    # 1. Save the uploaded X-ray
    # 2. Send it to Roboflow for analysis
    # 3. Process the results
    # 4. Update the patient's chart
    
    # For now, we'll simulate a successful response
    return {
        "status": "success",
        "message": "X-ray analysis initiated",
        "xray_id": "sim-xray-123",
        "patient_id": patient_id,
        "processing_status": "in_progress"
    }

@router.post("/xray/external/{patient_id}")
async def upload_external_xray(
    patient_id: str,
    xray_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Upload and process an external X-ray for a patient.
    """
    workflow_service = get_patient_workflow_service(db)
    
    try:
        xray_id = await workflow_service.upload_external_xray(patient_id, xray_data)
        return {
            "status": "success",
            "message": "External X-ray uploaded successfully",
            "xray_id": xray_id,
            "patient_id": patient_id
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading external X-ray: {str(e)}"
        )

@router.post("/xray/findings/{patient_id}")
async def process_xray_findings(
    patient_id: str,
    findings: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    notes_service: ClinicalNotesService = Depends(get_notes_service)
):
    """
    Process X-ray findings from Roboflow/AI analysis, updating the
    patient's restorative chart and clinical notes.
    """
    workflow_service = get_patient_workflow_service(db)
    
    try:
        # Process the findings
        await workflow_service.process_xray_findings(patient_id, findings)
        
        # Generate clinical notes from the findings
        note = await notes_service.generate_from_findings(patient_id, findings)
        
        # In a real implementation, save the note to the database
        # db_note = ClinicalNote(**note)
        # db.add(db_note)
        # db.commit()
        
        return {
            "status": "success",
            "message": "X-ray findings processed successfully",
            "patient_id": patient_id,
            "findings_count": len(findings.get("findings", [])),
            "clinical_note": {
                "id": note["id"],
                "title": note["title"],
                "status": note["status"]
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing X-ray findings: {str(e)}"
        )

@router.post("/treatment-plan/{patient_id}/{diagnosis_id}")
async def generate_treatment_plan(
    patient_id: str,
    diagnosis_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    notes_service: ClinicalNotesService = Depends(get_notes_service)
):
    """
    Generate a comprehensive treatment plan based on diagnosis, medical
    history, and patient preferences, considering medical contraindications.
    """
    workflow_service = get_patient_workflow_service(db)
    
    try:
        treatment_plan = await workflow_service.generate_treatment_plan(
            patient_id, diagnosis_id
        )
        
        # Generate clinical notes from the treatment plan
        plan_data = {
            "name": treatment_plan.name if hasattr(treatment_plan, "name") else "Treatment Plan",
            "procedures": [proc.__dict__ for proc in treatment_plan.procedures] if hasattr(treatment_plan, "procedures") else [],
            "diagnosis": {"id": diagnosis_id}
        }
        
        note = await notes_service.generate_from_treatment_plan(
            patient_id, 
            treatment_plan.id,
            plan_data
        )
        
        # In a real implementation, save the note to the database
        # db_note = ClinicalNote(**note)
        # db.add(db_note)
        # db.commit()
        
        return {
            "status": "success",
            "message": "Treatment plan generated successfully",
            "treatment_plan_id": treatment_plan.id,
            "patient_id": patient_id,
            "status": treatment_plan.status,
            "medical_alerts": treatment_plan.medical_alerts if hasattr(treatment_plan, "medical_alerts") else [],
            "clinical_note": {
                "id": note["id"],
                "title": note["title"],
                "status": note["status"]
            }
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating treatment plan: {str(e)}"
        )

@router.get("/treatment-plan/{treatment_plan_id}/procedures")
async def get_treatment_procedures(
    treatment_plan_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all procedures in a treatment plan, with AI reasoning and
    medical considerations.
    """
    from ..models.treatment_plan import TreatmentProcedure
    
    procedures = db.query(TreatmentProcedure).filter(
        TreatmentProcedure.treatment_plan_id == treatment_plan_id
    ).all()
    
    if not procedures:
        return {
            "status": "success",
            "message": "No procedures found for this treatment plan",
            "procedures": []
        }
    
    # Convert to response format
    procedure_list = []
    for proc in procedures:
        procedure_list.append({
            "id": proc.id,
            "tooth_number": proc.tooth_number,
            "cdt_code": proc.cdt_code,
            "procedure_name": proc.procedure_name,
            "description": proc.description,
            "status": proc.status,
            "priority": proc.priority,
            "notes": proc.notes,
            "reasoning": proc.reasoning,
            "ai_suggested": proc.ai_suggested,
            "doctor_approved": proc.doctor_approved,
            "created_at": proc.created_at.isoformat() if proc.created_at else None
        })
    
    return {
        "status": "success",
        "treatment_plan_id": treatment_plan_id,
        "procedures": procedure_list
    }

@router.put("/treatment-plan/{treatment_plan_id}/approve")
async def approve_treatment_plan(
    treatment_plan_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Doctor approves a treatment plan, marking it and its procedures
    as approved.
    """
    from ..models.treatment_plan import TreatmentPlan, TreatmentProcedure
    
    # Get the treatment plan
    treatment_plan = db.query(TreatmentPlan).filter(
        TreatmentPlan.id == treatment_plan_id
    ).first()
    
    if not treatment_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Treatment plan not found"
        )
    
    # Update the treatment plan status
    treatment_plan.status = "approved"
    treatment_plan.approved_by = current_user.get("username")
    treatment_plan.approved_at = datetime.now()
    
    # Update all procedures to be doctor approved
    procedures = db.query(TreatmentProcedure).filter(
        TreatmentProcedure.treatment_plan_id == treatment_plan_id
    ).all()
    
    for procedure in procedures:
        procedure.doctor_approved = True
    
    # Commit the changes
    db.commit()
    
    return {
        "status": "success",
        "message": "Treatment plan approved successfully",
        "treatment_plan_id": treatment_plan_id
    }

@router.put("/treatment-plan/procedure/{procedure_id}/approve")
async def approve_procedure(
    procedure_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Doctor approves a specific procedure in a treatment plan.
    """
    from ..models.treatment_plan import TreatmentProcedure
    
    # Get the procedure
    procedure = db.query(TreatmentProcedure).filter(
        TreatmentProcedure.id == procedure_id
    ).first()
    
    if not procedure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Procedure not found"
        )
    
    # Update the procedure
    procedure.doctor_approved = True
    
    # Commit the change
    db.commit()
    
    return {
        "status": "success",
        "message": "Procedure approved successfully",
        "procedure_id": procedure_id
    }

@router.put("/treatment-plan/procedure/{procedure_id}/modify")
async def modify_procedure(
    procedure_id: str,
    procedure_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Doctor modifies a procedure in a treatment plan.
    """
    from ..models.treatment_plan import TreatmentProcedure
    
    # Get the procedure
    procedure = db.query(TreatmentProcedure).filter(
        TreatmentProcedure.id == procedure_id
    ).first()
    
    if not procedure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Procedure not found"
        )
    
    # Update the procedure with the provided data
    updateable_fields = [
        "cdt_code", "procedure_name", "description", 
        "status", "priority", "notes"
    ]
    
    for field in updateable_fields:
        if field in procedure_data:
            setattr(procedure, field, procedure_data[field])
    
    # Mark as modified by doctor
    procedure.doctor_approved = True
    procedure.modified_by_doctor = True
    
    # Add doctor's reasoning if provided
    if "doctor_reasoning" in procedure_data:
        procedure.doctor_reasoning = procedure_data["doctor_reasoning"]
    
    # Commit the changes
    db.commit()
    
    return {
        "status": "success",
        "message": "Procedure modified successfully",
        "procedure_id": procedure_id
    }

@router.post("/treatment-plans/{treatment_plan_id}/approve", response_model=Dict[str, Any])
async def approve_treatment_plan(
    treatment_plan_id: str,
    generate_prescriptions: bool = True,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Approve a treatment plan and optionally generate prescriptions based on procedures.
    
    This marks the treatment plan as approved and, if requested, automatically generates
    prescriptions for medications indicated by the procedures in the plan, taking into account
    the patient's medical history and potential contraindications.
    """
    patient_workflow_service = get_patient_workflow_service(db)
    
    try:
        result = await patient_workflow_service.approve_treatment_plan(
            treatment_plan_id=treatment_plan_id,
            provider_id=current_user.id,
            generate_prescriptions=generate_prescriptions,
            notes=notes
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error approving treatment plan: {str(e)}"
        )

@router.post("/procedures/{procedure_id}/complete", response_model=Dict[str, Any])
async def complete_procedure(
    procedure_id: str,
    data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    notes_service: ClinicalNotesService = Depends(get_notes_service)
):
    """
    Mark a treatment procedure as completed and update the restorative chart.
    
    This records the procedure as completed and automatically updates the patient's
    restorative chart based on the completed work (e.g., adding a crown, filling, etc.).
    
    You can provide optional completion notes and vital signs recording.
    """
    patient_workflow_service = get_patient_workflow_service(db)
    
    try:
        # Complete the procedure
        result = await patient_workflow_service.complete_treatment_procedure(
            procedure_id=procedure_id,
            provider_id=current_user.id,
            completion_notes=data.get("notes"),
            vital_signs=data.get("vital_signs")
        )
        
        # Get the patient ID from the result
        patient_id = result.get("patient_id")
        
        # Generate clinical notes from the completed procedure
        procedure_data = {
            "procedure_name": result.get("procedure_name", "Unknown Procedure"),
            "tooth_number": result.get("tooth_number"),
            "cdt_code": result.get("cdt_code"),
            "description": result.get("description", ""),
            "completion_notes": data.get("notes", "")
        }
        
        note = await notes_service.generate_from_procedure(
            patient_id, 
            procedure_id, 
            procedure_data
        )
        
        # In a real implementation, save the note to the database
        # db_note = ClinicalNote(**note)
        # db.add(db_note)
        # db.commit()
        
        # Add the clinical note to the result
        result["clinical_note"] = {
            "id": note["id"],
            "title": note["title"],
            "status": note["status"]
        }
        
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error completing procedure: {str(e)}"
        )

@router.post("/treatment-plan/{plan_id}/approve")
async def approve_treatment_plan(
    plan_id: str = Path(..., description="The ID of the treatment plan to approve"),
    data: Dict[str, Any] = Body(..., description="Approval data"),
    notes_service: ClinicalNotesService = Depends(get_notes_service)
):
    """
    Approve a treatment plan and trigger follow-up actions
    """
    # In a real implementation, this would:
    # 1. Update the treatment plan status to approved
    # 2. Generate prescriptions if needed
    # 3. Update the patient's chart
    # 4. Schedule follow-up appointments
    
    # For demo, simulate generating a prescription if requested
    generated_prescription_id = None
    patient_id = data.get("patient_id", "unknown_patient")
    
    if data.get("generate_prescription", False):
        # This would call the prescriptions API to create a new prescription
        generated_prescription_id = f"rx-{str(uuid.uuid4())[:8]}"
        
        # In a real implementation, we would create the prescription in the database
        # For demo, just simulate the creation
    
    # Generate a clinical note for the approved treatment plan
    if "plan_data" in data:
        note = await notes_service.generate_from_treatment_plan(
            patient_id, 
            plan_id, 
            data["plan_data"]
        )
        
        # Update the note to reflect that the plan was approved
        note["title"] = "Approved: " + note["title"]
        note["content"] += "\n\n## Approval\nTreatment plan approved by provider on " + datetime.now().strftime("%Y-%m-%d") + "."
        note["status"] = "final"
        
        # In a real implementation, save the note to the database
        # db_note = ClinicalNote(**note)
        # db.add(db_note)
        # db.commit()
    
    return {
        "status": "success",
        "message": "Treatment plan approved successfully",
        "generated_prescription_id": generated_prescription_id,
        "clinical_note_generated": "plan_data" in data
    }

@router.post("/procedure/{procedure_id}/complete")
async def complete_procedure(
    procedure_id: str = Path(..., description="The ID of the procedure to mark as complete"),
    data: Dict[str, Any] = Body(..., description="Completion data"),
    notes_service: ClinicalNotesService = Depends(get_notes_service)
):
    """
    Mark a procedure as complete and update related systems
    """
    # In a real implementation, this would:
    # 1. Update the procedure status to complete
    # 2. Update the restorative chart
    # 3. Generate prescriptions if needed
    # 4. Schedule follow-up appointments
    
    # For demo, simulate updating the chart and generating a prescription
    chart_updated = True
    generated_prescription_id = None
    patient_id = data.get("patient_id", "unknown_patient")
    
    if data.get("generate_prescription", False):
        # This would call the prescriptions API to create a new prescription
        generated_prescription_id = f"rx-{str(uuid.uuid4())[:8]}"
        
        # In a real implementation, we would create the prescription in the database
        # For demo, just simulate the creation
    
    # Update the patient notes if provided
    notes_updated = False
    if data.get("notes"):
        notes_updated = True
    
    # Generate a clinical note for the completed procedure
    note = await notes_service.generate_from_procedure(
        patient_id, 
        procedure_id, 
        {
            "procedure_name": data.get("procedure_name", "Unknown Procedure"),
            "tooth_number": data.get("tooth_number"),
            "cdt_code": data.get("cdt_code"),
            "description": data.get("description", ""),
            "completion_notes": data.get("notes", "")
        }
    )
    
    # In a real implementation, save the note to the database
    # db_note = ClinicalNote(**note)
    # db.add(db_note)
    # db.commit()
    
    return {
        "status": "success",
        "message": "Procedure marked as complete",
        "chart_updated": chart_updated,
        "notes_updated": notes_updated,
        "generated_prescription_id": generated_prescription_id,
        "clinical_note": {
            "id": note["id"],
            "title": note["title"],
            "status": note["status"]
        }
    }

@router.post("/diagnosis/{diagnosis_id}/document")
async def document_diagnosis(
    diagnosis_id: str = Path(..., description="The ID of the diagnosis to document"),
    data: Dict[str, Any] = Body(..., description="Documentation data"),
    notes_service: ClinicalNotesService = Depends(get_notes_service)
):
    """
    Document a diagnosis in patient notes and optionally trigger follow-up actions
    """
    # In a real implementation, this would:
    # 1. Update the patient notes with the diagnosis
    # 2. Link to supplementary education materials
    # 3. Update the patient's health record
    
    # For demo, simulate documenting the diagnosis
    notes_updated = True
    education_materials = []
    patient_id = data.get("patient_id", "unknown_patient")
    
    if data.get("include_education_materials", False):
        # This would retrieve relevant education materials
        education_materials = [
            {
                "id": "edu-001",
                "title": "Understanding Dental Caries",
                "type": "pdf",
                "url": "/api/education/materials/edu-001"
            },
            {
                "id": "edu-002",
                "title": "Proper Brushing Techniques",
                "type": "video",
                "url": "/api/education/materials/edu-002"
            }
        ]
    
    # Generate a clinical note for the diagnosis
    note = await notes_service.generate_from_findings(
        patient_id, 
        {
            "id": diagnosis_id,
            "overall_findings": data.get("findings", []),
            "tooth_findings": data.get("tooth_findings", [])
        }
    )
    
    # Customize the note further
    note["title"] = "Diagnosis: " + (data.get("diagnosis_name", "Dental Diagnosis"))
    if "notes" in data:
        note["content"] += "\n\n## Provider Notes\n" + data["notes"]
    
    # In a real implementation, save the note to the database
    # db_note = ClinicalNote(**note)
    # db.add(db_note)
    # db.commit()
    
    return {
        "status": "success",
        "message": "Diagnosis documented successfully",
        "notes_updated": notes_updated,
        "education_materials": education_materials,
        "clinical_note": {
            "id": note["id"],
            "title": note["title"],
            "status": note["status"]
        }
    }

@router.get("/prescription-recommendations/{patient_id}")
async def get_prescription_recommendations(
    patient_id: str = Path(..., description="The patient ID to get prescription recommendations for")
):
    """
    Get prescription recommendations based on patient's treatment plan and completed procedures
    """
    # In a real implementation, this would:
    # 1. Get the patient's treatment plan
    # 2. Analyze completed procedures
    # 3. Generate recommended prescriptions
    
    # For demo, return mock recommendations
    recommendations = [
        {
            "procedure": "Extraction of tooth #18",
            "recommended_medications": [
                {
                    "medication_name": "Amoxicillin",
                    "dosage": "500mg",
                    "form": "Tablet",
                    "route": "Oral",
                    "frequency": "Every 8 hours",
                    "quantity": 21,
                    "days_supply": 7,
                    "refills": 0,
                    "notes": "For infection prevention following extraction"
                },
                {
                    "medication_name": "Ibuprofen",
                    "dosage": "800mg",
                    "form": "Tablet",
                    "route": "Oral",
                    "frequency": "Every 6 hours",
                    "quantity": 20,
                    "days_supply": 5,
                    "refills": 0,
                    "notes": "For pain management"
                }
            ]
        },
        {
            "procedure": "Root canal treatment #30",
            "recommended_medications": [
                {
                    "medication_name": "Ibuprofen",
                    "dosage": "800mg",
                    "form": "Tablet",
                    "route": "Oral",
                    "frequency": "Every 6 hours",
                    "quantity": 20,
                    "days_supply": 5,
                    "refills": 0,
                    "notes": "For pain management"
                }
            ]
        }
    ]
    
    return recommendations 