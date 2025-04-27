from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Enum as SQLEnum
import enum
from database import Base

class AlertType(str, enum.Enum):
    DIAGNOSIS_ACCURACY = "diagnosis_accuracy"
    TREATMENT_STABILITY = "treatment_stability"
    BILLING_ACCURACY = "billing_accuracy"
    USER_EXPERIENCE = "user_experience"

class AlertSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class LearningInsight(Base):
    __tablename__ = "learning_insights"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Diagnosis metrics
    diagnosis_correction_rate = Column(Float)
    diagnosis_confidence_before = Column(Float)
    diagnosis_confidence_after = Column(Float)
    common_diagnosis_corrections = Column(JSON)
    
    # Treatment metrics
    treatment_edit_rate = Column(Float)
    avg_treatment_edit_time = Column(Float)
    common_treatment_changes = Column(JSON)
    
    # Billing metrics
    billing_override_rate = Column(Float)
    avg_billing_adjustment = Column(Float)
    common_billing_reasons = Column(JSON)
    
    # User experience metrics
    avg_page_time = Column(Float)
    common_user_paths = Column(JSON)
    performance_metrics = Column(JSON)

class Alert(Base):
    __tablename__ = "learning_alerts"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    type = Column(SQLEnum(AlertType))
    severity = Column(SQLEnum(AlertSeverity))
    title = Column(String)
    description = Column(String)
    metric = Column(Float)
    
    # Optional related data
    context = Column(JSON, nullable=True)  # Additional context/data about the alert
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(String, nullable=True) 