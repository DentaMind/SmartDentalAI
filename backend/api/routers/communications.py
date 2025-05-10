from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, constr

from api.database import get_db
from api.schemas.communication import (
    CommunicationMessage,
    CommunicationLog,
    CommunicationPreference,
    CommunicationAnalytics,
    CommunicationChannel,
    CommunicationIntent,
    MessageCategory,
)
from api.services.communication_service import communication_service
from api.services.sms_sender import sms_sender
from api.services.email_sender import email_sender
from api.services.voice_call_sender import voice_call_sender
from api.services.security_service import SecurityService
from api.dependencies.security import get_security_service

router = APIRouter(prefix="/communications", tags=["communications"])

class MessageTemplate(BaseModel):
    id: str
    subject: str
    body: str

class PhoneValidationRequest(BaseModel):
    phone_number: constr(regex=r'^\+?1?\d{9,15}$')

class PhoneValidationResponse(BaseModel):
    is_valid: bool

@router.post("/send", response_model=CommunicationLog)
async def send_message(
    message: CommunicationMessage,
    preferred_channel: Optional[CommunicationChannel] = None,
    force_channel: Optional[CommunicationChannel] = None,
    request: Request = None,
    db: Session = Depends(get_db),
    security_service: SecurityService = Depends(get_security_service)
):
    """Send a message through the appropriate channel."""
    try:
        # Get user ID from request (assuming it's in the headers)
        user_id = request.headers.get("X-User-ID")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID required")
        
        # Send message
        communication_service = CommunicationService(db)
        log = await communication_service.send_message(
            message=message,
            preferred_channel=preferred_channel,
            force_channel=force_channel
        )
        
        # Encrypt sensitive data
        security_service.encrypt_communication_log(log, user_id)
        
        # Log access
        security_service.log_access(
            user_id=user_id,
            entity_type="communication_log",
            entity_id=str(log.id),
            action="create",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        
        return log
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/logs", response_model=List[CommunicationLog])
async def get_logs(
    patient_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    channel: Optional[CommunicationChannel] = None,
    category: Optional[MessageCategory] = None,
    intent: Optional[CommunicationIntent] = None,
    request: Request = None,
    db: Session = Depends(get_db),
    security_service: SecurityService = Depends(get_security_service)
):
    """Get communication logs with optional filtering."""
    try:
        # Get user ID from request
        user_id = request.headers.get("X-User-ID")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID required")
        
        # Get logs
        communication_service = CommunicationService(db)
        logs = await communication_service.get_communication_logs(
            patient_id=patient_id,
            start_date=start_date,
            end_date=end_date,
            channel=channel,
            category=category,
            intent=intent
        )
        
        # Decrypt sensitive data and log access
        for log in logs:
            security_service.decrypt_communication_log(log, user_id)
            security_service.log_access(
                user_id=user_id,
                entity_type="communication_log",
                entity_id=str(log.id),
                action="read",
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent")
            )
        
        return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/preferences/{patient_id}", response_model=CommunicationPreference)
async def get_preferences(
    patient_id: str,
    request: Request = None,
    db: Session = Depends(get_db),
    security_service: SecurityService = Depends(get_security_service)
):
    """Get a patient's communication preferences."""
    try:
        # Get user ID from request
        user_id = request.headers.get("X-User-ID")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID required")
        
        # Get preferences
        communication_service = CommunicationService(db)
        preferences = await communication_service.get_communication_preferences(patient_id)
        
        # Log access
        security_service.log_access(
            user_id=user_id,
            entity_type="communication_preference",
            entity_id=patient_id,
            action="read",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        
        return preferences
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/preferences/{patient_id}", response_model=CommunicationPreference)
async def update_preferences(
    patient_id: str,
    preferences: CommunicationPreference,
    request: Request = None,
    db: Session = Depends(get_db),
    security_service: SecurityService = Depends(get_security_service)
):
    """Update a patient's communication preferences."""
    try:
        # Get user ID from request
        user_id = request.headers.get("X-User-ID")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID required")
        
        # Update preferences
        communication_service = CommunicationService(db)
        updated_preferences = await communication_service.update_communication_preferences(
            patient_id=patient_id,
            preferences=preferences
        )
        
        # Update consent history
        for channel in CommunicationChannel:
            consent_field = f"{channel.value}_consent"
            if hasattr(preferences, consent_field):
                security_service.update_consent_history(
                    patient_id=patient_id,
                    channel=channel,
                    consent=getattr(preferences, consent_field),
                    user_id=user_id,
                    reason="Updated through API"
                )
        
        # Log access
        security_service.log_access(
            user_id=user_id,
            entity_type="communication_preference",
            entity_id=patient_id,
            action="update",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        
        return updated_preferences
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics", response_model=List[CommunicationAnalytics])
async def get_analytics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    request: Request = None,
    db: Session = Depends(get_db),
    security_service: SecurityService = Depends(get_security_service)
):
    """Get communication analytics."""
    try:
        # Get user ID from request
        user_id = request.headers.get("X-User-ID")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID required")
        
        # Get analytics
        communication_service = CommunicationService(db)
        analytics = await communication_service.get_communication_analytics(
            start_date=start_date,
            end_date=end_date
        )
        
        # Log access
        for analytic in analytics:
            security_service.log_access(
                user_id=user_id,
                entity_type="communication_analytics",
                entity_id=str(analytic.id),
                action="read",
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent")
            )
        
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/audit-logs")
async def get_audit_logs(
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    user_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 100,
    request: Request = None,
    security_service: SecurityService = Depends(get_security_service)
):
    """Get audit logs with optional filtering."""
    try:
        # Get requesting user ID
        requesting_user_id = request.headers.get("X-User-ID")
        if not requesting_user_id:
            raise HTTPException(status_code=401, detail="User ID required")
        
        # Get audit logs
        logs = security_service.get_audit_logs(
            entity_type=entity_type,
            entity_id=entity_id,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            limit=limit
        )
        
        # Log access to audit logs
        security_service.log_access(
            user_id=requesting_user_id,
            entity_type="audit_log",
            entity_id="all",
            action="read",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent")
        )
        
        return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{message_id}", response_model=CommunicationLog)
async def get_message_status(
    message_id: str,
    db: Session = Depends(get_db)
):
    try:
        log = await communication_service.get_message_status(
            db=db,
            message_id=message_id
        )
        if not log:
            raise HTTPException(status_code=404, detail="Message not found")
        return log
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/resend/{message_id}", response_model=CommunicationLog)
async def resend_message(
    message_id: str,
    db: Session = Depends(get_db)
):
    try:
        return await communication_service.resend_message(
            db=db,
            message_id=message_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/validate-phone", response_model=PhoneValidationResponse)
async def validate_phone_number(
    request: PhoneValidationRequest,
    db: Session = Depends(get_db)
):
    try:
        is_valid = await sms_sender.validate_phone_number(request.phone_number)
        return PhoneValidationResponse(is_valid=is_valid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/templates", response_model=List[MessageTemplate])
async def get_message_templates(
    category: Optional[MessageCategory] = None,
    intent: Optional[CommunicationIntent] = None,
    db: Session = Depends(get_db)
):
    try:
        return await communication_service.get_message_templates(
            db=db,
            category=category,
            intent=intent
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 