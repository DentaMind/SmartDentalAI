"""
Audit Logging Models

Defines database models for tracking user actions and system events
for compliance and monitoring purposes.
"""

from sqlalchemy import Column, String, Integer, Float, JSON, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from uuid import uuid4

from ..database import Base

class AuditLog(Base):
    """Base audit log model for tracking all significant system events"""
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    event_type = Column(String(50), nullable=False, index=True)
    user_id = Column(String(36), nullable=True, index=True)
    user_role = Column(String(20), nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 support
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(String(36), nullable=True, index=True)
    action = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False, default="success")
    details = Column(JSON, nullable=True)
    request_id = Column(String(36), nullable=True, index=True)  # For event correlation
    retention_days = Column(Integer, nullable=True)  # Days to retain this log (null = use default)
    
    def __repr__(self):
        return (f"<AuditLog(id={self.id}, timestamp={self.timestamp}, "
                f"event_type={self.event_type}, action={self.action})>")

class DiagnosticLog(Base):
    """Specialized audit log for diagnostic activities"""
    __tablename__ = "diagnostic_logs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    audit_log_id = Column(String(36), ForeignKey("audit_logs.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    patient_id = Column(String(36), nullable=False, index=True)
    provider_id = Column(String(36), nullable=True, index=True)
    image_type = Column(String(20), nullable=False)  # xray, photo, scan, etc.
    image_id = Column(String(36), nullable=True)
    analysis_id = Column(String(36), nullable=False, index=True)
    ai_model_version = Column(String(50), nullable=True)
    confidence_score = Column(Float, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)  # execution time
    findings_count = Column(Integer, nullable=True)
    status = Column(String(20), nullable=False, default="success")
    error_message = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)  # Additional diagnostic-specific metadata
    request_id = Column(String(36), nullable=True, index=True)  # For event correlation
    
    # Relationships
    audit_log = relationship("AuditLog", foreign_keys=[audit_log_id])
    
    def __repr__(self):
        return (f"<DiagnosticLog(id={self.id}, patient_id={self.patient_id}, "
                f"image_type={self.image_type}, findings_count={self.findings_count})>")

class TreatmentLog(Base):
    """Specialized audit log for treatment activities"""
    __tablename__ = "treatment_logs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    audit_log_id = Column(String(36), ForeignKey("audit_logs.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    patient_id = Column(String(36), nullable=False, index=True)
    provider_id = Column(String(36), nullable=True, index=True)
    diagnostic_id = Column(String(36), ForeignKey("diagnostic_logs.id"), nullable=True)
    treatment_plan_id = Column(String(36), nullable=True, index=True)
    suggested_treatments = Column(JSON, nullable=True)  # List of treatments suggested by AI
    selected_treatments = Column(JSON, nullable=True)  # List of treatments selected by provider
    ai_confidence = Column(Float, nullable=True)
    provider_feedback = Column(Text, nullable=True)  # Provider comments on AI suggestions
    feedback_rating = Column(Integer, nullable=True)  # Rating of AI suggestions (1-5)
    status = Column(String(20), nullable=False, default="suggested")  # suggested, accepted, modified, rejected
    metadata = Column(JSON, nullable=True)  # Additional treatment-specific metadata
    request_id = Column(String(36), nullable=True, index=True)  # For event correlation
    
    # Relationships
    audit_log = relationship("AuditLog", foreign_keys=[audit_log_id])
    diagnostic = relationship("DiagnosticLog", foreign_keys=[diagnostic_id])
    
    def __repr__(self):
        return (f"<TreatmentLog(id={self.id}, patient_id={self.patient_id}, "
                f"status={self.status})>")

class FeedbackLog(Base):
    """Logs provider feedback on AI performance"""
    __tablename__ = "feedback_logs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    audit_log_id = Column(String(36), ForeignKey("audit_logs.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    provider_id = Column(String(36), nullable=True, index=True)
    resource_type = Column(String(50), nullable=False)  # "diagnostic" or "treatment"
    resource_id = Column(String(36), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 rating
    accuracy = Column(Float, nullable=True)  # provider's assessment of AI accuracy (0-100%)
    comments = Column(Text, nullable=True)
    is_used_for_training = Column(Boolean, default=False, nullable=False)
    metadata = Column(JSON, nullable=True)
    request_id = Column(String(36), nullable=True, index=True)  # For event correlation
    
    # Relationships
    audit_log = relationship("AuditLog", foreign_keys=[audit_log_id])
    
    def __repr__(self):
        return (f"<FeedbackLog(id={self.id}, resource_type={self.resource_type}, "
                f"rating={self.rating})>") 