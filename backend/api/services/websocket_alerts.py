"""
WebSocket Alert Service

This module provides alert functionality for WebSocket monitoring,
detecting issues and notifying administrators about potential problems.
"""

import logging
import json
import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, List, Any, Optional, Set, Callable
from datetime import datetime, timedelta
import uuid

from ..config.settings import settings
from .websocket_monitoring import websocket_metrics
from .websocket_connection_pool import connection_pool

# Configure logging
logger = logging.getLogger(__name__)

# Alert severity levels
SEVERITY_LEVELS = ['info', 'warning', 'error', 'critical']

# Default alert thresholds
DEFAULT_THRESHOLDS = [
    {
        "metric": "connections.utilization",
        "condition": "gt",
        "value": 0.8,  # 80% utilization
        "severity": "warning",
        "enabled": True,
    },
    {
        "metric": "connections.utilization",
        "condition": "gt",
        "value": 0.95,  # 95% utilization
        "severity": "critical",
        "enabled": True,
    },
    {
        "metric": "performance.avg_message_latency_ms",
        "condition": "gt",
        "value": 1000,  # 1 second latency
        "severity": "warning",
        "enabled": True,
    },
    {
        "metric": "performance.avg_message_latency_ms",
        "condition": "gt",
        "value": 5000,  # 5 seconds latency
        "severity": "critical",
        "enabled": True,
    },
    {
        "metric": "messages.error_rate",
        "condition": "gt",
        "value": 0.05,  # 5% error rate
        "severity": "warning",
        "enabled": True,
    },
    {
        "metric": "messages.error_rate",
        "condition": "gt",
        "value": 0.15,  # 15% error rate
        "severity": "critical",
        "enabled": True,
    },
]


