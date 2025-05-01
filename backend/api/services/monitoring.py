from typing import Dict, Any, List
from datetime import datetime, timedelta
import psutil
import json
import os
from ..utils.logger import metrics_logger
from ..config import METRIC_THRESHOLDS, RETUNING_INTERVALS

class MonitoringService:
    def __init__(self):
        self.metrics_history: Dict[str, List[Dict[str, Any]]] = {}
        self.last_check: Dict[str, datetime] = {}
        self.alerts: List[Dict[str, Any]] = []

    def check_system_metrics(self) -> Dict[str, Any]:
        """Check current system metrics against thresholds"""
        metrics = {
            "cpu_usage": psutil.cpu_percent(),
            "memory_usage": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage('/').percent,
            "response_time": self._get_average_response_time(),
            "error_rate": self._get_error_rate(),
            "request_rate": self._get_request_rate()
        }

        # Log metrics
        metrics_logger.info(f"System metrics: {json.dumps(metrics)}")

        # Check thresholds
        alerts = []
        for metric, value in metrics.items():
            if value > METRIC_THRESHOLDS[metric]:
                alert = {
                    "metric": metric,
                    "value": value,
                    "threshold": METRIC_THRESHOLDS[metric],
                    "timestamp": datetime.now().isoformat(),
                    "severity": "high" if value > METRIC_THRESHOLDS[metric] * 1.5 else "medium"
                }
                alerts.append(alert)
                metrics_logger.warning(f"Alert: {json.dumps(alert)}")

        return {
            "metrics": metrics,
            "alerts": alerts
        }

    def _get_average_response_time(self) -> float:
        """Calculate average response time for the last minute"""
        # Implementation would depend on your request tracking system
        return 0.0  # Placeholder

    def _get_error_rate(self) -> float:
        """Calculate error rate for the last minute"""
        # Implementation would depend on your error tracking system
        return 0.0  # Placeholder

    def _get_request_rate(self) -> float:
        """Calculate requests per minute"""
        # Implementation would depend on your request tracking system
        return 0.0  # Placeholder

    def should_retune(self, check_type: str) -> bool:
        """Check if it's time to retune based on intervals"""
        now = datetime.now()
        if check_type not in self.last_check:
            self.last_check[check_type] = now
            return True

        interval = RETUNING_INTERVALS[check_type]
        if now - self.last_check[check_type] >= interval:
            self.last_check[check_type] = now
            return True

        return False

    def get_performance_report(self) -> Dict[str, Any]:
        """Generate a comprehensive performance report"""
        metrics = self.check_system_metrics()
        
        return {
            "timestamp": datetime.now().isoformat(),
            "metrics": metrics["metrics"],
            "alerts": metrics["alerts"],
            "recommendations": self._generate_recommendations(metrics["metrics"])
        }

    def _generate_recommendations(self, metrics: Dict[str, float]) -> List[str]:
        """Generate recommendations based on metrics"""
        recommendations = []
        
        if metrics["cpu_usage"] > 90:
            recommendations.append("Consider scaling up CPU resources")
        elif metrics["cpu_usage"] < 30:
            recommendations.append("Consider scaling down CPU resources")
            
        if metrics["memory_usage"] > 90:
            recommendations.append("Consider increasing memory allocation")
            
        if metrics["disk_usage"] > 90:
            recommendations.append("Consider cleaning up disk space or increasing storage")
            
        if metrics["error_rate"] > 5:
            recommendations.append("Investigate recent errors and implement fixes")
            
        if metrics["response_time"] > 1000:
            recommendations.append("Optimize slow endpoints or increase resources")
            
        return recommendations 