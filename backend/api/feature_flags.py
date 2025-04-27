from typing import List, Dict, Any, Optional, Set
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from auth import get_current_user, require_admin
from services.feature_flag_service import FeatureFlagService, FeatureFlag
from redis_client import get_redis_client

router = APIRouter(prefix="/feature-flags", tags=["feature-flags"])

class FeatureFlagCreate(BaseModel):
    """Request model for creating a feature flag."""
    key: str
    description: str
    enabled: bool = False
    user_groups: Optional[Set[str]] = None
    percentage_rollout: Optional[int] = None
    enterprise_only: bool = False
    killswitch_enabled: bool = True
    alert_on_error: bool = True
    metadata: Optional[Dict[str, Any]] = None

class FeatureFlagUpdate(BaseModel):
    """Request model for updating a feature flag."""
    description: Optional[str] = None
    enabled: Optional[bool] = None
    user_groups: Optional[Set[str]] = None
    percentage_rollout: Optional[int] = None
    enterprise_only: Optional[bool] = None
    killswitch_enabled: Optional[bool] = None
    alert_on_error: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None

class FeatureFlagResponse(BaseModel):
    """Response model for feature flags."""
    key: str
    description: str
    enabled: bool
    user_groups: Set[str]
    percentage_rollout: Optional[int]
    enterprise_only: bool
    killswitch_enabled: bool
    alert_on_error: bool
    metadata: Dict[str, Any]

class KillswitchRequest(BaseModel):
    """Request model for emergency killswitch."""
    reason: str

@router.post("", response_model=FeatureFlagResponse)
async def create_feature_flag(
    flag_data: FeatureFlagCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Create a new feature flag. Admin only."""
    require_admin(current_user)
    
    # Validate percentage rollout
    if flag_data.percentage_rollout is not None:
        if not 0 <= flag_data.percentage_rollout <= 100:
            raise HTTPException(
                status_code=400,
                detail="Percentage rollout must be between 0 and 100"
            )
    
    # Create feature flag
    flag = FeatureFlag(
        key=flag_data.key,
        description=flag_data.description,
        enabled=flag_data.enabled,
        user_groups=flag_data.user_groups,
        percentage_rollout=flag_data.percentage_rollout,
        enterprise_only=flag_data.enterprise_only,
        killswitch_enabled=flag_data.killswitch_enabled,
        alert_on_error=flag_data.alert_on_error,
        metadata=flag_data.metadata or {}
    )
    
    try:
        service = FeatureFlagService(get_redis_client())
        service.create_feature_flag(db, flag, current_user.id)
        return flag.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=List[FeatureFlagResponse])
async def list_feature_flags(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """List all feature flags. Admin only."""
    require_admin(current_user)
    
    service = FeatureFlagService(get_redis_client())
    flags = service.list_feature_flags()
    return [flag.to_dict() for flag in flags]

@router.get("/{flag_key}", response_model=FeatureFlagResponse)
async def get_feature_flag(
    flag_key: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get a specific feature flag. Admin only."""
    require_admin(current_user)
    
    service = FeatureFlagService(get_redis_client())
    flag = service.get_feature_flag(flag_key)
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    return flag.to_dict()

@router.put("/{flag_key}", response_model=FeatureFlagResponse)
async def update_feature_flag(
    flag_key: str,
    flag_data: FeatureFlagUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Update a feature flag. Admin only."""
    require_admin(current_user)
    
    service = FeatureFlagService(get_redis_client())
    flag = service.get_feature_flag(flag_key)
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    
    # Update flag fields
    if flag_data.description is not None:
        flag.description = flag_data.description
    if flag_data.enabled is not None:
        flag.enabled = flag_data.enabled
    if flag_data.user_groups is not None:
        flag.user_groups = flag_data.user_groups
    if flag_data.percentage_rollout is not None:
        if not 0 <= flag_data.percentage_rollout <= 100:
            raise HTTPException(
                status_code=400,
                detail="Percentage rollout must be between 0 and 100"
            )
        flag.percentage_rollout = flag_data.percentage_rollout
    if flag_data.enterprise_only is not None:
        flag.enterprise_only = flag_data.enterprise_only
    if flag_data.killswitch_enabled is not None:
        flag.killswitch_enabled = flag_data.killswitch_enabled
    if flag_data.alert_on_error is not None:
        flag.alert_on_error = flag_data.alert_on_error
    if flag_data.metadata is not None:
        flag.metadata.update(flag_data.metadata)
    
    try:
        service.update_feature_flag(db, flag, current_user.id)
        return flag.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{flag_key}")
async def delete_feature_flag(
    flag_key: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Delete a feature flag. Admin only."""
    require_admin(current_user)
    
    service = FeatureFlagService(get_redis_client())
    try:
        service.delete_feature_flag(db, flag_key, current_user.id)
        return {"message": f"Feature flag '{flag_key}' deleted"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{flag_key}/killswitch")
async def emergency_killswitch(
    flag_key: str,
    request: KillswitchRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """Emergency killswitch for a feature flag. Admin only."""
    require_admin(current_user)
    
    service = FeatureFlagService(get_redis_client())
    try:
        service.emergency_killswitch(
            db,
            flag_key,
            current_user.id,
            request.reason
        )
        return {
            "message": f"Emergency killswitch activated for feature '{flag_key}'"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{flag_key}/audit-log")
async def get_feature_flag_audit_log(
    flag_key: str,
    limit: int = 100,
    skip: int = 0,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get audit log for a feature flag. Admin only."""
    require_admin(current_user)
    
    service = FeatureFlagService(get_redis_client())
    return service.get_audit_log(limit=limit, skip=skip) 