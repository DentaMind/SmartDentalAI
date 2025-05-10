import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
import uuid
import enum

from ..database import get_db
from ..models.patient_notification import PatientNotificationType, PatientNotificationPriority
from .patient_notification_service import patient_notification_service, NotificationPayload, AppointmentReminderPayload
from ..services.appointment_service import appointment_service
from .patient_recall_service import patient_recall_service

logger = logging.getLogger(__name__)

class RecallType(str, enum.Enum):
    """Types of recall intervals"""
    HYGIENE = "hygiene"
    PERIO_MAINTENANCE = "perio_maintenance"
    RESTORATIVE_FOLLOWUP = "restorative_followup"
    PATIENT_REACTIVATION = "patient_reactivation"
    TREATMENT_PENDING = "treatment_pending"

class RecallInterval(str, enum.Enum):
    """Standard recall intervals"""
    ONE_MONTH = "1_month"
    THREE_MONTHS = "3_months"
    FOUR_MONTHS = "4_months"
    SIX_MONTHS = "6_months"
    ONE_YEAR = "1_year"
    CUSTOM = "custom"  # For custom day intervals

class NotificationSchedulerService:
    """Service to schedule and generate automated notifications"""
    
    def __init__(self):
        self.is_running = False
        self.scheduler_task = None
    
    async def start(self):
        """Start the notification scheduler"""
        if self.is_running:
            logger.info("Notification scheduler is already running")
            return
        
        logger.info("Starting notification scheduler")
        self.is_running = True
        self.scheduler_task = asyncio.create_task(self._scheduler_loop())
        
    async def stop(self):
        """Stop the notification scheduler"""
        if not self.is_running:
            logger.info("Notification scheduler is not running")
            return
        
        logger.info("Stopping notification scheduler")
        self.is_running = False
        if self.scheduler_task:
            self.scheduler_task.cancel()
            try:
                await self.scheduler_task
            except asyncio.CancelledError:
                pass
            self.scheduler_task = None
    
    async def _scheduler_loop(self):
        """Main scheduler loop"""
        while self.is_running:
            try:
                # Get database session
                db = next(get_db())
                
                # Schedule all notification types
                await self._schedule_appointment_reminders(db)
                await self._schedule_treatment_reminders(db)
                await self._schedule_hygiene_reminders(db)
                
                # Process recall reminders
                await self._process_recall_reminders(db)
                
                # Close session
                db.close()
                
                # Sleep until next check (every hour)
                await asyncio.sleep(3600)  # 1 hour
            except Exception as e:
                logger.error(f"Error in notification scheduler: {e}")
                await asyncio.sleep(60)  # Wait 1 minute before retrying on error
    
    async def _schedule_appointment_reminders(self, db: Session):
        """Schedule appointment reminder notifications"""
        try:
            logger.info("Scheduling appointment reminders")
            
            # Get upcoming appointments in the next 48 hours that need reminders
            tomorrow = datetime.now() + timedelta(days=1)
            upcoming_appointments = appointment_service.get_upcoming_appointments(
                db,
                start_date=datetime.now(),
                end_date=tomorrow + timedelta(hours=24),
                remind_only=True
            )
            
            # Send reminders for each appointment
            for appointment in upcoming_appointments:
                # Calculate time until appointment
                appointment_time = appointment.start_time
                time_until = appointment_time - datetime.now()
                hours_until = time_until.total_seconds() / 3600
                
                # Skip if reminder already sent
                if appointment.reminder_sent:
                    continue
                
                # Get patient info
                patient = appointment.patient
                provider = appointment.provider
                
                # Determine priority based on how soon the appointment is
                priority = PatientNotificationPriority.MEDIUM
                if hours_until < 4:
                    priority = PatientNotificationPriority.HIGH
                elif hours_until < 24:
                    priority = PatientNotificationPriority.MEDIUM
                else:
                    priority = PatientNotificationPriority.LOW
                
                # Create appointment reminder payload
                appointment_data = AppointmentReminderPayload(
                    title="Upcoming Appointment Reminder",
                    message=f"You have an upcoming appointment with Dr. {provider.last_name} on {appointment_time.strftime('%A, %B %d at %I:%M %p')}",
                    priority=priority,
                    appointment_id=appointment.id,
                    appointment_date=appointment_time,
                    provider_name=f"{provider.first_name} {provider.last_name}",
                    action_url=f"/patient/appointments/{appointment.id}"
                )
                
                # Send notification
                await patient_notification_service.create_appointment_reminder(
                    db=db,
                    patient_id=patient.id,
                    payload=appointment_data
                )
                
                # Mark reminder as sent
                appointment.reminder_sent = True
                db.commit()
                
                logger.info(f"Sent appointment reminder to patient {patient.id} for appointment {appointment.id}")
            
            # Count how many reminders were sent
            logger.info(f"Scheduled {len(upcoming_appointments)} appointment reminders")
        except Exception as e:
            logger.error(f"Error scheduling appointment reminders: {e}")
    
    async def _schedule_treatment_reminders(self, db: Session):
        """Schedule treatment plan reminder notifications"""
        try:
            logger.info("Scheduling treatment reminders")
            # TODO: Implement treatment reminders logic
            pass
        except Exception as e:
            logger.error(f"Error scheduling treatment reminders: {e}")
    
    async def _schedule_hygiene_reminders(self, db: Session):
        """Schedule dental hygiene reminder notifications"""
        try:
            logger.info("Scheduling hygiene reminders")
            # TODO: Implement hygiene reminders logic
            pass
        except Exception as e:
            logger.error(f"Error scheduling hygiene reminders: {e}")
    
    async def _process_recall_reminders(self, db: Session):
        """Process recall reminders based on recall schedule
        
        This function checks for patients who are due for recall appointments
        based on their last appointment date and recall interval.
        """
        try:
            logger.info("Processing recall reminders")
            
            # Use the patient recall service to process all due reminders
            results = await patient_recall_service.process_recall_reminders(db)
            
            if results["sent_count"] > 0:
                logger.info(f"Sent {results['sent_count']} recall reminders")
                for recall_type, count in results["by_type"].items():
                    logger.info(f"  - {recall_type}: {count} reminders")
            else:
                logger.info("No recall reminders due for processing")
                
        except Exception as e:
            logger.error(f"Error processing recall reminders: {e}")
    
    def _get_due_recall_schedules(self, db: Session) -> List:
        """Get recall schedules that are due for notifications"""
        # This is a placeholder - in a real implementation, you would:
        # 1. Query a recall_schedules table with patient_id, recall_type, interval, last_reminded_date, etc.
        # 2. Filter for schedules where due_date <= current_date and not already reminded
        
        now = datetime.now()
        
        # Example query (adjust based on your actual schema)
        try:
            return db.query(PatientRecallSchedule).filter(
                and_(
                    PatientRecallSchedule.due_date <= now,
                    PatientRecallSchedule.reminder_sent == False,
                    PatientRecallSchedule.active == True
                )
            ).all()
        except Exception as e:
            logger.error(f"Error querying recall schedules: {e}")
            return []
    
    def _recall_type_to_notification_type(self, recall_type: str) -> str:
        """Convert recall type to notification type"""
        mapping = {
            RecallType.HYGIENE: PatientNotificationType.DENTAL_HYGIENE_REMINDER,
            RecallType.PERIO_MAINTENANCE: PatientNotificationType.TREATMENT_REMINDER,
            RecallType.RESTORATIVE_FOLLOWUP: PatientNotificationType.TREATMENT_REMINDER,
            RecallType.PATIENT_REACTIVATION: PatientNotificationType.GENERAL_ANNOUNCEMENT,
            RecallType.TREATMENT_PENDING: PatientNotificationType.TREATMENT_REMINDER
        }
        return mapping.get(recall_type, PatientNotificationType.GENERAL_ANNOUNCEMENT)
    
    def _get_recall_notification_content(
        self, 
        recall_type: str, 
        patient, 
        provider, 
        last_appointment_date: Optional[datetime] = None,
        due_date: Optional[datetime] = None
    ) -> Tuple[str, str, str, Optional[str]]:
        """Generate notification content based on recall type"""
        patient_name = f"{patient.first_name}"
        provider_name = f"Dr. {provider.last_name}" if provider else "our office"
        due_date_str = due_date.strftime("%B %d, %Y") if due_date else "soon"
        
        if recall_type == RecallType.HYGIENE:
            title = "Hygiene Cleaning Reminder"
            message = f"Hi {patient_name}, it's time to schedule your regular dental cleaning with {provider_name}."
            priority = PatientNotificationPriority.MEDIUM
            action_url = "/patient/schedule-appointment?type=hygiene"
            
        elif recall_type == RecallType.PERIO_MAINTENANCE:
            title = "Periodontal Maintenance Reminder"
            message = f"Hi {patient_name}, your periodontal maintenance is due by {due_date_str}. Please schedule with {provider_name}."
            priority = PatientNotificationPriority.HIGH
            action_url = "/patient/schedule-appointment?type=perio"
            
        elif recall_type == RecallType.RESTORATIVE_FOLLOWUP:
            title = "Treatment Follow-up Reminder"
            message = f"Hi {patient_name}, it's time for your follow-up appointment with {provider_name} to check on your recent treatment."
            priority = PatientNotificationPriority.MEDIUM
            action_url = "/patient/schedule-appointment?type=followup"
            
        elif recall_type == RecallType.PATIENT_REACTIVATION:
            title = "We Miss You!"
            message = f"Hi {patient_name}, we haven't seen you since {last_appointment_date.strftime('%B %Y') if last_appointment_date else 'your last visit'}. We'd love to see you again at {provider_name}."
            priority = PatientNotificationPriority.LOW
            action_url = "/patient/schedule-appointment"
            
        elif recall_type == RecallType.TREATMENT_PENDING:
            title = "Pending Treatment Reminder"
            message = f"Hi {patient_name}, you have treatment that was recommended but not yet completed. Please contact {provider_name} to schedule."
            priority = PatientNotificationPriority.MEDIUM
            action_url = "/patient/treatment-plans"
            
        else:
            title = "Dental Appointment Reminder"
            message = f"Hi {patient_name}, this is a reminder from {provider_name} about your dental care."
            priority = PatientNotificationPriority.MEDIUM
            action_url = "/patient/schedule-appointment"
        
        return title, message, priority, action_url
    
    def _update_recall_reminder_status(self, db: Session, schedule):
        """Update the reminder status for a recall schedule"""
        # Update the last reminded date and increment the reminder count
        schedule.last_reminded_date = datetime.now()
        schedule.reminder_count = (schedule.reminder_count or 0) + 1
        schedule.reminder_sent = True
        
        # If the schedule has a max_reminders and we've reached it, mark as inactive
        if schedule.max_reminders and schedule.reminder_count >= schedule.max_reminders:
            schedule.active = False
        
        # If using a recurrence pattern, calculate the next due date
        if schedule.recurrence_pattern:
            # Calculate the next due date based on recurrence pattern
            schedule.due_date = self._calculate_next_due_date(
                schedule.due_date or datetime.now(),
                schedule.recurrence_pattern,
                schedule.recurrence_interval
            )
            # Reset the reminder_sent flag for the next cycle
            schedule.reminder_sent = False
    
    def _calculate_next_due_date(
        self, 
        current_due_date: datetime, 
        recurrence_pattern: str, 
        recurrence_interval: int
    ) -> datetime:
        """Calculate the next due date based on recurrence pattern"""
        if recurrence_pattern == RecallInterval.ONE_MONTH:
            return current_due_date + timedelta(days=30)
        elif recurrence_pattern == RecallInterval.THREE_MONTHS:
            return current_due_date + timedelta(days=90)
        elif recurrence_pattern == RecallInterval.FOUR_MONTHS:
            return current_due_date + timedelta(days=120)
        elif recurrence_pattern == RecallInterval.SIX_MONTHS:
            return current_due_date + timedelta(days=180)
        elif recurrence_pattern == RecallInterval.ONE_YEAR:
            return current_due_date + timedelta(days=365)
        elif recurrence_pattern == RecallInterval.CUSTOM and recurrence_interval:
            return current_due_date + timedelta(days=recurrence_interval)
        else:
            # Default to 6 months if pattern is unknown
            return current_due_date + timedelta(days=180)
    
    async def create_recall_schedule(
        self, 
        db: Session,
        patient_id: str,
        recall_type: str,
        due_date: datetime = None,
        provider_id: str = None,
        recurrence_pattern: str = None,
        recurrence_interval: int = None,
        max_reminders: int = None,
        last_appointment_date: datetime = None,
        active: bool = True
    ):
        """Create a new recall schedule for a patient"""
        # Calculate due date if not provided
        if not due_date and last_appointment_date and recurrence_pattern:
            due_date = self._calculate_next_due_date(
                last_appointment_date, 
                recurrence_pattern, 
                recurrence_interval
            )
        elif not due_date:
            # Default to 6 months from now if no due date can be calculated
            due_date = datetime.now() + timedelta(days=180)
            
        # Create the recall schedule
        recall_schedule = PatientRecallSchedule(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            recall_type=recall_type,
            due_date=due_date,
            provider_id=provider_id,
            recurrence_pattern=recurrence_pattern,
            recurrence_interval=recurrence_interval,
            max_reminders=max_reminders,
            last_appointment_date=last_appointment_date,
            active=active,
            created_at=datetime.now(),
            reminder_count=0,
            reminder_sent=False
        )
        
        db.add(recall_schedule)
        db.commit()
        db.refresh(recall_schedule)
        
        logger.info(f"Created {recall_type} recall schedule for patient {patient_id} due on {due_date}")
        
        return recall_schedule

# Create a singleton instance
notification_scheduler_service = NotificationSchedulerService() 