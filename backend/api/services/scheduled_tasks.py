import asyncio
import logging
import time
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session

from ..database import get_db
from .ai_training_service import get_ai_training_service
from ..models.ai_feedback import AITrainingJob

logger = logging.getLogger(__name__)

class ScheduledTaskService:
    """Service to handle scheduled tasks"""
    
    def __init__(self):
        self.is_running = False
        self.tasks = []
    
    async def start(self):
        """Start the scheduled task service"""
        if self.is_running:
            logger.warning("Scheduled task service is already running")
            return
        
        self.is_running = True
        logger.info("Starting scheduled task service")
        
        # Create tasks
        self.tasks = [
            asyncio.create_task(self._process_ai_training_jobs()),
            asyncio.create_task(self._check_ai_training_trigger())
        ]
    
    async def stop(self):
        """Stop the scheduled task service"""
        if not self.is_running:
            logger.warning("Scheduled task service is not running")
            return
        
        logger.info("Stopping scheduled task service")
        self.is_running = False
        
        # Cancel all tasks
        for task in self.tasks:
            task.cancel()
        
        # Wait for tasks to complete
        if self.tasks:
            await asyncio.wait(self.tasks, return_when=asyncio.ALL_COMPLETED)
        
        self.tasks = []
    
    async def _process_ai_training_jobs(self):
        """Process AI training jobs in the queue"""
        while self.is_running:
            try:
                # Get a database session
                db = next(get_db())
                
                # Get the AI training service
                training_service = get_ai_training_service(db)
                
                # Process the training queue
                job_id = await training_service.process_training_queue()
                
                if job_id:
                    logger.info(f"Processed AI training job: {job_id}")
                
                # Sleep for 5 minutes before checking again
                await asyncio.sleep(300)
                
            except Exception as e:
                logger.error(f"Error processing AI training jobs: {str(e)}")
                # Sleep for 1 minute before retrying
                await asyncio.sleep(60)
    
    async def _check_ai_training_trigger(self):
        """Check if we should trigger an AI training job"""
        while self.is_running:
            try:
                # Only run once per day, at around midnight
                now = datetime.now()
                if not (now.hour == 0 and now.minute < 15):
                    # Sleep for 15 minutes before checking again
                    await asyncio.sleep(900)
                    continue
                
                # Get a database session
                db = next(get_db())
                
                # Get the AI training service
                training_service = get_ai_training_service(db)
                
                # Check if we should trigger training
                should_trigger = await training_service.should_trigger_training()
                
                if should_trigger:
                    logger.info("Triggering AI training job based on feedback volume")
                    
                    # Get the latest model version to determine the next version
                    latest_metrics = await training_service.get_model_metrics()
                    current_version = latest_metrics.get("model_version", "1.0.0")
                    
                    # Calculate the next version number
                    version_parts = current_version.split('.')
                    next_version = f"{version_parts[0]}.{version_parts[1]}.{int(version_parts[2]) + 1}"
                    
                    # Create a new training job
                    new_job = AITrainingJob(
                        id=uuid.uuid4(),
                        model_version=next_version,
                        status="queued",
                        triggered_by="scheduled_task",
                        feedback_count=0  # Will be updated during processing
                    )
                    
                    db.add(new_job)
                    db.commit()
                    
                    logger.info(f"Created scheduled training job for model version {next_version}")
                
                # Sleep for 1 hour before checking again
                await asyncio.sleep(3600)
                
            except Exception as e:
                logger.error(f"Error checking AI training trigger: {str(e)}")
                # Sleep for 15 minutes before retrying
                await asyncio.sleep(900)


# Global instance
scheduled_task_service = ScheduledTaskService()


# Functions to start/stop the service
async def start_scheduled_tasks():
    """Start all scheduled tasks"""
    await scheduled_task_service.start()


async def stop_scheduled_tasks():
    """Stop all scheduled tasks"""
    await scheduled_task_service.stop() 