import uuid
import logging
from typing import List, Dict, Optional, Any, Union
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from datetime import datetime, timedelta
import json

from ..models.patient_recall import (
    PatientRecallSchedule,
    RecallReminderHistory,
    RecallType,
    RecallFrequency,
    RecallStatus
)
from ..schemas.patient_recall import (
    PatientRecallScheduleCreate,
    PatientRecallScheduleUpdate,
    RecallReminderHistoryCreate,
    RecallStatistics,
    BatchRecallScheduleCreate,
    RecallHistoryResponse,
    RecallHistoryStatus
)
from ..models.patient import Patient
from ..models.appointment import Appointment
from .patient_notification_service import patient_notification_service, NotificationPayload

logger = logging.getLogger(__name__)

class PatientRecallService:
    """Service for managing patient recall schedules"""
    
    async def create_recall_schedule(
        self, 
        db: Session, 
        recall_data: PatientRecallScheduleCreate,
        created_by: Optional[str] = None
    ) -> PatientRecallSchedule:
        """Create a new patient recall schedule"""
        try:
            # Create schedule with new ID
            schedule_id = str(uuid.uuid4())
            new_schedule = PatientRecallSchedule(
                id=schedule_id,
                patient_id=recall_data.patient_id,
                recall_type=recall_data.recall_type,
                frequency=recall_data.frequency,
                custom_days=recall_data.custom_days,
                provider_id=recall_data.provider_id,
                status=recall_data.status,
                last_appointment_date=recall_data.last_appointment_date,
                next_due_date=recall_data.next_due_date,
                notes=recall_data.notes,
                reminder_days_before=recall_data.reminder_days_before,
                max_reminders=recall_data.max_reminders,
                created_by=created_by
            )
            
            db.add(new_schedule)
            db.commit()
            db.refresh(new_schedule)
            
            logger.info(f"Created recall schedule {schedule_id} for patient {recall_data.patient_id}")
            return new_schedule
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating recall schedule: {e}")
            raise
    
    async def get_recall_schedule(self, db: Session, schedule_id: str) -> Optional[PatientRecallSchedule]:
        """Get a single recall schedule by ID"""
        return db.query(PatientRecallSchedule).filter(PatientRecallSchedule.id == schedule_id).first()
    
    async def get_recall_schedules_by_patient(
        self, 
        db: Session, 
        patient_id: str,
        active_only: bool = False,
        recall_type: Optional[RecallType] = None
    ) -> List[PatientRecallSchedule]:
        """Get all recall schedules for a patient"""
        query = db.query(PatientRecallSchedule).filter(PatientRecallSchedule.patient_id == patient_id)
        
        if active_only:
            query = query.filter(PatientRecallSchedule.status == RecallStatus.ACTIVE)
            
        if recall_type:
            query = query.filter(PatientRecallSchedule.recall_type == recall_type)
            
        return query.order_by(PatientRecallSchedule.next_due_date).all()
    
    async def update_recall_schedule(
        self, 
        db: Session, 
        schedule_id: str, 
        update_data: PatientRecallScheduleUpdate
    ) -> Optional[PatientRecallSchedule]:
        """Update an existing recall schedule"""
        try:
            schedule = await self.get_recall_schedule(db, schedule_id)
            if not schedule:
                return None
                
            # Update only provided fields
            update_dict = update_data.dict(exclude_unset=True)
            for key, value in update_dict.items():
                setattr(schedule, key, value)
                
            # If last_appointment_date was updated and frequency is provided,
            # recalculate the next_due_date
            if 'last_appointment_date' in update_dict and schedule.last_appointment_date:
                schedule.next_due_date = schedule.calculate_next_due_date()
                
            schedule.updated_at = datetime.now()
            
            db.commit()
            db.refresh(schedule)
            logger.info(f"Updated recall schedule {schedule_id}")
            return schedule
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating recall schedule: {e}")
            raise
    
    async def delete_recall_schedule(self, db: Session, schedule_id: str) -> bool:
        """Delete a recall schedule"""
        try:
            schedule = await self.get_recall_schedule(db, schedule_id)
            if not schedule:
                return False
                
            db.delete(schedule)
            db.commit()
            logger.info(f"Deleted recall schedule {schedule_id}")
            return True
        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting recall schedule: {e}")
            raise
            
    async def create_batch_recall_schedules(
        self, 
        db: Session, 
        batch_data: BatchRecallScheduleCreate,
        created_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create recall schedules for multiple patients at once"""
        try:
            created_schedules = []
            failed_patients = []
            
            for patient_id in batch_data.patient_ids:
                try:
                    # Calculate next_due_date based on days_ahead
                    next_due_date = datetime.now() + timedelta(days=batch_data.days_ahead)
                    
                    # Create schedule data
                    schedule_data = PatientRecallScheduleCreate(
                        patient_id=patient_id,
                        recall_type=batch_data.recall_type,
                        frequency=batch_data.frequency,
                        custom_days=batch_data.custom_days,
                        provider_id=batch_data.provider_id,
                        next_due_date=next_due_date,
                        reminder_days_before=batch_data.reminder_days_before,
                        notes=batch_data.notes
                    )
                    
                    # Create schedule
                    schedule = await self.create_recall_schedule(db, schedule_data, created_by)
                    created_schedules.append(schedule)
                except Exception as e:
                    logger.error(f"Failed to create recall for patient {patient_id}: {e}")
                    failed_patients.append(patient_id)
            
            return {
                "created_count": len(created_schedules),
                "failed_count": len(failed_patients),
                "failed_patients": failed_patients
            }
        except Exception as e:
            db.rollback()
            logger.error(f"Error in batch recall creation: {e}")
            raise
    
    async def get_due_recalls(
        self, 
        db: Session, 
        days_ahead: int = 30,
        recall_type: Optional[RecallType] = None,
        provider_id: Optional[str] = None
    ) -> List[PatientRecallSchedule]:
        """Get all active recall schedules due within the specified days"""
        try:
            end_date = datetime.now() + timedelta(days=days_ahead)
            
            query = db.query(PatientRecallSchedule).filter(
                and_(
                    PatientRecallSchedule.status == RecallStatus.ACTIVE,
                    PatientRecallSchedule.next_due_date <= end_date
                )
            )
            
            if recall_type:
                query = query.filter(PatientRecallSchedule.recall_type == recall_type)
                
            if provider_id:
                query = query.filter(PatientRecallSchedule.provider_id == provider_id)
            
            return query.order_by(PatientRecallSchedule.next_due_date).all()
        except Exception as e:
            logger.error(f"Error getting due recalls: {e}")
            raise
    
    async def get_recall_statistics(self, db: Session) -> RecallStatistics:
        """Get statistics about recall schedules"""
        try:
            # Get counts by status
            status_counts = {
                status.name.lower(): db.query(PatientRecallSchedule).filter(
                    PatientRecallSchedule.status == status
                ).count() 
                for status in RecallStatus
            }
            
            # Get counts by type
            type_counts = {
                recall_type.name.lower(): db.query(PatientRecallSchedule).filter(
                    PatientRecallSchedule.recall_type == recall_type
                ).count()
                for recall_type in RecallType
            }
            
            # Get overdue count (due date in the past)
            overdue_count = db.query(PatientRecallSchedule).filter(
                and_(
                    PatientRecallSchedule.status == RecallStatus.ACTIVE,
                    PatientRecallSchedule.next_due_date < datetime.now()
                )
            ).count()
            
            # Get due within 30 days
            thirty_days_from_now = datetime.now() + timedelta(days=30)
            due_soon_count = db.query(PatientRecallSchedule).filter(
                and_(
                    PatientRecallSchedule.status == RecallStatus.ACTIVE,
                    PatientRecallSchedule.next_due_date >= datetime.now(),
                    PatientRecallSchedule.next_due_date <= thirty_days_from_now
                )
            ).count()
            
            return RecallStatistics(
                total_active=status_counts.get('active', 0),
                total_paused=status_counts.get('paused', 0),
                total_completed=status_counts.get('completed', 0),
                total_cancelled=status_counts.get('cancelled', 0),
                by_type=type_counts,
                overdue_count=overdue_count,
                due_within_30_days=due_soon_count
            )
        except Exception as e:
            logger.error(f"Error getting recall statistics: {e}")
            raise
    
    async def record_reminder_sent(
        self,
        db: Session,
        recall_schedule_id: str,
        notification_id: str,
        days_before_due: int,
        delivery_channel: str,
        sent_by: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> RecallReminderHistory:
        """Record that a reminder was sent for a recall schedule"""
        try:
            reminder_history = RecallReminderHistory(
                id=str(uuid.uuid4()),
                recall_schedule_id=recall_schedule_id,
                notification_id=notification_id,
                days_before_due=days_before_due,
                delivery_channel=delivery_channel,
                sent_by=sent_by,
                metadata=metadata
            )
            
            db.add(reminder_history)
            db.commit()
            db.refresh(reminder_history)
            logger.info(f"Recorded reminder for recall schedule {recall_schedule_id}")
            return reminder_history
        except Exception as e:
            db.rollback()
            logger.error(f"Error recording reminder history: {e}")
            raise
    
    async def get_reminder_history(
        self,
        db: Session,
        recall_schedule_id: str
    ) -> List[RecallReminderHistory]:
        """Get reminder history for a recall schedule"""
        return db.query(RecallReminderHistory).filter(
            RecallReminderHistory.recall_schedule_id == recall_schedule_id
        ).order_by(desc(RecallReminderHistory.sent_at)).all()
    
    async def process_recall_reminders(self, db: Session) -> Dict[str, Any]:
        """Process all due recall reminders
        
        This method is intended to be called by a scheduled task to 
        send reminders for upcoming recall appointments.
        """
        try:
            logger.info("Processing recall reminders")
            sent_count = 0
            reminder_types = {}
            
            # Get all active recall schedules
            schedules = db.query(PatientRecallSchedule).filter(
                PatientRecallSchedule.status == RecallStatus.ACTIVE
            ).all()
            
            for schedule in schedules:
                # Skip if no reminder days are configured
                if not schedule.reminder_days_before:
                    continue
                
                # Check each reminder day threshold
                for days_before in schedule.reminder_days_before:
                    if schedule.is_due_for_reminder(days_before):
                        # Check if we already sent a reminder for this threshold
                        existing_reminder = db.query(RecallReminderHistory).filter(
                            and_(
                                RecallReminderHistory.recall_schedule_id == schedule.id,
                                RecallReminderHistory.days_before_due == days_before
                            )
                        ).first()
                        
                        if existing_reminder:
                            # Already sent a reminder for this threshold
                            continue
                        
                        # Count by type
                        reminder_types[schedule.recall_type.value] = reminder_types.get(
                            schedule.recall_type.value, 0) + 1
                        
                        # Send reminder
                        await self.send_recall_reminder(db, schedule, days_before)
                        sent_count += 1
            
            logger.info(f"Sent {sent_count} recall reminders")
            return {
                "sent_count": sent_count,
                "by_type": reminder_types
            }
        except Exception as e:
            logger.error(f"Error processing recall reminders: {e}")
            raise
    
    async def send_recall_reminder(
        self,
        db: Session,
        schedule: PatientRecallSchedule,
        days_before: int
    ) -> Optional[RecallReminderHistory]:
        """Send a reminder for a specific recall schedule"""
        try:
            # Get patient details
            patient = db.query(Patient).filter(Patient.id == schedule.patient_id).first()
            if not patient:
                logger.error(f"Patient {schedule.patient_id} not found for recall {schedule.id}")
                return None
            
            # Create notification based on recall type
            notification_title, notification_message = self._get_reminder_message(
                schedule.recall_type,
                patient.first_name,
                patient.last_name,
                schedule.next_due_date,
                days_before
            )
            
            # Create notification payload
            payload = NotificationPayload(
                title=notification_title,
                message=notification_message,
                metadata={
                    "recall_id": schedule.id,
                    "recall_type": schedule.recall_type.value,
                    "due_date": schedule.next_due_date.isoformat(),
                    "days_before": days_before
                }
            )
            
            # Determine notification type based on recall type
            notification_type = self._get_notification_type_for_recall(schedule.recall_type)
            
            # Send notification via notification service
            notification = await patient_notification_service.create_notification(
                db=db,
                patient_id=patient.id,
                notification_type=notification_type,
                payload=payload
            )
            
            if not notification:
                logger.error(f"Failed to create notification for recall {schedule.id}")
                return None
            
            # Record the reminder in history
            reminder_history = await self.record_reminder_sent(
                db=db,
                recall_schedule_id=schedule.id,
                notification_id=notification.id,
                days_before_due=days_before,
                delivery_channel="email",  # Assuming email as default, could be derived from patient preferences
                metadata={
                    "notification_title": notification_title,
                    "notification_message": notification_message,
                    "patient_name": f"{patient.first_name} {patient.last_name}"
                }
            )
            
            return reminder_history
        except Exception as e:
            logger.error(f"Error sending recall reminder: {e}")
            raise
    
    def _get_reminder_message(
        self,
        recall_type: RecallType,
        first_name: str,
        last_name: str,
        due_date: datetime,
        days_before: int
    ) -> tuple:
        """Generate reminder title and message based on recall type"""
        formatted_date = due_date.strftime("%B %d, %Y")
        
        # Default messages
        title = f"Dental Appointment Reminder"
        message = f"Hello {first_name}, this is a reminder that you are due for a dental appointment on {formatted_date}."
        
        # Customize based on recall type
        if recall_type == RecallType.HYGIENE:
            title = "Dental Hygiene Appointment Reminder"
            message = f"Hello {first_name}, this is a reminder that you are due for your dental hygiene appointment on {formatted_date}."
        
        elif recall_type == RecallType.PERIO_MAINTENANCE:
            title = "Periodontal Maintenance Reminder"
            message = f"Hello {first_name}, this is a reminder that you are due for your periodontal maintenance on {formatted_date}."
        
        elif recall_type == RecallType.RESTORATIVE_FOLLOWUP:
            title = "Dental Treatment Follow-Up Reminder"
            message = f"Hello {first_name}, this is a reminder for your follow-up dental treatment appointment on {formatted_date}."
        
        elif recall_type == RecallType.PATIENT_REACTIVATION:
            title = "We Miss You!"
            message = f"Hello {first_name}, it's been a while since your last visit. We'd love to see you again! Please call us to schedule your next appointment."
        
        # Add urgency based on days before
        if days_before <= 7:
            message += " Your appointment is coming up soon. Please contact us if you need to reschedule."
        
        return title, message
    
    def _get_notification_type_for_recall(self, recall_type: RecallType) -> str:
        """Map recall type to notification type"""
        recall_to_notification = {
            RecallType.HYGIENE: "hygiene_recall",
            RecallType.PERIO_MAINTENANCE: "perio_recall",
            RecallType.RESTORATIVE_FOLLOWUP: "treatment_followup",
            RecallType.PATIENT_REACTIVATION: "patient_reactivation",
            RecallType.OTHER: "general_reminder"
        }
        
        return recall_to_notification.get(recall_type, "general_reminder")

    async def get_patient_recall_history(
        self,
        db: Session,
        patient_id: str,
        limit: int = 50,
        skip: int = 0
    ) -> List[RecallHistoryResponse]:
        """
        Get recall history for a patient including completed, missed, and scheduled appointments.
        
        This method combines recall schedules with appointment data to generate a comprehensive history.
        - Completed: Recalls with corresponding completed appointments
        - Missed: Recalls with due dates in the past without corresponding appointments
        - Scheduled: Recalls with due dates in the future
        """
        try:
            history_items = []
            
            # Get all recall schedules for the patient (including inactive ones)
            recall_schedules = await self.get_recall_schedules_by_patient(
                db=db,
                patient_id=patient_id,
                active_only=False
            )
            
            # Get all appointments for the patient
            appointments = db.query(Appointment).filter(
                Appointment.patient_id == patient_id
            ).order_by(desc(Appointment.date)).all()
            
            # Create a map of appointment dates for easier lookup
            appointment_dates = {
                appointment.date.date(): appointment
                for appointment in appointments
                if appointment.date and appointment.status in ["completed", "confirmed", "scheduled"]
            }
            
            now = datetime.now()
            
            # Process each recall schedule
            for schedule in recall_schedules:
                next_due_date = schedule.next_due_date
                
                if not next_due_date:
                    continue
                
                # Check for completed appointments
                appointment_found = False
                appointment_date = None
                
                # Look for appointments within 7 days of the due date (before or after)
                for i in range(-7, 8):
                    check_date = (next_due_date + timedelta(days=i)).date()
                    if check_date in appointment_dates:
                        appointment_found = True
                        appointment = appointment_dates[check_date]
                        appointment_date = appointment.date
                        
                        # Add completed recall to history
                        if appointment.status == "completed":
                            history_items.append(
                                RecallHistoryResponse(
                                    id=str(uuid.uuid4()),  # Generate unique ID for history item
                                    recall_type=schedule.recall_type,
                                    due_date=next_due_date,
                                    appointment_date=appointment_date,
                                    status=RecallHistoryStatus.COMPLETED,
                                    notes=f"Completed {schedule.recall_type.value} recall appointment"
                                )
                            )
                        break
                
                # If no appointment found and the due date is in the past, mark as missed
                if not appointment_found and next_due_date < now:
                    history_items.append(
                        RecallHistoryResponse(
                            id=str(uuid.uuid4()),
                            recall_type=schedule.recall_type,
                            due_date=next_due_date,
                            appointment_date=None,
                            status=RecallHistoryStatus.MISSED,
                            notes=f"Missed {schedule.recall_type.value} recall appointment"
                        )
                    )
                
                # If due date is in the future, mark as scheduled
                elif not appointment_found and next_due_date >= now:
                    history_items.append(
                        RecallHistoryResponse(
                            id=str(uuid.uuid4()),
                            recall_type=schedule.recall_type,
                            due_date=next_due_date,
                            appointment_date=None,
                            status=RecallHistoryStatus.SCHEDULED,
                            notes=f"Upcoming {schedule.recall_type.value} recall appointment"
                        )
                    )
            
            # Sort history items by due date (newest first)
            history_items.sort(key=lambda x: x.due_date, reverse=True)
            
            # Apply pagination
            return history_items[skip:skip+limit]
        
        except Exception as e:
            logger.error(f"Error getting recall history for patient {patient_id}: {e}")
            raise

# Instantiate the service as a singleton
patient_recall_service = PatientRecallService() 