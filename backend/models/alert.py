from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, JSON, Enum as SQLEnum
from sqlalchemy.sql import func

from database import Base

class AlertType(str, Enum):
    SCHEMA_VALIDATION = "schema_validation"
    LEARNING_PATTERN = "learning_pattern"
    SYSTEM_HEALTH = "system_health"

class AlertSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

class AlertStatus(str, Enum):
    ACTIVE = "active"
    RESOLVED = "resolved"
    ACKNOWLEDGED = "acknowledged"

class Alert(Base):
    """Model for system alerts."""
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(SQLEnum(AlertType), nullable=False)
    severity = Column(SQLEnum(AlertSeverity), nullable=False)
    status = Column(SQLEnum(AlertStatus), nullable=False, default=AlertStatus.ACTIVE)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    resolved_at = Column(DateTime, nullable=True) 