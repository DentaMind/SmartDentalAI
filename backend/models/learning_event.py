from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class LearningEvent(Base):
    """Model for storing learning events."""
    __tablename__ = 'learning_events'
    
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    event_type = Column(String(255), nullable=False)
    user_id = Column(String(255), nullable=True)
    session_id = Column(String(255), nullable=False)
    metadata = Column(JSON, nullable=False)
    
    # Indexes for common queries
    __table_args__ = (
        {'postgresql_partition_by': 'RANGE (timestamp)'}  # Partition by time for better query performance
    )
    
    def __repr__(self):
        return f"<LearningEvent(id={self.id}, type={self.event_type}, timestamp={self.timestamp})>"
    
    @property
    def anonymized_metadata(self) -> Dict[str, Any]:
        """Get anonymized version of metadata."""
        from services.event_collector import EventCollector
        return EventCollector.anonymize_data(self.metadata)
    
    def to_dict(self, anonymize: bool = True) -> Dict[str, Any]:
        """Convert event to dictionary format."""
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat(),
            'event_type': self.event_type,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'metadata': self.anonymized_metadata if anonymize else self.metadata
        } 