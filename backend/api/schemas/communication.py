from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum

class CommunicationChannel(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    VOICE = "voice"

class CommunicationIntent(str, Enum):
    BOOK_APPOINTMENT = "book_appointment"
    CANCEL_APPOINTMENT = "cancel_appointment"
    REQUEST_AVAILABILITY = "request_availability"
    PAYMENT_REQUEST = "payment_request"
    PAYMENT_QUESTION = "payment_question"
    VERIFY_COVERAGE = "verify_coverage"
    INSURANCE_QUESTION = "insurance_question"
    LAB_RESULTS = "lab_results"
    URGENT = "urgent"
    GENERAL = "general"

class MessageCategory(str, Enum):
    APPOINTMENT = "appointment"
    PAYMENT = "payment"
    INSURANCE = "insurance"
    LAB_RESULTS = "lab_results"
    GENERAL = "general"
    URGENT = "urgent"

class CommunicationMessage(BaseModel):
    patient_id: int
    subject: Optional[str] = None
    body: str
    attachments: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None

class CommunicationLogBase(BaseModel):
    patient_id: int
    channel: CommunicationChannel
    message_type: MessageCategory
    subject: Optional[str] = None
    body: str
    status: str
    intent: Optional[CommunicationIntent] = None
    metadata: Optional[Dict[str, Any]] = None

class CommunicationLogCreate(CommunicationLogBase):
    pass

class CommunicationLog(CommunicationLogBase):
    id: int
    sent_at: datetime
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    response_received_at: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        orm_mode = True

class CommunicationPreferenceBase(BaseModel):
    patient_id: int
    preferred_channel: CommunicationChannel
    allow_sms: bool = True
    allow_voice: bool = True
    allow_email: bool = True
    allow_urgent_calls: bool = True
    allow_sensitive_emails: bool = True

class CommunicationPreferenceCreate(CommunicationPreferenceBase):
    pass

class CommunicationPreference(CommunicationPreferenceBase):
    id: int
    sms_consent_date: Optional[datetime] = None
    voice_consent_date: Optional[datetime] = None
    email_consent_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class CommunicationEscalationBase(BaseModel):
    communication_id: int
    original_channel: CommunicationChannel
    escalated_to: CommunicationChannel
    escalation_reason: str
    scheduled_for: datetime

class CommunicationEscalationCreate(CommunicationEscalationBase):
    pass

class CommunicationEscalation(CommunicationEscalationBase):
    id: int
    executed_at: Optional[datetime] = None
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class CommunicationAnalytics(BaseModel):
    total_messages: int
    by_channel: Dict[CommunicationChannel, int]
    by_category: Dict[MessageCategory, int]
    by_intent: Dict[CommunicationIntent, int]
    average_response_time: float
    success_rate: float
    escalation_count: int
    most_effective_channel: CommunicationChannel
    busiest_hours: List[int]
    busiest_days: List[str] 