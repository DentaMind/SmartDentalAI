"""
Repository for AI Diagnostics metrics
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, cast, Float
import numpy as np
import json

from ..models.ai_diagnostics_metrics import (
    AIDiagnosticMetric,
    AIDiagnosticMetricAggregation,
    AIDiagnosticGeographicMetric,
    AIDiagnosticAnomalyDetection,
    AIDiagnosticClinicalCorrelation
)


class AIDiagnosticsMetricsRepository:
    """Repository for AI Diagnostics metrics database operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Diagnostic Metrics Operations
    
    def store_diagnostic_metrics(
        self, 
        model_name: str, 
        model_version: str, 
        request_id: str, 
        metrics: Dict[str, Any], 
        user_id: Optional[str] = None,
        patient_id: Optional[str] = None
    ) -> AIDiagnosticMetric:
        """
        Store AI diagnostic metrics in the database
        
        Args:
            model_name: Name of the AI model
            model_version: Version of the AI model
            request_id: Unique request identifier
            metrics: Diagnostic metrics data
            user_id: User identifier (if authenticated)
            patient_id: Patient identifier (if applicable)
            
        Returns:
            AIDiagnosticMetric: The created database record
        """
        # Extract performance metrics
        performance = metrics.get("performance", {})
        
        # Extract diagnostic info
        diagnostic = metrics.get("diagnostic", {})
        
        # Extract resource usage
        resources = metrics.get("resources", {})
        
        # Extract clinical metrics
        clinical = metrics.get("clinical", {})
        
        # Extract error info
        error = metrics.get("error", {})
        
        # Create the diagnostic metric record
        diagnostic_metric = AIDiagnosticMetric(
            model_name=model_name,
            model_version=model_version,
            request_id=request_id,
            user_id=user_id,
            patient_id=patient_id,
            inference_time_ms=performance.get("inference_time_ms", 0),
            preprocessing_time_ms=performance.get("preprocessing_time_ms", 0),
            postprocessing_time_ms=performance.get("postprocessing_time_ms", 0),
            total_processing_time_ms=performance.get("total_processing_time_ms", 0),
            diagnostic_type=diagnostic.get("type"),
            confidence_score=diagnostic.get("confidence_score", 0),
            findings_count=diagnostic.get("findings_count", 0),
            cpu_utilization=resources.get("cpu_utilization"),
            memory_usage_mb=resources.get("memory_usage_mb"),
            gpu_utilization=resources.get("gpu_utilization"),
            clinician_agreement=clinical.get("clinician_agreement"),
            clinician_review_time_ms=clinical.get("clinician_review_time_ms"),
            error_type=error.get("type") if error else None,
            error_message=error.get("message") if error else None,
            raw_metrics=metrics
        )
        
        self.db.add(diagnostic_metric)
        self.db.commit()
        self.db.refresh(diagnostic_metric)
        
        return diagnostic_metric
    
    def get_diagnostic_metrics(
        self,
        model_name: Optional[str] = None,
        model_version: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100
    ) -> List[AIDiagnosticMetric]:
        """
        Get AI diagnostic metrics from the database
        
        Args:
            model_name: Filter by model name
            model_version: Filter by model version
            start_time: Filter by start time
            end_time: Filter by end time
            limit: Maximum number of records to return
            
        Returns:
            List[AIDiagnosticMetric]: List of diagnostic metrics
        """
        query = self.db.query(AIDiagnosticMetric)
        
        # Apply filters
        if model_name:
            query = query.filter(AIDiagnosticMetric.model_name == model_name)
        
        if model_version:
            query = query.filter(AIDiagnosticMetric.model_version == model_version)
        
        if start_time:
            query = query.filter(AIDiagnosticMetric.timestamp >= start_time)
        
        if end_time:
            query = query.filter(AIDiagnosticMetric.timestamp <= end_time)
        
        # Order by timestamp descending and limit
        query = query.order_by(desc(AIDiagnosticMetric.timestamp)).limit(limit)
        
        return query.all()
    
    # Aggregation Operations
    
    def create_hourly_aggregation(self, model_name: Optional[str] = None) -> List[AIDiagnosticMetricAggregation]:
        """
        Create hourly aggregation of AI diagnostic metrics
        
        Args:
            model_name: Filter by model name
            
        Returns:
            List[AIDiagnosticMetricAggregation]: The created aggregation records
        """
        # Get time range for the last hour
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=1)
        
        # Get base query for metrics for the last hour
        base_query = self.db.query(AIDiagnosticMetric).filter(
            AIDiagnosticMetric.timestamp >= start_time,
            AIDiagnosticMetric.timestamp < end_time
        )
        
        if model_name:
            base_query = base_query.filter(AIDiagnosticMetric.model_name == model_name)
        
        # Group the data by model name and version
        model_versions = base_query.with_entities(
            AIDiagnosticMetric.model_name,
            AIDiagnosticMetric.model_version
        ).distinct().all()
        
        aggregations = []
        
        for model_name, model_version in model_versions:
            # Get metrics for this model version
            metrics = base_query.filter(
                AIDiagnosticMetric.model_name == model_name,
                AIDiagnosticMetric.model_version == model_version
            ).all()
            
            if not metrics:
                continue
            
            # Count requests
            request_count = len(metrics)
            
            # Calculate performance aggregations
            inference_times = [m.inference_time_ms for m in metrics if m.inference_time_ms > 0]
            if inference_times:
                avg_inference_time = sum(inference_times) / len(inference_times)
                min_inference_time = min(inference_times)
                max_inference_time = max(inference_times)
                p95_inference_time = np.percentile(inference_times, 95) if len(inference_times) >= 20 else max_inference_time
            else:
                avg_inference_time = min_inference_time = max_inference_time = p95_inference_time = 0
            
            # Calculate diagnostic aggregations
            confidence_scores = [m.confidence_score for m in metrics if m.confidence_score > 0]
            avg_confidence_score = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
            
            findings_counts = [m.findings_count for m in metrics]
            avg_findings_count = sum(findings_counts) / len(findings_counts) if findings_counts else 0
            
            # Calculate resource aggregations
            cpu_utils = [m.cpu_utilization for m in metrics if m.cpu_utilization is not None]
            avg_cpu_utilization = sum(cpu_utils) / len(cpu_utils) if cpu_utils else 0
            
            memory_usages = [m.memory_usage_mb for m in metrics if m.memory_usage_mb is not None]
            avg_memory_usage = sum(memory_usages) / len(memory_usages) if memory_usages else 0
            
            gpu_utils = [m.gpu_utilization for m in metrics if m.gpu_utilization is not None]
            avg_gpu_utilization = sum(gpu_utils) / len(gpu_utils) if gpu_utils else 0
            
            # Calculate clinical aggregations
            agreements = [m.clinician_agreement for m in metrics if m.clinician_agreement is not None]
            agreement_rate = sum(int(a) for a in agreements) / len(agreements) if agreements else 0
            
            # Calculate error rate
            errors = [m for m in metrics if m.error_type is not None]
            error_rate = len(errors) / request_count if request_count > 0 else 0
            
            # Create aggregation record
            aggregation = AIDiagnosticMetricAggregation(
                model_name=model_name,
                model_version=model_version,
                period="hourly",
                timestamp=end_time,
                request_count=request_count,
                avg_inference_time_ms=avg_inference_time,
                min_inference_time_ms=min_inference_time,
                max_inference_time_ms=max_inference_time,
                p95_inference_time_ms=p95_inference_time,
                avg_total_processing_time_ms=sum([m.total_processing_time_ms for m in metrics]) / request_count if request_count > 0 else 0,
                avg_confidence_score=avg_confidence_score,
                avg_findings_count=avg_findings_count,
                avg_cpu_utilization=avg_cpu_utilization,
                avg_memory_usage_mb=avg_memory_usage,
                avg_gpu_utilization=avg_gpu_utilization,
                clinician_agreement_rate=agreement_rate,
                error_rate=error_rate,
                error_count=len(errors),
                aggregation_data={
                    "start_time": start_time.isoformat(),
                    "end_time": end_time.isoformat(),
                    "metrics_count": request_count,
                    "diagnostic_types": list(set([m.diagnostic_type for m in metrics if m.diagnostic_type]))
                }
            )
            
            self.db.add(aggregation)
            aggregations.append(aggregation)
        
        if aggregations:
            self.db.commit()
            for aggregation in aggregations:
                self.db.refresh(aggregation)
        
        return aggregations
    
    def get_aggregations(
        self,
        model_name: Optional[str] = None,
        model_version: Optional[str] = None,
        period: str = "hourly",
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100
    ) -> List[AIDiagnosticMetricAggregation]:
        """
        Get AI diagnostic metric aggregations
        
        Args:
            model_name: Filter by model name
            model_version: Filter by model version
            period: Aggregation period (hourly, daily, weekly)
            start_time: Filter by start time
            end_time: Filter by end time
            limit: Maximum number of records to return
            
        Returns:
            List[AIDiagnosticMetricAggregation]: List of aggregations
        """
        query = self.db.query(AIDiagnosticMetricAggregation)
        
        # Apply filters
        if model_name:
            query = query.filter(AIDiagnosticMetricAggregation.model_name == model_name)
        
        if model_version:
            query = query.filter(AIDiagnosticMetricAggregation.model_version == model_version)
        
        if period:
            query = query.filter(AIDiagnosticMetricAggregation.period == period)
        
        if start_time:
            query = query.filter(AIDiagnosticMetricAggregation.timestamp >= start_time)
        
        if end_time:
            query = query.filter(AIDiagnosticMetricAggregation.timestamp <= end_time)
        
        # Order by timestamp descending and limit
        query = query.order_by(desc(AIDiagnosticMetricAggregation.timestamp)).limit(limit)
        
        return query.all()
    
    # Geographic Metrics Operations
    
    def store_geographic_metric(
        self,
        model_name: str,
        model_version: str,
        region: str,
        country: str,
        metrics_data: Dict[str, Any]
    ) -> AIDiagnosticGeographicMetric:
        """
        Store geographic AI diagnostic metrics
        
        Args:
            model_name: Name of the AI model
            model_version: Version of the AI model
            region: Geographic region
            country: Country
            metrics_data: Metrics data for the region
            
        Returns:
            AIDiagnosticGeographicMetric: The created record
        """
        geo_metric = AIDiagnosticGeographicMetric(
            model_name=model_name,
            model_version=model_version,
            region=region,
            country=country,
            request_count=metrics_data.get("request_count", 0),
            avg_inference_time_ms=metrics_data.get("avg_inference_time_ms", 0),
            avg_confidence_score=metrics_data.get("avg_confidence_score", 0),
            error_rate=metrics_data.get("error_rate", 0),
            city=metrics_data.get("city"),
            clinic_id=metrics_data.get("clinic_id"),
            metrics_data=metrics_data
        )
        
        self.db.add(geo_metric)
        self.db.commit()
        self.db.refresh(geo_metric)
        
        return geo_metric
    
    def get_geographic_metrics(
        self,
        model_name: Optional[str] = None,
        region: Optional[str] = None,
        country: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100
    ) -> List[AIDiagnosticGeographicMetric]:
        """
        Get geographic AI diagnostic metrics
        
        Args:
            model_name: Filter by model name
            region: Filter by region
            country: Filter by country
            start_time: Filter by start time
            end_time: Filter by end time
            limit: Maximum number of records to return
            
        Returns:
            List[AIDiagnosticGeographicMetric]: List of geographic metrics
        """
        query = self.db.query(AIDiagnosticGeographicMetric)
        
        # Apply filters
        if model_name:
            query = query.filter(AIDiagnosticGeographicMetric.model_name == model_name)
        
        if region:
            query = query.filter(AIDiagnosticGeographicMetric.region == region)
        
        if country:
            query = query.filter(AIDiagnosticGeographicMetric.country == country)
        
        if start_time:
            query = query.filter(AIDiagnosticGeographicMetric.timestamp >= start_time)
        
        if end_time:
            query = query.filter(AIDiagnosticGeographicMetric.timestamp <= end_time)
        
        # Order by timestamp descending and limit
        query = query.order_by(desc(AIDiagnosticGeographicMetric.timestamp)).limit(limit)
        
        return query.all()
    
    # Anomaly Detection Operations
    
    def store_anomaly_detection(
        self,
        model_name: str,
        model_version: Optional[str],
        metric_name: str,
        expected_value: float,
        actual_value: float,
        is_anomaly: bool = False,
        severity: str = "low",
        context: Optional[Dict[str, Any]] = None
    ) -> AIDiagnosticAnomalyDetection:
        """
        Store AI diagnostic anomaly detection
        
        Args:
            model_name: Name of the AI model
            model_version: Version of the AI model
            metric_name: Name of the metric
            expected_value: Expected value of the metric
            actual_value: Actual value of the metric
            is_anomaly: Whether this is an anomaly
            severity: Severity of the anomaly (low, medium, high)
            context: Additional context information
            
        Returns:
            AIDiagnosticAnomalyDetection: The created record
        """
        # Calculate deviation percentage
        if expected_value != 0:
            deviation_percent = abs((actual_value - expected_value) / expected_value) * 100
        else:
            deviation_percent = 100 if actual_value != 0 else 0
        
        anomaly = AIDiagnosticAnomalyDetection(
            model_name=model_name,
            model_version=model_version,
            metric_name=metric_name,
            expected_value=expected_value,
            actual_value=actual_value,
            deviation_percent=deviation_percent,
            is_anomaly=is_anomaly,
            severity=severity,
            context=context
        )
        
        self.db.add(anomaly)
        self.db.commit()
        self.db.refresh(anomaly)
        
        return anomaly
    
    def get_anomalies(
        self,
        model_name: Optional[str] = None,
        metric_name: Optional[str] = None,
        is_anomaly: Optional[bool] = None,
        severity: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100
    ) -> List[AIDiagnosticAnomalyDetection]:
        """
        Get AI diagnostic anomaly detections
        
        Args:
            model_name: Filter by model name
            metric_name: Filter by metric name
            is_anomaly: Filter by anomaly status
            severity: Filter by severity
            start_time: Filter by start time
            end_time: Filter by end time
            limit: Maximum number of records to return
            
        Returns:
            List[AIDiagnosticAnomalyDetection]: List of anomaly detections
        """
        query = self.db.query(AIDiagnosticAnomalyDetection)
        
        # Apply filters
        if model_name:
            query = query.filter(AIDiagnosticAnomalyDetection.model_name == model_name)
        
        if metric_name:
            query = query.filter(AIDiagnosticAnomalyDetection.metric_name == metric_name)
        
        if is_anomaly is not None:
            query = query.filter(AIDiagnosticAnomalyDetection.is_anomaly == is_anomaly)
        
        if severity:
            query = query.filter(AIDiagnosticAnomalyDetection.severity == severity)
        
        if start_time:
            query = query.filter(AIDiagnosticAnomalyDetection.timestamp >= start_time)
        
        if end_time:
            query = query.filter(AIDiagnosticAnomalyDetection.timestamp <= end_time)
        
        # Order by timestamp descending and limit
        query = query.order_by(desc(AIDiagnosticAnomalyDetection.timestamp)).limit(limit)
        
        return query.all()
    
    # Clinical Correlation Operations
    
    def store_clinical_correlation(
        self,
        model_name: str,
        model_version: str,
        diagnostic_type: str,
        correlation_type: str,
        correlation_value: float,
        sample_size: int,
        p_value: Optional[float] = None,
        confidence_interval: Optional[str] = None,
        study_period_start: Optional[datetime] = None,
        study_period_end: Optional[datetime] = None,
        description: Optional[str] = None,
        correlation_data: Optional[Dict[str, Any]] = None
    ) -> AIDiagnosticClinicalCorrelation:
        """
        Store clinical correlation for AI diagnostic metrics
        
        Args:
            model_name: Name of the AI model
            model_version: Version of the AI model
            diagnostic_type: Type of diagnosis
            correlation_type: Type of correlation (accuracy, treatment_change, etc.)
            correlation_value: Correlation value (typically between -1 and 1)
            sample_size: Number of samples in the correlation study
            p_value: Statistical p-value (if applicable)
            confidence_interval: Confidence interval (if applicable)
            study_period_start: Start of study period
            study_period_end: End of study period
            description: Description of the correlation
            correlation_data: Additional correlation data
            
        Returns:
            AIDiagnosticClinicalCorrelation: The created record
        """
        correlation = AIDiagnosticClinicalCorrelation(
            model_name=model_name,
            model_version=model_version,
            diagnostic_type=diagnostic_type,
            correlation_type=correlation_type,
            correlation_value=correlation_value,
            sample_size=sample_size,
            p_value=p_value,
            confidence_interval=confidence_interval,
            study_period_start=study_period_start,
            study_period_end=study_period_end,
            description=description,
            correlation_data=correlation_data
        )
        
        self.db.add(correlation)
        self.db.commit()
        self.db.refresh(correlation)
        
        return correlation
    
    def get_clinical_correlations(
        self,
        model_name: Optional[str] = None,
        model_version: Optional[str] = None,
        diagnostic_type: Optional[str] = None,
        correlation_type: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100
    ) -> List[AIDiagnosticClinicalCorrelation]:
        """
        Get clinical correlations for AI diagnostic metrics
        
        Args:
            model_name: Filter by model name
            model_version: Filter by model version
            diagnostic_type: Filter by diagnostic type
            correlation_type: Filter by correlation type
            start_time: Filter by start time
            end_time: Filter by end time
            limit: Maximum number of records to return
            
        Returns:
            List[AIDiagnosticClinicalCorrelation]: List of clinical correlations
        """
        query = self.db.query(AIDiagnosticClinicalCorrelation)
        
        # Apply filters
        if model_name:
            query = query.filter(AIDiagnosticClinicalCorrelation.model_name == model_name)
        
        if model_version:
            query = query.filter(AIDiagnosticClinicalCorrelation.model_version == model_version)
        
        if diagnostic_type:
            query = query.filter(AIDiagnosticClinicalCorrelation.diagnostic_type == diagnostic_type)
        
        if correlation_type:
            query = query.filter(AIDiagnosticClinicalCorrelation.correlation_type == correlation_type)
        
        if start_time:
            query = query.filter(AIDiagnosticClinicalCorrelation.timestamp >= start_time)
        
        if end_time:
            query = query.filter(AIDiagnosticClinicalCorrelation.timestamp <= end_time)
        
        # Order by timestamp descending and limit
        query = query.order_by(desc(AIDiagnosticClinicalCorrelation.timestamp)).limit(limit)
        
        return query.all() 