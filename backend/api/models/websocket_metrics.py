from sqlalchemy import Column, Integer, Float, String, JSON, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..database import Base


class WebSocketClientMetric(Base):
    """Database model for storing client-side WebSocket metrics"""
    
    __tablename__ = "websocket_client_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(String, index=True, nullable=False)
    user_id = Column(String, index=True, nullable=True)
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    
    # Connection metrics
    connection_state = Column(String)
    total_connections = Column(Integer, default=0)
    connection_drops = Column(Integer, default=0)
    reconnection_attempts = Column(Integer, default=0)
    successful_reconnections = Column(Integer, default=0)
    
    # Message metrics
    messages_sent = Column(Integer, default=0)
    messages_received = Column(Integer, default=0)
    messages_queued = Column(Integer, default=0)
    message_errors = Column(Integer, default=0)
    
    # Performance metrics
    last_message_latency = Column(Float, default=0)
    avg_message_latency = Column(Float, default=0)
    total_connected_time = Column(Integer, default=0)
    
    # Client information
    user_agent = Column(String, nullable=True)
    network_type = Column(String, nullable=True)
    effective_type = Column(String, nullable=True)
    round_trip_time = Column(Float, nullable=True)
    downlink = Column(Float, nullable=True)
    
    # Error details (if any)
    last_error_type = Column(String, nullable=True)
    last_error_message = Column(String, nullable=True)
    last_error_timestamp = Column(Integer, nullable=True)
    
    # Full metrics as JSON (for additional data not covered by columns)
    raw_metrics = Column(JSON, nullable=True)


class WebSocketMetricAggregation(Base):
    """Database model for storing aggregated WebSocket metrics"""
    
    __tablename__ = "websocket_metric_aggregations"
    
    id = Column(Integer, primary_key=True, index=True)
    period = Column(String, index=True)  # hourly, daily, weekly
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    
    # Aggregated connection metrics
    client_count = Column(Integer, default=0)
    avg_connection_drops = Column(Float, default=0)
    avg_reconnection_attempts = Column(Float, default=0)
    avg_successful_reconnections = Column(Float, default=0)
    
    # Aggregated message metrics
    total_messages_sent = Column(Integer, default=0)
    total_messages_received = Column(Integer, default=0)
    total_message_errors = Column(Integer, default=0)
    
    # Aggregated performance metrics
    avg_message_latency = Column(Float, default=0)
    min_message_latency = Column(Float, default=0)
    max_message_latency = Column(Float, default=0)
    p95_message_latency = Column(Float, default=0)
    
    # Geographic stats
    region = Column(String, nullable=True, index=True)
    
    # Raw data 
    aggregation_data = Column(JSON, nullable=True)


class WebSocketGeographicMetric(Base):
    """Database model for storing geographical WebSocket metrics"""
    
    __tablename__ = "websocket_geographic_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    region = Column(String, index=True)
    country = Column(String, index=True)
    
    # Performance metrics by region
    client_count = Column(Integer, default=0)
    avg_message_latency = Column(Float, default=0)
    connection_success_rate = Column(Float, default=0)
    
    # Additional geographic data
    city = Column(String, nullable=True)
    isp = Column(String, nullable=True)
    
    # Raw data
    metrics_data = Column(JSON, nullable=True)


class WebSocketAnomalyDetection(Base):
    """Database model for WebSocket anomaly detection"""
    
    __tablename__ = "websocket_anomaly_detections"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, server_default=func.now(), index=True)
    metric_name = Column(String, index=True)
    expected_value = Column(Float)
    actual_value = Column(Float)
    deviation_percent = Column(Float)
    is_anomaly = Column(Boolean, default=False)
    severity = Column(String)  # low, medium, high
    
    # Context data
    context = Column(JSON, nullable=True) 