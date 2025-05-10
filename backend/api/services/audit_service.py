"""
Audit Service

Provides functions for logging system events, with specific handlers for
diagnostic and treatment activities.
"""

import time
import logging
from typing import Dict, Any, Optional, List, Union
from fastapi import Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid

from ..models.audit import AuditLog, DiagnosticLog, TreatmentLog, FeedbackLog
from ..config.config import settings

# Configure logger
logger = logging.getLogger(__name__)

# Event types
class EventType:
    """Constants for event types"""
    AUTH = "authentication"
    ACCESS = "data_access"
    DIAGNOSTIC = "diagnostic"
    TREATMENT = "treatment"
    FEEDBACK = "feedback"
    SYSTEM = "system"
    ERROR = "error"

# Actions
class Action:
    """Constants for actions"""
    # Authentication actions
    LOGIN = "login"
    LOGOUT = "logout"
    
    # Data access actions
    READ = "read"
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    
    # Diagnostic actions
    UPLOAD_IMAGE = "upload_image"
    ANALYZE_IMAGE = "analyze_image"
    VIEW_DIAGNOSTIC = "view_diagnostic"
    
    # Treatment actions
    SUGGEST_TREATMENT = "suggest_treatment"
    APPROVE_TREATMENT = "approve_treatment"
    MODIFY_TREATMENT = "modify_treatment"
    REJECT_TREATMENT = "reject_treatment"
    
    # Feedback actions
    SUBMIT_FEEDBACK = "submit_feedback"
    
    # System actions
    STARTUP = "startup"
    SHUTDOWN = "shutdown"
    CONFIG_CHANGE = "config_change"

