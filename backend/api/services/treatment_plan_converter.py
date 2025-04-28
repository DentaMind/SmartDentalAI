from typing import List, Optional
from datetime import datetime
import uuid
from ..models.claims import InsuranceClaim, ClaimStatus, ClaimProcedure
from ..models.treatment_plans import TreatmentPlan, TreatmentPlanStatus, TreatmentPlanProcedure

class TreatmentPlanConverter:
    @staticmethod
    def convert_to_claim(
        treatment_plan: TreatmentPlan,
        insurance_provider_id: str,
        claim_number: Optional[str] = None
    ) -> InsuranceClaim:
        """
        Convert a treatment plan into an insurance claim.
        
        Args:
            treatment_plan: The treatment plan to convert
            insurance_provider_id: The ID of the insurance provider
            claim_number: Optional claim number (will be generated if not provided)
            
        Returns:
            InsuranceClaim: The generated insurance claim
        """
        if treatment_plan.status != TreatmentPlanStatus.APPROVED:
            raise ValueError("Only approved treatment plans can be converted to claims")

        # Generate claim number if not provided
        if not claim_number:
            claim_number = f"CLM-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}"

        # Convert procedures
        claim_procedures = [
            ClaimProcedure(
                code=proc.procedure_code,
                description=proc.description,
                amount=float(proc.fee)
            )
            for proc in treatment_plan.procedures
            if proc.insurance_covered  # Only include procedures covered by insurance
        ]

        # Calculate total amount
        total_amount = sum(proc.amount for proc in claim_procedures)

        # Create the claim
        claim = InsuranceClaim(
            id=str(uuid.uuid4()),
            claim_number=claim_number,
            patient_id=treatment_plan.patient_id,
            patient_name=treatment_plan.patient_name,
            submission_date=datetime.now(),
            status=ClaimStatus.SUBMITTED,
            total_amount=total_amount,
            procedures=claim_procedures,
            treatment_plan_id=treatment_plan.id,
            insurance_provider_id=insurance_provider_id,
            notes=f"Generated from Treatment Plan {treatment_plan.id}"
        )

        return claim

    @staticmethod
    def validate_treatment_plan_for_claim(treatment_plan: TreatmentPlan) -> bool:
        """
        Validate if a treatment plan can be converted to a claim.
        
        Args:
            treatment_plan: The treatment plan to validate
            
        Returns:
            bool: True if the treatment plan can be converted
        """
        # Check if treatment plan is approved
        if treatment_plan.status != TreatmentPlanStatus.APPROVED:
            return False

        # Check if there are any insurance-covered procedures
        has_covered_procedures = any(
            proc.insurance_covered for proc in treatment_plan.procedures
        )
        if not has_covered_procedures:
            return False

        # Check if all required fields are present
        required_fields = [
            treatment_plan.patient_id,
            treatment_plan.patient_name,
            treatment_plan.procedures
        ]
        if not all(required_fields):
            return False

        return True 