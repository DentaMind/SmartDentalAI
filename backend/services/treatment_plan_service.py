from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from models.treatment_plan import TreatmentPlan, TreatmentStatus
from models.audit import AuditEvent
from fastapi import HTTPException

class TreatmentPlanService:
    def __init__(self, db: Session):
        self.db = db

    def get_treatment_plan(self, plan_id: int) -> Optional[TreatmentPlan]:
        """Get a treatment plan by ID."""
        plan = self.db.query(TreatmentPlan).filter(TreatmentPlan.id == plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Treatment plan not found")
        return plan

    def sign_consent(
        self,
        plan_id: int,
        signed_by: str,
        signature_data: str,
        ip_address: str,
        user_id: int,  # ID of the user recording the consent
    ) -> TreatmentPlan:
        """
        Sign consent for a treatment plan.
        
        Args:
            plan_id: ID of the treatment plan
            signed_by: Name of the person signing
            signature_data: Base64 encoded signature image
            ip_address: IP address of the signer
            user_id: ID of the user recording the consent
            
        Returns:
            Updated treatment plan
            
        Raises:
            HTTPException: If plan is not found or already signed
        """
        plan = self.get_treatment_plan(plan_id)
        
        # Validate plan can be signed
        if plan.status != TreatmentStatus.PLANNED:
            raise HTTPException(
                status_code=400,
                detail=f"Treatment plan cannot be signed in {plan.status.value} status"
            )
            
        if plan.consent_signed_at:
            raise HTTPException(
                status_code=400,
                detail="Treatment plan already has consent signed"
            )

        # Sign the consent
        plan.sign_consent(
            signed_by=signed_by,
            signature_data=signature_data,
            ip_address=ip_address
        )
        
        # Create audit log
        AuditEvent.log_consent_signed(
            db=self.db,
            user_id=user_id,
            plan_id=plan_id,
            patient_id=plan.patient_id,
            ip_address=ip_address,
            signed_by=signed_by
        )
        
        # Save changes
        self.db.commit()
        self.db.refresh(plan)
        
        return plan

    def get_consent_data(self, plan_id: int) -> dict:
        """
        Get consent data for a treatment plan.
        
        Args:
            plan_id: ID of the treatment plan
            
        Returns:
            Dict containing consent data
            
        Raises:
            HTTPException: If plan is not found or not signed
        """
        plan = self.get_treatment_plan(plan_id)
        
        if not plan.consent_signed_at:
            raise HTTPException(
                status_code=404,
                detail="No consent found for this treatment plan"
            )
            
        return {
            "signed_by": plan.consent_signed_by,
            "signed_at": plan.consent_signed_at,
            "signature_data": plan.consent_signature_data,
            "ip_address": plan.consent_ip_address,
            "status": plan.status.value
        } 