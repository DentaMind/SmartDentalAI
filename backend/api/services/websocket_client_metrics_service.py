"""
WebSocket Client Metrics Service

This module provides functionality for processing and analyzing client-side
WebSocket metrics received from browser clients.
"""

import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
import json
import numpy as np
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut

from ..repositories.websocket_metrics_repository import WebSocketMetricsRepository
from ..config.settings import settings

# Configure logging
logger = logging.getLogger(__name__)

class WebSocketClientMetricsService:
    """Service for handling client-side WebSocket metrics"""
    
    def __init__(self, db: Session):
        """Initialize with database session"""
        self.db = db
        self.repository = WebSocketMetricsRepository(db)
        self._geolocator = None  # Lazy-loaded geocoder
        
        # Start background tasks
        self._start_background_tasks()
    
    async def process_client_metrics(self, client_id: str, metrics: Dict[str, Any], timestamp: int, user_id: Optional[str] = None) -> bool:
        """
        Process client metrics received from a browser
        
        Args:
            client_id: Client identifier
            metrics: The metrics data sent from the client
            timestamp: Client timestamp in milliseconds
            user_id: Optional authenticated user ID
            
        Returns:
            bool: Success status
        """
        try:
            # Store raw metrics in database
            self.repository.store_client_metrics(client_id, user_id, metrics)
            
            # Try to extract geographic information
            await self._process_geographic_data(client_id, metrics)
            
            # Run anomaly detection
            await self._detect_anomalies(client_id, metrics)
            
            return True
        except Exception as e:
            logger.error(f"Error processing client metrics: {str(e)}")
            return False
    
    async def _process_geographic_data(self, client_id: str, metrics: Dict[str, Any]) -> None:
        """
        Process geographic data from metrics
        
        Args:
            client_id: Client identifier
            metrics: Client metrics data
        """
        # Skip if geolocation is disabled
        if not getattr(settings, "ENABLE_METRICS_GEOLOCATION", False):
            return
        
        # If we have IP address info, try to geolocate
        ip_address = metrics.get("connectionInfo", {}).get("ipAddress")
        if not ip_address or ip_address == "127.0.0.1" or ip_address.startswith("192.168."):
            return  # Skip local addresses
        
        try:
            # Use cached geo info if available
            geo_info = await self._geolocate_ip(ip_address)
            if not geo_info:
                return
            
            region = geo_info.get("region", "unknown")
            country = geo_info.get("country", "unknown")
            
            # Store as geographic metric
            geo_metrics = {
                "client_id": client_id,
                "avg_message_latency": metrics.get("avgMessageLatency", 0),
                "connection_success_rate": 1.0 if metrics.get("connectionDrops", 0) == 0 else 0.0,
                "client_count": 1,
                "ip_address": ip_address,
                "city": geo_info.get("city"),
                "isp": geo_info.get("isp"),
                "connection_type": metrics.get("connectionInfo", {}).get("effectiveType")
            }
            
            self.repository.store_geographic_metric(region, country, geo_metrics)
            
        except Exception as e:
            logger.error(f"Error processing geographic data: {str(e)}")
    
    async def _geolocate_ip(self, ip_address: str) -> Dict[str, Any]:
        """
        Geolocate an IP address
        
        Args:
            ip_address: IP address to geolocate
            
        Returns:
            Dict: Geolocation information
        """
        # In a real implementation, you would use a proper IP geolocation service
        # This is a simplified placeholder
        
        # For development/testing, return dummy data based on IP patterns
        if ip_address.startswith("1."):
            return {
                "region": "North America",
                "country": "United States",
                "city": "New York",
                "isp": "Verizon"
            }
        elif ip_address.startswith("2."):
            return {
                "region": "Europe",
                "country": "United Kingdom",
                "city": "London",
                "isp": "BT"
            }
        elif ip_address.startswith("3."):
            return {
                "region": "Asia",
                "country": "Japan",
                "city": "Tokyo",
                "isp": "NTT"
            }
        else:
            return {
                "region": "Unknown",
                "country": "Unknown",
                "city": None,
                "isp": None
            }
    
    async def _detect_anomalies(self, client_id: str, metrics: Dict[str, Any]) -> None:
        """
        Detect anomalies in client metrics
        
        Args:
            client_id: Client identifier
            metrics: Client metrics data
        """
        # Check for connection stability anomalies
        connection_drops = metrics.get("connectionDrops", 0)
        if connection_drops > 3:
            self.repository.store_anomaly_detection(
                metric_name="connection_drops",
                expected_value=1.0,
                actual_value=float(connection_drops),
                is_anomaly=True,
                severity="high" if connection_drops > 5 else "medium",
                context={
                    "client_id": client_id,
                    "reconnection_attempts": metrics.get("reconnectionAttempts", 0),
                    "successful_reconnections": metrics.get("successfulReconnections", 0),
                    "network_type": metrics.get("connectionInfo", {}).get("networkType"),
                    "effective_type": metrics.get("connectionInfo", {}).get("effectiveType")
                }
            )
        
        # Check for latency anomalies
        avg_latency = metrics.get("avgMessageLatency", 0)
        if avg_latency > 500:  # More than 500ms is considered high
            self.repository.store_anomaly_detection(
                metric_name="avg_message_latency",
                expected_value=100.0,  # Expected good latency
                actual_value=avg_latency,
                is_anomaly=True,
                severity="high" if avg_latency > 1000 else "medium",
                context={
                    "client_id": client_id,
                    "network_type": metrics.get("connectionInfo", {}).get("networkType"),
                    "effective_type": metrics.get("connectionInfo", {}).get("effectiveType"),
                    "round_trip_time": metrics.get("connectionInfo", {}).get("roundTripTime")
                }
            )
        
        # Check for message error anomalies
        message_errors = metrics.get("messageErrors", 0)
        messages_sent = metrics.get("messagesSent", 0)
        if messages_sent > 0:
            error_rate = message_errors / messages_sent
            if error_rate > 0.1:  # More than 10% error rate
                self.repository.store_anomaly_detection(
                    metric_name="message_error_rate",
                    expected_value=0.01,  # Expected 1% or less
                    actual_value=error_rate,
                    is_anomaly=True,
                    severity="high" if error_rate > 0.2 else "medium",
                    context={
                        "client_id": client_id,
                        "messages_sent": messages_sent,
                        "message_errors": message_errors
                    }
                )
    
    def _start_background_tasks(self) -> None:
        """Start background processing tasks"""
        # In a real implementation with a task queue like Celery,
        # you would register these as periodic tasks
        
        async def run_aggregation_task():
            while True:
                try:
                    # Create hourly aggregation
                    self.repository.create_hourly_aggregation()
                    logger.info("Created hourly WebSocket metrics aggregation")
                except Exception as e:
                    logger.error(f"Error creating aggregation: {str(e)}")
                
                # Sleep for one hour before next aggregation
                await asyncio.sleep(3600)
        
        async def run_cleanup_task():
            while True:
                try:
                    # Clean up old metrics once a day
                    days_to_keep = getattr(settings, "WEBSOCKET_METRICS_RETENTION_DAYS", 30)
                    deleted_count = self.repository.cleanup_old_metrics(days_to_keep)
                    if deleted_count > 0:
                        logger.info(f"Cleaned up {deleted_count} old WebSocket metric records")
                except Exception as e:
                    logger.error(f"Error cleaning up old metrics: {str(e)}")
                
                # Sleep for one day
                await asyncio.sleep(86400)
        
        # Start tasks in background
        try:
            asyncio.create_task(run_aggregation_task())
            asyncio.create_task(run_cleanup_task())
        except Exception as e:
            logger.error(f"Error starting background tasks: {str(e)}")
    
    # Analytics methods for frontend
    
    async def get_client_metrics_summary(self, start_time: Optional[datetime] = None, end_time: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Get a summary of client metrics
        
        Args:
            start_time: Optional start time filter
            end_time: Optional end time filter
        
        Returns:
            Dict: Summary of client metrics
        """
        # Default to last 24 hours if not specified
        if not end_time:
            end_time = datetime.utcnow()
        if not start_time:
            start_time = end_time - timedelta(days=1)
        
        # Get metrics for the specified time range
        metrics = self.repository.get_client_metrics(
            start_time=start_time,
            end_time=end_time,
            limit=1000  # Get a significant sample
        )
        
        if not metrics:
            return {
                "client_count": 0,
                "avg_latency": 0,
                "connection_stability": 100,
                "error_rate": 0,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat()
            }
        
        # Calculate summary statistics
        unique_clients = len(set(m.client_id for m in metrics))
        
        # Latency
        latencies = [m.avg_message_latency for m in metrics if m.avg_message_latency > 0]
        avg_latency = sum(latencies) / len(latencies) if latencies else 0
        
        # Connection stability (percentage of connections without drops)
        total_connections = sum(m.total_connections for m in metrics)
        total_drops = sum(m.connection_drops for m in metrics)
        connection_stability = 100 - ((total_drops / total_connections * 100) if total_connections > 0 else 0)
        
        # Error rate
        total_messages = sum(m.messages_sent for m in metrics)
        total_errors = sum(m.message_errors for m in metrics)
        error_rate = (total_errors / total_messages * 100) if total_messages > 0 else 0
        
        return {
            "client_count": unique_clients,
            "avg_latency": avg_latency,
            "connection_stability": connection_stability,
            "error_rate": error_rate,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat()
        }
    
    async def get_geographic_distribution(self) -> List[Dict[str, Any]]:
        """
        Get the geographic distribution of WebSocket metrics
        
        Returns:
            List[Dict]: List of geographic data points
        """
        # Get all geographic metrics for the last 24 hours
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=1)
        
        geo_metrics = self.repository.get_geographic_metrics(
            start_time=start_time,
            end_time=end_time
        )
        
        # Group by region
        regions = {}
        for metric in geo_metrics:
            region = metric.region
            if region not in regions:
                regions[region] = {
                    "region": region,
                    "country": metric.country,
                    "client_count": 0,
                    "avg_latency": 0,
                    "latency_samples": [],
                    "connection_success_rate": 0,
                    "success_rate_samples": []
                }
            
            # Accumulate metrics
            regions[region]["client_count"] += metric.client_count
            regions[region]["latency_samples"].append(metric.avg_message_latency)
            regions[region]["success_rate_samples"].append(metric.connection_success_rate)
        
        # Calculate averages
        result = []
        for region_name, data in regions.items():
            latency_samples = data.pop("latency_samples")
            success_rate_samples = data.pop("success_rate_samples")
            
            data["avg_latency"] = sum(latency_samples) / len(latency_samples) if latency_samples else 0
            data["connection_success_rate"] = sum(success_rate_samples) / len(success_rate_samples) if success_rate_samples else 0
            
            result.append(data)
        
        return result
    
    async def get_anomalies_summary(self) -> Dict[str, Any]:
        """
        Get a summary of recent anomalies
        
        Returns:
            Dict: Summary of anomalies
        """
        # Get anomalies from the last 24 hours
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=1)
        
        anomalies = self.repository.get_anomalies(
            start_time=start_time,
            end_time=end_time,
            is_anomaly=True
        )
        
        # Group by metric and severity
        metrics = {}
        severity_counts = {"low": 0, "medium": 0, "high": 0}
        
        for anomaly in anomalies:
            metric_name = anomaly.metric_name
            if metric_name not in metrics:
                metrics[metric_name] = {
                    "count": 0,
                    "avg_deviation": 0,
                    "deviations": []
                }
            
            metrics[metric_name]["count"] += 1
            metrics[metric_name]["deviations"].append(anomaly.deviation_percent)
            
            # Count by severity
            severity_counts[anomaly.severity] += 1
        
        # Calculate average deviations
        for metric_name, data in metrics.items():
            deviations = data.pop("deviations")
            data["avg_deviation"] = sum(deviations) / len(deviations) if deviations else 0
        
        return {
            "total_anomalies": len(anomalies),
            "severity_counts": severity_counts,
            "metrics": metrics,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat()
        }
    
    async def correlate_with_user_experience(self, start_time: Optional[datetime] = None, end_time: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Correlate WebSocket metrics with user experience metrics
        
        Args:
            start_time: Optional start time filter
            end_time: Optional end time filter
            
        Returns:
            Dict: Correlation data
        """
        # Default to last 24 hours if not specified
        if not end_time:
            end_time = datetime.utcnow()
        if not start_time:
            start_time = end_time - timedelta(days=1)
        
        # Get metrics for the specified time range
        metrics = self.repository.get_client_metrics(
            start_time=start_time,
            end_time=end_time,
            limit=1000
        )
        
        if not metrics:
            return {
                "correlations": {},
                "insights": [],
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat()
            }
        
        # This would ideally correlate with real UX metrics from other sources
        # For now, we'll use a simplified approach with synthetic correlations
        
        # Group metrics by hour for time-series correlation
        hourly_data = {}
        for metric in metrics:
            hour = metric.timestamp.replace(minute=0, second=0, microsecond=0)
            hour_key = hour.isoformat()
            
            if hour_key not in hourly_data:
                hourly_data[hour_key] = {
                    "websocket": {
                        "latency_samples": [],
                        "connection_drops": 0,
                        "message_errors": 0,
                        "total_messages": 0
                    },
                    "ux": {
                        # Synthetic UX metrics - in a real implementation, 
                        # these would come from analytics data
                        "page_load_time": 0,
                        "user_interactions": 0,
                        "error_count": 0,
                        "samples": 0
                    }
                }
            
            # Accumulate WebSocket metrics
            hourly_data[hour_key]["websocket"]["latency_samples"].append(metric.avg_message_latency)
            hourly_data[hour_key]["websocket"]["connection_drops"] += metric.connection_drops
            hourly_data[hour_key]["websocket"]["message_errors"] += metric.message_errors
            hourly_data[hour_key]["websocket"]["total_messages"] += metric.messages_sent
            
            # For demo purposes, we'll create synthetic UX metrics that correlate with WebSocket metrics
            # In a real implementation, these would be actual measurements from analytics
            hourly_data[hour_key]["ux"]["samples"] += 1
            hourly_data[hour_key]["ux"]["page_load_time"] += 1000 + (metric.avg_message_latency * 2)  # Base + scaling
            hourly_data[hour_key]["ux"]["error_count"] += metric.message_errors
            hourly_data[hour_key]["ux"]["user_interactions"] += max(0, 50 - (metric.connection_drops * 10))
        
        # Calculate averages for each hour
        time_series = []
        for hour, data in hourly_data.items():
            ws_data = data["websocket"]
            ux_data = data["ux"]
            
            avg_latency = sum(ws_data["latency_samples"]) / len(ws_data["latency_samples"]) if ws_data["latency_samples"] else 0
            error_rate = ws_data["message_errors"] / ws_data["total_messages"] if ws_data["total_messages"] > 0 else 0
            
            avg_page_load = ux_data["page_load_time"] / ux_data["samples"] if ux_data["samples"] > 0 else 0
            avg_interactions = ux_data["user_interactions"] / ux_data["samples"] if ux_data["samples"] > 0 else 0
            
            time_series.append({
                "timestamp": hour,
                "websocket": {
                    "avg_latency": avg_latency,
                    "error_rate": error_rate,
                    "connection_drops": ws_data["connection_drops"]
                },
                "ux": {
                    "page_load_time": avg_page_load,
                    "user_interactions": avg_interactions,
                    "error_count": ux_data["error_count"]
                }
            })
        
        # Calculate correlations
        correlations = {
            "latency_vs_page_load": self._calculate_correlation(
                [point["websocket"]["avg_latency"] for point in time_series],
                [point["ux"]["page_load_time"] for point in time_series]
            ),
            "error_rate_vs_ux_errors": self._calculate_correlation(
                [point["websocket"]["error_rate"] for point in time_series],
                [point["ux"]["error_count"] for point in time_series]
            ),
            "drops_vs_interactions": self._calculate_correlation(
                [point["websocket"]["connection_drops"] for point in time_series],
                [point["ux"]["user_interactions"] for point in time_series]
            )
        }
        
        # Generate insights based on correlations
        insights = []
        if correlations["latency_vs_page_load"] > 0.7:
            insights.append("High WebSocket latency is strongly correlated with slower page load times")
        
        if correlations["error_rate_vs_ux_errors"] > 0.5:
            insights.append("WebSocket errors appear to be contributing to user-facing errors")
        
        if correlations["drops_vs_interactions"] < -0.5:
            insights.append("Connection drops are negatively impacting user interaction rates")
        
        return {
            "correlations": correlations,
            "time_series": time_series,
            "insights": insights,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat()
        }
    
    def _calculate_correlation(self, x: List[float], y: List[float]) -> float:
        """
        Calculate Pearson correlation coefficient between two series
        
        Args:
            x: First data series
            y: Second data series
            
        Returns:
            float: Correlation coefficient (-1 to 1)
        """
        if len(x) != len(y) or len(x) < 2:
            return 0
        
        try:
            # Calculate means
            mean_x = sum(x) / len(x)
            mean_y = sum(y) / len(y)
            
            # Calculate covariance and variances
            covariance = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(len(x)))
            variance_x = sum((val - mean_x) ** 2 for val in x)
            variance_y = sum((val - mean_y) ** 2 for val in y)
            
            # Calculate correlation
            if variance_x > 0 and variance_y > 0:
                correlation = covariance / (variance_x ** 0.5 * variance_y ** 0.5)
                return max(-1.0, min(1.0, correlation))  # Clamp to [-1, 1]
            else:
                return 0
        except Exception:
            return 0 