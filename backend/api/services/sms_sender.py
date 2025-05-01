from typing import Dict, Any, Optional
import logging
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from ..config import settings

logger = logging.getLogger(__name__)

class SMSSender:
    def __init__(self):
        self.client = Client(
            settings.TWILIO_ACCOUNT_SID,
            settings.TWILIO_AUTH_TOKEN
        )
        self.from_number = settings.TWILIO_PHONE_NUMBER

    async def send(
        self,
        to: str,
        body: str,
        media_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send an SMS message using Twilio.
        
        Args:
            to: Recipient phone number (E.164 format)
            body: Message content
            media_url: Optional URL for media attachment
            
        Returns:
            Dict containing message details and status
        """
        try:
            message_params = {
                "from_": self.from_number,
                "to": to,
                "body": body
            }
            
            if media_url:
                message_params["media_url"] = media_url

            message = self.client.messages.create(**message_params)

            return {
                "status": "success",
                "message_id": message.sid,
                "status_code": message.status,
                "error_code": None,
                "error_message": None
            }

        except TwilioRestException as e:
            logger.error(f"Failed to send SMS: {str(e)}")
            return {
                "status": "error",
                "message_id": None,
                "status_code": None,
                "error_code": e.code,
                "error_message": str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error sending SMS: {str(e)}")
            return {
                "status": "error",
                "message_id": None,
                "status_code": None,
                "error_code": None,
                "error_message": str(e)
            }

    async def get_message_status(self, message_id: str) -> Dict[str, Any]:
        """
        Get the status of a sent SMS message.
        
        Args:
            message_id: Twilio message SID
            
        Returns:
            Dict containing current message status
        """
        try:
            message = self.client.messages(message_id).fetch()
            
            return {
                "status": "success",
                "message_id": message.sid,
                "status_code": message.status,
                "error_code": None,
                "error_message": None
            }

        except TwilioRestException as e:
            logger.error(f"Failed to get message status: {str(e)}")
            return {
                "status": "error",
                "message_id": message_id,
                "status_code": None,
                "error_code": e.code,
                "error_message": str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error getting message status: {str(e)}")
            return {
                "status": "error",
                "message_id": message_id,
                "status_code": None,
                "error_code": None,
                "error_message": str(e)
            }

    def validate_phone_number(self, phone_number: str) -> bool:
        """
        Validate a phone number format.
        
        Args:
            phone_number: Phone number to validate
            
        Returns:
            bool indicating if the number is valid
        """
        try:
            # Use Twilio's phone number lookup service
            self.client.lookups.v1.phone_numbers(phone_number).fetch()
            return True
        except TwilioRestException:
            return False

# Singleton instance
sms_sender = SMSSender() 