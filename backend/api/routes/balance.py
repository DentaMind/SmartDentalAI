from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from decimal import Decimal
from ..services.balance_service import balance_service, PatientBalance, BalanceEntry

router = APIRouter()

class BalanceEntryCreate(BaseModel):
    amount: Decimal
    type: str
    reference_id: str
    description: str

class BalanceEntryUpdate(BaseModel):
    status: str

class BalanceEntryResponse(BaseModel):
    id: str
    patient_id: str
    amount: Decimal
    type: str
    reference_id: str
    date: str
    description: str
    status: str

    class Config:
        orm_mode = True

class PatientBalanceResponse(BaseModel):
    patient_id: str
    current_balance: Decimal
    pending_charges: Decimal
    pending_payments: Decimal
    last_updated: str
    entries: List[BalanceEntryResponse]

    class Config:
        orm_mode = True

@router.get("/patients/{patient_id}/balance", response_model=PatientBalanceResponse)
async def get_patient_balance(patient_id: str):
    """Get a patient's current balance."""
    balance = balance_service.get_balance(patient_id)
    if not balance:
        raise HTTPException(status_code=404, detail="Patient balance not found")
    return balance

@router.post("/patients/{patient_id}/charges", response_model=BalanceEntryResponse)
async def add_charge(patient_id: str, charge: BalanceEntryCreate):
    """Add a charge to a patient's balance."""
    try:
        balance_service.add_charge(
            patient_id=patient_id,
            amount=charge.amount,
            reference_id=charge.reference_id,
            description=charge.description
        )
        # Return the latest entry
        balance = balance_service.get_balance(patient_id)
        if not balance or not balance.entries:
            raise HTTPException(status_code=500, detail="Failed to create charge")
        return balance.entries[-1]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/patients/{patient_id}/payments", response_model=BalanceEntryResponse)
async def add_payment(patient_id: str, payment: BalanceEntryCreate):
    """Add a payment to a patient's balance."""
    try:
        balance_service.add_payment(
            patient_id=patient_id,
            amount=payment.amount,
            reference_id=payment.reference_id,
            description=payment.description
        )
        # Return the latest entry
        balance = balance_service.get_balance(patient_id)
        if not balance or not balance.entries:
            raise HTTPException(status_code=500, detail="Failed to create payment")
        return balance.entries[-1]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/patients/{patient_id}/insurance-estimates", response_model=BalanceEntryResponse)
async def add_insurance_estimate(patient_id: str, estimate: BalanceEntryCreate):
    """Add an insurance estimate to a patient's balance."""
    try:
        balance_service.add_insurance_estimate(
            patient_id=patient_id,
            amount=estimate.amount,
            reference_id=estimate.reference_id,
            description=estimate.description
        )
        # Return the latest entry
        balance = balance_service.get_balance(patient_id)
        if not balance or not balance.entries:
            raise HTTPException(status_code=500, detail="Failed to create insurance estimate")
        return balance.entries[-1]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/patients/{patient_id}/entries/{entry_id}", response_model=BalanceEntryResponse)
async def update_entry_status(patient_id: str, entry_id: str, update: BalanceEntryUpdate):
    """Update the status of a balance entry."""
    try:
        balance_service.update_entry_status(patient_id, entry_id, update.status)
        # Return the updated entry
        balance = balance_service.get_balance(patient_id)
        if not balance:
            raise HTTPException(status_code=404, detail="Patient balance not found")
        for entry in balance.entries:
            if entry.id == entry_id:
                return entry
        raise HTTPException(status_code=404, detail="Entry not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/patients/{patient_id}/balance-history", response_model=List[BalanceEntryResponse])
async def get_balance_history(patient_id: str):
    """Get the complete balance history for a patient."""
    entries = balance_service.get_balance_history(patient_id)
    if not entries:
        raise HTTPException(status_code=404, detail="No balance history found")
    return entries 