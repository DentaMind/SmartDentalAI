from datetime import datetime
from typing import Dict, Any, List, Optional
import json
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from pydantic import BaseModel
import sqlalchemy as sa

from models.audit import AuditEvent
from models.learning_event import LearningEvent
from services.alert_service import AlertService

class EventData(BaseModel):
    """Model for incoming event data."""
    event_type: str
    user_id: Optional[str]
    session_id: str
    metadata: Dict[str, Any]
    timestamp: Optional[datetime]

class EventCollector:
    """Service for collecting and processing learning events."""
    
    def __init__(
        self,
        db_url: str,
        batch_size: int = 100,
        flush_interval: int = 60
    ):
        """Initialize event collector.
        
        Args:
            db_url: Database connection URL
            batch_size: Number of events to batch before writing
            flush_interval: Seconds between forced flushes
        """
        self.engine = create_engine(db_url)
        self.Session = sessionmaker(bind=self.engine)
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self.event_queue = asyncio.Queue()
        self.processing = False
        
        # Initialize stats
        self.stats = {
            'events_processed': 0,
            'batches_written': 0,
            'errors': 0
        }
    
    def start_processing(self):
        """Start background event processing."""
        if not self.processing:
            self.processing = True
            asyncio.create_task(self._process_events())
    
    def stop_processing(self):
        """Stop background event processing."""
        self.processing = False
    
    async def collect_event(self, event: EventData):
        """Add event to processing queue."""
        await self.event_queue.put(event)
    
    async def _process_events(self):
        """Process events from queue in batches."""
        batch = []
        last_flush = datetime.utcnow()
        
        while self.processing:
            try:
                # Get event from queue
                try:
                    event = await asyncio.wait_for(
                        self.event_queue.get(),
                        timeout=1.0
                    )
                    batch.append(event)
                except asyncio.TimeoutError:
                    pass
                
                # Check if we should flush
                now = datetime.utcnow()
                should_flush = (
                    len(batch) >= self.batch_size or
                    (now - last_flush).seconds >= self.flush_interval
                )
                
                if batch and should_flush:
                    await self._flush_batch(batch)
                    batch = []
                    last_flush = now
            
            except Exception as e:
                print(f"Error processing events: {e}")
                self.stats['errors'] += 1
    
    async def _flush_batch(self, batch: List[EventData]):
        """Write batch of events to database."""
        session = self.Session()
        try:
            # Convert events to DB models
            db_events = [
                LearningEvent(
                    timestamp=event.timestamp or datetime.utcnow(),
                    event_type=event.event_type,
                    user_id=event.user_id,
                    session_id=event.session_id,
                    metadata=event.metadata
                )
                for event in batch
            ]
            
            # Write to database
            session.bulk_save_objects(db_events)
            session.commit()
            
            # Update stats
            self.stats['events_processed'] += len(batch)
            self.stats['batches_written'] += 1
        
        except Exception as e:
            session.rollback()
            print(f"Error writing batch: {e}")
            self.stats['errors'] += 1
        
        finally:
            session.close()
    
    @staticmethod
    def anonymize_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """Remove sensitive information from event data."""
        # Deep copy to avoid modifying original
        anon_data = json.loads(json.dumps(data))
        
        sensitive_fields = [
            'password', 'token', 'key', 'secret', 'auth',
            'ssn', 'credit_card', 'phone', 'address'
        ]
        
        def _recursively_anonymize(obj):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    if any(field in key.lower() for field in sensitive_fields):
                        obj[key] = '[REDACTED]'
                    elif isinstance(value, (dict, list)):
                        _recursively_anonymize(value)
            elif isinstance(obj, list):
                for item in obj:
                    if isinstance(item, (dict, list)):
                        _recursively_anonymize(item)
        
        _recursively_anonymize(anon_data)
        return anon_data
    
    async def get_event_stats(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        event_types: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Get statistics about collected events."""
        session = self.Session()
        try:
            # Build query
            query = session.query(LearningEvent)
            
            if start_time:
                query = query.filter(LearningEvent.timestamp >= start_time)
            if end_time:
                query = query.filter(LearningEvent.timestamp <= end_time)
            if event_types:
                query = query.filter(LearningEvent.event_type.in_(event_types))
            
            # Get counts
            total_events = query.count()
            events_by_type = dict(
                session.query(
                    LearningEvent.event_type,
                    sa.func.count(LearningEvent.id)
                )
                .group_by(LearningEvent.event_type)
                .all()
            )
            
            return {
                'total_events': total_events,
                'events_by_type': events_by_type,
                'processing_stats': self.stats
            }
        
        finally:
            session.close() 