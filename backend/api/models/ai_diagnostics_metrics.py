from sqlalchemy import Column, Integer, Float, String, JSON, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from ..database import Base


class DiagnosticModelType(enum.Enum):
    """Types of diagnostic AI models"""
    XRAY_ANALYSIS = "xray_analysis"
    CARIES_DETECTION = "caries_detection"
    PERIO_ASSESSMENT = "perio_assessment"
    PATHOLOGY_SCREENING = "pathology_screening"
    RESTORATION_ASSESSMENT = "restoration_assessment"
    BONE_DENSITY = "bone_density"
    STRUCTURE_IDENTIFICATION = "structure_identification"
    ROOT_CANAL = "root_canal"
    IMPLANT_PLANNING = "implant_planning"


class AIDiagnosticMetric(Base):
    """Database model for storing AI diagnostic metrics"""
    
    __tablename__ = "ai_diagnostic_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, index=True, nullable=False)
    model_version = Column(String, index=True, nullable=False)
    request_id = Column(String, index=True, nullable=False)
    user_id = Column(String, index=True, nullable=True)
    patient_id = Column(String, index=True, nullable=True)
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    
    # Performance metrics
    inference_time_ms = Column(Float, default=0)
    preprocessing_time_ms = Column(Float, default=0)
    postprocessing_time_ms = Column(Float, default=0)
    total_processing_time_ms = Column(Float, default=0)
    
    # Diagnostic metrics
    diagnostic_type = Column(String, index=True)  # caries, periapical, periodontal, etc.
    confidence_score = Column(Float, default=0)
    findings_count = Column(Integer, default=0)
    
    # Execution metrics
    cpu_utilization = Column(Float, nullable=True)
    memory_usage_mb = Column(Float, nullable=True)
    gpu_utilization = Column(Float, nullable=True)
    
    # Clinical metrics
    clinician_agreement = Column(Boolean, nullable=True)
    clinician_review_time_ms = Column(Float, nullable=True)
    
    # Error details (if any)
    error_type = Column(String, nullable=True)
    error_message = Column(String, nullable=True)
    
    # Full metrics as JSON (for additional data not covered by columns)
    raw_metrics = Column(JSON, nullable=True)


class AIDiagnosticMetricAggregation(Base):
    """Database model for storing aggregated AI diagnostic metrics"""
    
    __tablename__ = "ai_diagnostic_metric_aggregations"
    
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, index=True)
    model_version = Column(String, index=True)
    period = Column(String, index=True)  # hourly, daily, weekly
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    
    # Aggregated performance metrics
    request_count = Column(Integer, default=0)
    avg_inference_time_ms = Column(Float, default=0)
    min_inference_time_ms = Column(Float, default=0)
    max_inference_time_ms = Column(Float, default=0)
    p95_inference_time_ms = Column(Float, default=0)
    avg_total_processing_time_ms = Column(Float, default=0)
    
    # Aggregated diagnostic metrics
    avg_confidence_score = Column(Float, default=0)
    avg_findings_count = Column(Float, default=0)
    
    # Aggregated resource metrics
    avg_cpu_utilization = Column(Float, default=0)
    avg_memory_usage_mb = Column(Float, default=0)
    avg_gpu_utilization = Column(Float, default=0)
    
    # Aggregated clinical metrics
    clinician_agreement_rate = Column(Float, default=0)
    
    # Error rates
    error_rate = Column(Float, default=0)
    error_count = Column(Integer, default=0)
    
    # Raw data 
    aggregation_data = Column(JSON, nullable=True)


