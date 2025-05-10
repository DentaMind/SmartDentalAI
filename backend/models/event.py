from datetime import datetime
from typing import Dict, Optional
from sqlalchemy import Column, Integer, String, DateTime, JSON, Index, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base

class LearningEvent(Base):
    __tablename__ = 'learning_events'

    id = Column(Integer, primary_key=True)
    event_id = Column(String(36), nullable=False, unique=True)  # UUID
    type = Column(String(100), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    server_timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # User context
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    session_id = Column(String(100), nullable=True)
    device_info = Column(String(500), nullable=True)
    
    # Event data
    payload = Column(JSON, nullable=False)
    metadata = Column(JSON, nullable=True)
    
    # Environment info
    environment = Column(String(20), nullable=False)  # 'production', 'development', etc.
    version = Column(String(20), nullable=True)  # API/App version
    
    # Error tracking
    error_count = Column(Integer, default=0)
    last_error = Column(String(500), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="events")

    # Indexes for common queries
    __table_args__ = (
        Index('idx_event_type_timestamp', 'type', 'timestamp'),
        Index('idx_user_timestamp', 'user_id', 'timestamp'),
        Index('idx_session_timestamp', 'session_id', 'timestamp'),
        Index('idx_environment_timestamp', 'environment', 'timestamp'),
    )

    @classmethod
    def create_from_batch_item(cls, event_data: Dict) -> 'LearningEvent':
        """Create a LearningEvent instance from batch event data."""
        return cls(
            event_id=event_data['id'],
            type=event_data['type'],
            timestamp=datetime.fromisoformat(event_data['timestamp'].replace('Z', '+00:00')),
            user_id=event_data.get('metadata', {}).get('userId'),
            session_id=event_data.get('metadata', {}).get('sessionId'),
            device_info=event_data.get('metadata', {}).get('deviceInfo'),
            payload=event_data['payload'],
            metadata=event_data.get('metadata'),
            environment=event_data.get('metadata', {}).get('environment', 'production'),
            version=event_data.get('metadata', {}).get('version')
        )

    def to_dict(self) -> Dict:
        """Convert the event to a dictionary representation."""
        return {
            'id': self.event_id,
            'type': self.type,
            'timestamp': self.timestamp.isoformat(),
            'server_timestamp': self.server_timestamp.isoformat(),
            'user_id': self.user_id,
            'session_id': self.session_id,
            'device_info': self.device_info,
            'payload': self.payload,
            'metadata': self.metadata,
            'environment': self.environment,
            'version': self.version,
            'error_count': self.error_count,
            'last_error': self.last_error
        } 