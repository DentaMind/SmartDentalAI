"""
Export Service

Provides functionality for exporting data in various formats (CSV, JSON)
primarily focused on audit logs for compliance reporting.
"""

import json
import csv
import io
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models.audit import AuditLog, DiagnosticLog, TreatmentLog, FeedbackLog
from ..services.audit_service import AuditService


class ExportService:
    """Service for exporting data in various formats"""
    
    @staticmethod
    def export_audit_logs_csv(
        db: Session,
        event_type: Optional[str] = None,
        user_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
    ) -> io.StringIO:
        """
        Export audit logs to CSV format
        
        Args:
            db: Database session
            event_type: Filter by event type
            user_id: Filter by user ID
            resource_type: Filter by resource type
            from_date: Filter by start date
            to_date: Filter by end date
            
        Returns:
            StringIO object containing CSV data
        """
        # Query for audit logs
        query = db.query(AuditLog)
        
        # Apply filters
        if event_type:
            query = query.filter(AuditLog.event_type == event_type)
        
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        
        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)
        
        if from_date:
            query = query.filter(AuditLog.timestamp >= from_date)
        
        if to_date:
            query = query.filter(AuditLog.timestamp <= to_date)
        
        # Execute query
        logs = query.order_by(AuditLog.timestamp.desc()).all()
        
        # Prepare CSV output
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            "ID", "Timestamp", "Event Type", "User ID", "User Role",
            "Resource Type", "Resource ID", "Action", "Status", "Details",
            "Request ID"
        ])
        
        # Write data rows
        for log in logs:
            writer.writerow([
                log.id,
                log.timestamp.isoformat(),
                log.event_type,
                log.user_id or "",
                log.user_role or "",
                log.resource_type or "",
                log.resource_id or "",
                log.action,
                log.status,
                json.dumps(log.details) if log.details else "",
                log.request_id or ""
            ])
        
        # Reset pointer to start of stream
        output.seek(0)
        return output
    
    @staticmethod
    def export_audit_logs_json(
        db: Session,
        event_type: Optional[str] = None,
        user_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
    ) -> str:
        """
        Export audit logs to JSON format
        
        Args:
            db: Database session
            event_type: Filter by event type
            user_id: Filter by user ID
            resource_type: Filter by resource type
            from_date: Filter by start date
            to_date: Filter by end date
            
        Returns:
            JSON string of the audit logs
        """
        # Query for audit logs
        query = db.query(AuditLog)
        
        # Apply filters
        if event_type:
            query = query.filter(AuditLog.event_type == event_type)
        
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        
        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)
        
        if from_date:
            query = query.filter(AuditLog.timestamp >= from_date)
        
        if to_date:
            query = query.filter(AuditLog.timestamp <= to_date)
        
        # Execute query
        logs = query.order_by(AuditLog.timestamp.desc()).all()
        
        # Convert to list of dictionaries
        results = []
        for log in logs:
            results.append({
                "id": log.id,
                "timestamp": log.timestamp.isoformat(),
                "event_type": log.event_type,
                "user_id": log.user_id,
                "user_role": log.user_role,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "action": log.action,
                "status": log.status,
                "details": log.details,
                "request_id": log.request_id
            })
        
        # Convert to JSON
        return json.dumps({"logs": results}, indent=2)
    
    @staticmethod
    def export_diagnostic_logs_csv(
        db: Session,
        patient_id: Optional[str] = None,
        provider_id: Optional[str] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
    ) -> io.StringIO:
        """
        Export diagnostic logs to CSV format
        
        Args:
            db: Database session
            patient_id: Filter by patient ID
            provider_id: Filter by provider ID
            from_date: Filter by start date
            to_date: Filter by end date
            
        Returns:
            StringIO object containing CSV data
        """
        # Get diagnostic logs using the service
        logs = AuditService.get_diagnostic_logs(
            db=db,
            patient_id=patient_id,
            provider_id=provider_id,
            from_date=from_date,
            to_date=to_date,
            limit=10000,  # Large limit for export
            offset=0
        )
        
        # Prepare CSV output
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            "ID", "Timestamp", "Patient ID", "Provider ID", "Image Type",
            "Analysis ID", "AI Model Version", "Confidence Score",
            "Processing Time (ms)", "Findings Count", "Status", "Request ID"
        ])
        
        # Write data rows
        for log in logs:
            writer.writerow([
                log.id,
                log.timestamp.isoformat(),
                log.patient_id,
                log.provider_id or "",
                log.image_type,
                log.analysis_id,
                log.ai_model_version or "",
                log.confidence_score or "",
                log.processing_time_ms or "",
                log.findings_count or "",
                log.status,
                log.request_id or ""
            ])
        
        # Reset pointer to start of stream
        output.seek(0)
        return output 