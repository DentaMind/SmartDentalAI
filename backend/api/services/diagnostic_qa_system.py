import logging
import uuid
import json
import os
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_, not_

from ..models.diagnostic_feedback import DiagnosticFeedback, DiagnosticFinding

logger = logging.getLogger(__name__)

class DiagnosticQASystem:
    """
    Quality Assurance System for monitoring diagnostic patterns
    
    This system:
    1. Monitors AI diagnostic patterns for anomalies
    2. Identifies unusual correction/rejection patterns
    3. Alerts on high error rates from specific model versions
    4. Highlights potential quality issues for proactive review
    5. Provides recommendations for system improvements
    """
    
    def __init__(self, db: Optional[Session] = None):
        """Initialize the diagnostic QA system"""
        self.db = db
        self.qa_alerts_path = os.path.join("data", "qa_alerts")
        self._ensure_directories()
        
        # Define thresholds for alerts (these would be configurable in a real system)
        self.thresholds = {
            "high_rejection_rate": 0.20,  # 20% rejection rate
            "unusual_pattern_stdev": 2.0,  # 2 standard deviations from normal
            "model_error_threshold": 0.15,  # 15% error rate
            "practice_variance_threshold": 0.25,  # 25% variance between practices
            "provider_variance_threshold": 0.20  # 20% variance between providers
        }
    
    def _ensure_directories(self):
        """Ensure necessary directories exist"""
        os.makedirs(self.qa_alerts_path, exist_ok=True)
    
    async def run_diagnostic_qa_check(self, lookback_days: int = 7) -> Dict[str, Any]:
        """
        Run a full diagnostic quality assurance check
        
        Args:
            lookback_days: Number of days to analyze
            
        Returns:
            QA check results with alerts and recommendations
        """
        # For real implementation, execute all checks
        alerts = []
        
        # Check for high rejection rates
        rejection_alerts = await self.check_rejection_rates(lookback_days)
        alerts.extend(rejection_alerts)
        
        # Check for unusual diagnostic patterns
        pattern_alerts = await self.check_unusual_patterns(lookback_days)
        alerts.extend(pattern_alerts)
        
        # Check for model version issues
        model_alerts = await self.check_model_versions(lookback_days)
        alerts.extend(model_alerts)
        
        # Check for practice variances
        practice_alerts = await self.check_practice_variances(lookback_days)
        alerts.extend(practice_alerts)
        
        # Generate recommendations based on alerts
        recommendations = self._generate_recommendations(alerts)
        
        # Compile the QA report
        qa_report = {
            "report_id": str(uuid.uuid4()),
            "timestamp": datetime.now().isoformat(),
            "lookback_days": lookback_days,
            "alert_count": len(alerts),
            "alerts": alerts,
            "recommendations": recommendations,
            "summary": self._generate_summary(alerts)
        }
        
        # Save the report
        report_filename = os.path.join(self.qa_alerts_path, f"qa_report_{qa_report['report_id']}.json")
        with open(report_filename, 'w') as f:
            json.dump(qa_report, f, indent=2)
        
        return qa_report
    
    async def check_rejection_rates(self, lookback_days: int = 7) -> List[Dict[str, Any]]:
        """
        Check for high rejection rates in diagnostics
        
        Args:
            lookback_days: Number of days to analyze
            
        Returns:
            List of alerts for high rejection rates
        """
        if not self.db:
            # Mock implementation
            return self._mock_rejection_rate_alerts()
        
        # Get the date threshold
        date_threshold = datetime.now() - timedelta(days=lookback_days)
        
        # Get rejection rates overall
        total_findings = self.db.query(func.count(DiagnosticFinding.id)).filter(
            DiagnosticFinding.created_at >= date_threshold
        ).scalar() or 0
        
        rejected_findings = self.db.query(func.count(DiagnosticFinding.id)).filter(
            DiagnosticFinding.status == "rejected",
            DiagnosticFinding.created_at >= date_threshold
        ).scalar() or 0
        
        overall_rejection_rate = rejected_findings / total_findings if total_findings > 0 else 0
        
        alerts = []
        
        # Overall rejection rate alert
        if overall_rejection_rate >= self.thresholds["high_rejection_rate"]:
            alerts.append({
                "alert_id": str(uuid.uuid4()),
                "alert_type": "high_rejection_rate",
                "severity": "high" if overall_rejection_rate >= 0.3 else "medium",
                "description": f"High overall rejection rate of {overall_rejection_rate:.1%}",
                "details": {
                    "total_findings": total_findings,
                    "rejected_findings": rejected_findings,
                    "rejection_rate": overall_rejection_rate
                },
                "created_at": datetime.now().isoformat()
            })
        
        # Check rejection rates by diagnostic area
        area_stats = []
        for area in ["caries", "periodontal", "periapical", "tmj", "orthodontic"]:
            area_findings = self.db.query(func.count(DiagnosticFinding.id)).filter(
                DiagnosticFinding.area == area,
                DiagnosticFinding.created_at >= date_threshold
            ).scalar() or 0
            
            area_rejections = self.db.query(func.count(DiagnosticFinding.id)).filter(
                DiagnosticFinding.area == area,
                DiagnosticFinding.status == "rejected",
                DiagnosticFinding.created_at >= date_threshold
            ).scalar() or 0
            
            area_rejection_rate = area_rejections / area_findings if area_findings > 0 else 0
            
            area_stats.append({
                "area": area,
                "total": area_findings,
                "rejected": area_rejections,
                "rejection_rate": area_rejection_rate
            })
            
            # Add alert if this area has a high rejection rate
            if area_findings >= 10 and area_rejection_rate >= self.thresholds["high_rejection_rate"]:
                alerts.append({
                    "alert_id": str(uuid.uuid4()),
                    "alert_type": "high_area_rejection_rate",
                    "severity": "high" if area_rejection_rate >= 0.3 else "medium",
                    "description": f"High rejection rate of {area_rejection_rate:.1%} for {area} diagnoses",
                    "details": {
                        "area": area,
                        "total_findings": area_findings,
                        "rejected_findings": area_rejections,
                        "rejection_rate": area_rejection_rate
                    },
                    "created_at": datetime.now().isoformat()
                })
        
        return alerts
    
    def _mock_rejection_rate_alerts(self) -> List[Dict[str, Any]]:
        """Generate mock alerts for demonstration"""
        return [
            {
                "alert_id": str(uuid.uuid4()),
                "alert_type": "high_rejection_rate",
                "severity": "medium",
                "description": "High overall rejection rate of 22.5%",
                "details": {
                    "total_findings": 1250,
                    "rejected_findings": 281,
                    "rejection_rate": 0.225
                },
                "created_at": datetime.now().isoformat()
            },
            {
                "alert_id": str(uuid.uuid4()),
                "alert_type": "high_area_rejection_rate",
                "severity": "high",
                "description": "High rejection rate of 32.6% for periapical diagnoses",
                "details": {
                    "area": "periapical",
                    "total_findings": 215,
                    "rejected_findings": 70,
                    "rejection_rate": 0.326
                },
                "created_at": datetime.now().isoformat()
            }
        ]
    
    async def check_unusual_patterns(self, lookback_days: int = 7) -> List[Dict[str, Any]]:
        """
        Check for unusual diagnostic patterns that may indicate issues
        
        Args:
            lookback_days: Number of days to analyze
            
        Returns:
            List of alerts for unusual patterns
        """
        if not self.db:
            # Mock implementation
            return self._mock_unusual_pattern_alerts()
        
        # Get the date threshold
        date_threshold = datetime.now() - timedelta(days=lookback_days)
        
        alerts = []
        
        # Look for sudden changes in diagnostic rates by area
        # This requires comparing current period to previous period
        for area in ["caries", "periodontal", "periapical", "tmj", "orthodontic"]:
            # Current period stats
            current_total = self.db.query(func.count(DiagnosticFinding.id)).filter(
                DiagnosticFinding.area == area,
                DiagnosticFinding.created_at >= date_threshold
            ).scalar() or 0
            
            # Previous period stats (same duration)
            prev_threshold = date_threshold - timedelta(days=lookback_days)
            prev_total = self.db.query(func.count(DiagnosticFinding.id)).filter(
                DiagnosticFinding.area == area,
                DiagnosticFinding.created_at >= prev_threshold,
                DiagnosticFinding.created_at < date_threshold
            ).scalar() or 0
            
            # Skip if either period has too few diagnoses
            if current_total < 10 or prev_total < 10:
                continue
            
            # Calculate percentage change
            if prev_total > 0:
                percent_change = ((current_total - prev_total) / prev_total) * 100
                
                # Alert on significant changes (more than 50% increase or 30% decrease)
                if percent_change >= 50 or percent_change <= -30:
                    alerts.append({
                        "alert_id": str(uuid.uuid4()),
                        "alert_type": "unusual_diagnostic_pattern",
                        "severity": "medium",
                        "description": f"{'Increase' if percent_change > 0 else 'Decrease'} of {abs(percent_change):.1f}% in {area} diagnoses",
                        "details": {
                            "area": area,
                            "current_period_count": current_total,
                            "previous_period_count": prev_total,
                            "percent_change": percent_change,
                            "current_period_start": date_threshold.isoformat(),
                            "previous_period_start": prev_threshold.isoformat()
                        },
                        "created_at": datetime.now().isoformat()
                    })
        
        # Look for unusual patterns in specific findings
        # This would involve more complex analysis in a real implementation
        
        return alerts
    
    def _mock_unusual_pattern_alerts(self) -> List[Dict[str, Any]]:
        """Generate mock pattern alerts for demonstration"""
        return [
            {
                "alert_id": str(uuid.uuid4()),
                "alert_type": "unusual_diagnostic_pattern",
                "severity": "medium",
                "description": "Increase of 65.3% in periapical diagnoses",
                "details": {
                    "area": "periapical",
                    "current_period_count": 198,
                    "previous_period_count": 120,
                    "percent_change": 65.3,
                    "current_period_start": (datetime.now() - timedelta(days=7)).isoformat(),
                    "previous_period_start": (datetime.now() - timedelta(days=14)).isoformat()
                },
                "created_at": datetime.now().isoformat()
            },
            {
                "alert_id": str(uuid.uuid4()),
                "alert_type": "unusual_correction_pattern",
                "severity": "high",
                "description": "Unusual correction pattern: 85% of 'Moderate Caries' diagnoses corrected to 'Mild Caries'",
                "details": {
                    "original_diagnosis": "Moderate Caries",
                    "corrected_diagnosis": "Mild Caries",
                    "occurrence_count": 42,
                    "total_diagnoses": 49,
                    "correction_percentage": 85.7
                },
                "created_at": datetime.now().isoformat()
            }
        ]
    
    async def check_model_versions(self, lookback_days: int = 7) -> List[Dict[str, Any]]:
        """
        Check for issues with specific model versions
        
        Args:
            lookback_days: Number of days to analyze
            
        Returns:
            List of alerts for model version issues
        """
        if not self.db:
            # Mock implementation
            return self._mock_model_version_alerts()
        
        # Get the date threshold
        date_threshold = datetime.now() - timedelta(days=lookback_days)
        
        alerts = []
        
        # Get all model versions used in the period
        model_versions = self.db.query(DiagnosticFinding.model_version).filter(
            DiagnosticFinding.created_at >= date_threshold,
            DiagnosticFinding.model_version.isnot(None)
        ).distinct().all()
        
        for version_tuple in model_versions:
            version = version_tuple[0]
            
            # Skip if no version
            if not version:
                continue
            
            # Get stats for this model version
            total_findings = self.db.query(func.count(DiagnosticFinding.id)).filter(
                DiagnosticFinding.model_version == version,
                DiagnosticFinding.created_at >= date_threshold
            ).scalar() or 0
            
            # Skip if too few samples
            if total_findings < 50:
                continue
            
            # Count rejections and corrections
            rejected = self.db.query(func.count(DiagnosticFinding.id)).filter(
                DiagnosticFinding.model_version == version,
                DiagnosticFinding.status == "rejected",
                DiagnosticFinding.created_at >= date_threshold
            ).scalar() or 0
            
            corrected = self.db.query(func.count(DiagnosticFinding.id)).filter(
                DiagnosticFinding.model_version == version,
                DiagnosticFinding.status == "corrected",
                DiagnosticFinding.created_at >= date_threshold
            ).scalar() or 0
            
            # Calculate error rate (rejections + corrections)
            error_rate = (rejected + corrected) / total_findings if total_findings > 0 else 0
            
            # Alert if error rate is too high
            if error_rate >= self.thresholds["model_error_threshold"]:
                alerts.append({
                    "alert_id": str(uuid.uuid4()),
                    "alert_type": "high_model_error_rate",
                    "severity": "high" if error_rate >= 0.25 else "medium",
                    "description": f"Model version {version} has a high error rate of {error_rate:.1%}",
                    "details": {
                        "model_version": version,
                        "total_findings": total_findings,
                        "rejected_findings": rejected,
                        "corrected_findings": corrected,
                        "error_rate": error_rate
                    },
                    "created_at": datetime.now().isoformat()
                })
        
        return alerts
    
    def _mock_model_version_alerts(self) -> List[Dict[str, Any]]:
        """Generate mock model version alerts for demonstration"""
        return [
            {
                "alert_id": str(uuid.uuid4()),
                "alert_type": "high_model_error_rate",
                "severity": "high",
                "description": "Model version 1.2.3 has a high error rate of 28.5%",
                "details": {
                    "model_version": "1.2.3",
                    "total_findings": 425,
                    "rejected_findings": 72,
                    "corrected_findings": 49,
                    "error_rate": 0.285
                },
                "created_at": datetime.now().isoformat()
            }
        ]
    
    async def check_practice_variances(self, lookback_days: int = 7) -> List[Dict[str, Any]]:
        """
        Check for unusual variances between practices
        
        Args:
            lookback_days: Number of days to analyze
            
        Returns:
            List of alerts for practice variance issues
        """
        if not self.db:
            # Mock implementation
            return self._mock_practice_variance_alerts()
        
        # Get the date threshold
        date_threshold = datetime.now() - timedelta(days=lookback_days)
        
        alerts = []
        
        # Get all practices with sufficient data
        practice_data = {}
        feedback_items = self.db.query(DiagnosticFeedback).filter(
            DiagnosticFeedback.created_at >= date_threshold,
            DiagnosticFeedback.practice_id.isnot(None)
        ).all()
        
        for feedback in feedback_items:
            practice_id = feedback.practice_id
            if practice_id not in practice_data:
                practice_data[practice_id] = {"total": 0, "rejected": 0, "corrected": 0}
            
            practice_data[practice_id]["total"] += 1
            
            if feedback.feedback_type == "correction":
                practice_data[practice_id]["corrected"] += 1
            elif hasattr(feedback, 'status') and feedback.status == "rejected":
                practice_data[practice_id]["rejected"] += 1
        
        # Calculate average rejection and correction rates across practices
        valid_practices = {p: d for p, d in practice_data.items() if d["total"] >= 20}
        if len(valid_practices) >= 3:  # Need at least 3 practices for meaningful comparison
            avg_rejection_rate = sum(d["rejected"] / d["total"] for d in valid_practices.values()) / len(valid_practices)
            avg_correction_rate = sum(d["corrected"] / d["total"] for d in valid_practices.values()) / len(valid_practices)
            
            # Check each practice against averages
            for practice_id, data in valid_practices.items():
                practice_rejection_rate = data["rejected"] / data["total"]
                practice_correction_rate = data["corrected"] / data["total"]
                
                # Alert if rejection rate is significantly higher than average
                if practice_rejection_rate >= (avg_rejection_rate * (1 + self.thresholds["practice_variance_threshold"])):
                    alerts.append({
                        "alert_id": str(uuid.uuid4()),
                        "alert_type": "practice_variance",
                        "severity": "medium",
                        "description": f"Practice {practice_id} has a rejection rate {((practice_rejection_rate / avg_rejection_rate) - 1) * 100:.1f}% higher than average",
                        "details": {
                            "practice_id": practice_id,
                            "practice_rejection_rate": practice_rejection_rate,
                            "average_rejection_rate": avg_rejection_rate,
                            "variance_percentage": ((practice_rejection_rate / avg_rejection_rate) - 1) * 100
                        },
                        "created_at": datetime.now().isoformat()
                    })
                
                # Alert if correction rate is significantly higher than average
                if practice_correction_rate >= (avg_correction_rate * (1 + self.thresholds["practice_variance_threshold"])):
                    alerts.append({
                        "alert_id": str(uuid.uuid4()),
                        "alert_type": "practice_variance",
                        "severity": "medium",
                        "description": f"Practice {practice_id} has a correction rate {((practice_correction_rate / avg_correction_rate) - 1) * 100:.1f}% higher than average",
                        "details": {
                            "practice_id": practice_id,
                            "practice_correction_rate": practice_correction_rate,
                            "average_correction_rate": avg_correction_rate,
                            "variance_percentage": ((practice_correction_rate / avg_correction_rate) - 1) * 100
                        },
                        "created_at": datetime.now().isoformat()
                    })
        
        return alerts
    
    def _mock_practice_variance_alerts(self) -> List[Dict[str, Any]]:
        """Generate mock practice variance alerts for demonstration"""
        return [
            {
                "alert_id": str(uuid.uuid4()),
                "alert_type": "practice_variance",
                "severity": "medium",
                "description": "Practice practice-007 has a rejection rate 68.5% higher than average",
                "details": {
                    "practice_id": "practice-007",
                    "practice_rejection_rate": 0.32,
                    "average_rejection_rate": 0.19,
                    "variance_percentage": 68.5
                },
                "created_at": datetime.now().isoformat()
            },
            {
                "alert_id": str(uuid.uuid4()),
                "alert_type": "practice_variance",
                "severity": "medium",
                "description": "Practice practice-012 has a correction rate 72.4% higher than average",
                "details": {
                    "practice_id": "practice-012",
                    "practice_correction_rate": 0.29,
                    "average_correction_rate": 0.168,
                    "variance_percentage": 72.4
                },
                "created_at": datetime.now().isoformat()
            }
        ]
    
    def _generate_recommendations(self, alerts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate recommendations based on alerts"""
        recommendations = []
        
        # Group alerts by type
        alert_types = {}
        for alert in alerts:
            alert_type = alert["alert_type"]
            if alert_type not in alert_types:
                alert_types[alert_type] = []
            alert_types[alert_type].append(alert)
        
        # Generate recommendations for each alert type
        if "high_rejection_rate" in alert_types or "high_area_rejection_rate" in alert_types:
            areas_with_issues = set()
            for alert in alert_types.get("high_area_rejection_rate", []):
                if "details" in alert and "area" in alert["details"]:
                    areas_with_issues.add(alert["details"]["area"])
            
            recommendations.append({
                "recommendation_id": str(uuid.uuid4()),
                "title": "Review AI Model for Diagnostic Areas",
                "description": f"Consider adjusting the AI model for {', '.join(areas_with_issues) if areas_with_issues else 'problem areas'} to reduce rejection rates.",
                "action_items": [
                    "Review rejected findings to identify specific issues",
                    "Consider additional training data for affected areas",
                    "Adjust confidence thresholds for areas with high error rates"
                ],
                "priority": "high" if any(a["severity"] == "high" for a in alert_types.get("high_area_rejection_rate", [])) else "medium"
            })
        
        if "unusual_diagnostic_pattern" in alert_types:
            recommendations.append({
                "recommendation_id": str(uuid.uuid4()),
                "title": "Investigate Unusual Diagnostic Patterns",
                "description": "Review recent diagnostic patterns to understand what's causing the anomalies.",
                "action_items": [
                    "Compare recent diagnoses with historical trends",
                    "Check for changes in image quality or protocol",
                    "Review specific providers' correction patterns"
                ],
                "priority": "medium"
            })
        
        if "high_model_error_rate" in alert_types:
            recommendations.append({
                "recommendation_id": str(uuid.uuid4()),
                "title": "Evaluate and Potentially Rollback Model Version",
                "description": "Current model version is showing high error rates and may need to be rolled back.",
                "action_items": [
                    "Compare performance with previous versions",
                    "Consider temporarily rolling back to a more stable version",
                    "Schedule focused retraining with corrections"
                ],
                "priority": "high"
            })
        
        if "practice_variance" in alert_types:
            practice_ids = set()
            for alert in alert_types["practice_variance"]:
                if "details" in alert and "practice_id" in alert["details"]:
                    practice_ids.add(alert["details"]["practice_id"])
            
            recommendations.append({
                "recommendation_id": str(uuid.uuid4()),
                "title": "Review Practice-Specific Adaptations",
                "description": f"Evaluate diagnostic patterns for {'practices ' + ', '.join(practice_ids) if practice_ids else 'practices with high variance'}.",
                "action_items": [
                    "Review correction patterns in highlighted practices",
                    "Consider practice-specific model adaptations",
                    "Evaluate if additional training is needed for these practices"
                ],
                "priority": "medium"
            })
        
        return recommendations
    
    def _generate_summary(self, alerts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate a summary of the QA report"""
        high_severity = sum(1 for a in alerts if a.get("severity") == "high")
        medium_severity = sum(1 for a in alerts if a.get("severity") == "medium")
        low_severity = sum(1 for a in alerts if a.get("severity") == "low")
        
        # Group alerts by type
        types = {}
        for alert in alerts:
            alert_type = alert["alert_type"]
            types[alert_type] = types.get(alert_type, 0) + 1
        
        # Determine overall status
        if high_severity > 0:
            overall_status = "needs_attention"
        elif medium_severity > 0:
            overall_status = "monitor"
        else:
            overall_status = "healthy"
        
        return {
            "total_alerts": len(alerts),
            "severity_breakdown": {
                "high": high_severity,
                "medium": medium_severity,
                "low": low_severity
            },
            "alert_types": types,
            "overall_status": overall_status
        }
    
    async def get_recent_qa_reports(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get recent QA reports
        
        Args:
            limit: Maximum number of reports to return
            
        Returns:
            List of recent QA reports
        """
        reports = []
        
        # List report files, sorted by modification time (newest first)
        if os.path.exists(self.qa_alerts_path):
            files = [os.path.join(self.qa_alerts_path, f) for f in os.listdir(self.qa_alerts_path) 
                     if f.startswith("qa_report_") and f.endswith(".json")]
            files.sort(key=lambda x: os.path.getmtime(x), reverse=True)
            
            # Load the reports
            for file_path in files[:limit]:
                try:
                    with open(file_path, 'r') as f:
                        report = json.load(f)
                        reports.append(report)
                except Exception as e:
                    logger.error(f"Error reading QA report file {file_path}: {str(e)}")
        
        # If no reports found or in mock mode, return mock reports
        if not reports:
            return self._mock_qa_reports(limit)
        
        return reports
    
    def _mock_qa_reports(self, limit: int) -> List[Dict[str, Any]]:
        """Generate mock QA reports for demonstration"""
        reports = []
        for i in range(limit):
            # Generate reports with declining dates
            report_date = datetime.now() - timedelta(days=i)
            
            # Generate different statuses based on the day
            overall_status = "healthy" if i % 3 == 0 else "monitor" if i % 3 == 1 else "needs_attention"
            alert_count = 0 if overall_status == "healthy" else 3 if overall_status == "monitor" else 7
            
            reports.append({
                "report_id": str(uuid.uuid4()),
                "timestamp": report_date.isoformat(),
                "lookback_days": 7,
                "alert_count": alert_count,
                "alerts": [],  # Not including full alerts for brevity
                "recommendations": [],  # Not including full recommendations for brevity
                "summary": {
                    "total_alerts": alert_count,
                    "severity_breakdown": {
                        "high": 2 if overall_status == "needs_attention" else 0,
                        "medium": 5 if overall_status == "needs_attention" else 3 if overall_status == "monitor" else 0,
                        "low": 0
                    },
                    "alert_types": {
                        "high_rejection_rate": 1 if overall_status != "healthy" else 0,
                        "unusual_diagnostic_pattern": 1 if overall_status == "needs_attention" else 0,
                        "high_model_error_rate": 1 if overall_status == "needs_attention" else 0,
                        "practice_variance": 1 if overall_status != "healthy" else 0
                    },
                    "overall_status": overall_status
                }
            })
        
        return reports 