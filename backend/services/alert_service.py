from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy import func, desc, and_, case
from sqlalchemy.orm import Session
import asyncio
import logging
from fastapi import BackgroundTasks

from models.audit import AuditEvent
from models.xray import XRay
from models.learning_insights import LearningInsight, Alert, AlertType, AlertSeverity
from services.notification_service import NotificationService
from config import Settings
from models.alert import Alert, AlertStatus
from models.schema_registry import SchemaVersion
from models.event import LearningEvent

logger = logging.getLogger(__name__)

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
    
    def __init__(self, db: Session):
        self.db = db
        self.notification_service = NotificationService()
        
        # Alert thresholds for schema validation
        self.VALIDATION_ERROR_RATE_CRITICAL = 0.05  # 5%
        self.VALIDATION_ERROR_RATE_WARNING = 0.02   # 2%
        self.MIN_SAMPLE_SIZE = 100  # Minimum events to calculate error rate
        
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

    async def check_diagnosis_accuracy_trend(self, window_days: int = 7) -> Optional[Alert]:
        """Monitor diagnosis correction rate trends."""
        cutoff_date = datetime.utcnow() - timedelta(days=window_days)
        
        # Get average correction rates for current and previous windows
        current_window = self.db.query(
            func.avg(LearningInsight.diagnosis_correction_rate)
        ).filter(
            LearningInsight.created_at >= cutoff_date
        ).scalar() or 0.0
        
        previous_window = self.db.query(
            func.avg(LearningInsight.diagnosis_correction_rate)
        ).filter(
            and_(
                LearningInsight.created_at < cutoff_date,
                LearningInsight.created_at >= cutoff_date - timedelta(days=window_days)
            )
        ).scalar() or 0.0
        
        # Calculate change and determine if alert needed
        change = current_window - previous_window
        threshold = self.settings.alert_thresholds.diagnosis_accuracy
        
        if abs(change) >= threshold:
            return Alert(
                type=AlertType.DIAGNOSIS_ACCURACY,
                severity=AlertSeverity.HIGH if change > 0 else AlertSeverity.MEDIUM,
                title="Significant Change in Diagnosis Accuracy",
                description=f"Diagnosis correction rate {'increased' if change > 0 else 'decreased'} by {abs(change)*100:.1f}% over {window_days} days",
                metric=current_window
            )
        return None

    async def check_treatment_plan_stability(self, window_days: int = 7) -> Optional[Alert]:
        """Monitor treatment plan edit rate trends."""
        cutoff_date = datetime.utcnow() - timedelta(days=window_days)
        
        current_window = self.db.query(
            func.avg(LearningInsight.treatment_edit_rate)
        ).filter(
            LearningInsight.created_at >= cutoff_date
        ).scalar() or 0.0
        
        previous_window = self.db.query(
            func.avg(LearningInsight.treatment_edit_rate)
        ).filter(
            and_(
                LearningInsight.created_at < cutoff_date,
                LearningInsight.created_at >= cutoff_date - timedelta(days=window_days)
            )
        ).scalar() or 0.0
        
        change = current_window - previous_window
        threshold = self.settings.alert_thresholds.treatment_stability
        
        if abs(change) >= threshold:
            return Alert(
                type=AlertType.TREATMENT_STABILITY,
                severity=AlertSeverity.HIGH if change > 0 else AlertSeverity.MEDIUM,
                title="Change in Treatment Plan Stability",
                description=f"Treatment plan edit rate {'increased' if change > 0 else 'decreased'} by {abs(change)*100:.1f}% over {window_days} days",
                metric=current_window
            )
        return None

    async def check_billing_accuracy(self, window_days: int = 7) -> Optional[Alert]:
        """Monitor billing override rate trends."""
        cutoff_date = datetime.utcnow() - timedelta(days=window_days)
        
        current_window = self.db.query(
            func.avg(LearningInsight.billing_override_rate)
        ).filter(
            LearningInsight.created_at >= cutoff_date
        ).scalar() or 0.0
        
        previous_window = self.db.query(
            func.avg(LearningInsight.billing_override_rate)
        ).filter(
            and_(
                LearningInsight.created_at < cutoff_date,
                LearningInsight.created_at >= cutoff_date - timedelta(days=window_days)
            )
        ).scalar() or 0.0
        
        change = current_window - previous_window
        threshold = self.settings.alert_thresholds.billing_accuracy
        
        if abs(change) >= threshold:
            return Alert(
                type=AlertType.BILLING_ACCURACY,
                severity=AlertSeverity.HIGH if change > 0 else AlertSeverity.MEDIUM,
                title="Change in Billing Accuracy",
                description=f"Billing override rate {'increased' if change > 0 else 'decreased'} by {abs(change)*100:.1f}% over {window_days} days",
                metric=current_window
            )
        return None

    async def check_user_experience(self, window_days: int = 7) -> Optional[Alert]:
        """Monitor user experience metrics."""
        cutoff_date = datetime.utcnow() - timedelta(days=window_days)
        
        current_window = self.db.query(
            func.avg(LearningInsight.avg_page_time)
        ).filter(
            LearningInsight.created_at >= cutoff_date
        ).scalar() or 0.0
        
        previous_window = self.db.query(
            func.avg(LearningInsight.avg_page_time)
        ).filter(
            and_(
                LearningInsight.created_at < cutoff_date,
                LearningInsight.created_at >= cutoff_date - timedelta(days=window_days)
            )
        ).scalar() or 0.0
        
        change = current_window - previous_window
        threshold = self.settings.alert_thresholds.user_experience
        
        if abs(change) >= threshold:
            return Alert(
                type=AlertType.USER_EXPERIENCE,
                severity=AlertSeverity.MEDIUM,
                title="Change in User Experience Metrics",
                description=f"Average page time {'increased' if change > 0 else 'decreased'} by {abs(change):.1f} seconds over {window_days} days",
                metric=current_window
            )
        return None

    async def monitor_learning_patterns(self):
        """Main monitoring loop that checks all patterns and sends alerts."""
        while True:
            try:
                alerts = []
                checks = [
                    self.check_diagnosis_accuracy_trend(),
                    self.check_treatment_plan_stability(),
                    self.check_billing_accuracy(),
                    self.check_user_experience()
                ]
                
                results = await asyncio.gather(*checks)
                alerts = [alert for alert in results if alert is not None]
                
                for alert in alerts:
                    # Save alert to database
                    self.db.add(alert)
                    self.db.commit()
                    
                    # Send notification
                    await self.notification_service.send_alert(alert)
                    
                logger.info(f"Completed learning pattern check. Found {len(alerts)} alerts.")
                
            except Exception as e:
                logger.error(f"Error in learning pattern monitor: {str(e)}")
            
            # Wait for next check interval
            await asyncio.sleep(self.settings.alert_check_interval)

    async def start_monitoring(self, background_tasks: BackgroundTasks):
        """Start the monitoring process."""
        logger.info("Starting learning pattern monitoring service...")
        await self.monitor_learning_patterns()

    async def check_schema_validation_health(self) -> None:
        """Check schema validation health and create alerts if needed."""
        # Get validation stats for the last hour
        hour_ago = datetime.utcnow() - timedelta(hours=1)
        
        # Count total and failed validations
        stats = (
            self.db.query(
                func.count(LearningEvent.id).label('total'),
                func.sum(
                    case((LearningEvent.error_count > 0, 1), else_=0)
                ).label('failed')
            )
            .filter(LearningEvent.timestamp >= hour_ago)
            .first()
        )
        
        if not stats or stats.total < self.MIN_SAMPLE_SIZE:
            return
        
        error_rate = stats.failed / stats.total
        
        # Check if we need to create an alert
        if error_rate >= self.VALIDATION_ERROR_RATE_CRITICAL:
            await self._create_validation_alert(
                error_rate,
                AlertSeverity.CRITICAL,
                stats.total,
                stats.failed
            )
        elif error_rate >= self.VALIDATION_ERROR_RATE_WARNING:
            await self._create_validation_alert(
                error_rate,
                AlertSeverity.WARNING,
                stats.total,
                stats.failed
            )
    
    async def _create_validation_alert(
        self,
        error_rate: float,
        severity: AlertSeverity,
        total_events: int,
        failed_events: int
    ) -> None:
        """Create a schema validation alert."""
        # Check if there's already an active alert
        existing_alert = (
            self.db.query(Alert)
            .filter(
                Alert.type == AlertType.SCHEMA_VALIDATION,
                Alert.status == AlertStatus.ACTIVE
            )
            .first()
        )
        
        if existing_alert:
            # Update existing alert if severity changed
            if existing_alert.severity != severity:
                existing_alert.severity = severity
                existing_alert.updated_at = datetime.utcnow()
                self.db.add(existing_alert)
                self.db.commit()
            return
        
        # Create new alert
        alert = Alert(
            type=AlertType.SCHEMA_VALIDATION,
            severity=severity,
            status=AlertStatus.ACTIVE,
            title="High Schema Validation Error Rate",
            description=f"Schema validation error rate is {error_rate:.2%} "
                       f"({failed_events}/{total_events} events failed) "
                       f"in the last hour.",
            metadata={
                "error_rate": error_rate,
                "total_events": total_events,
                "failed_events": failed_events,
                "threshold": self.VALIDATION_ERROR_RATE_CRITICAL
                if severity == AlertSeverity.CRITICAL
                else self.VALIDATION_ERROR_RATE_WARNING
            }
        )
        
        self.db.add(alert)
        self.db.commit()
        
        # Notify founders
        await self.notification_service.notify_founders(
            title="Schema Validation Alert",
            message=alert.description,
            severity=severity
        )
    
    async def get_active_alerts(self) -> List[Alert]:
        """Get all active alerts."""
        return (
            self.db.query(Alert)
            .filter(Alert.status == AlertStatus.ACTIVE)
            .order_by(Alert.created_at.desc())
            .all()
        )
    
    async def resolve_alert(self, alert_id: int) -> Optional[Alert]:
        """Resolve an active alert."""
        alert = self.db.query(Alert).filter(Alert.id == alert_id).first()
        if alert and alert.status == AlertStatus.ACTIVE:
            alert.status = AlertStatus.RESOLVED
            alert.resolved_at = datetime.utcnow()
            self.db.add(alert)
            self.db.commit()
            return alert
        return None 