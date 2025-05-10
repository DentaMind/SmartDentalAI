"""
Repository for WebSocket metrics
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, cast, Float
import numpy as np
import json

from ..models.websocket_metrics import (
    WebSocketClientMetric,
    WebSocketMetricAggregation,
    WebSocketGeographicMetric,
    WebSocketAnomalyDetection
)


class WebSocketMetricsRepository:
    """Repository for WebSocket metrics database operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Client Metrics Operations
    
    def store_client_metrics(self, client_id: str, user_id: Optional[str], metrics: Dict[str, Any]) -> WebSocketClientMetric:
        """
        Store client-side WebSocket metrics in the database
        
        Args:
            client_id: Client identifier
            user_id: User identifier (if authenticated)
            metrics: Client metrics data
            
        Returns:
            WebSocketClientMetric: The created database record
        """
        # Extract connection info
        connection_info = metrics.get("connectionInfo", {})
        
        # Extract error info
        last_error = metrics.get("lastError", {})
        
        # Create the client metric record
        client_metric = WebSocketClientMetric(
            client_id=client_id,
            user_id=user_id,
            connection_state=metrics.get("connectionState", "unknown"),
            total_connections=metrics.get("totalConnections", 0),
            connection_drops=metrics.get("connectionDrops", 0),
            reconnection_attempts=metrics.get("reconnectionAttempts", 0),
            successful_reconnections=metrics.get("successfulReconnections", 0),
            messages_sent=metrics.get("messagesSent", 0),
            messages_received=metrics.get("messagesReceived", 0),
            messages_queued=metrics.get("messagesQueued", 0),
            message_errors=metrics.get("messageErrors", 0),
            last_message_latency=metrics.get("lastMessageLatency", 0),
            avg_message_latency=metrics.get("avgMessageLatency", 0),
            total_connected_time=metrics.get("totalConnectedTime", 0),
            user_agent=connection_info.get("userAgent"),
            network_type=connection_info.get("networkType"),
            effective_type=connection_info.get("effectiveType"),
            round_trip_time=connection_info.get("roundTripTime"),
            downlink=connection_info.get("downlink"),
            last_error_type=last_error.get("type") if last_error else None,
            last_error_message=last_error.get("message") if last_error else None,
            last_error_timestamp=last_error.get("timestamp") if last_error else None,
            raw_metrics=metrics
        )
        
        self.db.add(client_metric)
        self.db.commit()
        self.db.refresh(client_metric)
        
        return client_metric
    
    def get_client_metrics(
        self, 
        client_id: Optional[str] = None,
        user_id: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100
    ) -> List[WebSocketClientMetric]:
        """
        Get client metrics based on filters
        
        Args:
            client_id: Optional client ID filter
            user_id: Optional user ID filter
            start_time: Optional start time filter
            end_time: Optional end time filter
            limit: Maximum number of records to return
            
        Returns:
            List[WebSocketClientMetric]: List of client metric records
        """
        query = self.db.query(WebSocketClientMetric)
        
        if client_id:
            query = query.filter(WebSocketClientMetric.client_id == client_id)
        
        if user_id:
            query = query.filter(WebSocketClientMetric.user_id == user_id)
        
        if start_time:
            query = query.filter(WebSocketClientMetric.timestamp >= start_time)
        
        if end_time:
            query = query.filter(WebSocketClientMetric.timestamp <= end_time)
        
        return query.order_by(desc(WebSocketClientMetric.timestamp)).limit(limit).all()
    
    # Aggregation Operations
    
    def create_hourly_aggregation(self) -> WebSocketMetricAggregation:
        """
        Create hourly aggregation of WebSocket metrics
        
        Returns:
            WebSocketMetricAggregation: The created aggregation record
        """
        # Get time range for the last hour
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=1)
        
        # Get metrics for the last hour
        metrics = self.db.query(WebSocketClientMetric).filter(
            WebSocketClientMetric.timestamp >= start_time,
            WebSocketClientMetric.timestamp < end_time
        ).all()
        
        if not metrics:
            return None
        
        # Count unique clients
        client_count = len(set(m.client_id for m in metrics))
        
        # Calculate aggregations
        latencies = [m.avg_message_latency for m in metrics if m.avg_message_latency > 0]
        if latencies:
            avg_latency = sum(latencies) / len(latencies)
            min_latency = min(latencies)
            max_latency = max(latencies)
            p95_latency = np.percentile(latencies, 95) if len(latencies) >= 20 else max_latency
        else:
            avg_latency = min_latency = max_latency = p95_latency = 0
        
        # Aggregate message stats
        total_messages_sent = sum(m.messages_sent for m in metrics)
        total_messages_received = sum(m.messages_received for m in metrics)
        total_message_errors = sum(m.message_errors for m in metrics)
        
        # Aggregate connection stats
        avg_connection_drops = sum(m.connection_drops for m in metrics) / client_count if client_count > 0 else 0
        avg_reconnection_attempts = sum(m.reconnection_attempts for m in metrics) / client_count if client_count > 0 else 0
        avg_successful_reconnections = sum(m.successful_reconnections for m in metrics) / client_count if client_count > 0 else 0
        
        # Create aggregation record
        aggregation = WebSocketMetricAggregation(
            period="hourly",
            timestamp=end_time,
            client_count=client_count,
            avg_connection_drops=avg_connection_drops,
            avg_reconnection_attempts=avg_reconnection_attempts,
            avg_successful_reconnections=avg_successful_reconnections,
            total_messages_sent=total_messages_sent,
            total_messages_received=total_messages_received,
            total_message_errors=total_message_errors,
            avg_message_latency=avg_latency,
            min_message_latency=min_latency,
            max_message_latency=max_latency,
            p95_message_latency=p95_latency,
            aggregation_data={
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "metrics_count": len(metrics),
                "unique_clients": client_count
            }
        )
        
        self.db.add(aggregation)
        self.db.commit()
        self.db.refresh(aggregation)
        
        return aggregation
    
    def get_aggregations(
        self,
        period: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 168  # Default 7 days of hourly data
    ) -> List[WebSocketMetricAggregation]:
        """
        Get metric aggregations
        
        Args:
            period: Aggregation period (hourly, daily, weekly)
            start_time: Optional start time filter
            end_time: Optional end time filter
            limit: Maximum number of records to return
            
        Returns:
            List[WebSocketMetricAggregation]: List of aggregation records
        """
        query = self.db.query(WebSocketMetricAggregation).filter(
            WebSocketMetricAggregation.period == period
        )
        
        if start_time:
            query = query.filter(WebSocketMetricAggregation.timestamp >= start_time)
        
        if end_time:
            query = query.filter(WebSocketMetricAggregation.timestamp <= end_time)
        
        return query.order_by(desc(WebSocketMetricAggregation.timestamp)).limit(limit).all()
    
    # Geographic Metrics Operations
    
    def store_geographic_metric(
        self,
        region: str,
        country: str,
        metrics_data: Dict[str, Any]
    ) -> WebSocketGeographicMetric:
        """
        Store geographic WebSocket metrics
        
        Args:
            region: Geographic region
            country: Country
            metrics_data: Metrics data for the region
            
        Returns:
            WebSocketGeographicMetric: The created record
        """
        geo_metric = WebSocketGeographicMetric(
            region=region,
            country=country,
            client_count=metrics_data.get("client_count", 0),
            avg_message_latency=metrics_data.get("avg_message_latency", 0),
            connection_success_rate=metrics_data.get("connection_success_rate", 0),
            city=metrics_data.get("city"),
            isp=metrics_data.get("isp"),
            metrics_data=metrics_data
        )
        
        self.db.add(geo_metric)
        self.db.commit()
        self.db.refresh(geo_metric)
        
        return geo_metric
    
    def get_geographic_metrics(
        self,
        region: Optional[str] = None,
        country: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[WebSocketGeographicMetric]:
        """
        Get geographic metrics
        
        Args:
            region: Optional region filter
            country: Optional country filter
            start_time: Optional start time filter
            end_time: Optional end time filter
            
        Returns:
            List[WebSocketGeographicMetric]: List of geographic metric records
        """
        query = self.db.query(WebSocketGeographicMetric)
        
        if region:
            query = query.filter(WebSocketGeographicMetric.region == region)
        
        if country:
            query = query.filter(WebSocketGeographicMetric.country == country)
        
        if start_time:
            query = query.filter(WebSocketGeographicMetric.timestamp >= start_time)
        
        if end_time:
            query = query.filter(WebSocketGeographicMetric.timestamp <= end_time)
        
        return query.order_by(desc(WebSocketGeographicMetric.timestamp)).all()
    
    # Anomaly Detection Operations
    
    def store_anomaly_detection(
        self,
        metric_name: str,
        expected_value: float,
        actual_value: float,
        is_anomaly: bool,
        severity: str,
        context: Optional[Dict[str, Any]] = None
    ) -> WebSocketAnomalyDetection:
        """
        Store anomaly detection result
        
        Args:
            metric_name: Name of the metric
            expected_value: Expected value based on historical data
            actual_value: Actual observed value
            is_anomaly: Whether this is considered an anomaly
            severity: Severity level (low, medium, high)
            context: Additional context data
            
        Returns:
            WebSocketAnomalyDetection: The created record
        """
        # Calculate deviation percentage
        if expected_value != 0:
            deviation_percent = ((actual_value - expected_value) / abs(expected_value)) * 100
        else:
            deviation_percent = 0 if actual_value == 0 else 100
        
        anomaly = WebSocketAnomalyDetection(
            metric_name=metric_name,
            expected_value=expected_value,
            actual_value=actual_value,
            deviation_percent=deviation_percent,
            is_anomaly=is_anomaly,
            severity=severity,
            context=context or {}
        )
        
        self.db.add(anomaly)
        self.db.commit()
        self.db.refresh(anomaly)
        
        return anomaly
    
    def get_anomalies(
        self,
        metric_name: Optional[str] = None,
        is_anomaly: Optional[bool] = True,
        severity: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100
    ) -> List[WebSocketAnomalyDetection]:
        """
        Get anomaly detection records
        
        Args:
            metric_name: Optional metric name filter
            is_anomaly: Optional anomaly status filter
            severity: Optional severity filter
            start_time: Optional start time filter
            end_time: Optional end time filter
            limit: Maximum number of records to return
            
        Returns:
            List[WebSocketAnomalyDetection]: List of anomaly detection records
        """
        query = self.db.query(WebSocketAnomalyDetection)
        
        if metric_name:
            query = query.filter(WebSocketAnomalyDetection.metric_name == metric_name)
        
        if is_anomaly is not None:
            query = query.filter(WebSocketAnomalyDetection.is_anomaly == is_anomaly)
        
        if severity:
            query = query.filter(WebSocketAnomalyDetection.severity == severity)
        
        if start_time:
            query = query.filter(WebSocketAnomalyDetection.timestamp >= start_time)
        
        if end_time:
            query = query.filter(WebSocketAnomalyDetection.timestamp <= end_time)
        
        return query.order_by(desc(WebSocketAnomalyDetection.timestamp)).limit(limit).all()
    
    # Data Cleanup
    
    def cleanup_old_metrics(self, days_to_keep: int = 30) -> int:
        """
        Clean up old metrics data
        
        Args:
            days_to_keep: Number of days of data to retain
            
        Returns:
            int: Number of records deleted
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        # Delete old client metrics
        deleted_count = self.db.query(WebSocketClientMetric).filter(
            WebSocketClientMetric.timestamp < cutoff_date
        ).delete(synchronize_session=False)
        
        self.db.commit()
        
        return deleted_count 