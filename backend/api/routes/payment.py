from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from ..services.payment_service import payment_service, PaymentStatus, PaymentMethod, PaymentPlan, Payment

router = APIRouter()

class PaymentPlanCreate(BaseModel):
    patient_id: str
    treatment_plan_id: str
    total_amount: float
    monthly_payment: float
    start_date: str
    notes: Optional[str] = None

class PaymentCreate(BaseModel):
    payment_plan_id: str
    amount: float
    method: PaymentMethod
    reference: str
    notes: Optional[str] = None

class PaymentPlanResponse(BaseModel):
    id: str
    patient_id: str
    treatment_plan_id: str
    total_amount: float
    remaining_balance: float
    monthly_payment: float
    start_date: str
    end_date: str
    status: PaymentStatus
    payments: List[dict]
    notes: Optional[str] = None

    class Config:
        orm_mode = True

@router.post("/payment-plans", response_model=PaymentPlanResponse)
async def create_payment_plan(plan: PaymentPlanCreate):
    """Create a new payment plan."""
    try:
        payment_plan = payment_service.create_payment_plan(
            patient_id=plan.patient_id,
            treatment_plan_id=plan.treatment_plan_id,
            total_amount=plan.total_amount,
            monthly_payment=plan.monthly_payment,
            start_date=plan.start_date,
            notes=plan.notes
        )
        return payment_plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/payments", response_model=Payment)
async def add_payment(payment: PaymentCreate):
    """Add a payment to a payment plan."""
    try:
        new_payment = payment_service.add_payment(
            payment_plan_id=payment.payment_plan_id,
            amount=payment.amount,
            method=payment.method,
            reference=payment.reference,
            notes=payment.notes
        )
        return new_payment
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/payment-plans/{plan_id}", response_model=PaymentPlanResponse)
async def get_payment_plan(plan_id: str):
    """Get a specific payment plan by ID."""
    plan = payment_service.get_payment_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Payment plan not found")
    return plan

@router.get("/patients/{patient_id}/payment-plans", response_model=List[PaymentPlanResponse])
async def get_patient_payment_plans(patient_id: str):
    """Get all payment plans for a specific patient."""
    return payment_service.get_patient_payment_plans(patient_id)

@router.get("/treatment-plans/{treatment_plan_id}/payment-plans", response_model=List[PaymentPlanResponse])
async def get_treatment_plan_payment_plans(treatment_plan_id: str):
    """Get all payment plans for a specific treatment plan."""
    return payment_service.get_treatment_plan_payment_plans(treatment_plan_id)

@router.put("/payment-plans/{plan_id}/status", response_model=PaymentPlanResponse)
async def update_payment_plan_status(plan_id: str, status: PaymentStatus):
    """Update the status of a payment plan."""
    plan = payment_service.update_payment_plan_status(plan_id, status)
    if not plan:
        raise HTTPException(status_code=404, detail="Payment plan not found")
    return plan

@router.get("/payment-plans", response_model=List[PaymentPlanResponse])
async def get_all_payment_plans():
    """Get all payment plans."""
    return payment_service.get_all_payment_plans()

@router.get("/payment-plans/status/{status}", response_model=List[PaymentPlanResponse])
async def get_payment_plans_by_status(status: PaymentStatus):
    """Get all payment plans with a specific status."""
    return payment_service.get_payment_plans_by_status(status) 