class AuditService:
    """Service for logging audit events"""
    
    @staticmethod
    async def log_event(
        db: Session,
        event_type: str,
        action: str,
        user_id: Optional[str] = None,
        user_role: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        request: Optional[Request] = None,
        status: str = "success",
        details: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
        retention_days: Optional[int] = None,
    ) -> AuditLog:
        """
        Log a general event in the system
        
        Args:
            db: Database session
            event_type: Type of event (auth, access, diagnostic, etc.)
            action: Action being performed
            user_id: ID of the user performing the action
            user_role: Role of the user
            resource_type: Type of resource being acted upon
            resource_id: ID of the resource
            request: FastAPI request object (for extracting IP)
            status: Outcome status of the action
            details: Additional details about the action
            request_id: Unique identifier for correlating related events
            retention_days: Number of days to retain this log entry
            
        Returns:
            The created AuditLog instance
        """
        # Get client IP if request is provided
        ip_address = None
        if request:
            ip_address = request.client.host
            
            # Generate request_id if not provided
            if not request_id and hasattr(request.state, 'request_id'):
                request_id = request.state.request_id
        
        # Generate a new request_id if none exists
        if not request_id:
            request_id = str(uuid.uuid4())
        
        # Create audit log entry
        audit_log = AuditLog(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            event_type=event_type,
            user_id=user_id,
            user_role=user_role,
            ip_address=ip_address,
            resource_type=resource_type,
            resource_id=resource_id,
            action=action,
            status=status,
            details=details or {},
            request_id=request_id,
            retention_days=retention_days
        )
        
        # Add to database
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        
        # Log to application logs if debug mode
        if settings.DEBUG:
            logger.debug(f"Audit: {event_type} - {action} by {user_id} on {resource_type} {resource_id} ({status})")
        
        return audit_log
    
    @staticmethod
    async def log_diagnostic(
        db: Session,
        patient_id: str,
        image_type: str,
        analysis_id: str,
        provider_id: Optional[str] = None,
        image_id: Optional[str] = None,
        ai_model_version: Optional[str] = None,
        confidence_score: Optional[float] = None,
        processing_time_ms: Optional[int] = None,
        findings_count: Optional[int] = None,
        status: str = "success",
        error_message: Optional[str] = None,
        request: Optional[Request] = None,
        metadata: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
        retention_days: Optional[int] = None,
    ) -> DiagnosticLog:
        """
        Log a diagnostic event
        
        Args:
            db: Database session
            patient_id: ID of the patient
            image_type: Type of image (xray, photo, etc.)
            analysis_id: ID of the analysis
            provider_id: ID of the provider
            image_id: ID of the image
            ai_model_version: Version of the AI model used
            confidence_score: Overall confidence of the diagnosis
            processing_time_ms: Time taken to process the image
            findings_count: Number of findings detected
            status: Outcome status of the analysis
            error_message: Error message if analysis failed
            request: FastAPI request object
            metadata: Additional metadata
            request_id: Unique identifier for correlating related events
            retention_days: Number of days to retain this log entry
            
        Returns:
            The created DiagnosticLog instance
        """
        # First create a general audit log
        audit_log = await AuditService.log_event(
            db=db,
            event_type=EventType.DIAGNOSTIC,
            action=Action.ANALYZE_IMAGE,
            user_id=provider_id,
            resource_type="patient_image",
            resource_id=image_id or patient_id,
            request=request,
            status=status,
            details={
                "patient_id": patient_id,
                "image_type": image_type,
                "analysis_id": analysis_id,
                "ai_model_version": ai_model_version,
                "confidence_score": confidence_score,
                "findings_count": findings_count
            },
            request_id=request_id,
            retention_days=retention_days
        )
        
        # Create specialized diagnostic log
        diagnostic_log = DiagnosticLog(
            id=str(uuid.uuid4()),
            audit_log_id=audit_log.id,
            timestamp=datetime.utcnow(),
            patient_id=patient_id,
            provider_id=provider_id,
            image_type=image_type,
            image_id=image_id,
            analysis_id=analysis_id,
            ai_model_version=ai_model_version,
            confidence_score=confidence_score,
            processing_time_ms=processing_time_ms,
            findings_count=findings_count,
            status=status,
            error_message=error_message,
            metadata=metadata or {},
            request_id=request_id
        )
        
        # Add to database
        db.add(diagnostic_log)
        db.commit()
        db.refresh(diagnostic_log)
        
        return diagnostic_log
    
    @staticmethod
    async def log_treatment(
        db: Session,
        patient_id: str,
        diagnostic_id: str,
        provider_id: Optional[str] = None,
        treatment_plan_id: Optional[str] = None,
        suggested_treatments: Optional[List[Dict[str, Any]]] = None,
        selected_treatments: Optional[List[Dict[str, Any]]] = None,
        ai_confidence: Optional[float] = None,
        status: str = "suggested",
        request: Optional[Request] = None,
        metadata: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
        retention_days: Optional[int] = None,
    ) -> TreatmentLog:
        """
        Log a treatment suggestion event
        
        Args:
            db: Database session
            patient_id: ID of the patient
            diagnostic_id: ID of the related diagnostic
            provider_id: ID of the provider
            treatment_plan_id: ID of the treatment plan
            suggested_treatments: Treatments suggested by AI
            selected_treatments: Treatments selected by provider
            ai_confidence: AI confidence in the suggestions
            status: Status of the treatment plan
            request: FastAPI request object
            metadata: Additional metadata
            request_id: Unique identifier for correlating related events
            retention_days: Number of days to retain this log entry
            
        Returns:
            The created TreatmentLog instance
        """
        # Determine action based on status
        action = Action.SUGGEST_TREATMENT
        if status == "accepted":
            action = Action.APPROVE_TREATMENT
        elif status == "modified":
            action = Action.MODIFY_TREATMENT
        elif status == "rejected":
            action = Action.REJECT_TREATMENT
        
        # First create a general audit log
        audit_log = await AuditService.log_event(
            db=db,
            event_type=EventType.TREATMENT,
            action=action,
            user_id=provider_id,
            resource_type="treatment_plan",
            resource_id=treatment_plan_id or diagnostic_id,
            request=request,
            status="success",
            details={
                "patient_id": patient_id,
                "diagnostic_id": diagnostic_id,
                "treatment_status": status,
                "ai_confidence": ai_confidence
            },
            request_id=request_id,
            retention_days=retention_days
        )
        
        # Create specialized treatment log
        treatment_log = TreatmentLog(
            id=str(uuid.uuid4()),
            audit_log_id=audit_log.id,
            timestamp=datetime.utcnow(),
            patient_id=patient_id,
            provider_id=provider_id,
            diagnostic_id=diagnostic_id,
            treatment_plan_id=treatment_plan_id,
            suggested_treatments=suggested_treatments,
            selected_treatments=selected_treatments,
            ai_confidence=ai_confidence,
            status=status,
            metadata=metadata or {},
            request_id=request_id
        )
        
        # Add to database
        db.add(treatment_log)
        db.commit()
        db.refresh(treatment_log)
        
        return treatment_log
    
    @staticmethod
    async def log_feedback(
        db: Session,
        provider_id: str,
        resource_type: str,
        resource_id: str,
        rating: int,
        accuracy: Optional[float] = None,
        comments: Optional[str] = None,
        is_used_for_training: bool = False,
        request: Optional[Request] = None,
        metadata: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
        retention_days: Optional[int] = None,
    ) -> FeedbackLog:
        """
        Log provider feedback on AI performance
        
        Args:
            db: Database session
            provider_id: ID of the provider giving feedback
            resource_type: Type of resource being rated
            resource_id: ID of the resource
            rating: Rating given (1-5)
            accuracy: Provider's assessment of AI accuracy
            comments: Provider's comments
            is_used_for_training: Whether this feedback is used to train the model
            request: FastAPI request object
            metadata: Additional metadata
            request_id: Unique identifier for correlating related events
            retention_days: Number of days to retain this log entry
            
        Returns:
            The created FeedbackLog instance
        """
        # First create a general audit log
        audit_log = await AuditService.log_event(
            db=db,
            event_type=EventType.FEEDBACK,
            action=Action.SUBMIT_FEEDBACK,
            user_id=provider_id,
            resource_type=resource_type,
            resource_id=resource_id,
            request=request,
            status="success",
            details={
                "rating": rating,
                "accuracy": accuracy,
                "is_used_for_training": is_used_for_training
            },
            request_id=request_id,
            retention_days=retention_days
        )
        
        # Create specialized feedback log
        feedback_log = FeedbackLog(
            id=str(uuid.uuid4()),
            audit_log_id=audit_log.id,
            timestamp=datetime.utcnow(),
            provider_id=provider_id,
            resource_type=resource_type,
            resource_id=resource_id,
            rating=rating,
            accuracy=accuracy,
            comments=comments,
            is_used_for_training=is_used_for_training,
            metadata=metadata or {},
            request_id=request_id
        )
        
        # Add to database
        db.add(feedback_log)
        db.commit()
        db.refresh(feedback_log)
        
        return feedback_log
    
    @staticmethod
    async def log_image_upload(
        db: Session,
        patient_id: str,
        provider_id: Optional[str],
        image_type: str,
        image_id: str,
        request: Optional[Request] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """
        Log an image upload event
        
        Args:
            db: Database session
            patient_id: ID of the patient
            provider_id: ID of the provider
            image_type: Type of image
            image_id: ID of the uploaded image
            request: FastAPI request object
            metadata: Additional metadata
            
        Returns:
            The created AuditLog instance
        """
        return await AuditService.log_event(
            db=db,
            event_type=EventType.DIAGNOSTIC,
            action=Action.UPLOAD_IMAGE,
            user_id=provider_id,
            resource_type="patient_image",
            resource_id=image_id,
            request=request,
            details={
                "patient_id": patient_id,
                "image_type": image_type,
                "metadata": metadata or {}
            }
        )

    @staticmethod
    async def log_error(
        db: Session,
        error_message: str,
        user_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        request: Optional[Request] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """
        Log an error event
        
        Args:
            db: Database session
            error_message: Description of the error
            user_id: ID of the user experiencing the error
            resource_type: Type of resource related to the error
            resource_id: ID of the resource
            request: FastAPI request object
            details: Additional details about the error
            
        Returns:
            The created AuditLog instance
        """
        error_details = details or {}
        error_details["error_message"] = error_message
        
        return await AuditService.log_event(
            db=db,
            event_type=EventType.ERROR,
            action="system_error",
            user_id=user_id,
            resource_type=resource_type,
            resource_id=resource_id,
            request=request,
            status="error",
            details=error_details
        )
        
    @staticmethod
    def get_diagnostic_logs(
        db: Session,
        patient_id: Optional[str] = None,
        provider_id: Optional[str] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[DiagnosticLog]:
        """
        Retrieve diagnostic logs with filtering
        
        Args:
            db: Database session
            patient_id: Filter by patient ID
            provider_id: Filter by provider ID
            from_date: Filter by start date
            to_date: Filter by end date
            limit: Maximum number of results
            offset: Pagination offset
            
        Returns:
            List of matching DiagnosticLog records
        """
        query = db.query(DiagnosticLog)
        
        # Apply filters
        if patient_id:
            query = query.filter(DiagnosticLog.patient_id == patient_id)
        
        if provider_id:
            query = query.filter(DiagnosticLog.provider_id == provider_id)
        
        if from_date:
            query = query.filter(DiagnosticLog.timestamp >= from_date)
        
        if to_date:
            query = query.filter(DiagnosticLog.timestamp <= to_date)
        
        # Order by timestamp descending (newest first)
        query = query.order_by(DiagnosticLog.timestamp.desc())
        
        # Apply pagination
        query = query.limit(limit).offset(offset)
        
        return query.all()
    
    @staticmethod
    def get_treatment_logs(
        db: Session,
        patient_id: Optional[str] = None,
        provider_id: Optional[str] = None,
        diagnostic_id: Optional[str] = None,
        status: Optional[str] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[TreatmentLog]:
        """
        Retrieve treatment logs with filtering
        
        Args:
            db: Database session
            patient_id: Filter by patient ID
            provider_id: Filter by provider ID
            diagnostic_id: Filter by diagnostic ID
            status: Filter by treatment status
            from_date: Filter by start date
            to_date: Filter by end date
            limit: Maximum number of results
            offset: Pagination offset
            
        Returns:
            List of matching TreatmentLog records
        """
        query = db.query(TreatmentLog)
        
        # Apply filters
        if patient_id:
            query = query.filter(TreatmentLog.patient_id == patient_id)
        
        if provider_id:
            query = query.filter(TreatmentLog.provider_id == provider_id)
        
        if diagnostic_id:
            query = query.filter(TreatmentLog.diagnostic_id == diagnostic_id)
        
        if status:
            query = query.filter(TreatmentLog.status == status)
        
        if from_date:
            query = query.filter(TreatmentLog.timestamp >= from_date)
        
        if to_date:
            query = query.filter(TreatmentLog.timestamp <= to_date)
        
        # Order by timestamp descending (newest first)
        query = query.order_by(TreatmentLog.timestamp.desc())
        
        # Apply pagination
        query = query.limit(limit).offset(offset)
        
        return query.all()
    
    @staticmethod
    def get_audit_statistics(
        db: Session,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Get statistics on audit logs for reporting
        
        Args:
            db: Database session
            from_date: Start date for statistics
            to_date: End date for statistics
            
        Returns:
            Dictionary of statistics
        """
        # Base queries
        audit_query = db.query(AuditLog)
        diagnostic_query = db.query(DiagnosticLog)
        treatment_query = db.query(TreatmentLog)
        feedback_query = db.query(FeedbackLog)
        
        # Apply date filters if provided
        if from_date:
            audit_query = audit_query.filter(AuditLog.timestamp >= from_date)
            diagnostic_query = diagnostic_query.filter(DiagnosticLog.timestamp >= from_date)
            treatment_query = treatment_query.filter(TreatmentLog.timestamp >= from_date)
            feedback_query = feedback_query.filter(FeedbackLog.timestamp >= from_date)
        
        if to_date:
            audit_query = audit_query.filter(AuditLog.timestamp <= to_date)
            diagnostic_query = diagnostic_query.filter(DiagnosticLog.timestamp <= to_date)
            treatment_query = treatment_query.filter(TreatmentLog.timestamp <= to_date)
            feedback_query = feedback_query.filter(FeedbackLog.timestamp <= to_date)
        
        # Total counts
        total_audits = audit_query.count()
        total_diagnostics = diagnostic_query.count()
        total_treatments = treatment_query.count()
        total_feedback = feedback_query.count()
        
        # Treatment statistics
        treatment_statuses = {}
        for status in ["suggested", "accepted", "modified", "rejected"]:
            treatment_statuses[status] = treatment_query.filter(TreatmentLog.status == status).count()
        
        # Average AI confidence
        avg_diagnostic_confidence = db.query(
            db.func.avg(DiagnosticLog.confidence_score)
        ).scalar() or 0
        
        avg_treatment_confidence = db.query(
            db.func.avg(TreatmentLog.ai_confidence)
        ).scalar() or 0
        
        # Average feedback rating
        avg_feedback_rating = db.query(
            db.func.avg(FeedbackLog.rating)
        ).scalar() or 0
        
        # Return compiled statistics
        return {
            "time_period": {
                "from_date": from_date.isoformat() if from_date else None,
                "to_date": to_date.isoformat() if to_date else None,
            },
            "total_counts": {
                "audits": total_audits,
                "diagnostics": total_diagnostics,
                "treatments": total_treatments,
                "feedback": total_feedback,
            },
            "treatment_statistics": {
                "statuses": treatment_statuses,
            },
            "ai_performance": {
                "avg_diagnostic_confidence": float(avg_diagnostic_confidence),
                "avg_treatment_confidence": float(avg_treatment_confidence),
                "avg_feedback_rating": float(avg_feedback_rating),
            }
        }

    @staticmethod
    def purge_expired_logs(
        db: Session,
        default_retention_days: int = 365,  # Default to 1 year
        archive_before_delete: bool = True
    ) -> Dict[str, int]:
        """
        Purge expired audit logs based on retention policy
        
        Args:
            db: Database session
            default_retention_days: Default retention period for logs with no specific policy
            archive_before_delete: Whether to archive logs before deletion
            
        Returns:
            Dictionary with counts of archived and deleted logs
        """
        today = datetime.utcnow()
        results = {
            "archived": 0,
            "deleted": 0
        }
        
        # Query for AuditLog entries to purge
        query = db.query(AuditLog)
        
        # Handle logs with specific retention_days
        specific_retention = query.filter(AuditLog.retention_days.isnot(None))
        for log in specific_retention:
            expiry_date = log.timestamp + timedelta(days=log.retention_days)
            if today >= expiry_date:
                if archive_before_delete:
                    AuditService._archive_log(db, log)
                    results["archived"] += 1
                
                # Delete related specialized logs
                AuditService._delete_related_logs(db, log.id)
                
                # Delete the audit log
                db.delete(log)
                results["deleted"] += 1
        
        # Handle logs with default retention policy
        default_retention = query.filter(AuditLog.retention_days.is_(None))
        expiry_date = today - timedelta(days=default_retention_days)
        expired_logs = default_retention.filter(AuditLog.timestamp <= expiry_date)
        
        for log in expired_logs:
            if archive_before_delete:
                AuditService._archive_log(db, log)
                results["archived"] += 1
            
            # Delete related specialized logs
            AuditService._delete_related_logs(db, log.id)
            
            # Delete the audit log
            db.delete(log)
            results["deleted"] += 1
        
        # Commit the transaction
        db.commit()
        
        return results
    
    @staticmethod
    def _archive_log(db: Session, log: AuditLog) -> None:
        """
        Archive an audit log before deletion
        
        Args:
            db: Database session
            log: The AuditLog to archive
        """
        # In a real implementation, this would:
        # 1. Serialize the log to JSON
        # 2. Store in a long-term storage solution (S3, GCS, etc.)
        # 3. Potentially compress the data
        
        # For this implementation, we'll just log that it would be archived
        logger.info(f"Archiving log {log.id} from {log.timestamp.isoformat()}")
        
        # A real implementation would look like:
        # archive_data = {
        #     "id": log.id,
        #     "timestamp": log.timestamp.isoformat(),
        #     "event_type": log.event_type,
        #     "user_id": log.user_id,
        #     "resource_type": log.resource_type,
        #     "resource_id": log.resource_id,
        #     "action": log.action,
        #     "details": log.details
        # }
        # archive_service.store(json.dumps(archive_data), f"audit_logs/{log.id}.json")
    
    @staticmethod
    def _delete_related_logs(db: Session, audit_log_id: str) -> None:
        """
        Delete related specialized logs for an audit log
        
        Args:
            db: Database session
            audit_log_id: The ID of the AuditLog entry
        """
        # Delete diagnostic logs
        db.query(DiagnosticLog).filter(DiagnosticLog.audit_log_id == audit_log_id).delete()
        
        # Delete treatment logs
        db.query(TreatmentLog).filter(TreatmentLog.audit_log_id == audit_log_id).delete()
        
        # Delete feedback logs
        db.query(FeedbackLog).filter(FeedbackLog.audit_log_id == audit_log_id).delete() 