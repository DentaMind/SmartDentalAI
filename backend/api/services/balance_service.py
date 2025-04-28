from datetime import datetime
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, asdict
import json
import os
import logging
from decimal import Decimal

@dataclass
class BalanceEntry:
    id: str
    patient_id: str
    amount: Decimal
    type: str  # 'charge', 'payment', 'adjustment', 'insurance'
    reference_id: str  # treatment_plan_id, payment_id, etc.
    date: str
    description: str
    status: str  # 'pending', 'completed', 'cancelled'

@dataclass
class PatientBalance:
    patient_id: str
    current_balance: Decimal
    pending_charges: Decimal
    pending_payments: Decimal
    last_updated: str
    entries: List[BalanceEntry]

class BalanceService:
    def __init__(self):
        self.balances: Dict[str, PatientBalance] = {}
        self.storage_file = "patient_balances.json"
        self.load_balances()

    def load_balances(self) -> None:
        """Load patient balances from storage file."""
        try:
            if os.path.exists(self.storage_file):
                with open(self.storage_file, 'r') as f:
                    data = json.load(f)
                    for patient_id, balance_data in data.items():
                        entries = [
                            BalanceEntry(**entry_data)
                            for entry_data in balance_data['entries']
                        ]
                        self.balances[patient_id] = PatientBalance(
                            patient_id=patient_id,
                            current_balance=Decimal(str(balance_data['current_balance'])),
                            pending_charges=Decimal(str(balance_data['pending_charges'])),
                            pending_payments=Decimal(str(balance_data['pending_payments'])),
                            last_updated=balance_data['last_updated'],
                            entries=entries
                        )
        except Exception as e:
            logging.error(f"Error loading patient balances: {e}")

    def save_balances(self) -> None:
        """Save patient balances to storage file."""
        try:
            data = {
                patient_id: {
                    'current_balance': str(balance.current_balance),
                    'pending_charges': str(balance.pending_charges),
                    'pending_payments': str(balance.pending_payments),
                    'last_updated': balance.last_updated,
                    'entries': [asdict(entry) for entry in balance.entries]
                }
                for patient_id, balance in self.balances.items()
            }
            with open(self.storage_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logging.error(f"Error saving patient balances: {e}")

    def get_balance(self, patient_id: str) -> Optional[PatientBalance]:
        """Get a patient's current balance."""
        return self.balances.get(patient_id)

    def add_charge(self, patient_id: str, amount: Decimal, reference_id: str, description: str) -> None:
        """Add a charge to a patient's balance."""
        if patient_id not in self.balances:
            self.balances[patient_id] = PatientBalance(
                patient_id=patient_id,
                current_balance=Decimal('0'),
                pending_charges=Decimal('0'),
                pending_payments=Decimal('0'),
                last_updated=datetime.now().isoformat(),
                entries=[]
            )

        balance = self.balances[patient_id]
        entry = BalanceEntry(
            id=str(len(balance.entries) + 1),
            patient_id=patient_id,
            amount=amount,
            type='charge',
            reference_id=reference_id,
            date=datetime.now().isoformat(),
            description=description,
            status='pending'
        )

        balance.entries.append(entry)
        balance.pending_charges += amount
        balance.current_balance += amount
        balance.last_updated = datetime.now().isoformat()
        self.save_balances()

    def add_payment(self, patient_id: str, amount: Decimal, reference_id: str, description: str) -> None:
        """Add a payment to a patient's balance."""
        if patient_id not in self.balances:
            self.balances[patient_id] = PatientBalance(
                patient_id=patient_id,
                current_balance=Decimal('0'),
                pending_charges=Decimal('0'),
                pending_payments=Decimal('0'),
                last_updated=datetime.now().isoformat(),
                entries=[]
            )

        balance = self.balances[patient_id]
        entry = BalanceEntry(
            id=str(len(balance.entries) + 1),
            patient_id=patient_id,
            amount=amount,
            type='payment',
            reference_id=reference_id,
            date=datetime.now().isoformat(),
            description=description,
            status='pending'
        )

        balance.entries.append(entry)
        balance.pending_payments += amount
        balance.current_balance -= amount
        balance.last_updated = datetime.now().isoformat()
        self.save_balances()

    def add_insurance_estimate(self, patient_id: str, amount: Decimal, reference_id: str, description: str) -> None:
        """Add an insurance estimate to a patient's balance."""
        if patient_id not in self.balances:
            self.balances[patient_id] = PatientBalance(
                patient_id=patient_id,
                current_balance=Decimal('0'),
                pending_charges=Decimal('0'),
                pending_payments=Decimal('0'),
                last_updated=datetime.now().isoformat(),
                entries=[]
            )

        balance = self.balances[patient_id]
        entry = BalanceEntry(
            id=str(len(balance.entries) + 1),
            patient_id=patient_id,
            amount=amount,
            type='insurance',
            reference_id=reference_id,
            date=datetime.now().isoformat(),
            description=description,
            status='pending'
        )

        balance.entries.append(entry)
        balance.current_balance -= amount
        balance.last_updated = datetime.now().isoformat()
        self.save_balances()

    def update_entry_status(self, patient_id: str, entry_id: str, new_status: str) -> None:
        """Update the status of a balance entry."""
        if patient_id not in self.balances:
            return

        balance = self.balances[patient_id]
        for entry in balance.entries:
            if entry.id == entry_id:
                if entry.status != new_status:
                    if entry.type == 'charge':
                        if new_status == 'completed':
                            balance.pending_charges -= entry.amount
                        elif entry.status == 'completed':
                            balance.pending_charges += entry.amount
                    elif entry.type == 'payment':
                        if new_status == 'completed':
                            balance.pending_payments -= entry.amount
                        elif entry.status == 'completed':
                            balance.pending_payments += entry.amount
                    entry.status = new_status
                    balance.last_updated = datetime.now().isoformat()
                    self.save_balances()
                break

    def get_balance_history(self, patient_id: str) -> List[BalanceEntry]:
        """Get the complete balance history for a patient."""
        if patient_id not in self.balances:
            return []
        return self.balances[patient_id].entries

# Create a singleton instance
balance_service = BalanceService() 