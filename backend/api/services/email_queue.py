from typing import Dict, Any, Optional
from datetime import datetime
import asyncio
from fastapi import BackgroundTasks
import logging
from pathlib import Path

from .email_sender import EmailSender
from ..models.email import Email
from ..schemas.email import EmailCreate
from ..config import settings

logger = logging.getLogger(__name__)

class EmailQueue:
    def __init__(self):
        self.sender = EmailSender()
        self.queue: asyncio.Queue = asyncio.Queue()
        self.processing = False
        self.max_retries = 3
        self.retry_delay = 60  # seconds

    async def add_to_queue(self, email_data: EmailCreate, background_tasks: BackgroundTasks) -> None:
        """Add an email to the processing queue."""
        try:
            # Create email record in database
            email = Email(
                to=email_data.to,
                subject=email_data.subject,
                body=email_data.body,
                cc=email_data.cc,
                bcc=email_data.bcc,
                priority=email_data.priority,
                category=email_data.category,
                attachments=email_data.attachments,
                date=datetime.now(),
                is_read=False,
                is_starred=False,
                status="queued"
            )
            
            # Start processing in background
            background_tasks.add_task(self.process_queue)
            
            # Add to queue
            await self.queue.put({
                "email": email,
                "retries": 0
            })
            
            logger.info(f"Email queued for {email_data.to}")
            
        except Exception as e:
            logger.error(f"Failed to queue email: {str(e)}")
            raise

    async def process_queue(self) -> None:
        """Process the email queue."""
        if self.processing:
            return
            
        self.processing = True
        try:
            while not self.queue.empty():
                item = await self.queue.get()
                email = item["email"]
                retries = item["retries"]
                
                try:
                    # Attempt to send email
                    success = await self.sender.send(
                        to=email.to,
                        subject=email.subject,
                        body=email.body,
                        cc=email.cc,
                        bcc=email.bcc,
                        attachments=email.attachments
                    )
                    
                    if success:
                        email.status = "sent"
                        logger.info(f"Email sent successfully to {email.to}")
                    else:
                        raise Exception("Failed to send email")
                        
                except Exception as e:
                    logger.error(f"Failed to send email to {email.to}: {str(e)}")
                    
                    # Retry logic
                    if retries < self.max_retries:
                        retries += 1
                        await asyncio.sleep(self.retry_delay)
                        await self.queue.put({
                            "email": email,
                            "retries": retries
                        })
                    else:
                        email.status = "failed"
                        logger.error(f"Email failed after {self.max_retries} retries")
                        
                finally:
                    self.queue.task_done()
                    
        except Exception as e:
            logger.error(f"Queue processing error: {str(e)}")
        finally:
            self.processing = False

    async def get_queue_status(self) -> Dict[str, Any]:
        """Get current queue status."""
        return {
            "queue_size": self.queue.qsize(),
            "processing": self.processing,
            "max_retries": self.max_retries,
            "retry_delay": self.retry_delay
        }

# Singleton instance
email_queue = EmailQueue() 