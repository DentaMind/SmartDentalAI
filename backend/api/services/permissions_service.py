from enum import Enum
from typing import Dict, List, Optional
from dataclasses import dataclass
import json
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class UserRole(str, Enum):
    ADMIN_DENTIST = "admin_dentist"
    ASSOCIATE_DENTIST = "associate_dentist"
    HYGIENIST = "hygienist"
    ASSISTANT = "assistant"
    BILLING_MANAGER = "billing_manager"

class TreatmentPlanPermission(str, Enum):
    CREATE_PLAN = "create_plan"
    EDIT_PLAN = "edit_plan"
    APPROVE_PLAN = "approve_plan"
    SUBMIT_CLAIM = "submit_claim"
    LOCK_PLAN = "lock_plan"
    ADD_NOTES = "add_notes"
    VIEW_HISTORY = "view_history"
    PROPOSE_CHANGES = "propose_changes"

@dataclass
class RolePermission:
    role: UserRole
    permissions: List[TreatmentPlanPermission]
    description: str

class PermissionsService:
    def __init__(self, storage_file: str = "permissions.json"):
        self.storage_file = storage_file
        self.role_permissions = self._load_permissions()
        self._initialize_default_permissions()

    def _load_permissions(self) -> Dict[str, RolePermission]:
        if os.path.exists(self.storage_file):
            try:
                with open(self.storage_file, 'r') as f:
                    data = json.load(f)
                    return {
                        role: RolePermission(
                            role=UserRole(role),
                            permissions=[TreatmentPlanPermission(p) for p in perms["permissions"]],
                            description=perms["description"]
                        )
                        for role, perms in data.items()
                    }
            except Exception as e:
                logger.error(f"Error loading permissions: {e}")
                return {}
        return {}

    def _save_permissions(self):
        try:
            with open(self.storage_file, 'w') as f:
                json.dump({
                    role: {
                        "permissions": [p.value for p in perms.permissions],
                        "description": perms.description
                    }
                    for role, perms in self.role_permissions.items()
                }, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving permissions: {e}")

    def _initialize_default_permissions(self):
        if not self.role_permissions:
            self.role_permissions = {
                UserRole.ADMIN_DENTIST.value: RolePermission(
                    role=UserRole.ADMIN_DENTIST,
                    permissions=list(TreatmentPlanPermission),
                    description="Full access to all treatment plan operations"
                ),
                UserRole.ASSOCIATE_DENTIST.value: RolePermission(
                    role=UserRole.ASSOCIATE_DENTIST,
                    permissions=[
                        TreatmentPlanPermission.CREATE_PLAN,
                        TreatmentPlanPermission.EDIT_PLAN,
                        TreatmentPlanPermission.APPROVE_PLAN,
                        TreatmentPlanPermission.SUBMIT_CLAIM,
                        TreatmentPlanPermission.LOCK_PLAN,
                        TreatmentPlanPermission.ADD_NOTES,
                        TreatmentPlanPermission.VIEW_HISTORY
                    ],
                    description="Full clinical access with treatment plan management"
                ),
                UserRole.HYGIENIST.value: RolePermission(
                    role=UserRole.HYGIENIST,
                    permissions=[
                        TreatmentPlanPermission.CREATE_PLAN,
                        TreatmentPlanPermission.EDIT_PLAN,
                        TreatmentPlanPermission.ADD_NOTES,
                        TreatmentPlanPermission.VIEW_HISTORY,
                        TreatmentPlanPermission.PROPOSE_CHANGES
                    ],
                    description="Limited to hygiene treatment plans and proposing changes"
                ),
                UserRole.ASSISTANT.value: RolePermission(
                    role=UserRole.ASSISTANT,
                    permissions=[
                        TreatmentPlanPermission.ADD_NOTES,
                        TreatmentPlanPermission.VIEW_HISTORY,
                        TreatmentPlanPermission.PROPOSE_CHANGES
                    ],
                    description="Can add notes and propose changes to treatment plans"
                ),
                UserRole.BILLING_MANAGER.value: RolePermission(
                    role=UserRole.BILLING_MANAGER,
                    permissions=[
                        TreatmentPlanPermission.SUBMIT_CLAIM,
                        TreatmentPlanPermission.VIEW_HISTORY
                    ],
                    description="Can submit claims and view treatment plan history"
                )
            }
            self._save_permissions()

    def get_role_permissions(self, role: UserRole) -> Optional[RolePermission]:
        return self.role_permissions.get(role.value)

    def has_permission(self, role: UserRole, permission: TreatmentPlanPermission) -> bool:
        role_perms = self.get_role_permissions(role)
        if not role_perms:
            return False
        return permission in role_perms.permissions

    def update_role_permissions(self, role: UserRole, permissions: List[TreatmentPlanPermission], description: str):
        self.role_permissions[role.value] = RolePermission(
            role=role,
            permissions=permissions,
            description=description
        )
        self._save_permissions()

    def get_all_roles(self) -> List[RolePermission]:
        return list(self.role_permissions.values())

# Initialize the service
permissions_service = PermissionsService() 