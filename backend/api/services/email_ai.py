from typing import Dict, Any, Optional, List
import logging
from datetime import datetime, timedelta
import re

from ..models.email import Email
from ..schemas.email import EmailCreate
from ..services.calendar_service import calendar_service

logger = logging.getLogger(__name__)

class EmailAIProcessor:
    def __init__(self):
        self.intent_patterns = {
            "appointment_request": [
                r"schedule|book|appointment|visit|come in|see you",
                r"available|openings|slots|times"
            ],
            "lab_case_ready": [
                r"lab case|case ready|crown ready|bridge ready|denture ready",
                r"arriving|arrived|delivered|ready for pickup"
            ],
            "insurance_document": [
                r"insurance|coverage|claim|benefits|policy",
                r"document|form|paperwork|submission"
            ],
            "payment_reminder": [
                r"payment|bill|invoice|balance|due",
                r"reminder|overdue|past due|outstanding"
            ]
        }

        self.category_keywords = {
            "lab": ["lab", "case", "crown", "bridge", "denture", "implant"],
            "appointment": ["schedule", "book", "appointment", "visit"],
            "insurance": ["insurance", "claim", "coverage", "benefits"],
            "finance": ["payment", "bill", "invoice", "balance"],
            "general": ["question", "inquiry", "information"]
        }

    def process_email(self, email: EmailCreate) -> Dict[str, Any]:
        """Process an incoming email to determine intent and category."""
        try:
            # Combine subject and body for analysis
            content = f"{email.subject} {email.body}".lower()
            
            # Detect intent
            intent = self._detect_intent(content)
            
            # Categorize email
            category = self._categorize_email(content)
            
            # Generate response if needed
            response = self._generate_response(email, intent, category)
            
            return {
                "intent": intent,
                "category": category,
                "response": response,
                "needs_action": response is not None
            }
            
        except Exception as e:
            logger.error(f"Failed to process email: {str(e)}")
            return {
                "intent": "unknown",
                "category": "general",
                "response": None,
                "needs_action": False
            }

    def _detect_intent(self, content: str) -> str:
        """Detect the intent of the email content."""
        for intent, patterns in self.intent_patterns.items():
            if all(re.search(pattern, content) for pattern in patterns):
                return intent
        return "unknown"

    def _categorize_email(self, content: str) -> str:
        """Categorize the email based on keywords."""
        for category, keywords in self.category_keywords.items():
            if any(keyword in content for keyword in keywords):
                return category
        return "general"

    def _generate_response(
        self,
        email: EmailCreate,
        intent: str,
        category: str
    ) -> Optional[str]:
        """Generate an appropriate response based on intent and category."""
        if intent == "appointment_request":
            # Check calendar for availability
            available_slots = calendar_service.get_available_slots(
                start_date=datetime.now(),
                end_date=datetime.now() + timedelta(days=14)
            )
            
            if available_slots:
                return (
                    f"Thank you for your appointment request. "
                    f"We have the following slots available:\n\n"
                    f"{self._format_slots(available_slots)}\n\n"
                    f"Please let us know which time works best for you."
                )
            
        elif intent == "lab_case_ready":
            # Check calendar for fitting appointments
            available_slots = calendar_service.get_available_slots(
                start_date=datetime.now(),
                end_date=datetime.now() + timedelta(days=7),
                appointment_type="fitting"
            )
            
            if available_slots:
                return (
                    f"Your dental case is ready! "
                    f"We have the following fitting appointments available:\n\n"
                    f"{self._format_slots(available_slots)}\n\n"
                    f"Please let us know which time works best for you."
                )
            
        elif intent == "insurance_document":
            return (
                "Thank you for submitting your insurance documents. "
                "We will process them and update your account accordingly. "
                "You will receive a confirmation once the processing is complete."
            )
            
        elif intent == "payment_reminder":
            return (
                "Thank you for your payment. "
                "We have received it and updated your account. "
                "If you have any questions, please don't hesitate to contact us."
            )
            
        return None

    def _format_slots(self, slots: List[Dict[str, Any]]) -> str:
        """Format available time slots for email response."""
        return "\n".join(
            f"- {slot['date']} at {slot['time']} with {slot['provider']}"
            for slot in slots
        )

# Singleton instance
email_ai = EmailAIProcessor() 