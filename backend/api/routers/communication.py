from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..models.communication import CommunicationLog, CommunicationPreference, CommunicationEscalation
from ..schemas.communication import (
    CommunicationMessage,
    CommunicationLog as CommunicationLogSchema,
    CommunicationPreference as CommunicationPreferenceSchema,
    CommunicationEscalation as CommunicationEscalationSchema,
    CommunicationAnalytics,
    CommunicationChannel,
    MessageCategory,
    CommunicationIntent
)
from ..services.communication_service import communication_service
from ..services.communication_ai_processor import communication_ai_processor

router = APIRouter(prefix="/communications", tags=["communications"])

@router.post("/send", response_model=CommunicationLogSchema)
async def send_message(
    message: CommunicationMessage,
    preferred_channel: Optional[CommunicationChannel] = None,
    force_channel: bool = False,
    db: Session = Depends(get_db)
):
    """
    Send a message through the most appropriate channel based on patient preferences.
    """
    try:
        # Process the message with AI
        ai_result = await communication_ai_processor.process_message(
            message=message,
            channel=preferred_channel or CommunicationChannel.EMAIL
        )

        # Send the message
        result = await communication_service.send_message(
            patient_id=message.patient_id,
            message=message,
            preferred_channel=preferred_channel,
            force_channel=force_channel
        )

        # Create communication log
        log = CommunicationLog(
            patient_id=message.patient_id,
            channel=result["channel"],
            message_type=ai_result["category"],
            subject=message.subject,
            body=message.body,
            status="sent",
            intent=ai_result["intent"],
            metadata={
                "ai_processing": ai_result,
                "delivery_result": result
            }
        )
        db.add(log)
        db.commit()
        db.refresh(log)

        # Handle escalation if needed
        if ai_result["escalation_rule"]:
            escalation = CommunicationEscalation(
                communication_id=log.id,
                original_channel=result["channel"],
                escalated_to=ai_result["escalation_rule"]["next_channel"],
                escalation_reason=f"Automatic escalation for {ai_result['category']}",
                scheduled_for=datetime.utcnow() + timedelta(minutes=ai_result["escalation_rule"]["delay_minutes"]),
                status="pending"
            )
            db.add(escalation)
            db.commit()

        return log

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/logs", response_model=List[CommunicationLogSchema])
async def get_communication_logs(
    patient_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    channel: Optional[CommunicationChannel] = None,
    category: Optional[MessageCategory] = None,
    intent: Optional[CommunicationIntent] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve communication logs with optional filtering.
    """
    query = db.query(CommunicationLog)

    if patient_id:
        query = query.filter(CommunicationLog.patient_id == patient_id)
    if start_date:
        query = query.filter(CommunicationLog.sent_at >= start_date)
    if end_date:
        query = query.filter(CommunicationLog.sent_at <= end_date)
    if channel:
        query = query.filter(CommunicationLog.channel == channel)
    if category:
        query = query.filter(CommunicationLog.message_type == category)
    if intent:
        query = query.filter(CommunicationLog.intent == intent)

    return query.order_by(CommunicationLog.sent_at.desc()).all()

@router.get("/preferences/{patient_id}", response_model=CommunicationPreferenceSchema)
async def get_communication_preferences(
    patient_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a patient's communication preferences.
    """
    preferences = db.query(CommunicationPreference).filter(
        CommunicationPreference.patient_id == patient_id
    ).first()

    if not preferences:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Communication preferences not found"
        )

    return preferences

@router.put("/preferences/{patient_id}", response_model=CommunicationPreferenceSchema)
async def update_communication_preferences(
    patient_id: int,
    preferences: CommunicationPreferenceSchema,
    db: Session = Depends(get_db)
):
    """
    Update a patient's communication preferences.
    """
    existing = db.query(CommunicationPreference).filter(
        CommunicationPreference.patient_id == patient_id
    ).first()

    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Communication preferences not found"
        )

    for key, value in preferences.dict(exclude_unset=True).items():
        setattr(existing, key, value)

    db.commit()
    db.refresh(existing)
    return existing

@router.get("/analytics", response_model=CommunicationAnalytics)
async def get_communication_analytics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """
    Get communication analytics.
    """
    query = db.query(CommunicationLog)

    if start_date:
        query = query.filter(CommunicationLog.sent_at >= start_date)
    if end_date:
        query = query.filter(CommunicationLog.sent_at <= end_date)

    logs = query.all()

    # Calculate analytics
    total_messages = len(logs)
    by_channel = {}
    by_category = {}
    by_intent = {}
    response_times = []
    successful_messages = 0
    escalation_count = 0

    for log in logs:
        # Count by channel
        by_channel[log.channel] = by_channel.get(log.channel, 0) + 1
        
        # Count by category
        by_category[log.message_type] = by_category.get(log.message_type, 0) + 1
        
        # Count by intent
        if log.intent:
            by_intent[log.intent] = by_intent.get(log.intent, 0) + 1
        
        # Calculate response time if available
        if log.response_received_at and log.sent_at:
            response_times.append((log.response_received_at - log.sent_at).total_seconds())
        
        # Count successful messages
        if log.status == "delivered" or log.status == "read":
            successful_messages += 1
        
        # Count escalations
        escalation_count += len(log.escalations)

    # Calculate averages
    average_response_time = sum(response_times) / len(response_times) if response_times else 0
    success_rate = (successful_messages / total_messages) * 100 if total_messages > 0 else 0

    # Find most effective channel
    most_effective_channel = max(by_channel.items(), key=lambda x: x[1])[0] if by_channel else None

    # Get busiest hours and days (simplified for example)
    busiest_hours = list(range(9, 17))  # Would be calculated from actual data
    busiest_days = ["Monday", "Wednesday", "Friday"]  # Would be calculated from actual data

    return CommunicationAnalytics(
        total_messages=total_messages,
        by_channel=by_channel,
        by_category=by_category,
        by_intent=by_intent,
        average_response_time=average_response_time,
        success_rate=success_rate,
        escalation_count=escalation_count,
        most_effective_channel=most_effective_channel,
        busiest_hours=busiest_hours,
        busiest_days=busiest_days
    ) 