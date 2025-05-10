from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import logging
import asyncio
from sqlalchemy.orm import Session

from ..models.communication import CommunicationLog, CommunicationEscalation
from ..schemas.communication import CommunicationChannel, CommunicationMessage
from ..services.communication_service import communication_service
from ..services.communication_ai_processor import communication_ai_processor

logger = logging.getLogger(__name__)

class EscalationEngine:
    def __init__(self, db: Session):
        self.db = db
        self.running = False
        self.task = None

    async def start(self):
        """
        Start the escalation engine.
        """
        if self.running:
            return

        self.running = True
        self.task = asyncio.create_task(self._run())

    async def stop(self):
        """
        Stop the escalation engine.
        """
        if not self.running:
            return

        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass

    async def _run(self):
        """
        Main loop for the escalation engine.
        """
        while self.running:
            try:
                # Get pending escalations
                pending_escalations = self.db.query(CommunicationEscalation).filter(
                    CommunicationEscalation.status == "pending",
                    CommunicationEscalation.scheduled_for <= datetime.utcnow()
                ).all()

                # Process each pending escalation
                for escalation in pending_escalations:
                    await self._process_escalation(escalation)

                # Wait before next check
                await asyncio.sleep(60)  # Check every minute

            except Exception as e:
                logger.error(f"Error in escalation engine: {str(e)}")
                await asyncio.sleep(60)  # Wait before retrying

    async def _process_escalation(self, escalation: CommunicationEscalation):
        """
        Process a single escalation.
        """
        try:
            # Get the original communication
            communication = self.db.query(CommunicationLog).filter(
                CommunicationLog.id == escalation.communication_id
            ).first()

            if not communication:
                escalation.status = "failed"
                escalation.error_message = "Original communication not found"
                self.db.commit()
                return

            # Create new message for escalation
            message = CommunicationMessage(
                patient_id=communication.patient_id,
                subject=f"Follow-up: {communication.subject}",
                body=self._get_escalation_message(communication, escalation),
                metadata={
                    "original_communication_id": communication.id,
                    "escalation_id": escalation.id
                }
            )

            # Send the escalated message
            result = await communication_service.send_message(
                patient_id=message.patient_id,
                message=message,
                preferred_channel=escalation.escalated_to,
                force_channel=True
            )

            # Update escalation status
            escalation.status = "completed"
            escalation.executed_at = datetime.utcnow()
            self.db.commit()

            # Log the escalation
            logger.info(f"Escalated communication {communication.id} to {escalation.escalated_to}")

        except Exception as e:
            logger.error(f"Failed to process escalation {escalation.id}: {str(e)}")
            escalation.status = "failed"
            escalation.error_message = str(e)
            self.db.commit()

    def _get_escalation_message(
        self,
        communication: CommunicationLog,
        escalation: CommunicationEscalation
    ) -> str:
        """
        Generate an appropriate message for the escalation.
        """
        if communication.message_type == "appointment":
            return (
                f"Hi, this is a follow-up regarding your appointment request. "
                f"We haven't received a response yet. Please let us know if you'd like to proceed with booking. "
                f"You can reply to this message or call us directly."
            )
        elif communication.message_type == "payment":
            return (
                f"Hi, this is a follow-up regarding your payment inquiry. "
                f"We haven't received a response yet. Please let us know if you need any clarification. "
                f"You can reply to this message or call us directly."
            )
        elif communication.message_type == "urgent":
            return (
                f"Hi, this is an urgent follow-up regarding your previous message. "
                f"Please contact us immediately to address your concern. "
                f"You can call us directly at [PHONE_NUMBER]."
            )
        else:
            return (
                f"Hi, this is a follow-up regarding your previous message. "
                f"We haven't received a response yet. Please let us know if you need any assistance. "
                f"You can reply to this message or call us directly."
            )

    async def schedule_escalation(
        self,
        communication_id: int,
        original_channel: CommunicationChannel,
        escalated_to: CommunicationChannel,
        delay_minutes: int,
        reason: str
    ) -> CommunicationEscalation:
        """
        Schedule a new escalation.
        """
        escalation = CommunicationEscalation(
            communication_id=communication_id,
            original_channel=original_channel,
            escalated_to=escalated_to,
            escalation_reason=reason,
            scheduled_for=datetime.utcnow() + timedelta(minutes=delay_minutes),
            status="pending"
        )
        self.db.add(escalation)
        self.db.commit()
        return escalation

# Singleton instance
escalation_engine = None  # Will be initialized with DB session when used 