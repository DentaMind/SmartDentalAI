from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy import func, desc, and_
from sqlalchemy.orm import Session

from models.audit import AuditEvent, AuditEventType
from models.treatment_plan import TreatmentPlan, TreatmentPlanStatus
from models.patient import Patient
from models.ledger import LedgerEntry
from models.xray import XRay

class MetricsService:
    """Service for collecting system-wide metrics for the Founder Ops Board."""
    
    @staticmethod
    def get_system_health(db: Session) -> Dict[str, Any]:
        """Get system health metrics."""
        now = datetime.utcnow()
        hour_ago = now - timedelta(hours=1)
        
        return {
            "api_response_times": {
                "avg_ms": db.query(func.avg(AuditEvent.metadata['response_time'])).filter(
                    AuditEvent.timestamp >= hour_ago
                ).scalar() or 0,
                "max_ms": db.query(func.max(AuditEvent.metadata['response_time'])).filter(
                    AuditEvent.timestamp >= hour_ago
                ).scalar() or 0,
            },
            "storage_metrics": {
                "total_xrays": db.query(XRay).count(),
                "total_storage_mb": db.query(func.sum(XRay.file_size_bytes) / 1024 / 1024).scalar() or 0,
            },
            "database_metrics": {
                "total_patients": db.query(Patient).count(),
                "total_treatment_plans": db.query(TreatmentPlan).count(),
                "total_audit_events": db.query(AuditEvent).count(),
            }
        }
    
    @staticmethod
    def get_scaling_metrics(db: Session) -> Dict[str, Any]:
        """Get metrics related to system scaling and performance."""
        now = datetime.utcnow()
        day_ago = now - timedelta(days=1)
        
        return {
            "concurrent_users": {
                "last_24h": db.query(func.count(func.distinct(AuditEvent.user_id))).filter(
                    AuditEvent.timestamp >= day_ago
                ).scalar() or 0,
            },
            "data_volume": {
                "daily_new_patients": db.query(Patient).filter(
                    Patient.created_at >= day_ago
                ).count(),
                "daily_new_treatment_plans": db.query(TreatmentPlan).filter(
                    TreatmentPlan.created_at >= day_ago
                ).count(),
                "daily_new_xrays": db.query(XRay).filter(
                    XRay.created_at >= day_ago
                ).count(),
            },
            "processing_metrics": {
                "ai_analysis_queue_size": db.query(XRay).filter(
                    XRay.analysis_status == "pending"
                ).count(),
                "background_jobs_pending": db.query(AuditEvent).filter(
                    and_(
                        AuditEvent.metadata['job_status'] == "pending",
                        AuditEvent.timestamp >= day_ago
                    )
                ).count(),
            }
        }
    
    @staticmethod
    def get_learning_metrics(db: Session) -> Dict[str, Any]:
        """Get metrics related to AI learning and data collection."""
        now = datetime.utcnow()
        month_ago = now - timedelta(days=30)
        
        return {
            "training_data": {
                "total_analyzed_xrays": db.query(XRay).filter(
                    XRay.analysis_status == "completed"
                ).count(),
                "human_corrections": db.query(AuditEvent).filter(
                    and_(
                        AuditEvent.event_type == "ai_diagnosis_corrected",
                        AuditEvent.timestamp >= month_ago
                    )
                ).count(),
            },
            "model_performance": {
                "agreement_rate": 0.85,  # TODO: Calculate from actual data
                "monthly_improvement": 0.02,  # TODO: Calculate from actual data
            },
            "data_collection": {
                "anonymized_cases": db.query(AuditEvent).filter(
                    and_(
                        AuditEvent.metadata['anonymized'] == True,
                        AuditEvent.timestamp >= month_ago
                    )
                ).count(),
            }
        }
    
    @staticmethod
    def get_deployment_metrics(db: Session) -> Dict[str, Any]:
        """Get metrics related to system deployment and updates."""
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)
        
        return {
            "deployment_health": {
                "successful_updates": db.query(AuditEvent).filter(
                    and_(
                        AuditEvent.event_type == "system_update_completed",
                        AuditEvent.timestamp >= week_ago
                    )
                ).count(),
                "failed_updates": db.query(AuditEvent).filter(
                    and_(
                        AuditEvent.event_type == "system_update_failed",
                        AuditEvent.timestamp >= week_ago
                    )
                ).count(),
            },
            "feature_flags": {
                "active_experiments": db.query(AuditEvent).filter(
                    and_(
                        AuditEvent.event_type == "feature_flag_active",
                        AuditEvent.timestamp >= now
                    )
                ).count(),
            },
            "api_versions": {
                "current": "v1",  # TODO: Get from config
                "deprecated": [],  # TODO: Get from config
            }
        }
    
    @staticmethod
    def get_risk_metrics(db: Session) -> Dict[str, Any]:
        """Get metrics related to system risks and technical debt."""
        now = datetime.utcnow()
        day_ago = now - timedelta(days=1)
        
        return {
            "security": {
                "failed_login_attempts": db.query(AuditEvent).filter(
                    and_(
                        AuditEvent.event_type == "login_failed",
                        AuditEvent.timestamp >= day_ago
                    )
                ).count(),
                "suspicious_activities": db.query(AuditEvent).filter(
                    and_(
                        AuditEvent.event_type == "suspicious_activity_detected",
                        AuditEvent.timestamp >= day_ago
                    )
                ).count(),
            },
            "compliance": {
                "hipaa_violations": db.query(AuditEvent).filter(
                    and_(
                        AuditEvent.event_type == "hipaa_violation_detected",
                        AuditEvent.timestamp >= day_ago
                    )
                ).count(),
                "data_export_requests": db.query(AuditEvent).filter(
                    and_(
                        AuditEvent.event_type == "data_export_requested",
                        AuditEvent.timestamp >= day_ago
                    )
                ).count(),
            },
            "technical_debt": {
                "deprecated_api_calls": db.query(AuditEvent).filter(
                    and_(
                        AuditEvent.event_type == "deprecated_api_called",
                        AuditEvent.timestamp >= day_ago
                    )
                ).count(),
                "slow_queries": db.query(AuditEvent).filter(
                    and_(
                        AuditEvent.event_type == "slow_query_detected",
                        AuditEvent.timestamp >= day_ago
                    )
                ).count(),
            }
        } 