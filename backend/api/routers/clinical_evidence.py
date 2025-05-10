from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional, Union
from uuid import UUID

from ..database import get_db
from ..services.clinical_evidence_service import ClinicalEvidenceService
from ..models.clinical_evidence import (
    ClinicalEvidenceCreate,
    ClinicalEvidenceResponse,
    EvidenceCitation,
    EvidenceType,
    EvidenceGrade
)
from ..auth.dependencies import get_current_user, verify_provider_role, verify_admin_role

router = APIRouter(
    prefix="/api/clinical-evidence",
    tags=["Clinical Evidence"],
    responses={404: {"description": "Not found"}}
)

@router.post("/", response_model=ClinicalEvidenceResponse)
async def create_evidence(
    evidence_data: ClinicalEvidenceCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> ClinicalEvidenceResponse:
    """
    Create a new clinical evidence entry
    
    Admin only endpoint for adding new evidence to the system
    """
    # Verify admin role for creating evidence
    verify_admin_role(current_user)
    
    service = ClinicalEvidenceService(db)
    evidence = await service.create_evidence(evidence_data)
    return ClinicalEvidenceResponse.from_orm(evidence)

@router.get("/{evidence_id}", response_model=ClinicalEvidenceResponse)
async def get_evidence(
    evidence_id: str = Path(..., description="ID of the evidence entry"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> ClinicalEvidenceResponse:
    """
    Get a clinical evidence entry by ID
    """
    # Verify provider role for accessing evidence
    verify_provider_role(current_user)
    
    service = ClinicalEvidenceService(db)
    evidence = await service.get_evidence_by_id(evidence_id)
    
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    return ClinicalEvidenceResponse.from_orm(evidence)

@router.get("/", response_model=List[ClinicalEvidenceResponse])
async def search_evidence(
    search_term: Optional[str] = Query(None, description="Text to search in title, summary, and keywords"),
    evidence_type: Optional[str] = Query(None, description="Type of evidence to filter by"),
    evidence_grade: Optional[str] = Query(None, description="Grade of evidence to filter by"),
    specialty: Optional[str] = Query(None, description="Dental specialty to filter by"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> List[ClinicalEvidenceResponse]:
    """
    Search for clinical evidence based on criteria
    """
    # Verify provider role for searching evidence
    verify_provider_role(current_user)
    
    service = ClinicalEvidenceService(db)
    evidence_list = await service.search_evidence(
        search_term=search_term,
        evidence_type=evidence_type,
        evidence_grade=evidence_grade,
        specialty=specialty,
        limit=limit,
        offset=offset
    )
    
    return [ClinicalEvidenceResponse.from_orm(e) for e in evidence_list]

@router.put("/{evidence_id}", response_model=ClinicalEvidenceResponse)
async def update_evidence(
    evidence_id: str = Path(..., description="ID of the evidence entry to update"),
    update_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> ClinicalEvidenceResponse:
    """
    Update a clinical evidence entry
    
    Admin only endpoint for updating evidence
    """
    # Verify admin role for updating evidence
    verify_admin_role(current_user)
    
    service = ClinicalEvidenceService(db)
    evidence = await service.update_evidence(evidence_id, update_data)
    
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    return ClinicalEvidenceResponse.from_orm(evidence)

@router.delete("/{evidence_id}")
async def delete_evidence(
    evidence_id: str = Path(..., description="ID of the evidence entry to delete"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, bool]:
    """
    Delete a clinical evidence entry
    
    Admin only endpoint for deleting evidence
    """
    # Verify admin role for deleting evidence
    verify_admin_role(current_user)
    
    service = ClinicalEvidenceService(db)
    success = await service.delete_evidence(evidence_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    return {"success": True}

@router.post("/associate/finding")
async def associate_finding(
    finding_type: str = Body(..., embed=True),
    evidence_id: str = Body(..., embed=True),
    relevance_score: float = Body(0.7, ge=0.0, le=1.0, embed=True),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, bool]:
    """
    Associate a finding type with evidence
    
    Admin only endpoint for creating associations
    """
    # Verify admin role for creating associations
    verify_admin_role(current_user)
    
    service = ClinicalEvidenceService(db)
    success = await service.associate_finding_with_evidence(
        finding_type=finding_type,
        evidence_id=evidence_id,
        relevance_score=relevance_score
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Could not create association")
    
    return {"success": True}

@router.post("/associate/treatment")
async def associate_treatment(
    procedure_code: str = Body(..., embed=True),
    evidence_id: str = Body(..., embed=True),
    relevance_score: float = Body(0.7, ge=0.0, le=1.0, embed=True),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, bool]:
    """
    Associate a treatment procedure with evidence
    
    Admin only endpoint for creating associations
    """
    # Verify admin role for creating associations
    verify_admin_role(current_user)
    
    service = ClinicalEvidenceService(db)
    success = await service.associate_treatment_with_evidence(
        procedure_code=procedure_code,
        evidence_id=evidence_id,
        relevance_score=relevance_score
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Could not create association")
    
    return {"success": True}

@router.get("/finding/{finding_type}")
async def get_evidence_for_finding(
    finding_type: str = Path(..., description="Type of finding to get evidence for"),
    specialty: Optional[str] = Query(None, description="Optional specialty to filter by"),
    limit: int = Query(5, ge=1, le=50, description="Maximum number of results to return"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Get evidence associated with a finding type
    """
    # Verify provider role for accessing evidence
    verify_provider_role(current_user)
    
    service = ClinicalEvidenceService(db)
    return await service.get_evidence_for_finding(
        finding_type=finding_type,
        specialty=specialty,
        limit=limit
    )

@router.get("/treatment/{procedure_code}")
async def get_evidence_for_treatment(
    procedure_code: str = Path(..., description="Procedure code to get evidence for"),
    finding_type: Optional[str] = Query(None, description="Optional finding type to filter by"),
    specialty: Optional[str] = Query(None, description="Optional specialty to filter by"),
    limit: int = Query(5, ge=1, le=50, description="Maximum number of results to return"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Get evidence associated with a treatment procedure
    """
    # Verify provider role for accessing evidence
    verify_provider_role(current_user)
    
    service = ClinicalEvidenceService(db)
    return await service.get_evidence_for_treatment(
        procedure_code=procedure_code,
        finding_type=finding_type,
        specialty=specialty,
        limit=limit
    )

@router.get("/citations/{finding_type}/{procedure_code}")
async def get_citations_for_suggestion(
    finding_type: str = Path(..., description="Type of finding"),
    procedure_code: str = Path(..., description="Procedure code"),
    specialty: Optional[str] = Query(None, description="Optional specialty to filter by"),
    limit: int = Query(3, ge=1, le=10, description="Maximum number of citations"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> List[EvidenceCitation]:
    """
    Get formatted citations for a treatment suggestion
    """
    # Verify provider role for accessing citations
    verify_provider_role(current_user)
    
    service = ClinicalEvidenceService(db)
    return await service.get_citations_for_suggestion(
        finding_type=finding_type,
        procedure_code=procedure_code,
        specialty=specialty,
        limit=limit
    )

@router.post("/seed")
async def seed_initial_evidence(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Seed the database with initial evidence entries
    
    Admin only endpoint for initializing the evidence database
    """
    # Verify admin role for seeding evidence
    verify_admin_role(current_user)
    
    service = ClinicalEvidenceService(db)
    evidence_list = await service.seed_initial_evidence()
    
    return {
        "message": f"Successfully seeded {len(evidence_list)} evidence entries",
        "count": len(evidence_list)
    } 