class WebSocketAlertService:
    """
    Service for monitoring WebSocket metrics and generating alerts
    """
    
    def __init__(self):
        """Initialize the alert service"""
        self.alerts: List[Dict[str, Any]] = []
        self.thresholds: List[Dict[str, Any]] = DEFAULT_THRESHOLDS.copy()
        self.alert_history_days = 7
        self.email_notifications = False
        self.email_recipients: List[str] = []
        
        # Load configuration if available
        self._load_config()
        
        # Start alert monitoring task
        asyncio.create_task(self._alert_monitoring_task())
        
        logger.info("WebSocket alert service initialized")
    
    def _load_config(self):
        """Load alert configuration from settings"""
        # In a real implementation, this would load from database or config file
        # For now, use default values and settings
        
        # Check if email settings are configured
        if (settings.SMTP_HOST and settings.SMTP_PORT and 
            settings.SMTP_USER and settings.SMTP_PASSWORD and settings.EMAIL_FROM):
            self.email_notifications = True
            
            # Default admin email from settings if available
            admin_email = getattr(settings, "ADMIN_EMAIL", None)
            if admin_email:
                self.email_recipients = [admin_email]
    
    async def _alert_monitoring_task(self):
        """Periodic task to check metrics against thresholds and generate alerts"""
        while True:
            try:
                # Check metrics every 60 seconds
                await asyncio.sleep(60)
                
                # Get latest metrics
                latest_metrics = websocket_metrics.get_metrics()
                
                # Get pool stats
                pool_stats = connection_pool.get_stats()
                
                # Combine metrics for easier access
                combined_metrics = {
                    "connections": {
                        "total": latest_metrics["connections"]["total"],
                        "peak": latest_metrics["connections"]["peak"],
                        "utilization": pool_stats["utilization"],
                    },
                    "messages": {
                        "sent": latest_metrics["messages"]["sent"],
                        "received": latest_metrics["messages"]["received"],
                        "errors": latest_metrics["messages"]["errors"],
                        "error_rate": (latest_metrics["messages"]["errors"] / latest_metrics["messages"]["sent"] 
                                      if latest_metrics["messages"]["sent"] > 0 else 0),
                    },
                    "performance": latest_metrics["performance"],
                }
                
                # Check thresholds
                await self._check_thresholds(combined_metrics)
                
                # Clean up old alerts
                self._cleanup_old_alerts()
            except Exception as e:
                logger.error(f"Error in alert monitoring task: {e}")
                await asyncio.sleep(60)  # Wait before retrying
    
    async def _check_thresholds(self, metrics: Dict[str, Any]):
        """
        Check metrics against threshold values
        
        Args:
            metrics: Current metrics to check
        """
        for threshold in self.thresholds:
            if not threshold["enabled"]:
                continue
                
            # Parse metric path (e.g., "connections.utilization")
            metric_path = threshold["metric"].split(".")
            
            # Get actual metric value
            metric_value = metrics
            try:
                for path in metric_path:
                    metric_value = metric_value[path]
            except (KeyError, TypeError):
                logger.warning(f"Metric path not found: {threshold['metric']}")
                continue
                
            # Check condition
            triggered = False
            
            if threshold["condition"] == "gt" and metric_value > threshold["value"]:
                triggered = True
            elif threshold["condition"] == "lt" and metric_value < threshold["value"]:
                triggered = True
            elif threshold["condition"] == "eq" and metric_value == threshold["value"]:
                triggered = True
            elif threshold["condition"] == "gte" and metric_value >= threshold["value"]:
                triggered = True
            elif threshold["condition"] == "lte" and metric_value <= threshold["value"]:
                triggered = True
            
            if triggered:
                # Generate alert
                alert_id = str(uuid.uuid4())
                alert = {
                    "id": alert_id,
                    "timestamp": datetime.now().isoformat(),
                    "metric": threshold["metric"],
                    "threshold": threshold["value"],
                    "value": metric_value,
                    "message": self._generate_alert_message(threshold, metric_value),
                    "severity": threshold["severity"],
                    "acknowledged": False,
                }
                
                # Add to alerts
                self.alerts.append(alert)
                
                # Log alert
                logger.warning(f"WebSocket alert triggered: {alert['message']}")
                
                # Send email notification if enabled
                if self.email_notifications and self.email_recipients and threshold["severity"] in ["error", "critical"]:
                    await self._send_alert_email(alert)
    
    def _generate_alert_message(self, threshold: Dict[str, Any], value: Any) -> str:
        """
        Generate a human-readable alert message
        
        Args:
            threshold: The threshold that triggered the alert
            value: The current value
            
        Returns:
            str: Alert message
        """
        condition_text = {
            "gt": "exceeded",
            "lt": "fell below",
            "eq": "exactly matched",
            "gte": "reached or exceeded",
            "lte": "reached or fell below",
        }.get(threshold["condition"], "triggered")
        
        # Format values for display
        formatted_value = value
        formatted_threshold = threshold["value"]
        
        # Apply special formatting for percentages
        if threshold["metric"] in ["connections.utilization", "messages.error_rate"]:
            formatted_value = f"{value * 100:.1f}%"
            formatted_threshold = f"{threshold['value'] * 100:.1f}%"
        
        return f"WebSocket {threshold['metric']} {condition_text} threshold: {formatted_value} (threshold: {formatted_threshold})"
    
    async def _send_alert_email(self, alert: Dict[str, Any]):
        """
        Send alert email notification
        
        Args:
            alert: The alert to send
        """
        try:
            # Build email message
            msg = MIMEMultipart()
            msg['From'] = settings.EMAIL_FROM
            msg['To'] = ", ".join(self.email_recipients)
            msg['Subject'] = f"[DentaMind] WebSocket {alert['severity'].upper()} Alert"
            
            # Email body
            body = f"""
            <html>
            <body>
                <h2>DentaMind WebSocket Alert</h2>
                <p><strong>Severity:</strong> {alert['severity'].upper()}</p>
                <p><strong>Time:</strong> {datetime.fromisoformat(alert['timestamp']).strftime('%Y-%m-%d %H:%M:%S')}</p>
                <p><strong>Message:</strong> {alert['message']}</p>
                <p><strong>Metric:</strong> {alert['metric']}</p>
                <p><strong>Current Value:</strong> {alert['value']}</p>
                <p><strong>Threshold:</strong> {alert['threshold']}</p>
                <hr>
                <p>Please check the WebSocket Analytics Dashboard for more information.</p>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html'))
            
            # Connect to SMTP server
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD.get_secret_value())
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Alert email sent to {', '.join(self.email_recipients)}")
        except Exception as e:
            logger.error(f"Failed to send alert email: {e}")
    
    def _cleanup_old_alerts(self):
        """Remove alerts older than the configured history period"""
        if not self.alerts:
            return
            
        # Calculate cutoff time
        cutoff_time = datetime.now() - timedelta(days=self.alert_history_days)
        cutoff_str = cutoff_time.isoformat()
        
        # Filter out old alerts
        self.alerts = [
            alert for alert in self.alerts
            if alert["timestamp"] > cutoff_str
        ]
    
    def get_alerts(self, limit: int = 100, include_acknowledged: bool = False) -> List[Dict[str, Any]]:
        """
        Get recent alerts
        
        Args:
            limit: Maximum number of alerts to return
            include_acknowledged: Whether to include acknowledged alerts
            
        Returns:
            List[Dict]: Recent alerts
        """
        # Filter alerts if needed
        if not include_acknowledged:
            filtered_alerts = [alert for alert in self.alerts if not alert["acknowledged"]]
        else:
            filtered_alerts = self.alerts
            
        # Sort by timestamp (newest first) and limit
        return sorted(
            filtered_alerts,
            key=lambda alert: alert["timestamp"],
            reverse=True
        )[:limit]
    
    def acknowledge_alert(self, alert_id: str) -> bool:
        """
        Mark an alert as acknowledged
        
        Args:
            alert_id: ID of the alert to acknowledge
            
        Returns:
            bool: True if successful, False if alert not found
        """
        for alert in self.alerts:
            if alert["id"] == alert_id:
                alert["acknowledged"] = True
                return True
        
        return False
    
    def get_thresholds(self) -> List[Dict[str, Any]]:
        """
        Get current alert thresholds
        
        Returns:
            List[Dict]: Current thresholds
        """
        return self.thresholds
    
    def update_threshold(self, threshold_index: int, updated_threshold: Dict[str, Any]) -> bool:
        """
        Update an existing threshold
        
        Args:
            threshold_index: Index of the threshold to update
            updated_threshold: New threshold values
            
        Returns:
            bool: True if successful, False if index out of range
        """
        if threshold_index < 0 or threshold_index >= len(self.thresholds):
            return False
            
        # Update threshold
        self.thresholds[threshold_index].update(updated_threshold)
        return True
    
    def add_threshold(self, threshold: Dict[str, Any]) -> bool:
        """
        Add a new threshold
        
        Args:
            threshold: New threshold to add
            
        Returns:
            bool: True if successful, False if invalid threshold
        """
        # Validate threshold
        required_fields = ["metric", "condition", "value", "severity", "enabled"]
        if not all(field in threshold for field in required_fields):
            return False
            
        # Add threshold
        self.thresholds.append(threshold)
        return True
    
    def delete_threshold(self, threshold_index: int) -> bool:
        """
        Delete a threshold
        
        Args:
            threshold_index: Index of the threshold to delete
            
        Returns:
            bool: True if successful, False if index out of range
        """
        if threshold_index < 0 or threshold_index >= len(self.thresholds):
            return False
            
        # Delete threshold
        del self.thresholds[threshold_index]
        return True
    
    def update_email_config(self, enable_emails: bool, recipients: List[str]) -> bool:
        """
        Update email notification settings
        
        Args:
            enable_emails: Whether to enable email notifications
            recipients: List of email recipients
            
        Returns:
            bool: True if successful
        """
        self.email_notifications = enable_emails
        self.email_recipients = recipients
        return True


# Create singleton instance
websocket_alerts = WebSocketAlertService()

# Exports
__all__ = ["websocket_alerts"] 