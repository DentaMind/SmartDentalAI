from typing import List, Dict, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, text
from fastapi import HTTPException

from models.event import LearningEvent
from schemas.event import Event, EventStats, EventError, HourlyVolume
from services.schema_validator import SchemaValidator, SchemaValidationError

class EventService:
    def __init__(self, db: Session):
        self.db = db
        self.BATCH_SIZE = 100  # Maximum events to process in one batch
        self.schema_validator = SchemaValidator(db)
        
    async def process_batch(self, events: List[Event]) -> Dict:
        """Process a batch of events with optimized database operations."""
        processed = 0
        errors = 0
        error_details = []
        
        # Process events in sub-batches for memory efficiency
        for i in range(0, len(events), self.BATCH_SIZE):
            sub_batch = events[i:i + self.BATCH_SIZE]
            try:
                # Validate all events in the batch first
                validation_errors = []
                for event in sub_batch:
                    try:
                        await self.schema_validator.validate_event(event)
                    except SchemaValidationError as e:
                        validation_errors.append((event, e))

                # If any events failed validation, process them individually
                if validation_errors:
                    for event, error in validation_errors:
                        errors += 1
                        error_details.append(
                            f"Schema validation failed for event {event.id}: {error.message}"
                        )
                    
                    # Remove failed events from batch
                    sub_batch = [
                        event for event in sub_batch
                        if event not in [e[0] for e in validation_errors]
                    ]

                if not sub_batch:
                    continue

                # Create database records for valid events
                db_events = [
                    LearningEvent(
                        event_id=event.id,
                        type=event.type,
                        timestamp=event.timestamp,
                        user_id=event.metadata.userId if event.metadata else None,
                        session_id=event.metadata.sessionId if event.metadata else None,
                        device_info=event.metadata.deviceInfo if event.metadata else None,
                        payload=event.payload,
                        metadata=event.metadata.dict() if event.metadata else None,
                        environment=event.metadata.environment if event.metadata else "production",
                        version=event.metadata.version if event.metadata else None
                    )
                    for event in sub_batch
                ]
                
                # Bulk insert with error handling
                self.db.bulk_save_objects(db_events)
                self.db.commit()
                processed += len(sub_batch)
                
            except Exception as e:
                self.db.rollback()
                errors += len(sub_batch)
                error_details.append(str(e))
                
                # Individual processing for failed batch
                for event in sub_batch:
                    try:
                        # Validate event schema
                        try:
                            await self.schema_validator.validate_event(event)
                        except SchemaValidationError as schema_error:
                            error_details.append(
                                f"Schema validation failed for event {event.id}: {schema_error.message}"
                            )
                            continue

                        db_event = LearningEvent(
                            event_id=event.id,
                            type=event.type,
                            timestamp=event.timestamp,
                            user_id=event.metadata.userId if event.metadata else None,
                            session_id=event.metadata.sessionId if event.metadata else None,
                            device_info=event.metadata.deviceInfo if event.metadata else None,
                            payload=event.payload,
                            metadata=event.metadata.dict() if event.metadata else None,
                            environment=event.metadata.environment if event.metadata else "production",
                            version=event.metadata.version if event.metadata else None,
                            error_count=1,
                            last_error=str(e)
                        )
                        self.db.add(db_event)
                        self.db.commit()
                        processed += 1
                        errors -= 1
                    except Exception as individual_error:
                        error_details.append(f"Event {event.id}: {str(individual_error)}")
        
        return {
            "processed": processed,
            "errors": errors,
            "error_details": error_details if error_details else None
        }
    
    async def get_event_stats(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        event_types: Optional[List[str]] = None
    ) -> EventStats:
        """Get statistics about event processing."""
        query = self.db.query(LearningEvent)
        
        # Apply time filters
        if start_time:
            query = query.filter(LearningEvent.timestamp >= start_time)
        if end_time:
            query = query.filter(LearningEvent.timestamp <= end_time)
        if event_types:
            query = query.filter(LearningEvent.type.in_(event_types))
            
        # Calculate basic stats
        total_events = query.count()
        error_events = query.filter(LearningEvent.error_count > 0).count()
        
        # Calculate type distribution
        type_distribution = dict(
            query.with_entities(
                LearningEvent.type,
                func.count(LearningEvent.id)
            ).group_by(LearningEvent.type).all()
        )
        
        # Calculate recent event rate (events/minute in last hour)
        hour_ago = datetime.utcnow() - timedelta(hours=1)
        recent_count = query.filter(LearningEvent.timestamp >= hour_ago).count()
        recent_events_per_minute = recent_count / 60 if recent_count > 0 else 0
        
        # Find peak event rate in last 24 hours
        day_ago = datetime.utcnow() - timedelta(days=1)
        peak_events_per_minute = (
            query.filter(LearningEvent.timestamp >= day_ago)
            .with_entities(
                func.date_trunc('minute', LearningEvent.timestamp),
                func.count(LearningEvent.id)
            )
            .group_by(func.date_trunc('minute', LearningEvent.timestamp))
            .order_by(func.count(LearningEvent.id).desc())
            .first()
        )
        peak_rate = peak_events_per_minute[1] if peak_events_per_minute else 0
        
        # Calculate hourly volumes for the last 24 hours
        hourly_volumes = (
            self.db.query(
                func.date_trunc('hour', LearningEvent.timestamp).label('hour'),
                func.count(LearningEvent.id).label('count'),
                func.sum(case((LearningEvent.error_count > 0, 1), else_=0)).label('errors')
            )
            .filter(LearningEvent.timestamp >= day_ago)
            .group_by(text('hour'))
            .order_by(text('hour'))
            .all()
        )
        
        hourly_data = [
            HourlyVolume(
                hour=hour,
                count=count,
                errors=errors or 0
            )
            for hour, count, errors in hourly_volumes
        ]
        
        return EventStats(
            total_events=total_events,
            error_events=error_events,
            error_rate=error_events / total_events if total_events > 0 else 0,
            type_distribution=type_distribution,
            recent_events_per_minute=recent_events_per_minute,
            peak_events_per_minute=peak_rate,
            hourly_volumes=hourly_data
        )
    
    async def get_recent_errors(self, limit: int = 100) -> List[EventError]:
        """Get details about recent events that encountered errors."""
        return (
            self.db.query(LearningEvent)
            .filter(LearningEvent.error_count > 0)
            .order_by(LearningEvent.timestamp.desc())
            .limit(limit)
            .all()
        )
    
    async def retry_failed_events(self) -> Dict:
        """Attempt to reprocess events that previously failed."""
        failed_events = (
            self.db.query(LearningEvent)
            .filter(LearningEvent.error_count > 0)
            .all()
        )
        
        retried_success = 0
        still_failed = 0
        
        for event in failed_events:
            try:
                # Attempt to reprocess the event
                # This is a placeholder - actual reprocessing logic would go here
                event.error_count = 0
                event.last_error = None
                self.db.add(event)
                self.db.commit()
                retried_success += 1
            except Exception as e:
                still_failed += 1
                event.error_count += 1
                event.last_error = str(e)
                self.db.add(event)
                self.db.commit()
        
        return {
            "retried_success": retried_success,
            "still_failed": still_failed
        } 