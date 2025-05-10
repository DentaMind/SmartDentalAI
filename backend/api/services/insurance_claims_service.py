from datetime import datetime
from typing import List, Dict, Any, Optional
from decimal import Decimal
import json
import os
import logging
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
from ..models.claims import InsuranceClaim, ClaimStatus, ClaimAppeal
from ..models.treatment_plans import TreatmentPlan, TreatmentPlanStatus
from .treatment_plan_converter import TreatmentPlanConverter

logger = logging.getLogger(__name__)

class ClaimType(Enum):
    INITIAL = "INITIAL"
    SUPPLEMENTAL = "SUPPLEMENTAL"
    CORRECTION = "CORRECTION"
    APPEAL = "APPEAL"

@dataclass
class ClaimProcedure:
    procedure_code: str
    description: str
    tooth_number: Optional[str]
    surface: Optional[str]
    fee: Decimal
    date_of_service: str
    provider_id: str
    notes: Optional[str] = None

@dataclass
class InsuranceClaim:
    id: str
    patient_id: str
    treatment_plan_id: str
    insurance_provider_id: str
    claim_type: ClaimType
    status: ClaimStatus
    procedures: List[ClaimProcedure]
    total_amount: Decimal
    submitted_date: Optional[str]
    received_date: Optional[str]
    processed_date: Optional[str]
    paid_date: Optional[str]
    paid_amount: Optional[Decimal]
    denial_reason: Optional[str]
    appeal_date: Optional[str]
    appeal_status: Optional[str]
    notes: Optional[str]
    created_at: str
    updated_at: str

class InsuranceClaimsService:
    def __init__(self, storage_file: str = "insurance_claims.json"):
        self.storage_file = storage_file
        self.claims = self._load_claims()

    def _load_claims(self) -> List[InsuranceClaim]:
        """Load claims from storage file"""
        try:
            with open(self.storage_file, 'r') as f:
                data = json.load(f)
                return [InsuranceClaim(**claim) for claim in data]
        except FileNotFoundError:
            return []
        except Exception as e:
            logger.error(f"Error loading claims: {e}")
            return []

    def _save_claims(self):
        """Save claims to storage file"""
        try:
            with open(self.storage_file, 'w') as f:
                json.dump([claim.dict() for claim in self.claims], f, default=str)
        except Exception as e:
            logger.error(f"Error saving claims: {e}")
            raise

    async def create_claim_from_treatment_plan(
        self,
        treatment_plan: TreatmentPlan,
        insurance_provider_id: str,
        claim_number: Optional[str] = None
    ) -> InsuranceClaim:
        """Create a new claim from a treatment plan"""
        # Validate treatment plan
        if not TreatmentPlanConverter.validate_treatment_plan_for_claim(treatment_plan):
            raise ValueError("Treatment plan cannot be converted to a claim")

        # Convert treatment plan to claim
        claim = TreatmentPlanConverter.convert_to_claim(
            treatment_plan,
            insurance_provider_id,
            claim_number
        )

        # Save the claim
        self.claims.append(claim)
        self._save_claims()
        return claim

    async def get_claims(
        self,
        status: Optional[ClaimStatus] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        search_text: Optional[str] = None
    ) -> List[InsuranceClaim]:
        """Get all claims with optional filtering"""
        filtered_claims = self.claims

        if status:
            filtered_claims = [c for c in filtered_claims if c.status == status]

        if start_date:
            filtered_claims = [c for c in filtered_claims if c.submission_date >= start_date]

        if end_date:
            filtered_claims = [c for c in filtered_claims if c.submission_date <= end_date]

        if search_text:
            search_text = search_text.lower()
            filtered_claims = [
                c for c in filtered_claims
                if search_text in c.claim_number.lower() or
                search_text in c.patient_name.lower()
            ]

        return filtered_claims

    async def get_claim(self, claim_id: str) -> Optional[InsuranceClaim]:
        """Get a single claim by ID"""
        for claim in self.claims:
            if claim.id == claim_id:
                return claim
        return None

    async def create_claim(self, claim_data: InsuranceClaim) -> InsuranceClaim:
        """Create a new claim"""
        # Generate a new ID if not provided
        if not claim_data.id:
            claim_data.id = str(uuid.uuid4())

        # Set submission date if not provided
        if not claim_data.submission_date:
            claim_data.submission_date = datetime.now()

        # Set initial status if not provided
        if not claim_data.status:
            claim_data.status = ClaimStatus.SUBMITTED

        self.claims.append(claim_data)
        self._save_claims()
        return claim_data

    async def submit_claim(self, claim_id: str) -> InsuranceClaim:
        """Submit a claim for processing"""
        claim = await self.get_claim(claim_id)
        if not claim:
            raise ValueError("Claim not found")

        claim.status = ClaimStatus.SUBMITTED
        claim.submission_date = datetime.now()
        self._save_claims()
        return claim

    async def update_claim_status(
        self,
        claim_id: str,
        status: ClaimStatus,
        payment_amount: Optional[float] = None,
        denial_reason: Optional[str] = None
    ) -> InsuranceClaim:
        """Update claim status"""
        claim = await self.get_claim(claim_id)
        if not claim:
            raise ValueError("Claim not found")

        claim.status = status
        if status == ClaimStatus.PAID and payment_amount:
            claim.payment_amount = payment_amount
            claim.payment_date = datetime.now()
        elif status == ClaimStatus.DENIED:
            claim.denial_reason = denial_reason

        self._save_claims()
        return claim

    async def appeal_claim(self, claim_id: str, appeal: ClaimAppeal) -> InsuranceClaim:
        """Submit an appeal for a denied claim"""
        claim = await self.get_claim(claim_id)
        if not claim:
            raise ValueError("Claim not found")

        if claim.status != ClaimStatus.DENIED:
            raise ValueError("Only denied claims can be appealed")

        claim.status = ClaimStatus.APPEALED
        claim.appeal_reason = appeal.reason
        claim.appeal_date = datetime.now()
        self._save_claims()
        return claim

    async def get_patient_claims(self, patient_id: str) -> List[InsuranceClaim]:
        """Get all claims for a specific patient"""
        return [c for c in self.claims if c.patient_id == patient_id]

    async def get_treatment_plan_claims(self, treatment_plan_id: str) -> List[InsuranceClaim]:
        """Get all claims associated with a treatment plan"""
        return [c for c in self.claims if c.treatment_plan_id == treatment_plan_id]

# Create a singleton instance
insurance_claims_service = InsuranceClaimsService() 