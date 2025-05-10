from sqlalchemy import Column, Integer, String, JSON, Boolean, DateTime, func
from sqlalchemy.schema import UniqueConstraint

from database import Base

class SchemaVersion(Base):
    """Model for storing event schema versions."""
    __tablename__ = "schema_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, nullable=False, index=True)
    version = Column(Integer, nullable=False)
    schema = Column(JSON, nullable=False)
    schema_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    __table_args__ = (
        UniqueConstraint('event_type', 'version', name='uq_event_type_version'),
        UniqueConstraint('event_type', 'schema_hash', name='uq_event_type_hash'),
    ) 