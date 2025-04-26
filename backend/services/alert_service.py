from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy import func, desc, and_
from sqlalchemy.orm import Session

from models.audit import AuditEvent
from models.xray import XRay

class AlertThresholds:
    """Alert thresholds for system monitoring."""
    API_RESPONSE_TIME_MS = 1000  # Alert if average response time exceeds 1s
    FAILED_LOGINS_HOUR = 10  # Alert if more than 10 failed logins in an hour
    STORAGE_USAGE_PERCENT = 80  # Alert if storage usage exceeds 80%
    AI_QUEUE_SIZE = 50  # Alert if AI analysis queue exceeds 50 items
    BACKGROUND_JOBS_PENDING = 100  # Alert if too many background jobs pending
    ERROR_RATE_PERCENT = 5  # Alert if error rate exceeds 5%
    MODEL_ACCURACY_DROP = 0.05  # Alert if model accuracy drops by more than 5%

class AlertService:
    """Service for monitoring system health and generating real-time alerts."""
    
    @staticmethod
    def check_system_alerts(db: Session) -> List[Dict[str, Any]]:
        """Check for system-level alerts."""
        now = datetime.utcnow()
        hour_ago = now - timedelta(hours=1)
        alerts = []
        
        # Check API response times
        avg_response_time = db.query(
            func.avg(AuditEvent.metadata['response_time'])
        ).filter(
            AuditEvent.timestamp >= hour_ago
        ).scalar() or 0
        
        if avg_response_time > AlertThresholds.API_RESPONSE_TIME_MS:
            alerts.append({
                "type": "performance",
                "severity": "warning",
                "message": f"High API response time: {avg_response_time:.2f}ms",
                "timestamp": now,
                "metadata": {"avg_response_time": avg_response_time}
            })
        
        # Check failed login attempts
        failed_logins = db.query(AuditEvent).filter(
            and_(
                AuditEvent.event_type == "login_failed",
                AuditEvent.timestamp >= hour_ago
            )
        ).count()
        
        if failed_logins > AlertThresholds.FAILED_LOGINS_HOUR:
            alerts.append({
                "type": "security",
                "severity": "high",
                "message": f"High number of failed logins: {failed_logins} in last hour",
                "timestamp": now,
                "metadata": {"failed_logins": failed_logins}
            })
        
        # Check AI processing queue
        ai_queue_size = db.query(XRay).filter(
            XRay.analysis_status == "pending"
        ).count()
        
        if ai_queue_size > AlertThresholds.AI_QUEUE_SIZE:
            alerts.append({
                "type": "processing",
                "severity": "warning",
                "message": f"Large AI analysis queue: {ai_queue_size} items pending",
                "timestamp": now,
                "metadata": {"queue_size": ai_queue_size}
            })
        
        return alerts
    
    @staticmethod
    def check_compliance_alerts(db: Session) -> List[Dict[str, Any]]:
        """Check for compliance-related alerts."""
        now = datetime.utcnow()
        day_ago = now - timedelta(days=1)
        alerts = []
        
        # Check for HIPAA violations
        hipaa_violations = db.query(AuditEvent).filter(
            and_(
                AuditEvent.event_type == "hipaa_violation_detected",
                AuditEvent.timestamp >= day_ago
            )
        ).count()
        
        if hipaa_violations > 0:
            alerts.append({
                "type": "compliance",
                "severity": "critical",
                "message": f"HIPAA violations detected: {hipaa_violations} in last 24h",
                "timestamp": now,
                "metadata": {"violations": hipaa_violations}
            })
        
        return alerts
    
    @staticmethod
    def check_learning_alerts(db: Session) -> List[Dict[str, Any]]:
        """Check for AI learning and model performance alerts."""
        now = datetime.utcnow()
        week_ago = now - timedelta(weeks=1)
        alerts = []
        
        # Check model accuracy trends
        accuracy_drop = db.query(
            func.avg(AuditEvent.metadata['accuracy_change'])
        ).filter(
            and_(
                AuditEvent.event_type == "model_accuracy_measured",
                AuditEvent.timestamp >= week_ago
            )
        ).scalar() or 0
        
        if accuracy_drop < -AlertThresholds.MODEL_ACCURACY_DROP:
            alerts.append({
                "type": "ai_learning",
                "severity": "warning",
                "message": f"Model accuracy dropped by {abs(accuracy_drop)*100:.1f}%",
                "timestamp": now,
                "metadata": {"accuracy_change": accuracy_drop}
            })
        
        return alerts
    
    @staticmethod
    def check_scaling_alerts(db: Session) -> List[Dict[str, Any]]:
        """Check for scaling and performance alerts."""
        now = datetime.utcnow()
        hour_ago = now - timedelta(hours=1)
        alerts = []
        
        # Check error rates
        total_requests = db.query(AuditEvent).filter(
            AuditEvent.timestamp >= hour_ago
        ).count()
        
        error_requests = db.query(AuditEvent).filter(
            and_(
                AuditEvent.event_type.like("%error%"),
                AuditEvent.timestamp >= hour_ago
            )
        ).count()
        
        if total_requests > 0:
            error_rate = (error_requests / total_requests) * 100
            if error_rate > AlertThresholds.ERROR_RATE_PERCENT:
                alerts.append({
                    "type": "reliability",
                    "severity": "high",
                    "message": f"High error rate: {error_rate:.1f}%",
                    "timestamp": now,
                    "metadata": {
                        "error_rate": error_rate,
                        "total_requests": total_requests,
                        "error_requests": error_requests
                    }
                })
        
        # Check background job queue
        pending_jobs = db.query(AuditEvent).filter(
            and_(
                AuditEvent.metadata['job_status'] == "pending",
                AuditEvent.timestamp >= hour_ago
            )
        ).count()
        
        if pending_jobs > AlertThresholds.BACKGROUND_JOBS_PENDING:
            alerts.append({
                "type": "processing",
                "severity": "warning",
                "message": f"High number of pending jobs: {pending_jobs}",
                "timestamp": now,
                "metadata": {"pending_jobs": pending_jobs}
            })
        
        return alerts
    
    @staticmethod
    def get_all_alerts(db: Session) -> List[Dict[str, Any]]:
        """Get all system alerts."""
        alerts = []
        alerts.extend(AlertService.check_system_alerts(db))
        alerts.extend(AlertService.check_compliance_alerts(db))
        alerts.extend(AlertService.check_learning_alerts(db))
        alerts.extend(AlertService.check_scaling_alerts(db))
        
        # Sort by severity and timestamp
        severity_order = {"critical": 0, "high": 1, "warning": 2}
        return sorted(alerts, 
                     key=lambda x: (severity_order.get(x["severity"], 99), x["timestamp"]),
                     reverse=True) 