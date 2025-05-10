from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from ..database import get_db
from ..models.clinical_note import ClinicalNote, NoteType, NoteStatus
from ..schemas.clinical_note import (
    NoteCreate, 
    NoteUpdate, 
    NoteResponse, 
    NoteSummary,
    NoteApprove
)
from ..services.clinical_notes_service import ClinicalNotesService
from ..dependencies.auth import get_current_user

router = APIRouter(
    prefix="/clinical-notes",
    tags=["clinical-notes"],
    dependencies=[Depends(get_current_user)]
)

# Helper function to get the notes service
def get_notes_service(db: Session = Depends(get_db)) -> ClinicalNotesService:
    return ClinicalNotesService(db)

@router.post("/", response_model=NoteResponse)
async def create_note(
    note: NoteCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new clinical note manually
    """
    # Create a new ClinicalNote instance
    db_note = ClinicalNote(
        patient_id=note.patient_id,
        title=note.title,
        type=note.type,
        content=note.content,
        metadata=note.metadata or {"source": "manual_entry"},
        status=note.status
    )
    
    # Add to database
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    
    return db_note

@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str = Path(..., description="The ID of the note to retrieve"),
    db: Session = Depends(get_db)
):
    """
    Get a specific clinical note by ID
    """
    db_note = db.query(ClinicalNote).filter(ClinicalNote.id == note_id).first()
    
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return db_note

@router.get("/patient/{patient_id}", response_model=List[NoteSummary])
async def get_patient_notes(
    patient_id: str = Path(..., description="The patient ID to get notes for"),
    note_type: Optional[NoteType] = Query(None, description="Filter by note type"),
    status: Optional[NoteStatus] = Query(None, description="Filter by note status"),
    db: Session = Depends(get_db)
):
    """
    Get all clinical notes for a specific patient
    """
    query = db.query(ClinicalNote).filter(ClinicalNote.patient_id == patient_id)
    
    # Apply filters if provided
    if note_type:
        query = query.filter(ClinicalNote.type == note_type)
    
    if status:
        query = query.filter(ClinicalNote.status == status)
    
    # Order by most recent first
    query = query.order_by(ClinicalNote.created_at.desc())
    
    return query.all()

@router.patch("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_update: NoteUpdate,
    note_id: str = Path(..., description="The ID of the note to update"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Update an existing clinical note
    """
    db_note = db.query(ClinicalNote).filter(ClinicalNote.id == note_id).first()
    
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Only allow updates for non-finalized notes
    if db_note.status == NoteStatus.FINAL and note_update.status != NoteStatus.AMENDED:
        raise HTTPException(
            status_code=400, 
            detail="Finalized notes cannot be modified. Use 'amend' status to make changes."
        )
    
    # Update fields if provided
    if note_update.title is not None:
        db_note.title = note_update.title
    
    if note_update.content is not None:
        db_note.content = note_update.content
    
    if note_update.metadata is not None:
        # Merge with existing metadata
        if db_note.metadata:
            db_note.metadata.update(note_update.metadata)
        else:
            db_note.metadata = note_update.metadata
    
    if note_update.status is not None:
        db_note.status = note_update.status
    
    # Update the note
    db_note.updated_at = datetime.utcnow()
    
    # Save changes
    db.commit()
    db.refresh(db_note)
    
    return db_note

@router.post("/{note_id}/approve", response_model=NoteResponse)
async def approve_note(
    note_approve: NoteApprove,
    note_id: str = Path(..., description="The ID of the note to approve"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Approve a clinical note, finalizing it
    """
    db_note = db.query(ClinicalNote).filter(ClinicalNote.id == note_id).first()
    
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Apply edits if provided
    if note_approve.edits:
        if "title" in note_approve.edits:
            db_note.title = note_approve.edits["title"]
        
        if "content" in note_approve.edits:
            db_note.content = note_approve.edits["content"]
    
    # Update status and approval information
    db_note.status = NoteStatus.FINAL
    db_note.approved_by = note_approve.approved_by
    db_note.approved_at = datetime.utcnow()
    
    # Save changes
    db.commit()
    db.refresh(db_note)
    
    return db_note

@router.delete("/{note_id}", response_model=Dict[str, Any])
async def delete_note(
    note_id: str = Path(..., description="The ID of the note to delete"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Soft delete a clinical note
    """
    db_note = db.query(ClinicalNote).filter(ClinicalNote.id == note_id).first()
    
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Soft delete by changing status
    db_note.status = NoteStatus.DELETED
    
    # Save changes
    db.commit()
    
    return {"message": "Note deleted successfully"}

@router.post("/generate/from-findings/{patient_id}", response_model=NoteResponse)
async def generate_note_from_findings(
    findings: Dict[str, Any] = Body(...),
    patient_id: str = Path(..., description="The patient ID to generate the note for"),
    notes_service: ClinicalNotesService = Depends(get_notes_service)
):
    """
    Generate a clinical note from diagnostic findings
    """
    note = await notes_service.generate_from_findings(patient_id, findings)
    
    # In a real implementation, save the generated note to the database
    # db_note = ClinicalNote(**note)
    # db.add(db_note)
    # db.commit()
    # db.refresh(db_note)
    
    return note

@router.post("/generate/from-procedure/{patient_id}/{procedure_id}", response_model=NoteResponse)
async def generate_note_from_procedure(
    procedure_data: Dict[str, Any] = Body(...),
    patient_id: str = Path(..., description="The patient ID to generate the note for"),
    procedure_id: str = Path(..., description="The procedure ID to generate the note from"),
    notes_service: ClinicalNotesService = Depends(get_notes_service)
):
    """
    Generate a clinical note from a completed procedure
    """
    note = await notes_service.generate_from_procedure(patient_id, procedure_id, procedure_data)
    
    # In a real implementation, save the generated note to the database
    # db_note = ClinicalNote(**note)
    # db.add(db_note)
    # db.commit()
    # db.refresh(db_note)
    
    return note

@router.post("/generate/from-treatment-plan/{patient_id}/{treatment_plan_id}", response_model=NoteResponse)
async def generate_note_from_treatment_plan(
    treatment_plan_data: Dict[str, Any] = Body(...),
    patient_id: str = Path(..., description="The patient ID to generate the note for"),
    treatment_plan_id: str = Path(..., description="The treatment plan ID to generate the note from"),
    notes_service: ClinicalNotesService = Depends(get_notes_service)
):
    """
    Generate a clinical note from a treatment plan
    """
    note = await notes_service.generate_from_treatment_plan(patient_id, treatment_plan_id, treatment_plan_data)
    
    # In a real implementation, save the generated note to the database
    # db_note = ClinicalNote(**note)
    # db.add(db_note)
    # db.commit()
    # db.refresh(db_note)
    
    return note 