from fastapi import APIRouter, WebSocket, Depends, HTTPException
from typing import Dict, Any, List
from pydantic import BaseModel
from ..services.email_service import email_service
from ..services.treatment_service import treatment_service
from ..auth.auth import get_current_user, User
from ..services.permissions_service import UserRole
from ..services.notification_service import (
    notification_service,
    Notification,
    NotificationSettings,
    NotificationType
)

router = APIRouter(prefix="/notifications", tags=["notifications"])

class NotificationSettings(BaseModel):
    email_enabled: bool
    preferences: Dict[str, bool]

class OverrideRequest(BaseModel):
    reason: str
    justification: str
    fields_to_unlock: List[str]

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await notification_service.connect(websocket, user_id)
    try:
        while True:
            # Keep the connection alive
            await websocket.receive_text()
    except Exception as e:
        notification_service.disconnect(websocket, user_id)

@router.get("", response_model=List[Notification])
async def get_notifications(current_user: User = Depends(get_current_user)):
    return await notification_service.get_notifications(current_user.id)

@router.post("/{notification_id}/read")
async def mark_as_read(notification_id: str, current_user: User = Depends(get_current_user)):
    await notification_service.mark_as_read(current_user.id, notification_id)
    return {"status": "success"}

@router.post("/read-all")
async def mark_all_as_read(current_user: User = Depends(get_current_user)):
    await notification_service.mark_all_as_read(current_user.id)
    return {"status": "success"}

@router.delete("/{notification_id}")
async def dismiss_notification(notification_id: str, current_user: User = Depends(get_current_user)):
    await notification_service.dismiss_notification(current_user.id, notification_id)
    return {"status": "success"}

@router.get("/settings", response_model=NotificationSettings)
async def get_settings(current_user: User = Depends(get_current_user)):
    return await notification_service.get_settings(current_user.id)

@router.put("/settings")
async def update_settings(
    settings: NotificationSettings,
    current_user: User = Depends(get_current_user)
):
    await notification_service.update_settings(current_user.id, settings)
    return {"status": "success"}

# Helper endpoint for creating notifications (for testing)
@router.post("/test")
async def create_test_notification(
    type: NotificationType,
    title: str,
    message: str,
    current_user: User = Depends(get_current_user)
):
    notification = await notification_service.create_notification(
        current_user.id,
        type,
        title,
        message
    )
    return notification

@router.get("/treatment-plans/{plan_id}/notifications", response_model=NotificationSettings)
async def get_notification_settings(
    plan_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get notification settings for a treatment plan"""
    try:
        return treatment_service.get_notification_settings(plan_id, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/treatment-plans/{plan_id}/notifications", response_model=NotificationSettings)
async def update_notification_settings(
    plan_id: str,
    settings: NotificationSettings,
    current_user: User = Depends(get_current_user)
):
    """Update notification settings for a treatment plan"""
    try:
        return treatment_service.update_notification_settings(
            plan_id,
            current_user.id,
            settings.email_enabled,
            settings.preferences
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/treatment-plans/{plan_id}/override-request")
async def request_financial_override(
    plan_id: str,
    request: OverrideRequest,
    current_user: User = Depends(get_current_user)
):
    """Request a financial override for a treatment plan"""
    try:
        # Verify user has permission to request override
        if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN]:
            raise HTTPException(status_code=403, detail="Only doctors and admins can request overrides")

        # Create the override request
        override = treatment_service.create_override_request(
            plan_id=plan_id,
            requester_id=current_user.id,
            reason=request.reason,
            justification=request.justification,
            fields_to_unlock=request.fields_to_unlock
        )

        # Send notification to admins
        admins = treatment_service.get_plan_admins(plan_id)
        for admin in admins:
            email_service.send_override_request_notification(
                to_email=admin.email,
                plan_id=plan_id,
                requester_name=current_user.name,
                reason=request.reason
            )

        return {"message": "Override request submitted successfully", "request_id": override.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/treatment-plans/{plan_id}/override-request/{request_id}/approve")
async def approve_override_request(
    plan_id: str,
    request_id: str,
    current_user: User = Depends(get_current_user)
):
    """Approve a financial override request"""
    try:
        # Verify user is admin
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Only admins can approve override requests")

        # Approve the request
        override = treatment_service.approve_override_request(
            plan_id=plan_id,
            request_id=request_id,
            approved_by=current_user.id
        )

        # Send notification to requester
        requester = treatment_service.get_user(override.requester_id)
        email_service.send_edit_approval_notification(
            to_email=requester.email,
            plan_id=plan_id,
            approver_name=current_user.name,
            status="approved"
        )

        return {"message": "Override request approved successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/treatment-plans/{plan_id}/override-request/{request_id}/reject")
async def reject_override_request(
    plan_id: str,
    request_id: str,
    current_user: User = Depends(get_current_user)
):
    """Reject a financial override request"""
    try:
        # Verify user is admin
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Only admins can reject override requests")

        # Reject the request
        override = treatment_service.reject_override_request(
            plan_id=plan_id,
            request_id=request_id,
            rejected_by=current_user.id
        )

        # Send notification to requester
        requester = treatment_service.get_user(override.requester_id)
        email_service.send_edit_approval_notification(
            to_email=requester.email,
            plan_id=plan_id,
            approver_name=current_user.name,
            status="rejected"
        )

        return {"message": "Override request rejected successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 