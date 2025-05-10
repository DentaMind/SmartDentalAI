from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..services.permissions_service import (
    permissions_service,
    UserRole,
    TreatmentPlanPermission,
    RolePermission
)
from ..auth.auth import get_current_user, User

router = APIRouter()

@router.get("/roles", response_model=List[RolePermission])
async def get_all_roles(current_user: User = Depends(get_current_user)):
    """Get all role permissions (admin only)"""
    if current_user.role != UserRole.ADMIN_DENTIST:
        raise HTTPException(status_code=403, detail="Only admin dentists can view role permissions")
    return permissions_service.get_all_roles()

@router.get("/roles/{role}", response_model=RolePermission)
async def get_role_permissions(role: UserRole, current_user: User = Depends(get_current_user)):
    """Get permissions for a specific role (admin only)"""
    if current_user.role != UserRole.ADMIN_DENTIST:
        raise HTTPException(status_code=403, detail="Only admin dentists can view role permissions")
    role_perms = permissions_service.get_role_permissions(role)
    if not role_perms:
        raise HTTPException(status_code=404, detail=f"Role {role} not found")
    return role_perms

@router.put("/roles/{role}")
async def update_role_permissions(
    role: UserRole,
    permissions: List[TreatmentPlanPermission],
    description: str,
    current_user: User = Depends(get_current_user)
):
    """Update permissions for a role (admin only)"""
    if current_user.role != UserRole.ADMIN_DENTIST:
        raise HTTPException(status_code=403, detail="Only admin dentists can update role permissions")
    permissions_service.update_role_permissions(role, permissions, description)
    return {"message": f"Permissions updated for role {role}"}

@router.get("/check-permission/{permission}")
async def check_permission(
    permission: TreatmentPlanPermission,
    current_user: User = Depends(get_current_user)
):
    """Check if current user has a specific permission"""
    has_perm = permissions_service.has_permission(current_user.role, permission)
    return {"has_permission": has_perm} 