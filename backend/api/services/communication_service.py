from typing import Dict, Any, Optional, List
from datetime import datetime
import logging
from enum import Enum
from pydantic import BaseModel

from .email_sender import EmailSender
from .sms_sender import SMSSender
from .voice_call_sender import VoiceCallSender
from ..models.communication import CommunicationLog, CommunicationPreference
from ..schemas.communication import CommunicationMessage, CommunicationChannel

logger = logging.getLogger(__name__)

class CommunicationStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    READ = "read"
    LISTENED = "listened"
    REPLIED = "replied"

class CommunicationService:
    def __init__(self, db):
        self.db = db
        self.email_sender = EmailSender()
        self.sms_sender = SMSSender()
        self.voice_call_sender = VoiceCallSender()

    async def send_message(
        self,
        patient_id: int,
        message: CommunicationMessage,
        preferred_channel: Optional[CommunicationChannel] = None,
        force_channel: bool = False
    ) -> Dict[str, Any]:
        """
        Send a message through the most appropriate channel based on patient preferences
        and message type.
        """
        try:
            # Get patient's communication preferences
            preferences = self.db.query(CommunicationPreference).filter(
                CommunicationPreference.patient_id == patient_id
            ).first()

            if not preferences:
                raise ValueError(f"No communication preferences found for patient {patient_id}")

            # Determine the best channel to use
            channel = self._determine_best_channel(
                message,
                preferences,
                preferred_channel,
                force_channel
            )

            # Send the message through the chosen channel
            result = await self._send_via_channel(channel, message, preferences)

            # Log the communication
            self._log_communication(
                patient_id=patient_id,
                channel=channel,
                message=message,
                status=CommunicationStatus.SENT,
                result=result
            )

            return {
                "status": "success",
                "channel": channel,
                "message_id": result.get("message_id"),
                "delivery_status": result.get("status")
            }

        except Exception as e:
            logger.error(f"Failed to send message: {str(e)}")
            return {
                "status": "error",
                "error": str(e)
            }

    def _determine_best_channel(
        self,
        message: CommunicationMessage,
        preferences: CommunicationPreference,
        preferred_channel: Optional[CommunicationChannel],
        force_channel: bool
    ) -> CommunicationChannel:
        """
        Determine the best channel to use for sending the message.
        """
        if force_channel and preferred_channel:
            return preferred_channel

        # Check if the message is urgent
        if message.is_urgent and preferences.allow_urgent_calls:
            return CommunicationChannel.VOICE

        # Check if the message contains sensitive information
        if message.is_sensitive and preferences.allow_sensitive_emails:
            return CommunicationChannel.EMAIL

        # Use patient's preferred channel
        return preferences.preferred_channel

    async def _send_via_channel(
        self,
        channel: CommunicationChannel,
        message: CommunicationMessage,
        preferences: CommunicationPreference
    ) -> Dict[str, Any]:
        """
        Send the message through the specified channel.
        """
        if channel == CommunicationChannel.EMAIL:
            return await self.email_sender.send(
                to=preferences.email,
                subject=message.subject,
                body=message.body,
                attachments=message.attachments
            )
        elif channel == CommunicationChannel.SMS:
            return await self.sms_sender.send(
                to=preferences.phone_number,
                body=message.body
            )
        elif channel == CommunicationChannel.VOICE:
            return await self.voice_call_sender.make_call(
                to=preferences.phone_number,
                message=message.body
            )
        else:
            raise ValueError(f"Unsupported communication channel: {channel}")

    def _log_communication(
        self,
        patient_id: int,
        channel: CommunicationChannel,
        message: CommunicationMessage,
        status: CommunicationStatus,
        result: Dict[str, Any]
    ) -> None:
        """
        Log the communication attempt in the database.
        """
        log = CommunicationLog(
            patient_id=patient_id,
            channel=channel,
            message_type=message.message_type,
            subject=message.subject,
            body=message.body,
            status=status,
            sent_at=datetime.utcnow(),
            delivery_status=result.get("status"),
            message_id=result.get("message_id")
        )
        self.db.add(log)
        self.db.commit()

    async def get_communication_history(
        self,
        patient_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        channel: Optional[CommunicationChannel] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve communication history for a patient.
        """
        query = self.db.query(CommunicationLog).filter(
            CommunicationLog.patient_id == patient_id
        )

        if start_date:
            query = query.filter(CommunicationLog.sent_at >= start_date)
        if end_date:
            query = query.filter(CommunicationLog.sent_at <= end_date)
        if channel:
            query = query.filter(CommunicationLog.channel == channel)

        logs = query.order_by(CommunicationLog.sent_at.desc()).all()

        return [
            {
                "id": log.id,
                "channel": log.channel,
                "message_type": log.message_type,
                "subject": log.subject,
                "status": log.status,
                "sent_at": log.sent_at,
                "delivery_status": log.delivery_status
            }
            for log in logs
        ]

    async def update_communication_preferences(
        self,
        patient_id: int,
        preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update a patient's communication preferences.
        """
        try:
            existing = self.db.query(CommunicationPreference).filter(
                CommunicationPreference.patient_id == patient_id
            ).first()

            if existing:
                for key, value in preferences.items():
                    setattr(existing, key, value)
            else:
                preferences["patient_id"] = patient_id
                existing = CommunicationPreference(**preferences)
                self.db.add(existing)

            self.db.commit()
            return {"status": "success", "preferences": existing}

        except Exception as e:
            logger.error(f"Failed to update communication preferences: {str(e)}")
            return {"status": "error", "error": str(e)}

# Singleton instance
communication_service = CommunicationService(None)  # DB session will be injected when used 