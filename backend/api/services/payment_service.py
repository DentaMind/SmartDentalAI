from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from dataclasses import dataclass, asdict
import json
import os
import logging

class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    PAID = "PAID"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"

class PaymentMethod(str, Enum):
    CASH = "CASH"
    CREDIT_CARD = "CREDIT_CARD"
    CHECK = "CHECK"
    INSURANCE = "INSURANCE"
    FINANCING = "FINANCING"

@dataclass
class Payment:
    id: str
    payment_plan_id: str
    amount: float
    date: str
    method: PaymentMethod
    reference: str
    status: PaymentStatus
    notes: Optional[str] = None

@dataclass
class PaymentPlan:
    id: str
    patient_id: str
    treatment_plan_id: str
    total_amount: float
    remaining_balance: float
    monthly_payment: float
    start_date: str
    end_date: str
    status: PaymentStatus
    payments: List[Payment]
    notes: Optional[str] = None

class PaymentService:
    def __init__(self):
        self.payment_plans: Dict[str, PaymentPlan] = {}
        self.storage_file = "payment_plans.json"
        self.load_payment_plans()

    def load_payment_plans(self) -> None:
        """Load payment plans from storage file."""
        try:
            if os.path.exists(self.storage_file):
                with open(self.storage_file, 'r') as f:
                    data = json.load(f)
                    for plan_id, plan_data in data.items():
                        payments = [
                            Payment(**payment_data)
                            for payment_data in plan_data['payments']
                        ]
                        self.payment_plans[plan_id] = PaymentPlan(
                            **{k: v for k, v in plan_data.items() if k != 'payments'},
                            payments=payments
                        )
        except Exception as e:
            logging.error(f"Error loading payment plans: {e}")

    def save_payment_plans(self) -> None:
        """Save payment plans to storage file."""
        try:
            data = {
                plan_id: {
                    **asdict(plan),
                    'payments': [asdict(payment) for payment in plan.payments]
                }
                for plan_id, plan in self.payment_plans.items()
            }
            with open(self.storage_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logging.error(f"Error saving payment plans: {e}")

    def create_payment_plan(
        self,
        patient_id: str,
        treatment_plan_id: str,
        total_amount: float,
        monthly_payment: float,
        start_date: str,
        notes: Optional[str] = None
    ) -> PaymentPlan:
        """Create a new payment plan."""
        plan_id = str(len(self.payment_plans) + 1)
        now = datetime.now().isoformat()
        
        # Calculate end date (assuming monthly payments)
        number_of_payments = total_amount / monthly_payment
        end_date = datetime.fromisoformat(start_date)
        end_date = end_date.replace(month=end_date.month + int(number_of_payments))
        
        plan = PaymentPlan(
            id=plan_id,
            patient_id=patient_id,
            treatment_plan_id=treatment_plan_id,
            total_amount=total_amount,
            remaining_balance=total_amount,
            monthly_payment=monthly_payment,
            start_date=start_date,
            end_date=end_date.isoformat(),
            status=PaymentStatus.PENDING,
            payments=[],
            notes=notes
        )
        
        self.payment_plans[plan_id] = plan
        self.save_payment_plans()
        return plan

    def add_payment(
        self,
        payment_plan_id: str,
        amount: float,
        method: PaymentMethod,
        reference: str,
        notes: Optional[str] = None
    ) -> Payment:
        """Add a payment to a payment plan."""
        plan = self.payment_plans.get(payment_plan_id)
        if not plan:
            raise ValueError("Payment plan not found")

        payment_id = str(len(plan.payments) + 1)
        now = datetime.now().isoformat()
        
        payment = Payment(
            id=payment_id,
            payment_plan_id=payment_plan_id,
            amount=amount,
            date=now,
            method=method,
            reference=reference,
            status=PaymentStatus.PAID,
            notes=notes
        )
        
        plan.payments.append(payment)
        plan.remaining_balance -= amount
        
        # Update plan status
        if plan.remaining_balance <= 0:
            plan.status = PaymentStatus.PAID
        elif plan.remaining_balance < plan.total_amount:
            plan.status = PaymentStatus.PARTIALLY_PAID
        
        self.save_payment_plans()
        return payment

    def get_payment_plan(self, plan_id: str) -> Optional[PaymentPlan]:
        """Get a payment plan by ID."""
        return self.payment_plans.get(plan_id)

    def get_patient_payment_plans(self, patient_id: str) -> List[PaymentPlan]:
        """Get all payment plans for a patient."""
        return [
            plan for plan in self.payment_plans.values()
            if plan.patient_id == patient_id
        ]

    def get_treatment_plan_payment_plans(self, treatment_plan_id: str) -> List[PaymentPlan]:
        """Get all payment plans for a treatment plan."""
        return [
            plan for plan in self.payment_plans.values()
            if plan.treatment_plan_id == treatment_plan_id
        ]

    def update_payment_plan_status(self, plan_id: str, status: PaymentStatus) -> Optional[PaymentPlan]:
        """Update the status of a payment plan."""
        plan = self.payment_plans.get(plan_id)
        if not plan:
            return None

        plan.status = status
        self.save_payment_plans()
        return plan

    def get_all_payment_plans(self) -> List[PaymentPlan]:
        """Get all payment plans."""
        return list(self.payment_plans.values())

    def get_payment_plans_by_status(self, status: PaymentStatus) -> List[PaymentPlan]:
        """Get all payment plans with a specific status."""
        return [
            plan for plan in self.payment_plans.values()
            if plan.status == status
        ]

# Create a singleton instance
payment_service = PaymentService() 