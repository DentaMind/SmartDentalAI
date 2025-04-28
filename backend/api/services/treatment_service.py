from typing import List, Optional, Dict
from dataclasses import dataclass, field, asdict
from datetime import datetime
import json
import os
import logging
from ..services.permissions_service import (
    permissions_service,
    TreatmentPlanPermission,
    UserRole
)
from enum import Enum
from pathlib import Path
from ..services.email_service import email_service

logger = logging.getLogger(__name__)

class TreatmentStatus(Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

@dataclass
class TreatmentProcedure:
    code: str
    description: str
    cost: float
    quantity: int = 1
    notes: Optional[str] = None

@dataclass
class TreatmentPlanAudit:
    timestamp: datetime
    user_id: str
    user_role: UserRole
    action: str
    details: dict = field(default_factory=dict)

@dataclass
class TreatmentPlan:
    id: str
    patient_id: str
    patient_name: str
    status: TreatmentStatus
    created_at: datetime
    updated_at: datetime
    priority: str
    procedures: List[TreatmentProcedure]
    total_cost: float
    is_locked: bool = False
    locked_fields: List[str] = field(default_factory=list)
    audit_trail: List[TreatmentPlanAudit] = field(default_factory=list)
    proposed_edits: List[dict] = field(default_factory=list)
    insurance_claim_id: Optional[str] = None

@dataclass
class NotificationSettings:
    email_enabled: bool
    preferences: Dict[str, bool]

@dataclass
class OverrideRequest:
    id: str
    plan_id: str
    requester_id: str
    reason: str
    justification: str
    fields_to_unlock: List[str]
    status: str
    created_at: datetime
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None

class TreatmentPlanService:
    def __init__(self, storage_file: str = "treatment_plans.json"):
        self.storage_file = storage_file
        self.treatment_plans = self._load_treatment_plans()
        self.notifications_path = Path(__file__).parent / 'data' / 'notification_settings.json'
        self.overrides_path = Path(__file__).parent / 'data' / 'override_requests.json'
        self._ensure_files_exist()

    def _ensure_files_exist(self):
        self.storage_file = str(self.storage_file)
        self.notifications_path = str(self.notifications_path)
        self.overrides_path = str(self.overrides_path)
        self.storage_path = Path(self.storage_file)
        self.notifications_path = Path(self.notifications_path)
        self.overrides_path = Path(self.overrides_path)
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.storage_path.exists():
            self.storage_path.write_text('{}')
        if not self.notifications_path.exists():
            self.notifications_path.write_text('{}')
        if not self.overrides_path.exists():
            self.overrides_path.write_text('{}')

    def _load_treatment_plans(self) -> List[TreatmentPlan]:
        if os.path.exists(self.storage_file):
            try:
                with open(self.storage_file, 'r') as f:
                    data = json.load(f)
                    return [
                        TreatmentPlan(
                            id=plan["id"],
                            patient_id=plan["patient_id"],
                            patient_name=plan["patient_name"],
                            status=TreatmentStatus(plan["status"]),
                            created_at=datetime.fromisoformat(plan["created_at"]),
                            updated_at=datetime.fromisoformat(plan["updated_at"]),
                            priority=plan["priority"],
                            procedures=[
                                TreatmentProcedure(
                                    code=proc["code"],
                                    description=proc["description"],
                                    cost=proc["cost"],
                                    quantity=proc.get("quantity", 1),
                                    notes=proc.get("notes")
                                )
                                for proc in plan["procedures"]
                            ],
                            total_cost=plan["total_cost"],
                            is_locked=plan.get("is_locked", False),
                            locked_fields=plan.get("locked_fields", []),
                            audit_trail=[
                                TreatmentPlanAudit(
                                    timestamp=datetime.fromisoformat(audit["timestamp"]),
                                    user_id=audit["user_id"],
                                    user_role=UserRole(audit["user_role"]),
                                    action=audit["action"],
                                    details=audit.get("details", {})
                                )
                                for audit in plan.get("audit_trail", [])
                            ],
                            proposed_edits=plan.get("proposed_edits", []),
                            insurance_claim_id=plan.get("insurance_claim_id")
                        )
                        for plan in data
                    ]
            except Exception as e:
                logger.error(f"Error loading treatment plans: {e}")
                return []
        return []

    def _save_treatment_plans(self):
        try:
            with open(self.storage_file, 'w') as f:
                json.dump([
                    {
                        "id": plan.id,
                        "patient_id": plan.patient_id,
                        "patient_name": plan.patient_name,
                        "status": plan.status.value,
                        "created_at": plan.created_at.isoformat(),
                        "updated_at": plan.updated_at.isoformat(),
                        "priority": plan.priority,
                        "procedures": [
                            {
                                "code": proc.code,
                                "description": proc.description,
                                "cost": proc.cost,
                                "quantity": proc.quantity,
                                "notes": proc.notes
                            }
                            for proc in plan.procedures
                        ],
                        "total_cost": plan.total_cost,
                        "is_locked": plan.is_locked,
                        "locked_fields": plan.locked_fields,
                        "audit_trail": [
                            {
                                "timestamp": audit.timestamp.isoformat(),
                                "user_id": audit.user_id,
                                "user_role": audit.user_role.value,
                                "action": audit.action,
                                "details": audit.details
                            }
                            for audit in plan.audit_trail
                        ],
                        "proposed_edits": plan.proposed_edits,
                        "insurance_claim_id": plan.insurance_claim_id
                    }
                    for plan in self.treatment_plans
                ], f, indent=2)
        except Exception as e:
            logger.error(f"Error saving treatment plans: {e}")

    def _check_permission(self, user_role: UserRole, permission: TreatmentPlanPermission) -> bool:
        return permissions_service.has_permission(user_role, permission)

    def _add_audit_entry(self, plan: TreatmentPlan, user_id: str, user_role: UserRole, action: str, details: dict = None):
        plan.audit_trail.append(
            TreatmentPlanAudit(
                timestamp=datetime.now(),
                user_id=user_id,
                user_role=user_role,
                action=action,
                details=details or {}
            )
        )
        self._save_treatment_plans()

    def create_treatment_plan(
        self,
        patient_id: str,
        patient_name: str,
        procedures: List[TreatmentProcedure],
        user_id: str,
        user_role: UserRole
    ) -> TreatmentPlan:
        if not self._check_permission(user_role, TreatmentPlanPermission.CREATE_PLAN):
            raise PermissionError("User does not have permission to create treatment plans")

        total_cost = sum(proc.cost * proc.quantity for proc in procedures)
        plan = TreatmentPlan(
            id=f"TP-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            patient_id=patient_id,
            patient_name=patient_name,
            status=TreatmentStatus.DRAFT,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            priority="",
            procedures=procedures,
            total_cost=total_cost
        )

        self._add_audit_entry(
            plan,
            user_id,
            user_role,
            "created",
            {"procedures": [{"code": proc.code, "description": proc.description, "cost": proc.cost, "quantity": proc.quantity} for proc in procedures]}
        )

        self.treatment_plans.append(plan)
        self._save_treatment_plans()
        return plan

    def update_treatment_plan(
        self,
        plan_id: str,
        updates: dict,
        user_id: str,
        user_role: UserRole
    ) -> TreatmentPlan:
        plan = self.get_treatment_plan(plan_id)
        if not plan:
            raise ValueError("Treatment plan not found")

        if plan.is_locked:
            raise ValueError("Treatment plan is locked and cannot be modified")

        if not self._check_permission(user_role, TreatmentPlanPermission.EDIT_PLAN):
            raise PermissionError("User does not have permission to edit treatment plans")

        for field in plan.locked_fields:
            if field in updates:
                raise ValueError(f"Field '{field}' is locked and cannot be modified")

        for key, value in updates.items():
            if hasattr(plan, key):
                setattr(plan, key, value)

        plan.updated_at = datetime.now()
        self._add_audit_entry(
            plan,
            user_id,
            user_role,
            "updated",
            updates
        )

        self._save_treatment_plans()
        return plan

    def approve_treatment_plan(
        self,
        plan_id: str,
        user_id: str,
        user_role: UserRole
    ) -> TreatmentPlan:
        plan = self.get_treatment_plan(plan_id)
        if not plan:
            raise ValueError("Treatment plan not found")

        if not self._check_permission(user_role, TreatmentPlanPermission.APPROVE_PLAN):
            raise PermissionError("User does not have permission to approve treatment plans")

        if plan.status != TreatmentStatus.DRAFT:
            raise ValueError("Only draft plans can be approved")

        plan.status = TreatmentStatus.APPROVED
        plan.updated_at = datetime.now()
        self._add_audit_entry(
            plan,
            user_id,
            user_role,
            "approved"
        )

        self._save_treatment_plans()
        return plan

    def add_note(
        self,
        plan_id: str,
        note: str,
        user_id: str,
        user_role: UserRole
    ) -> TreatmentPlan:
        plan = self.get_treatment_plan(plan_id)
        if not plan:
            raise ValueError("Treatment plan not found")

        if not self._check_permission(user_role, TreatmentPlanPermission.ADD_NOTES):
            raise PermissionError("User does not have permission to add notes")

        plan.audit_trail.append(
            TreatmentPlanAudit(
                timestamp=datetime.now(),
                user_id=user_id,
                user_role=user_role,
                action="added_note",
                details={"note": note}
            )
        )

        self._save_treatment_plans()
        return plan

    def lock_treatment_plan(
        self,
        plan_id: str,
        user_id: str,
        user_role: UserRole
    ) -> TreatmentPlan:
        plan = self.get_treatment_plan(plan_id)
        if not plan:
            raise ValueError("Treatment plan not found")

        if not self._check_permission(user_role, TreatmentPlanPermission.LOCK_PLAN):
            raise PermissionError("User does not have permission to lock treatment plans")

        plan.is_locked = True
        self._add_audit_entry(
            plan,
            user_id,
            user_role,
            "locked"
        )

        self._save_treatment_plans()
        return plan

    def lock_financial_fields(self, plan_id: str) -> TreatmentPlan:
        plan = self.get_treatment_plan(plan_id)
        if not plan:
            raise ValueError("Treatment plan not found")

        if not plan.insurance_claim_id:
            raise ValueError("Cannot lock financial fields without an insurance claim")

        plan.locked_fields.extend(['procedures', 'total_cost'])
        plan.updated_at = datetime.now()
        self._add_audit_entry(
            plan,
            "",
            UserRole.SYSTEM,
            "locked_financial_fields"
        )

        self._save_treatment_plans()
        return plan

    def get_treatment_plan(self, plan_id: str) -> Optional[TreatmentPlan]:
        return next((plan for plan in self.treatment_plans if plan.id == plan_id), None)

    def get_patient_treatment_plans(self, patient_id: str) -> List[TreatmentPlan]:
        return [plan for plan in self.treatment_plans if plan.patient_id == patient_id]

    def get_notification_settings(self, plan_id: str, user_id: str) -> NotificationSettings:
        try:
            settings = json.loads(self.notifications_path.read_text())
            user_settings = settings.get(f"{plan_id}:{user_id}", {
                "email_enabled": False,
                "preferences": {
                    "newEdits": True,
                    "editApprovals": True,
                    "financialChanges": True
                }
            })
            return NotificationSettings(**user_settings)
        except Exception as e:
            logging.error(f"Error getting notification settings: {str(e)}")
            raise

    def update_notification_settings(
        self,
        plan_id: str,
        user_id: str,
        email_enabled: bool,
        preferences: Dict[str, bool]
    ) -> NotificationSettings:
        try:
            settings = json.loads(self.notifications_path.read_text())
            user_settings = NotificationSettings(
                email_enabled=email_enabled,
                preferences=preferences
            )
            settings[f"{plan_id}:{user_id}"] = asdict(user_settings)
            self.notifications_path.write_text(json.dumps(settings, indent=2))
            return user_settings
        except Exception as e:
            logging.error(f"Error updating notification settings: {str(e)}")
            raise

    def create_override_request(
        self,
        plan_id: str,
        requester_id: str,
        reason: str,
        justification: str,
        fields_to_unlock: List[str]
    ) -> OverrideRequest:
        try:
            requests = json.loads(self.overrides_path.read_text())
            request_id = f"override_{len(requests) + 1}"
            
            override = OverrideRequest(
                id=request_id,
                plan_id=plan_id,
                requester_id=requester_id,
                reason=reason,
                justification=justification,
                fields_to_unlock=fields_to_unlock,
                status="pending",
                created_at=datetime.now()
            )
            
            requests[request_id] = asdict(override)
            self.overrides_path.write_text(json.dumps(requests, indent=2))
            return override
        except Exception as e:
            logging.error(f"Error creating override request: {str(e)}")
            raise

    def approve_override_request(
        self,
        plan_id: str,
        request_id: str,
        approved_by: str
    ) -> OverrideRequest:
        try:
            requests = json.loads(self.overrides_path.read_text())
            if request_id not in requests:
                raise ValueError("Override request not found")
            
            override = OverrideRequest(**requests[request_id])
            override.status = "approved"
            override.reviewed_by = approved_by
            override.reviewed_at = datetime.now()
            
            # Unlock the requested fields
            plan = self.get_treatment_plan(plan_id)
            for field in override.fields_to_unlock:
                if field in plan.locked_fields:
                    plan.locked_fields.remove(field)
            self.update_treatment_plan(plan)
            
            requests[request_id] = asdict(override)
            self.overrides_path.write_text(json.dumps(requests, indent=2))
            return override
        except Exception as e:
            logging.error(f"Error approving override request: {str(e)}")
            raise

    def reject_override_request(
        self,
        plan_id: str,
        request_id: str,
        rejected_by: str
    ) -> OverrideRequest:
        try:
            requests = json.loads(self.overrides_path.read_text())
            if request_id not in requests:
                raise ValueError("Override request not found")
            
            override = OverrideRequest(**requests[request_id])
            override.status = "rejected"
            override.reviewed_by = rejected_by
            override.reviewed_at = datetime.now()
            
            requests[request_id] = asdict(override)
            self.overrides_path.write_text(json.dumps(requests, indent=2))
            return override
        except Exception as e:
            logging.error(f"Error rejecting override request: {str(e)}")
            raise

    def get_plan_admins(self, plan_id: str) -> List[Dict[str, str]]:
        # In a real implementation, this would fetch from a user database
        return [
            {"id": "admin1", "email": "admin1@dentamind.com", "name": "Admin One"},
            {"id": "admin2", "email": "admin2@dentamind.com", "name": "Admin Two"}
        ]

    def get_user(self, user_id: str) -> Dict[str, str]:
        # In a real implementation, this would fetch from a user database
        return {
            "id": user_id,
            "email": f"{user_id}@dentamind.com",
            "name": f"User {user_id}"
        }

# Initialize the service
treatment_plan_service = TreatmentPlanService() 