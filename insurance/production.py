"""
Production tracking module for monitoring billing, collections, and payments.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum

class PaymentStatus(Enum):
    PENDING = "pending"
    SUBMITTED = "submitted"
    PAID = "paid"
    DENIED = "denied"
    PARTIAL = "partial"

@dataclass
class Payment:
    amount: float
    date: datetime
    source: str  # "insurance" or "patient"
    method: str  # "cash", "card", "check", etc.
    reference: Optional[str] = None  # Payment reference number
    notes: Optional[str] = None

@dataclass
class ProductionItem:
    cdt_code: str
    description: str
    tooth_number: Optional[str]
    quadrant: Optional[int]
    date_of_service: datetime
    provider_id: str
    total_fee: float
    insurance_portion: float
    patient_portion: float
    requires_preauth: bool
    status: PaymentStatus = PaymentStatus.PENDING
    payments: List[Payment] = None
    
    def __post_init__(self):
        self.payments = self.payments or []
    
    @property
    def total_paid(self) -> float:
        """Calculate total amount paid"""
        return sum(payment.amount for payment in self.payments)
    
    @property
    def balance_due(self) -> float:
        """Calculate remaining balance"""
        return self.total_fee - self.total_paid
    
    @property
    def insurance_paid(self) -> float:
        """Calculate amount paid by insurance"""
        return sum(p.amount for p in self.payments if p.source == "insurance")
    
    @property
    def patient_paid(self) -> float:
        """Calculate amount paid by patient"""
        return sum(p.amount for p in self.payments if p.source == "patient")
    
    def add_payment(self, payment: Payment):
        """Add a payment to this production item"""
        self.payments.append(payment)
        
        # Update payment status
        if self.total_paid >= self.total_fee:
            self.status = PaymentStatus.PAID
        elif self.total_paid > 0:
            self.status = PaymentStatus.PARTIAL
            
class ProductionTracker:
    def __init__(self):
        self.items: List[ProductionItem] = []
        
    def add_item(self, item: ProductionItem):
        """Add a production item to track"""
        self.items.append(item)
        
    def get_items_by_status(self, status: PaymentStatus) -> List[ProductionItem]:
        """Get all items with a specific payment status"""
        return [item for item in self.items if item.status == status]
    
    def get_items_by_date_range(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> List[ProductionItem]:
        """Get all items within a date range"""
        return [
            item for item in self.items
            if start_date <= item.date_of_service <= end_date
        ]
    
    def get_production_summary(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        provider_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a production summary for a date range
        
        Args:
            start_date: Optional start date filter
            end_date: Optional end date filter
            provider_id: Optional provider filter
            
        Returns:
            Dictionary with production summary statistics
        """
        # Filter items
        items = self.items
        if start_date and end_date:
            items = self.get_items_by_date_range(start_date, end_date)
        if provider_id:
            items = [item for item in items if item.provider_id == provider_id]
            
        # Calculate totals
        total_production = sum(item.total_fee for item in items)
        total_collected = sum(item.total_paid for item in items)
        insurance_collected = sum(item.insurance_paid for item in items)
        patient_collected = sum(item.patient_paid for item in items)
        
        # Group by status
        by_status = {
            status: len([i for i in items if i.status == status])
            for status in PaymentStatus
        }
        
        # Calculate aging buckets (0-30, 31-60, 61-90, 90+ days)
        now = datetime.now()
        aging = {
            "0-30": 0.0,
            "31-60": 0.0,
            "61-90": 0.0,
            "90+": 0.0
        }
        
        for item in items:
            if item.balance_due > 0:
                days = (now - item.date_of_service).days
                if days <= 30:
                    aging["0-30"] += item.balance_due
                elif days <= 60:
                    aging["31-60"] += item.balance_due
                elif days <= 90:
                    aging["61-90"] += item.balance_due
                else:
                    aging["90+"] += item.balance_due
        
        return {
            "total_production": round(total_production, 2),
            "total_collected": round(total_collected, 2),
            "collection_rate": round((total_collected / total_production * 100), 1) if total_production > 0 else 0,
            "insurance_collected": round(insurance_collected, 2),
            "patient_collected": round(patient_collected, 2),
            "outstanding_balance": round(total_production - total_collected, 2),
            "status_counts": by_status,
            "aging": {k: round(v, 2) for k, v in aging.items()},
            "items_count": len(items)
        }
    
    def generate_claims_report(self) -> List[Dict[str, Any]]:
        """Generate a report of all insurance claims"""
        claims = []
        for item in self.items:
            if item.insurance_portion > 0:
                claims.append({
                    "cdt_code": item.cdt_code,
                    "description": item.description,
                    "tooth_number": item.tooth_number,
                    "quadrant": item.quadrant,
                    "date_of_service": item.date_of_service,
                    "provider_id": item.provider_id,
                    "total_fee": item.total_fee,
                    "insurance_portion": item.insurance_portion,
                    "insurance_paid": item.insurance_paid,
                    "status": item.status.value,
                    "requires_preauth": item.requires_preauth
                })
        return claims 