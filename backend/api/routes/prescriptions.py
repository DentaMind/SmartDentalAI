from fastapi import APIRouter, HTTPException, Depends
from typing import List
from ..services.prescription_service import prescription_service
from ..models.prescriptions import Prescription, PrescriptionCreate, PrescriptionUpdate
from ..auth.auth import get_current_user

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])

@router.post("/", response_model=Prescription)
async def create_prescription(
    data: PrescriptionCreate,
    current_user: dict = Depends(get_current_user)
):
    try:
        return prescription_service.create_prescription(current_user["id"], data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{prescription_id}", response_model=Prescription)
async def update_prescription(
    prescription_id: str,
    data: PrescriptionUpdate,
    current_user: dict = Depends(get_current_user)
):
    prescription = prescription_service.update_prescription(prescription_id, data)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return prescription

@router.get("/{prescription_id}", response_model=Prescription)
async def get_prescription(
    prescription_id: str,
    current_user: dict = Depends(get_current_user)
):
    prescription = prescription_service.get_prescription(prescription_id)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return prescription

@router.get("/patient/{patient_id}", response_model=List[Prescription])
async def get_patient_prescriptions(
    patient_id: str,
    current_user: dict = Depends(get_current_user)
):
    return prescription_service.get_patient_prescriptions(patient_id)

@router.get("/case/{case_id}", response_model=List[Prescription])
async def get_case_prescriptions(
    case_id: str,
    current_user: dict = Depends(get_current_user)
):
    return prescription_service.get_case_prescriptions(case_id)

@router.get("/", response_model=List[Prescription])
async def get_all_prescriptions(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return prescription_service.get_all_prescriptions() 