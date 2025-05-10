from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import logging
import re
from enum import Enum
import json

from ..models.communication import CommunicationLog, CommunicationPreference
from ..schemas.communication import CommunicationMessage, CommunicationChannel, CommunicationIntent

logger = logging.getLogger(__name__)

class MessageCategory(str, Enum):
    APPOINTMENT = "appointment"
    PAYMENT = "payment"
    INSURANCE = "insurance"
    LAB_RESULTS = "lab_results"
    GENERAL = "general"
    URGENT = "urgent"

class CommunicationAIProcessor:
    def __init__(self, db):
        self.db = db
        self.intent_patterns = {
            MessageCategory.APPOINTMENT: [
                r"schedule|book|appointment|visit|checkup|consultation",
                r"available|next opening|next slot",
                r"cancel|reschedule|change appointment"
            ],
            MessageCategory.PAYMENT: [
                r"bill|payment|invoice|charge|cost|price",
                r"insurance|coverage|claim",
                r"balance|outstanding|due"
            ],
            MessageCategory.INSURANCE: [
                r"insurance|coverage|plan|benefits",
                r"claim|submission|pre-authorization",
                r"network|provider|in-network"
            ],
            MessageCategory.LAB_RESULTS: [
                r"lab|results|test|x-ray|scan",
                r"report|findings|analysis",
                r"ready|available|complete"
            ],
            MessageCategory.URGENT: [
                r"emergency|urgent|immediate|asap",
                r"pain|swelling|infection|bleeding",
                r"broken|cracked|lost|damaged"
            ]
        }

    async def process_message(
        self,
        message: CommunicationMessage,
        channel: CommunicationChannel
    ) -> Dict[str, Any]:
        """
        Process a message from any communication channel.
        """
        try:
            # Detect message category and intent
            category, intent = self._detect_category_and_intent(message.body)
            
            # Generate response
            response = await self._generate_response(
                message=message,
                category=category,
                intent=intent,
                channel=channel
            )

            # Check for escalation needs
            escalation_rule = self._check_escalation_rules(
                message=message,
                category=category,
                intent=intent
            )

            # Track analytics
            self._track_analytics(
                message=message,
                category=category,
                intent=intent,
                channel=channel
            )

            return {
                "status": "success",
                "category": category,
                "intent": intent,
                "response": response,
                "escalation_rule": escalation_rule,
                "analytics": {
                    "processed_at": datetime.utcnow(),
                    "channel": channel,
                    "category": category,
                    "intent": intent
                }
            }

        except Exception as e:
            logger.error(f"Failed to process message: {str(e)}")
            return {
                "status": "error",
                "error": str(e)
            }

    def _detect_category_and_intent(
        self,
        message_body: str
    ) -> tuple[MessageCategory, CommunicationIntent]:
        """
        Detect the category and intent of a message.
        """
        message_lower = message_body.lower()
        
        # Check for urgent messages first
        if any(re.search(pattern, message_lower) for pattern in self.intent_patterns[MessageCategory.URGENT]):
            return MessageCategory.URGENT, CommunicationIntent.URGENT

        # Check other categories
        for category, patterns in self.intent_patterns.items():
            if category != MessageCategory.URGENT and any(re.search(pattern, message_lower) for pattern in patterns):
                intent = self._determine_intent(category, message_lower)
                return category, intent

        return MessageCategory.GENERAL, CommunicationIntent.GENERAL

    def _determine_intent(
        self,
        category: MessageCategory,
        message: str
    ) -> CommunicationIntent:
        """
        Determine the specific intent within a category.
        """
        if category == MessageCategory.APPOINTMENT:
            if "cancel" in message or "reschedule" in message:
                return CommunicationIntent.CANCEL_APPOINTMENT
            elif "available" in message or "next" in message:
                return CommunicationIntent.REQUEST_AVAILABILITY
            else:
                return CommunicationIntent.BOOK_APPOINTMENT
        elif category == MessageCategory.PAYMENT:
            if "question" in message or "clarify" in message:
                return CommunicationIntent.PAYMENT_QUESTION
            else:
                return CommunicationIntent.PAYMENT_REQUEST
        elif category == MessageCategory.INSURANCE:
            if "verify" in message or "check" in message:
                return CommunicationIntent.VERIFY_COVERAGE
            else:
                return CommunicationIntent.INSURANCE_QUESTION
        elif category == MessageCategory.LAB_RESULTS:
            return CommunicationIntent.LAB_RESULTS
        else:
            return CommunicationIntent.GENERAL

    async def _generate_response(
        self,
        message: CommunicationMessage,
        category: MessageCategory,
        intent: CommunicationIntent,
        channel: CommunicationChannel
    ) -> Dict[str, Any]:
        """
        Generate an appropriate response based on the message category and intent.
        """
        # Get patient preferences
        preferences = self.db.query(CommunicationPreference).filter(
            CommunicationPreference.patient_id == message.patient_id
        ).first()

        # Generate response based on category and intent
        response = {
            "content": self._get_response_template(category, intent),
            "channel": channel,
            "priority": "high" if category == MessageCategory.URGENT else "normal",
            "suggested_actions": self._get_suggested_actions(category, intent)
        }

        # Add channel-specific formatting
        if channel == CommunicationChannel.EMAIL:
            response["subject"] = self._get_email_subject(category, intent)
            response["html"] = True
        elif channel == CommunicationChannel.SMS:
            response["content"] = self._format_sms_content(response["content"])
        elif channel == CommunicationChannel.VOICE:
            response["content"] = self._format_voice_content(response["content"])

        return response

    def _check_escalation_rules(
        self,
        message: CommunicationMessage,
        category: MessageCategory,
        intent: CommunicationIntent
    ) -> Optional[Dict[str, Any]]:
        """
        Check if the message requires escalation based on rules.
        """
        if category == MessageCategory.URGENT:
            return {
                "escalate": True,
                "delay_minutes": 0,
                "next_channel": CommunicationChannel.VOICE
            }
        
        if intent in [CommunicationIntent.BOOK_APPOINTMENT, CommunicationIntent.REQUEST_AVAILABILITY]:
            return {
                "escalate": True,
                "delay_minutes": 360,  # 6 hours
                "next_channel": CommunicationChannel.SMS
            }

        return None

    def _track_analytics(
        self,
        message: CommunicationMessage,
        category: MessageCategory,
        intent: CommunicationIntent,
        channel: CommunicationChannel
    ) -> None:
        """
        Track communication analytics.
        """
        log = CommunicationLog(
            patient_id=message.patient_id,
            channel=channel,
            message_type=category,
            subject=message.subject,
            body=message.body,
            status="processed",
            sent_at=datetime.utcnow(),
            intent=intent
        )
        self.db.add(log)
        self.db.commit()

    def _get_response_template(
        self,
        category: MessageCategory,
        intent: CommunicationIntent
    ) -> str:
        """
        Get a response template based on category and intent.
        """
        templates = {
            (MessageCategory.APPOINTMENT, CommunicationIntent.BOOK_APPOINTMENT): (
                "Thank you for your appointment request. I'll check our availability and get back to you shortly."
            ),
            (MessageCategory.APPOINTMENT, CommunicationIntent.REQUEST_AVAILABILITY): (
                "Here are our available appointment slots for the next week. Please let me know which time works best for you."
            ),
            (MessageCategory.APPOINTMENT, CommunicationIntent.CANCEL_APPOINTMENT): (
                "I'll help you cancel your appointment. Please confirm if you'd like to reschedule."
            ),
            (MessageCategory.PAYMENT, CommunicationIntent.PAYMENT_REQUEST): (
                "Here's your current balance and payment options. Let me know if you have any questions."
            ),
            (MessageCategory.INSURANCE, CommunicationIntent.VERIFY_COVERAGE): (
                "I'll verify your insurance coverage and get back to you with the details."
            ),
            (MessageCategory.LAB_RESULTS, CommunicationIntent.LAB_RESULTS): (
                "Your lab results are ready. I'll send them to you securely."
            ),
            (MessageCategory.URGENT, CommunicationIntent.URGENT): (
                "I understand this is urgent. I'll contact you immediately to address your concern."
            )
        }
        return templates.get((category, intent), "Thank you for your message. I'll get back to you shortly.")

    def _get_suggested_actions(
        self,
        category: MessageCategory,
        intent: CommunicationIntent
    ) -> List[Dict[str, Any]]:
        """
        Get suggested actions based on category and intent.
        """
        actions = {
            (MessageCategory.APPOINTMENT, CommunicationIntent.BOOK_APPOINTMENT): [
                {"action": "view_calendar", "label": "View Available Slots"},
                {"action": "call_office", "label": "Call Office"}
            ],
            (MessageCategory.PAYMENT, CommunicationIntent.PAYMENT_REQUEST): [
                {"action": "view_balance", "label": "View Balance"},
                {"action": "make_payment", "label": "Make Payment"}
            ],
            (MessageCategory.INSURANCE, CommunicationIntent.VERIFY_COVERAGE): [
                {"action": "upload_insurance", "label": "Upload Insurance Card"},
                {"action": "verify_coverage", "label": "Verify Coverage"}
            ]
        }
        return actions.get((category, intent), [])

    def _get_email_subject(
        self,
        category: MessageCategory,
        intent: CommunicationIntent
    ) -> str:
        """
        Get an appropriate email subject based on category and intent.
        """
        subjects = {
            (MessageCategory.APPOINTMENT, CommunicationIntent.BOOK_APPOINTMENT): "Appointment Request",
            (MessageCategory.APPOINTMENT, CommunicationIntent.REQUEST_AVAILABILITY): "Available Appointment Slots",
            (MessageCategory.PAYMENT, CommunicationIntent.PAYMENT_REQUEST): "Payment Information",
            (MessageCategory.INSURANCE, CommunicationIntent.VERIFY_COVERAGE): "Insurance Verification",
            (MessageCategory.URGENT, CommunicationIntent.URGENT): "URGENT: Immediate Attention Required"
        }
        return subjects.get((category, intent), "Message from Your Dental Office")

    def _format_sms_content(self, content: str) -> str:
        """
        Format content for SMS messages.
        """
        # Remove HTML tags
        content = re.sub(r'<[^>]+>', '', content)
        # Truncate if too long
        if len(content) > 160:
            content = content[:157] + "..."
        return content

    def _format_voice_content(self, content: str) -> str:
        """
        Format content for voice messages.
        """
        # Remove special characters and format for speech
        content = re.sub(r'[^\w\s.,!?]', '', content)
        return content

# Singleton instance
communication_ai_processor = CommunicationAIProcessor(None)  # DB session will be injected when used 