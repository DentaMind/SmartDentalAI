from typing import Dict, Any, Optional
import logging
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from ..config import settings

logger = logging.getLogger(__name__)

class VoiceCallSender:
    def __init__(self):
        self.client = Client(
            settings.TWILIO_ACCOUNT_SID,
            settings.TWILIO_AUTH_TOKEN
        )
        self.from_number = settings.TWILIO_PHONE_NUMBER
        self.webhook_url = settings.TWILIO_VOICE_WEBHOOK_URL

    async def make_call(
        self,
        to: str,
        message: str,
        language: str = "en-US",
        voice: str = "Polly.Amy"
    ) -> Dict[str, Any]:
        """
        Make a voice call using Twilio.
        
        Args:
            to: Recipient phone number (E.164 format)
            message: Text to be converted to speech
            language: Language code for text-to-speech
            voice: Voice to use for text-to-speech
            
        Returns:
            Dict containing call details and status
        """
        try:
            # Create TwiML for the call
            twiml = f"""
            <Response>
                <Say language="{language}" voice="{voice}">
                    {message}
                </Say>
            </Response>
            """

            call = self.client.calls.create(
                to=to,
                from_=self.from_number,
                twiml=twiml,
                status_callback=self.webhook_url,
                status_callback_event=["initiated", "ringing", "answered", "completed"]
            )

            return {
                "status": "success",
                "call_id": call.sid,
                "status_code": call.status,
                "error_code": None,
                "error_message": None
            }

        except TwilioRestException as e:
            logger.error(f"Failed to make voice call: {str(e)}")
            return {
                "status": "error",
                "call_id": None,
                "status_code": None,
                "error_code": e.code,
                "error_message": str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error making voice call: {str(e)}")
            return {
                "status": "error",
                "call_id": None,
                "status_code": None,
                "error_code": None,
                "error_message": str(e)
            }

    async def get_call_status(self, call_id: str) -> Dict[str, Any]:
        """
        Get the status of a voice call.
        
        Args:
            call_id: Twilio call SID
            
        Returns:
            Dict containing current call status
        """
        try:
            call = self.client.calls(call_id).fetch()
            
            return {
                "status": "success",
                "call_id": call.sid,
                "status_code": call.status,
                "duration": call.duration,
                "error_code": None,
                "error_message": None
            }

        except TwilioRestException as e:
            logger.error(f"Failed to get call status: {str(e)}")
            return {
                "status": "error",
                "call_id": call_id,
                "status_code": None,
                "duration": None,
                "error_code": e.code,
                "error_message": str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error getting call status: {str(e)}")
            return {
                "status": "error",
                "call_id": call_id,
                "status_code": None,
                "duration": None,
                "error_code": None,
                "error_message": str(e)
            }

    async def cancel_call(self, call_id: str) -> Dict[str, Any]:
        """
        Cancel an ongoing voice call.
        
        Args:
            call_id: Twilio call SID
            
        Returns:
            Dict containing cancellation status
        """
        try:
            call = self.client.calls(call_id).update(status="completed")
            
            return {
                "status": "success",
                "call_id": call.sid,
                "status_code": call.status,
                "error_code": None,
                "error_message": None
            }

        except TwilioRestException as e:
            logger.error(f"Failed to cancel call: {str(e)}")
            return {
                "status": "error",
                "call_id": call_id,
                "status_code": None,
                "error_code": e.code,
                "error_message": str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error canceling call: {str(e)}")
            return {
                "status": "error",
                "call_id": call_id,
                "status_code": None,
                "error_code": None,
                "error_message": str(e)
            }

# Singleton instance
voice_call_sender = VoiceCallSender() 