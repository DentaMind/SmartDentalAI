"""
AI Diagnostics Metrics Service

This module provides functionality for processing and analyzing AI diagnostic
metrics generated during dental diagnostic operations.
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

from ..repositories.ai_diagnostics_metrics_repository import AIDiagnosticsMetricsRepository
from ..config.settings import settings

# Configure logging
logger = logging.getLogger(__name__)

class AIDiagnosticsMetricsService:
    """Service for handling AI diagnostics metrics"""
    
    def __init__(self, db: Session):
        """Initialize with database session"""
        self.db = db
        self.repository = AIDiagnosticsMetricsRepository(db)
        self._geolocator = None  # Lazy-loaded geocoder
        
        # Start background tasks
        self._start_background_tasks()
    
    def _start_background_tasks(self):
        """Start background tasks for aggregation and analysis"""
        # Create task for hourly aggregation
        asyncio.create_task(self._hourly_aggregation_task())
        
        # Create task for anomaly detection
        asyncio.create_task(self._anomaly_detection_task())
    
    async def _hourly_aggregation_task(self):
        """Background task for creating hourly aggregations"""
        while True:
            try:
                # Wait until next hour starts
                now = datetime.utcnow()
                next_hour = (now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1))
                wait_seconds = (next_hour - now).total_seconds()
                
                # Don't wait more than an hour
                wait_seconds = min(wait_seconds, 3600)
                
                # Add a small delay to ensure we're in the next hour
                wait_seconds += 10
                
                await asyncio.sleep(wait_seconds)
                
                # Create hourly aggregations
                aggregations = self.repository.create_hourly_aggregation()
                
                if aggregations:
                    logger.info(f"Created {len(aggregations)} hourly AI diagnostic metrics aggregations")
                else:
                    logger.info("No metrics found for hourly aggregation")
                
            except Exception as e:
                logger.error(f"Error in hourly aggregation task: {str(e)}")
                await asyncio.sleep(60)  # Wait a minute before retrying
    
    async def _anomaly_detection_task(self):
        """Background task for detecting anomalies in AI diagnostic metrics"""
        while True:
            try:
                # Run anomaly detection every 15 minutes
                await asyncio.sleep(15 * 60)
                
                # Get reference time range (previous day)
                end_time = datetime.utcnow()
                start_time = end_time - timedelta(days=1)
                
                # Get recent aggregations
                recent_aggregations = self.repository.get_aggregations(
                    period="hourly",
                    start_time=start_time,
                    end_time=end_time
                )
                
                # Group by model name and version
                model_versions = {}
                for agg in recent_aggregations:
                    key = f"{agg.model_name}_{agg.model_version}"
                    if key not in model_versions:
                        model_versions[key] = []
                    model_versions[key].append(agg)
                
                # Analyze each model version
                for key, aggregations in model_versions.items():
                    if len(aggregations) < 3:  # Need enough data points
                        continue
                    
                    # Sort by timestamp
                    aggregations.sort(key=lambda x: x.timestamp)
                    
                    # Get the latest aggregation for anomaly detection
                    latest = aggregations[-1]
                    
                    # Calculate baseline from historical data (excluding the latest)
                    historical = aggregations[:-1]
                    
                    # Check inference time
                    inference_times = [agg.avg_inference_time_ms for agg in historical]
                    avg_inference_time = sum(inference_times) / len(inference_times)
                    std_inference_time = np.std(inference_times) if len(inference_times) > 1 else avg_inference_time * 0.1
                    
                    # Detect anomaly if more than 2 standard deviations from mean
                    if abs(latest.avg_inference_time_ms - avg_inference_time) > 2 * std_inference_time:
                        # Record anomaly
                        self.repository.store_anomaly_detection(
                            model_name=latest.model_name,
                            model_version=latest.model_version,
                            metric_name="avg_inference_time_ms",
                            expected_value=avg_inference_time,
                            actual_value=latest.avg_inference_time_ms,
                            is_anomaly=True,
                            severity="high" if latest.avg_inference_time_ms > avg_inference_time * 1.5 else "medium",
                            context={
                                "std_dev": float(std_inference_time),
                                "historical_data_points": len(historical),
                                "request_count": latest.request_count
                            }
                        )
                    
                    # Check error rate
                    error_rates = [agg.error_rate for agg in historical]
                    avg_error_rate = sum(error_rates) / len(error_rates)
                    
                    # Detect anomaly if error rate increases significantly
                    if latest.error_rate > avg_error_rate * 1.5 and latest.error_rate > 0.05:
                        # Record anomaly
                        self.repository.store_anomaly_detection(
                            model_name=latest.model_name,
                            model_version=latest.model_version,
                            metric_name="error_rate",
                            expected_value=avg_error_rate,
                            actual_value=latest.error_rate,
                            is_anomaly=True,
                            severity="high" if latest.error_rate > 0.2 else "medium",
                            context={
                                "avg_historical_error_rate": avg_error_rate,
                                "historical_data_points": len(historical),
                                "error_count": latest.error_count,
                                "request_count": latest.request_count
                            }
                        )
                    
                    # Check confidence score
                    confidence_scores = [agg.avg_confidence_score for agg in historical]
                    avg_confidence = sum(confidence_scores) / len(confidence_scores)
                    
                    # Detect anomaly if confidence drops significantly
                    if latest.avg_confidence_score < avg_confidence * 0.8:
                        # Record anomaly
                        self.repository.store_anomaly_detection(
                            model_name=latest.model_name,
                            model_version=latest.model_version,
                            metric_name="avg_confidence_score",
                            expected_value=avg_confidence,
                            actual_value=latest.avg_confidence_score,
                            is_anomaly=True,
                            severity="high" if latest.avg_confidence_score < avg_confidence * 0.6 else "medium",
                            context={
                                "avg_historical_confidence": avg_confidence,
                                "historical_data_points": len(historical),
                                "request_count": latest.request_count
                            }
                        )
                
                logger.info(f"Completed AI diagnostic metrics anomaly detection for {len(model_versions)} model versions")
                
            except Exception as e:
                logger.error(f"Error in anomaly detection task: {str(e)}")
                await asyncio.sleep(60)  # Wait a minute before retrying
    
    async def process_diagnostic_metrics(
        self, 
        model_name: str, 
        model_version: str, 
        request_id: str, 
        metrics: Dict[str, Any], 
        user_id: Optional[str] = None,
        patient_id: Optional[str] = None,
        location_info: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Process AI diagnostic metrics
        
        Args:
            model_name: Name of the AI model
            model_version: Version of the AI model
            request_id: Unique request identifier
            metrics: The metrics data
            user_id: Optional authenticated user ID
            patient_id: Optional patient ID
            location_info: Optional geographic information
            
        Returns:
            bool: Success status
        """
        try:
            # Store raw metrics in database
            self.repository.store_diagnostic_metrics(
                model_name=model_name,
                model_version=model_version,
                request_id=request_id,
                metrics=metrics,
                user_id=user_id,
                patient_id=patient_id
            )
            
            # Try to extract geographic information if provided
            if location_info:
                await self._process_geographic_data(model_name, model_version, metrics, location_info)
            
            # Run real-time anomaly detection
            await self._detect_real_time_anomalies(model_name, model_version, metrics)
            
            return True
        except Exception as e:
            logger.error(f"Error processing AI diagnostic metrics: {str(e)}")
            return False
    
    async def _process_geographic_data(
        self, 
        model_name: str, 
        model_version: str, 
        metrics: Dict[str, Any], 
        location_info: Dict[str, Any]
    ) -> None:
        """
        Process geographic information from diagnostic metrics
        
        Args:
            model_name: Name of the AI model
            model_version: Version of the AI model
            metrics: Diagnostic metrics data
            location_info: Geographic information
        """
        try:
            # Extract region and country
            region = location_info.get("region", "unknown")
            country = location_info.get("country", "unknown")
            
            # Extract performance metrics
            performance = metrics.get("performance", {})
            inference_time = performance.get("inference_time_ms", 0)
            
            # Extract diagnostic info
            diagnostic = metrics.get("diagnostic", {})
            confidence_score = diagnostic.get("confidence_score", 0)
            
            # Extract error info
            error = metrics.get("error", {})
            has_error = error and error.get("type") is not None
            
            # Get or create geographic metrics entry
            # In a real implementation, we would aggregate this data over time
            geo_metrics = {
                "request_count": 1,
                "avg_inference_time_ms": inference_time,
                "avg_confidence_score": confidence_score,
                "error_rate": 1.0 if has_error else 0.0,
                "city": location_info.get("city"),
                "clinic_id": location_info.get("clinic_id")
            }
            
            # Store geographic metrics
            self.repository.store_geographic_metric(
                model_name=model_name,
                model_version=model_version,
                region=region,
                country=country,
                metrics_data=geo_metrics
            )
            
        except Exception as e:
            logger.error(f"Error processing geographic data for diagnostic metrics: {str(e)}")
    
    async def _detect_real_time_anomalies(
        self, 
        model_name: str, 
        model_version: str, 
        metrics: Dict[str, Any]
    ) -> None:
        """
        Detect anomalies in real-time for individual diagnostic requests
        
        Args:
            model_name: Name of the AI model
            model_version: Version of the AI model
            metrics: Diagnostic metrics data
        """
        try:
            # Extract performance metrics
            performance = metrics.get("performance", {})
            inference_time = performance.get("inference_time_ms", 0)
            total_time = performance.get("total_processing_time_ms", 0)
            
            # Get reference values for this model (could be cached)
            # For simplicity, we'll use hardcoded thresholds, but in a real
            # implementation we would query historical averages
            
            # Inference time anomaly
            if inference_time > 5000:  # More than 5 seconds is very slow
                self.repository.store_anomaly_detection(
                    model_name=model_name,
                    model_version=model_version,
                    metric_name="inference_time_ms",
                    expected_value=1000.0,  # Expected good inference time
                    actual_value=float(inference_time),
                    is_anomaly=True,
                    severity="high" if inference_time > 10000 else "medium",
                    context={
                        "request_id": metrics.get("request_id"),
                        "total_processing_time_ms": total_time,
                        "diagnostic_type": metrics.get("diagnostic", {}).get("type")
                    }
                )
            
            # Extract diagnostic info
            diagnostic = metrics.get("diagnostic", {})
            confidence_score = diagnostic.get("confidence_score", 0)
            
            # Confidence score anomaly (unusually low confidence)
            if confidence_score < 0.4:  # Low confidence
                self.repository.store_anomaly_detection(
                    model_name=model_name,
                    model_version=model_version,
                    metric_name="confidence_score",
                    expected_value=0.7,  # Expected good confidence
                    actual_value=confidence_score,
                    is_anomaly=True,
                    severity="high" if confidence_score < 0.2 else "medium",
                    context={
                        "request_id": metrics.get("request_id"),
                        "diagnostic_type": diagnostic.get("type"),
                        "findings_count": diagnostic.get("findings_count", 0)
                    }
                )
            
        except Exception as e:
            logger.error(f"Error detecting real-time anomalies for diagnostic metrics: {str(e)}")
    
    async def get_model_metrics_summary(
        self, 
        start_time: Optional[datetime] = None, 
        end_time: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get a summary of AI diagnostic metrics across all models
        
        Args:
            start_time: Start time for filtering metrics
            end_time: End time for filtering metrics
            
        Returns:
            Dict: Summary of metrics
        """
        # If no time range specified, use last 24 hours
        if not end_time:
            end_time = datetime.utcnow()
        if not start_time:
            start_time = end_time - timedelta(days=1)
        
        # Get aggregations for this time period
        aggregations = self.repository.get_aggregations(
            period="hourly",
            start_time=start_time,
            end_time=end_time
        )
        
        # Group by model
        models = {}
        for agg in aggregations:
            model_key = f"{agg.model_name}_{agg.model_version}"
            if model_key not in models:
                models[model_key] = {
                    "model_name": agg.model_name,
                    "model_version": agg.model_version,
                    "total_requests": 0,
                    "avg_inference_time_ms": 0,
                    "avg_confidence_score": 0,
                    "error_rate": 0,
                    "clinician_agreement_rate": 0,
                    "data_points": 0,
                    "performance_trend": [],
                    "confidence_trend": [],
                    "error_trend": []
                }
            
            # Add to totals
            model = models[model_key]
            model["total_requests"] += agg.request_count
            model["avg_inference_time_ms"] += agg.avg_inference_time_ms * agg.request_count
            model["avg_confidence_score"] += agg.avg_confidence_score * agg.request_count
            model["error_rate"] += agg.error_rate * agg.request_count
            model["clinician_agreement_rate"] += agg.clinician_agreement_rate * agg.request_count
            model["data_points"] += agg.request_count
            
            # Add to trends
            model["performance_trend"].append({
                "timestamp": agg.timestamp.isoformat(),
                "value": agg.avg_inference_time_ms
            })
            model["confidence_trend"].append({
                "timestamp": agg.timestamp.isoformat(),
                "value": agg.avg_confidence_score
            })
            model["error_trend"].append({
                "timestamp": agg.timestamp.isoformat(),
                "value": agg.error_rate
            })
        
        # Calculate averages
        for model_key, model in models.items():
            if model["data_points"] > 0:
                model["avg_inference_time_ms"] /= model["data_points"]
                model["avg_confidence_score"] /= model["data_points"]
                model["error_rate"] /= model["data_points"]
                model["clinician_agreement_rate"] /= model["data_points"]
            
            # Sort trends by timestamp
            model["performance_trend"].sort(key=lambda x: x["timestamp"])
            model["confidence_trend"].sort(key=lambda x: x["timestamp"])
            model["error_trend"].sort(key=lambda x: x["timestamp"])
        
        # Get anomalies
        anomalies = self.repository.get_anomalies(
            start_time=start_time,
            end_time=end_time,
            is_anomaly=True
        )
        
        # Group anomalies by model
        anomaly_counts = {}
        for anomaly in anomalies:
            model_key = f"{anomaly.model_name}_{anomaly.model_version}"
            if model_key not in anomaly_counts:
                anomaly_counts[model_key] = {
                    "total": 0,
                    "by_severity": {"low": 0, "medium": 0, "high": 0},
                    "by_metric": {}
                }
            
            # Count by severity
            anomaly_counts[model_key]["total"] += 1
            anomaly_counts[model_key]["by_severity"][anomaly.severity] += 1
            
            # Count by metric
            metric = anomaly.metric_name
            if metric not in anomaly_counts[model_key]["by_metric"]:
                anomaly_counts[model_key]["by_metric"][metric] = 0
            anomaly_counts[model_key]["by_metric"][metric] += 1
        
        # Add anomalies to models
        for model_key, model in models.items():
            model["anomalies"] = anomaly_counts.get(model_key, {
                "total": 0,
                "by_severity": {"low": 0, "medium": 0, "high": 0},
                "by_metric": {}
            })
        
        # Prepare final result
        result = {
            "time_range": {
                "start": start_time.isoformat(),
                "end": end_time.isoformat()
            },
            "models": list(models.values()),
            "total_models": len(models),
            "total_requests": sum(model["total_requests"] for model in models.values()),
            "anomalies": {
                "total": sum(counts["total"] for counts in anomaly_counts.values()),
                "by_severity": {
                    "low": sum(counts["by_severity"]["low"] for counts in anomaly_counts.values()),
                    "medium": sum(counts["by_severity"]["medium"] for counts in anomaly_counts.values()),
                    "high": sum(counts["by_severity"]["high"] for counts in anomaly_counts.values())
                }
            }
        }
        
        return result
    
    async def get_geographic_analysis(
        self, 
        model_name: Optional[str] = None,
        start_time: Optional[datetime] = None, 
        end_time: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Get geographic analysis of AI diagnostic metrics
        
        Args:
            model_name: Filter by model name
            start_time: Start time for filtering metrics
            end_time: End time for filtering metrics
            
        Returns:
            List: Geographic analysis data
        """
        # If no time range specified, use last 24 hours
        if not end_time:
            end_time = datetime.utcnow()
        if not start_time:
            start_time = end_time - timedelta(days=1)
        
        # Get geographic metrics
        geo_metrics = self.repository.get_geographic_metrics(
            model_name=model_name,
            start_time=start_time,
            end_time=end_time
        )
        
        # Group by region
        regions = {}
        for metric in geo_metrics:
            region_key = f"{metric.region}_{metric.country}"
            if region_key not in regions:
                regions[region_key] = {
                    "region": metric.region,
                    "country": metric.country,
                    "request_count": 0,
                    "latency_samples": [],
                    "confidence_samples": [],
                    "error_rate_samples": []
                }
            
            regions[region_key]["request_count"] += metric.request_count
            regions[region_key]["latency_samples"].append(metric.avg_inference_time_ms)
            regions[region_key]["confidence_samples"].append(metric.avg_confidence_score)
            regions[region_key]["error_rate_samples"].append(metric.error_rate)
        
        # Calculate averages
        result = []
        for region_key, data in regions.items():
            result.append({
                "region": data["region"],
                "country": data["country"],
                "request_count": data["request_count"],
                "avg_inference_time_ms": sum(data["latency_samples"]) / len(data["latency_samples"]) if data["latency_samples"] else 0,
                "avg_confidence_score": sum(data["confidence_samples"]) / len(data["confidence_samples"]) if data["confidence_samples"] else 0,
                "avg_error_rate": sum(data["error_rate_samples"]) / len(data["error_rate_samples"]) if data["error_rate_samples"] else 0
            })
        
        # Sort by request count
        result.sort(key=lambda x: x["request_count"], reverse=True)
        
        return result
    
    async def get_anomalies_summary(
        self,
        model_name: Optional[str] = None,
        days: int = 1
    ) -> Dict[str, Any]:
        """
        Get a summary of recent anomalies
        
        Args:
            model_name: Filter by model name
            days: Number of days to include in the summary
            
        Returns:
            Dict: Summary of anomalies
        """
        # Get time range
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=days)
        
        # Get anomalies for this period
        anomalies = self.repository.get_anomalies(
            model_name=model_name,
            start_time=start_time,
            end_time=end_time,
            is_anomaly=True
        )
        
        # Group by metric and severity
        metrics = {}
        severity_counts = {"low": 0, "medium": 0, "high": 0}
        models = {}
        
        for anomaly in anomalies:
            # Group by metric
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
            
            # Group by model
            model_key = f"{anomaly.model_name}_{anomaly.model_version}"
            if model_key not in models:
                models[model_key] = {
                    "model_name": anomaly.model_name,
                    "model_version": anomaly.model_version,
                    "count": 0,
                    "by_severity": {"low": 0, "medium": 0, "high": 0},
                    "by_metric": {}
                }
            
            models[model_key]["count"] += 1
            models[model_key]["by_severity"][anomaly.severity] += 1
            
            if metric_name not in models[model_key]["by_metric"]:
                models[model_key]["by_metric"][metric_name] = 0
            models[model_key]["by_metric"][metric_name] += 1
        
        # Calculate average deviations
        for metric_name, data in metrics.items():
            deviations = data.pop("deviations")
            data["avg_deviation"] = sum(deviations) / len(deviations) if deviations else 0
        
        # Get recent metric aggregations for comparison
        aggregations = self.repository.get_aggregations(
            model_name=model_name,
            period="hourly",
            start_time=start_time,
            end_time=end_time
        )
        
        # Group aggregations by hour
        hourly_trends = {}
        for agg in aggregations:
            hour = agg.timestamp.replace(minute=0, second=0, microsecond=0)
            hour_key = hour.isoformat()
            
            if hour_key not in hourly_trends:
                hourly_trends[hour_key] = {
                    "timestamp": hour_key,
                    "request_count": 0,
                    "avg_inference_time_ms": 0,
                    "avg_confidence_score": 0,
                    "error_rate": 0,
                    "aggregations": 0
                }
            
            # Add to totals
            trend = hourly_trends[hour_key]
            trend["request_count"] += agg.request_count
            trend["avg_inference_time_ms"] += agg.avg_inference_time_ms * agg.request_count
            trend["avg_confidence_score"] += agg.avg_confidence_score * agg.request_count
            trend["error_rate"] += agg.error_rate * agg.request_count
            trend["aggregations"] += 1
        
        # Calculate hourly averages
        for hour_key, trend in hourly_trends.items():
            if trend["request_count"] > 0:
                trend["avg_inference_time_ms"] /= trend["request_count"]
                trend["avg_confidence_score"] /= trend["request_count"]
                trend["error_rate"] /= trend["request_count"]
        
        # Prepare time series
        time_series = list(hourly_trends.values())
        time_series.sort(key=lambda x: x["timestamp"])
        
        # Prepare final result
        result = {
            "time_range": {
                "start": start_time.isoformat(),
                "end": end_time.isoformat()
            },
            "total_anomalies": len(anomalies),
            "by_severity": severity_counts,
            "by_metric": metrics,
            "by_model": list(models.values()),
            "time_series": time_series
        }
        
        return result
    
    async def get_clinical_correlations(
        self,
        model_name: Optional[str] = None,
        diagnostic_type: Optional[str] = None,
        correlation_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get clinical correlations for AI diagnostic metrics
        
        Args:
            model_name: Filter by model name
            diagnostic_type: Filter by diagnostic type
            correlation_type: Filter by correlation type
            
        Returns:
            Dict: Clinical correlation data
        """
        # Get correlations with filters
        correlations = self.repository.get_clinical_correlations(
            model_name=model_name,
            diagnostic_type=diagnostic_type,
            correlation_type=correlation_type
        )
        
        # Group by model and diagnostic type
        model_correlations = {}
        for corr in correlations:
            model_key = f"{corr.model_name}_{corr.model_version}"
            if model_key not in model_correlations:
                model_correlations[model_key] = {
                    "model_name": corr.model_name,
                    "model_version": corr.model_version,
                    "by_diagnostic": {},
                    "by_correlation": {}
                }
            
            # Group by diagnostic type
            diag_type = corr.diagnostic_type
            if diag_type not in model_correlations[model_key]["by_diagnostic"]:
                model_correlations[model_key]["by_diagnostic"][diag_type] = []
            
            model_correlations[model_key]["by_diagnostic"][diag_type].append({
                "correlation_type": corr.correlation_type,
                "correlation_value": corr.correlation_value,
                "sample_size": corr.sample_size,
                "p_value": corr.p_value,
                "confidence_interval": corr.confidence_interval,
                "timestamp": corr.timestamp.isoformat(),
                "description": corr.description
            })
            
            # Group by correlation type
            corr_type = corr.correlation_type
            if corr_type not in model_correlations[model_key]["by_correlation"]:
                model_correlations[model_key]["by_correlation"][corr_type] = []
            
            model_correlations[model_key]["by_correlation"][corr_type].append({
                "diagnostic_type": diag_type,
                "correlation_value": corr.correlation_value,
                "sample_size": corr.sample_size,
                "p_value": corr.p_value,
                "confidence_interval": corr.confidence_interval,
                "timestamp": corr.timestamp.isoformat(),
                "description": corr.description
            })
        
        # Prepare final result
        result = {
            "models": list(model_correlations.values()),
            "total_correlations": len(correlations),
            "diagnostic_types": list(set(corr.diagnostic_type for corr in correlations)),
            "correlation_types": list(set(corr.correlation_type for corr in correlations))
        }
        
        return result 