class AIDiagnosticGeographicMetric(Base):
    """Database model for storing geographical AI diagnostic metrics"""
    
    __tablename__ = "ai_diagnostic_geographic_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    model_name = Column(String, index=True)
    model_version = Column(String, index=True, nullable=True)
    region = Column(String, index=True)
    country = Column(String, index=True)
    
    # Performance metrics by region
    request_count = Column(Integer, default=0)
    avg_inference_time_ms = Column(Float, default=0)
    avg_confidence_score = Column(Float, default=0)
    error_rate = Column(Float, default=0)
    
    # Additional geographic data
    city = Column(String, nullable=True)
    clinic_id = Column(String, nullable=True, index=True)
    
    # Raw data
    metrics_data = Column(JSON, nullable=True)


class AIDiagnosticAnomalyDetection(Base):
    """Database model for AI diagnostic anomaly detection"""
    
    __tablename__ = "ai_diagnostic_anomaly_detections"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    model_name = Column(String, index=True)
    model_version = Column(String, index=True, nullable=True)
    metric_name = Column(String, index=True)
    expected_value = Column(Float)
    actual_value = Column(Float)
    deviation_percent = Column(Float)
    is_anomaly = Column(Boolean, default=False)
    severity = Column(String)  # low, medium, high
    
    # Context data
    context = Column(JSON, nullable=True)


class AIDiagnosticClinicalCorrelation(Base):
    """Database model for correlating AI diagnostic metrics with clinical outcomes"""
    
    __tablename__ = "ai_diagnostic_clinical_correlations"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    model_name = Column(String, index=True)
    model_version = Column(String, index=True)
    diagnostic_type = Column(String, index=True)
    
    # Correlation data
    correlation_type = Column(String, index=True)  # accuracy, treatment_change, etc.
    correlation_value = Column(Float)
    sample_size = Column(Integer)
    p_value = Column(Float, nullable=True)
    confidence_interval = Column(String, nullable=True)
    
    # Contextual information
    study_period_start = Column(DateTime, nullable=True)
    study_period_end = Column(DateTime, nullable=True)
    description = Column(Text, nullable=True)
    
    # Raw data
    correlation_data = Column(JSON, nullable=True)


class AIModelPerformanceAggregation(Base):
    """Database model for storing aggregated AI model performance metrics"""
    
    __tablename__ = "ai_model_performance_aggregations"
    
    id = Column(Integer, primary_key=True, index=True)
    period = Column(String, index=True)  # hourly, daily, weekly
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    model_version = Column(String, index=True)
    model_type = Column(String, index=True)
    
    # Usage counts
    request_count = Column(Integer, default=0)
    unique_users = Column(Integer, default=0)
    unique_patients = Column(Integer, default=0)
    
    # Performance averages
    avg_inference_time_ms = Column(Float, default=0)
    avg_total_processing_time_ms = Column(Float, default=0)
    avg_confidence_score = Column(Float, default=0)
    p95_inference_time_ms = Column(Float, default=0)
    max_inference_time_ms = Column(Float, default=0)
    
    # Clinical metrics
    acceptance_rate = Column(Float, default=0)  # % accepted without changes
    avg_clinician_agreement = Column(Float, default=0)
    critical_findings_rate = Column(Float, default=0)
    
    # Error rates
    error_rate = Column(Float, default=0)
    
    # Regional data
    region = Column(String, nullable=True, index=True)
    
    # Aggregation metadata
    aggregation_data = Column(JSON, nullable=True)


class AIClinicalCorrelation(Base):
    """Database model for tracking correlations between AI diagnostics and clinical outcomes"""
    
    __tablename__ = "ai_clinical_correlations"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    model_version = Column(String, index=True)
    model_type = Column(String, index=True)
    
    # Time period
    period_start = Column(DateTime)
    period_end = Column(DateTime)
    
    # Correlation metrics
    correlation_metric = Column(String)  # e.g., "treatment_selection_agreement"
    correlation_value = Column(Float)  # -1 to 1
    
    # Sample size
    sample_size = Column(Integer)
    
    # Significance
    statistical_significance = Column(Float)  # p-value
    is_significant = Column(Boolean)
    
    # Additional data
    correlation_data = Column(JSON, nullable=True) 