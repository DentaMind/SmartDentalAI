from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from ..services.research_service import research_service, ResearchMode, SuggestionAction
from ..models.research import ResearchEncounter, AISuggestion
from ..auth.auth import get_current_user

router = APIRouter(prefix="/research", tags=["research"])

@router.post("/encounters", response_model=ResearchEncounter)
async def start_encounter(
    patient_id: str,
    mode: ResearchMode,
    current_user: dict = Depends(get_current_user)
):
    try:
        return research_service.start_encounter(
            patient_id=patient_id,
            doctor_id=current_user["id"],
            mode=mode
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/encounters/{encounter_id}/end", response_model=ResearchEncounter)
async def end_encounter(
    encounter_id: str,
    patient_acceptance: bool,
    current_user: dict = Depends(get_current_user)
):
    encounter = research_service.end_encounter(encounter_id, patient_acceptance)
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    return encounter

@router.put("/encounters/{encounter_id}/diagnosis", response_model=ResearchEncounter)
async def submit_diagnosis(
    encounter_id: str,
    diagnosis: str,
    treatment_plan: str,
    confidence: float,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    encounter = research_service.submit_diagnosis(
        encounter_id=encounter_id,
        diagnosis=diagnosis,
        treatment_plan=treatment_plan,
        confidence=confidence,
        notes=notes
    )
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    return encounter

@router.post("/encounters/{encounter_id}/suggestions", response_model=ResearchEncounter)
async def add_suggestion(
    encounter_id: str,
    suggestion_type: str,
    action: SuggestionAction,
    current_user: dict = Depends(get_current_user)
):
    encounter = research_service.add_ai_suggestion(
        encounter_id=encounter_id,
        suggestion_type=suggestion_type,
        action=action
    )
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")
    return encounter

@router.get("/encounters/doctor", response_model=List[ResearchEncounter])
async def get_doctor_encounters(current_user: dict = Depends(get_current_user)):
    return research_service.get_doctor_encounters(current_user["id"])

@router.get("/encounters", response_model=List[ResearchEncounter])
async def get_all_encounters(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return research_service.get_all_encounters()

@router.get("/metrics/doctor")
async def get_doctor_metrics(current_user: dict = Depends(get_current_user)):
    return research_service.get_research_metrics(current_user["id"])

@router.get("/metrics")
async def get_all_metrics(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return {
        "total_encounters": len(research_service.get_all_encounters()),
        "active_encounters": len([
            enc for enc in research_service.get_all_encounters()
            if not enc.end_time
        ])
    } 