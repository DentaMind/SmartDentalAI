from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from ..services.case_service import case_service, CaseStatus
from ..models.case import Case, AIAnalysis, DoctorAnalysis
from ..auth.auth import get_current_user

router = APIRouter(prefix="/cases", tags=["cases"])

@router.post("/", response_model=Case)
async def create_case(
    patient_id: str,
    title: str,
    description: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        return case_service.create_case(
            patient_id=patient_id,
            title=title,
            description=description,
            doctor_id=current_user["id"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{case_id}/ai-analysis/start", response_model=Case)
async def start_ai_analysis(
    case_id: str,
    current_user: dict = Depends(get_current_user)
):
    case = case_service.start_ai_analysis(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.post("/{case_id}/ai-analysis", response_model=Case)
async def update_ai_analysis(
    case_id: str,
    diagnosis: str,
    confidence: float,
    suggestions: List[str],
    current_user: dict = Depends(get_current_user)
):
    case = case_service.update_ai_analysis(
        case_id=case_id,
        diagnosis=diagnosis,
        confidence=confidence,
        suggestions=suggestions
    )
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.post("/{case_id}/doctor-analysis", response_model=Case)
async def submit_doctor_analysis(
    case_id: str,
    diagnosis: str,
    treatment_plan: str,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    case = case_service.submit_doctor_analysis(
        case_id=case_id,
        diagnosis=diagnosis,
        treatment_plan=treatment_plan,
        notes=notes
    )
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.get("/{case_id}", response_model=Case)
async def get_case(
    case_id: str,
    current_user: dict = Depends(get_current_user)
):
    case = case_service.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.get("/doctor", response_model=List[Case])
async def get_doctor_cases(current_user: dict = Depends(get_current_user)):
    return case_service.get_doctor_cases(current_user["id"])

@router.get("/", response_model=List[Case])
async def get_all_cases(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return case_service.get_all_cases() 