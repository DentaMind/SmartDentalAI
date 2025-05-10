"""
Treatment Plan Service

This module provides services for managing treatment plans, including versioning,
audit logging, and integrations with AI for treatment suggestions.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple, Set
from uuid import UUID, uuid4

from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from ..models.treatment_plan import (
    TreatmentPlan, 
    TreatmentProcedure, 
    TreatmentPlanAudit,
    PlanStatus,
    ProcedureStatus,
    treatment_plan_versions,
    PlanVersionInfo
)
from ..models.treatment_plan import (
    TreatmentPlanCreate, 
    TreatmentPlanUpdate, 
    TreatmentProcedureCreate,
    TreatmentProcedureUpdate,
    TreatmentPlanSummary
)
from ..models.diagnosis import Diagnosis
from ..utils.logger import get_logger

logger = get_logger(__name__)

class TreatmentPlanService:
    """Service for managing treatment plans"""

    @staticmethod
    async def create_treatment_plan(
        db: AsyncSession, 
        plan_data: TreatmentPlanCreate
    ) -> TreatmentPlan:
        """
        Create a new treatment plan
        
        Args:
            db: Database session
            plan_data: Treatment plan data
            
        Returns:
            The created treatment plan
        """
        # Create the treatment plan
        new_plan = TreatmentPlan(
            patient_id=plan_data.patient_id,
            diagnosis_id=plan_data.diagnosis_id,
            title=plan_data.title or f"Treatment Plan {datetime.now().strftime('%Y-%m-%d')}",
            description=plan_data.description,
            notes=plan_data.notes,
            status=plan_data.status,
            priority=plan_data.priority,
            created_by=plan_data.created_by,
            medical_alerts=plan_data.medical_alerts or [],
            ai_assisted=plan_data.ai_assisted,
            ai_model_version=plan_data.ai_model_version,
            ai_confidence_score=plan_data.ai_confidence_score,
            current_version=1,
            last_modified_by=plan_data.created_by
        )
        
        # Add to database
        db.add(new_plan)
        await db.flush()
        
        # Create audit log entry
        audit_entry = TreatmentPlanAudit(
            treatment_plan_id=new_plan.id,
            action="created",
            action_by=plan_data.created_by,
            details={
                "title": new_plan.title,
                "diagnosis_id": new_plan.diagnosis_id,
                "ai_assisted": new_plan.ai_assisted
            }
        )
        db.add(audit_entry)
        
        await db.commit()
        await db.refresh(new_plan)
        return new_plan

    @staticmethod
    async def get_treatment_plan(
        db: AsyncSession, 
        plan_id: UUID,
        include_procedures: bool = True
    ) -> Optional[TreatmentPlan]:
        """
        Get a treatment plan by ID
        
        Args:
            db: Database session
            plan_id: Treatment plan ID
            include_procedures: Whether to include procedures
            
        Returns:
            The treatment plan, or None if not found
        """
        query = select(TreatmentPlan).where(TreatmentPlan.id == plan_id)
        
        if include_procedures:
            query = query.options(joinedload(TreatmentPlan.procedures))
            
        result = await db.execute(query)
        return result.scalars().first()

    @staticmethod
    async def get_treatment_plans_for_patient(
        db: AsyncSession, 
        patient_id: str,
        status: Optional[List[str]] = None,
        include_procedures: bool = False
    ) -> List[TreatmentPlan]:
        """
        Get all treatment plans for a patient
        
        Args:
            db: Database session
            patient_id: Patient ID
            status: Optional list of statuses to filter by
            include_procedures: Whether to include procedures
            
        Returns:
            List of treatment plans
        """
        query = select(TreatmentPlan).where(TreatmentPlan.patient_id == patient_id)
        
        if status:
            query = query.where(TreatmentPlan.status.in_(status))
            
        if include_procedures:
            query = query.options(joinedload(TreatmentPlan.procedures))
            
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def update_treatment_plan(
        db: AsyncSession, 
        plan_id: UUID, 
        update_data: TreatmentPlanUpdate,
        user_id: str
    ) -> Optional[TreatmentPlan]:
        """
        Update a treatment plan
        
        Args:
            db: Database session
            plan_id: Treatment plan ID
            update_data: Update data
            user_id: User ID performing the update
            
        Returns:
            The updated treatment plan, or None if not found
        """
        # Get the plan
        plan = await TreatmentPlanService.get_treatment_plan(db, plan_id)
        if not plan:
            return None
            
        # Create a version before updating
        plan.create_version(db, user_id, f"Update by {user_id}")
        
        # Track changed fields for audit log
        changed_fields = {}
        
        # Update fields
        for key, value in update_data.dict(exclude_unset=True).items():
            if hasattr(plan, key) and getattr(plan, key) != value:
                changed_fields[key] = {"old": getattr(plan, key), "new": value}
                setattr(plan, key, value)
        
        # Update modified timestamp
        plan.last_modified_by = user_id
        
        # Create audit log entry if fields were changed
        if changed_fields:
            audit_entry = TreatmentPlanAudit(
                treatment_plan_id=plan.id,
                action="updated",
                action_by=user_id,
                details=changed_fields
            )
            db.add(audit_entry)
        
        await db.commit()
        await db.refresh(plan)
        return plan

    @staticmethod
    async def approve_treatment_plan(
        db: AsyncSession, 
        plan_id: UUID, 
        approved_by: str,
        notes: Optional[str] = None
    ) -> Optional[TreatmentPlan]:
        """
        Approve a treatment plan
        
        Args:
            db: Database session
            plan_id: Treatment plan ID
            approved_by: User approving the plan
            notes: Optional notes
            
        Returns:
            The updated treatment plan, or None if not found
        """
        # Get the plan
        plan = await TreatmentPlanService.get_treatment_plan(db, plan_id)
        if not plan:
            return None
            
        # Check if the plan is in a status that can be approved
        if plan.status not in [PlanStatus.DRAFT.value, PlanStatus.PROPOSED.value]:
            raise ValueError(f"Cannot approve plan in status: {plan.status}")
        
        # Create a version before updating
        plan.create_version(db, approved_by, f"Approved by {approved_by}")
        
        # Update the plan
        old_status = plan.status
        plan.status = PlanStatus.APPROVED.value
        plan.approved_by = approved_by
        plan.approved_at = datetime.now()
        plan.last_modified_by = approved_by
        
        # Create audit log entry
        audit_entry = TreatmentPlanAudit(
            treatment_plan_id=plan.id,
            action="status_changed",
            action_by=approved_by,
            details={
                "old_status": old_status,
                "new_status": plan.status,
                "notes": notes
            }
        )
        db.add(audit_entry)
        
        await db.commit()
        await db.refresh(plan)
        return plan

    @staticmethod
    async def sign_consent(
        db: AsyncSession, 
        plan_id: UUID, 
        signed_by: str
    ) -> Optional[TreatmentPlan]:
        """
        Sign consent for a treatment plan
        
        Args:
            db: Database session
            plan_id: Treatment plan ID
            signed_by: Person signing the consent
            
        Returns:
            The updated treatment plan, or None if not found
        """
        # Get the plan
        plan = await TreatmentPlanService.get_treatment_plan(db, plan_id)
        if not plan:
            return None
            
        # Check if the plan is approved
        if plan.status != PlanStatus.APPROVED.value:
            raise ValueError(f"Cannot sign consent for plan in status: {plan.status}")
        
        # Update the plan
        plan.consent_signed = True
        plan.consent_signed_by = signed_by
        plan.consent_signed_at = datetime.now()
        plan.status = PlanStatus.IN_PROGRESS.value
        plan.last_modified_by = signed_by
        
        # Create audit log entry
        audit_entry = TreatmentPlanAudit(
            treatment_plan_id=plan.id,
            action="consent_signed",
            action_by=signed_by,
            details={
                "status_change": {"old": PlanStatus.APPROVED.value, "new": PlanStatus.IN_PROGRESS.value}
            }
        )
        db.add(audit_entry)
        
        await db.commit()
        await db.refresh(plan)
        return plan

    @staticmethod
    async def complete_treatment_plan(
        db: AsyncSession, 
        plan_id: UUID, 
        completed_by: str,
        notes: Optional[str] = None
    ) -> Optional[TreatmentPlan]:
        """
        Mark a treatment plan as completed
        
        Args:
            db: Database session
            plan_id: Treatment plan ID
            completed_by: User completing the plan
            notes: Optional notes
            
        Returns:
            The updated treatment plan, or None if not found
        """
        # Get the plan
        plan = await TreatmentPlanService.get_treatment_plan(db, plan_id, include_procedures=True)
        if not plan:
            return None
            
        # Check if the plan is in progress
        if plan.status != PlanStatus.IN_PROGRESS.value:
            raise ValueError(f"Cannot complete plan in status: {plan.status}")
        
        # Check if all procedures are completed
        incomplete_procedures = [p for p in plan.procedures if p.status != ProcedureStatus.COMPLETED.value]
        if incomplete_procedures:
            procedure_ids = [str(p.id) for p in incomplete_procedures]
            raise ValueError(f"Cannot complete plan with incomplete procedures: {procedure_ids}")
        
        # Create a version before updating
        plan.create_version(db, completed_by, f"Completed by {completed_by}")
        
        # Update the plan
        old_status = plan.status
        plan.status = PlanStatus.COMPLETED.value
        plan.completed_at = datetime.now()
        plan.last_modified_by = completed_by
        
        # Create audit log entry
        audit_entry = TreatmentPlanAudit(
            treatment_plan_id=plan.id,
            action="status_changed",
            action_by=completed_by,
            details={
                "old_status": old_status,
                "new_status": plan.status,
                "notes": notes
            }
        )
        db.add(audit_entry)
        
        await db.commit()
        await db.refresh(plan)
        return plan

    @staticmethod
    async def add_procedure(
        db: AsyncSession, 
        procedure_data: TreatmentProcedureCreate,
        user_id: str
    ) -> TreatmentProcedure:
        """
        Add a procedure to a treatment plan
        
        Args:
            db: Database session
            procedure_data: Procedure data
            user_id: User ID adding the procedure
            
        Returns:
            The created procedure
        """
        # Get the plan to ensure it exists
        plan_id = UUID(procedure_data.treatment_plan_id)
        plan = await TreatmentPlanService.get_treatment_plan(db, plan_id)
        if not plan:
            raise ValueError(f"Treatment plan {plan_id} not found")
        
        # Create the procedure
        new_procedure = TreatmentProcedure(
            treatment_plan_id=plan_id,
            tooth_number=procedure_data.tooth_number,
            cdt_code=procedure_data.cdt_code,
            procedure_name=procedure_data.procedure_name,
            description=procedure_data.description,
            status=procedure_data.status,
            priority=procedure_data.priority,
            phase=procedure_data.phase,
            fee=procedure_data.fee,
            notes=procedure_data.notes,
            reasoning=procedure_data.reasoning,
            ai_suggested=procedure_data.ai_suggested,
            surfaces=procedure_data.surfaces or [],
            quadrant=procedure_data.quadrant,
            arch=procedure_data.arch,
            preauth_required=procedure_data.preauth_required
        )
        
        # Add to database
        db.add(new_procedure)
        
        # Create a version of the plan
        plan.create_version(db, user_id, f"Added procedure: {procedure_data.procedure_name}")
        
        # Update the plan's last_modified_by
        plan.last_modified_by = user_id
        
        # Create audit log entry
        audit_entry = TreatmentPlanAudit(
            treatment_plan_id=plan_id,
            action="procedure_added",
            action_by=user_id,
            details={
                "procedure_id": str(new_procedure.id),
                "procedure_name": new_procedure.procedure_name,
                "tooth_number": new_procedure.tooth_number,
                "cdt_code": new_procedure.cdt_code
            }
        )
        db.add(audit_entry)
        
        # Recalculate plan totals
        await TreatmentPlanService._update_plan_financials(db, plan_id)
        
        await db.commit()
        await db.refresh(new_procedure)
        return new_procedure

    @staticmethod
    async def update_procedure(
        db: AsyncSession, 
        procedure_id: UUID, 
        update_data: TreatmentProcedureUpdate,
        user_id: str
    ) -> Optional[TreatmentProcedure]:
        """
        Update a treatment procedure
        
        Args:
            db: Database session
            procedure_id: Procedure ID
            update_data: Update data
            user_id: User ID updating the procedure
            
        Returns:
            The updated procedure, or None if not found
        """
        # Get the procedure
        procedure = await TreatmentPlanService.get_procedure(db, procedure_id)
        if not procedure:
            return None
        
        # Get the plan
        plan = await TreatmentPlanService.get_treatment_plan(db, procedure.treatment_plan_id)
        if not plan:
            return None
        
        # Track changed fields for audit log
        changed_fields = {}
        
        # Update fields
        for key, value in update_data.dict(exclude_unset=True).items():
            if hasattr(procedure, key) and getattr(procedure, key) != value:
                changed_fields[key] = {"old": getattr(procedure, key), "new": value}
                setattr(procedure, key, value)
        
        # Check if status changed to completed and set completed_at
        if "status" in changed_fields and update_data.status == ProcedureStatus.COMPLETED:
            procedure.completed_at = datetime.now()
        
        # Special handling for doctor modifications
        if "doctor_reasoning" in update_data.dict(exclude_unset=True) and update_data.doctor_reasoning:
            procedure.modified_by_doctor = True
            procedure.doctor_approved = True
        
        # Create a version of the plan
        plan.create_version(db, user_id, f"Updated procedure: {procedure.procedure_name}")
        
        # Update the plan's last_modified_by
        plan.last_modified_by = user_id
        
        # Create audit log entry if fields were changed
        if changed_fields:
            audit_entry = TreatmentPlanAudit(
                treatment_plan_id=procedure.treatment_plan_id,
                action="procedure_updated",
                action_by=user_id,
                details={
                    "procedure_id": str(procedure.id),
                    "procedure_name": procedure.procedure_name,
                    "changes": changed_fields
                }
            )
            db.add(audit_entry)
            
            # Update plan financials if fee was updated
            if "fee" in changed_fields:
                await TreatmentPlanService._update_plan_financials(db, procedure.treatment_plan_id)
        
        await db.commit()
        await db.refresh(procedure)
        return procedure

    @staticmethod
    async def delete_procedure(
        db: AsyncSession, 
        procedure_id: UUID, 
        user_id: str
    ) -> bool:
        """
        Delete a treatment procedure
        
        Args:
            db: Database session
            procedure_id: Procedure ID
            user_id: User ID deleting the procedure
            
        Returns:
            True if deleted, False if not found
        """
        # Get the procedure
        procedure = await TreatmentPlanService.get_procedure(db, procedure_id)
        if not procedure:
            return False
        
        # Get the plan
        plan = await TreatmentPlanService.get_treatment_plan(db, procedure.treatment_plan_id)
        if not plan:
            return False
        
        # Create a version of the plan
        plan.create_version(db, user_id, f"Deleted procedure: {procedure.procedure_name}")
        
        # Update the plan's last_modified_by
        plan.last_modified_by = user_id
        
        # Create audit log entry
        audit_entry = TreatmentPlanAudit(
            treatment_plan_id=procedure.treatment_plan_id,
            action="procedure_deleted",
            action_by=user_id,
            details={
                "procedure_id": str(procedure.id),
                "procedure_name": procedure.procedure_name,
                "tooth_number": procedure.tooth_number,
                "cdt_code": procedure.cdt_code
            }
        )
        db.add(audit_entry)
        
        # Delete the procedure
        await db.delete(procedure)
        
        # Update plan financials
        await TreatmentPlanService._update_plan_financials(db, procedure.treatment_plan_id)
        
        await db.commit()
        return True

    @staticmethod
    async def get_procedure(
        db: AsyncSession, 
        procedure_id: UUID
    ) -> Optional[TreatmentProcedure]:
        """
        Get a treatment procedure by ID
        
        Args:
            db: Database session
            procedure_id: Procedure ID
            
        Returns:
            The procedure, or None if not found
        """
        query = select(TreatmentProcedure).where(TreatmentProcedure.id == procedure_id)
        result = await db.execute(query)
        return result.scalars().first()

    @staticmethod
    async def get_plan_versions(
        db: AsyncSession, 
        plan_id: UUID
    ) -> List[PlanVersionInfo]:
        """
        Get all versions of a treatment plan
        
        Args:
            db: Database session
            plan_id: Treatment plan ID
            
        Returns:
            List of version info
        """
        query = select(
            treatment_plan_versions.c.version,
            treatment_plan_versions.c.created_by,
            treatment_plan_versions.c.created_at,
            treatment_plan_versions.c.notes
        ).where(
            treatment_plan_versions.c.treatment_plan_id == plan_id
        ).order_by(treatment_plan_versions.c.version.desc())
        
        result = await db.execute(query)
        versions = []
        
        for row in result:
            versions.append(PlanVersionInfo(
                treatment_plan_id=str(plan_id),
                version=row.version,
                created_by=row.created_by,
                created_at=row.created_at,
                notes=row.notes
            ))
            
        return versions

    @staticmethod
    async def get_plan_audit_history(
        db: AsyncSession, 
        plan_id: UUID,
        limit: int = 100
    ) -> List[TreatmentPlanAudit]:
        """
        Get audit history for a treatment plan
        
        Args:
            db: Database session
            plan_id: Treatment plan ID
            limit: Maximum number of audit entries to return
            
        Returns:
            List of audit entries
        """
        query = select(TreatmentPlanAudit).where(
            TreatmentPlanAudit.treatment_plan_id == plan_id
        ).order_by(
            TreatmentPlanAudit.action_at.desc()
        ).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_plan_version_data(
        db: AsyncSession, 
        plan_id: UUID,
        version: int
    ) -> Optional[Dict[str, Any]]:
        """
        Get data for a specific version of a treatment plan
        
        Args:
            db: Database session
            plan_id: Treatment plan ID
            version: Version number
            
        Returns:
            Version data, or None if not found
        """
        query = select(treatment_plan_versions.c.data).where(
            treatment_plan_versions.c.treatment_plan_id == plan_id,
            treatment_plan_versions.c.version == version
        )
        
        result = await db.execute(query)
        row = result.first()
        return row[0] if row else None

    @staticmethod
    async def get_treatment_plan_summary(
        db: AsyncSession, 
        plan_id: UUID
    ) -> Optional[TreatmentPlanSummary]:
        """
        Get summary statistics for a treatment plan
        
        Args:
            db: Database session
            plan_id: Treatment plan ID
            
        Returns:
            Summary statistics, or None if plan not found
        """
        # Get the plan with procedures
        plan = await TreatmentPlanService.get_treatment_plan(db, plan_id, include_procedures=True)
        if not plan or not plan.procedures:
            return None
        
        # Count procedures by phase
        procedures_by_phase = {}
        for phase in ["urgent", "phase_1", "phase_2", "maintenance"]:
            procedures_by_phase[phase] = len([p for p in plan.procedures if p.phase == phase])
        
        # Count procedures by status
        procedures_by_status = {}
        for status in ["recommended", "planned", "scheduled", "in_progress", "completed", "cancelled"]:
            procedures_by_status[status] = len([p for p in plan.procedures if p.status == status])
        
        # Count completed procedures and calculate progress
        completed_procedures = procedures_by_status.get("completed", 0)
        total_active_procedures = len([p for p in plan.procedures if p.status != "cancelled"])
        progress_percentage = (completed_procedures / total_active_procedures * 100) if total_active_procedures > 0 else 0
        
        # Calculate financial information
        total_treatment_fee = sum(p.fee for p in plan.procedures if p.status != "cancelled")
        
        # Calculate insurance coverage
        total_insurance_coverage = 0
        for proc in plan.procedures:
            if proc.status != "cancelled" and proc.insurance_coverage is not None:
                coverage_amount = (proc.fee * proc.insurance_coverage / 100)
                total_insurance_coverage += coverage_amount
        
        # Calculate patient responsibility
        total_patient_responsibility = total_treatment_fee - total_insurance_coverage
        
        # Count procedures requiring preauthorization
        procedures_requiring_preauth = len([p for p in plan.procedures if p.preauth_required])
        
        return TreatmentPlanSummary(
            total_procedures=len(plan.procedures),
            procedures_by_phase=procedures_by_phase,
            procedures_by_status=procedures_by_status,
            total_treatment_fee=total_treatment_fee,
            total_insurance_coverage=total_insurance_coverage,
            total_patient_responsibility=total_patient_responsibility,
            procedures_requiring_preauth=procedures_requiring_preauth,
            completed_procedures=completed_procedures,
            progress_percentage=progress_percentage
        )

    @staticmethod
    async def ai_suggest_treatment_plan(
        db: AsyncSession,
        patient_id: str,
        diagnosis_id: Optional[str] = None,
        created_by: str = "ai_system"
    ) -> Optional[Tuple[TreatmentPlan, List[str]]]:
        """
        Use AI to suggest a treatment plan based on diagnosis
        
        Args:
            db: Database session
            patient_id: Patient ID
            diagnosis_id: Optional diagnosis ID
            created_by: User ID requesting the suggestion
            
        Returns:
            Tuple of (suggested plan, explanation) or None if unable to suggest
        """
        try:
            # Import here to avoid circular imports
            from ..services.ai_service import DiagnosisAI
            
            # Get the diagnosis if provided
            diagnosis = None
            if diagnosis_id:
                query = select(Diagnosis).where(Diagnosis.id == diagnosis_id)
                result = await db.execute(query)
                diagnosis = result.scalars().first()
                
                if not diagnosis:
                    logger.warning(f"Diagnosis {diagnosis_id} not found")
                    return None
            
            # Get AI service
            ai_service = DiagnosisAI()
            
            # Generate treatment plan suggestion
            suggestion = await ai_service.suggest_treatment_plan(patient_id, diagnosis)
            if not suggestion:
                logger.warning("AI unable to suggest treatment plan")
                return None
                
            # Create the treatment plan
            plan_data = TreatmentPlanCreate(
                patient_id=patient_id,
                diagnosis_id=diagnosis_id,
                title=suggestion.get("title"),
                description=suggestion.get("description"),
                notes=suggestion.get("notes"),
                status=PlanStatus.DRAFT,
                priority=suggestion.get("priority", "medium"),
                created_by=created_by,
                ai_assisted=True,
                ai_model_version=suggestion.get("model_version"),
                ai_confidence_score=suggestion.get("confidence_score")
            )
            
            new_plan = await TreatmentPlanService.create_treatment_plan(db, plan_data)
            
            # Add procedures
            procedures = suggestion.get("procedures", [])
            for proc in procedures:
                proc_data = TreatmentProcedureCreate(
                    treatment_plan_id=str(new_plan.id),
                    tooth_number=proc.get("tooth_number"),
                    cdt_code=proc.get("cdt_code"),
                    procedure_name=proc.get("name"),
                    description=proc.get("description"),
                    status=ProcedureStatus.RECOMMENDED,
                    priority=proc.get("priority", "medium"),
                    phase=proc.get("phase", "phase_1"),
                    fee=proc.get("fee", 0.0),
                    notes=proc.get("notes"),
                    reasoning=proc.get("reasoning"),
                    ai_suggested=True,
                    surfaces=proc.get("surfaces"),
                    quadrant=proc.get("quadrant"),
                    arch=proc.get("arch"),
                    preauth_required=proc.get("preauth_required", False)
                )
                
                await TreatmentPlanService.add_procedure(db, proc_data, created_by)
            
            # Return the plan and AI explanations
            return new_plan, suggestion.get("explanations", [])
            
        except Exception as e:
            logger.error(f"Error in AI treatment plan suggestion: {str(e)}")
            return None

    @staticmethod
    async def _update_plan_financials(
        db: AsyncSession, 
        plan_id: UUID
    ) -> None:
        """
        Update financial totals for a treatment plan
        
        Args:
            db: Database session
            plan_id: Treatment plan ID
        """
        # Get the plan with procedures
        plan = await TreatmentPlanService.get_treatment_plan(db, plan_id, include_procedures=True)
        if not plan:
            return
        
        # Calculate financial information
        total_fee = sum(p.fee for p in plan.procedures if p.status != "cancelled")
        
        # Calculate insurance coverage
        insurance_portion = 0
        for proc in plan.procedures:
            if proc.status != "cancelled" and proc.insurance_coverage is not None:
                coverage_amount = (proc.fee * proc.insurance_coverage / 100)
                insurance_portion += coverage_amount
        
        # Calculate patient responsibility
        patient_portion = total_fee - insurance_portion
        
        # Update the plan
        plan.total_fee = total_fee
        plan.insurance_portion = insurance_portion
        plan.patient_portion = patient_portion
        
        # No need to commit here, as this will be committed by the calling function 