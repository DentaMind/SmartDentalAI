"""
Router for AI diagnostics metrics and management
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Path, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import logging

from ..database import get_db
from ..auth.auth_handler import get_current_user, get_current_admin_user
from ..services.ai_diagnostics_metrics_service import AIDiagnosticsMetricsService
from ..services.ai_training_service import get_ai_training_service, AITrainingService
from ..models.user import User

router = APIRouter(
    prefix="/api/ai/diagnostics",
    tags=["ai-diagnostics"],
    responses={404: {"description": "Not found"}},
)

# Configure logging
logger = logging.getLogger(__name__)

# Metrics Endpoints

@router.post("/metrics", response_model=Dict[str, Any])
async def submit_diagnostic_metrics(
    request: Dict[str, Any],
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit AI diagnostic metrics
    
    This endpoint accepts metrics from AI diagnostic operations and processes
    them asynchronously.
    """
    try:
        service = AIDiagnosticsMetricsService(db)
        
        # Extract request data
        model_name = request.get("model_name")
        model_version = request.get("model_version")
        request_id = request.get("request_id")
        metrics = request.get("metrics", {})
        patient_id = request.get("patient_id")
        location_info = request.get("location_info")
        
        # Validate required fields
        if not model_name or not model_version or not request_id:
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Process metrics in background task
        background_tasks.add_task(
            service.process_diagnostic_metrics,
            model_name=model_name,
            model_version=model_version,
            request_id=request_id,
            metrics=metrics,
            user_id=str(current_user.id) if current_user else None,
            patient_id=patient_id,
            location_info=location_info
        )
        
        return {
            "success": True,
            "message": "Metrics submission accepted",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error submitting diagnostic metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics/summary", response_model=Dict[str, Any])
async def get_metrics_summary(
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Get summary of AI diagnostic metrics
    
    This endpoint provides a summary of AI diagnostic metrics, including
    model performance, confidence scores, and error rates.
    """
    try:
        service = AIDiagnosticsMetricsService(db)
        
        # Parse date parameters
        start_datetime = None
        end_datetime = None
        
        if start_time:
            start_datetime = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        
        if end_time:
            end_datetime = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
        
        # Get metrics summary
        summary = await service.get_model_metrics_summary(
            start_time=start_datetime,
            end_time=end_datetime
        )
        
        return summary
    except Exception as e:
        logger.error(f"Error getting metrics summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics/geographic", response_model=List[Dict[str, Any]])
async def get_geographic_metrics(
    model_name: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Get geographic analysis of AI diagnostic metrics
    
    This endpoint provides metrics broken down by geographic region.
    """
    try:
        service = AIDiagnosticsMetricsService(db)
        
        # Parse date parameters
        start_datetime = None
        end_datetime = None
        
        if start_time:
            start_datetime = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        
        if end_time:
            end_datetime = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
        
        # Get geographic analysis
        analysis = await service.get_geographic_analysis(
            model_name=model_name,
            start_time=start_datetime,
            end_time=end_datetime
        )
        
        return analysis
    except Exception as e:
        logger.error(f"Error getting geographic metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics/anomalies", response_model=Dict[str, Any])
async def get_anomalies_summary(
    model_name: Optional[str] = None,
    days: int = 1,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Get summary of anomalies in AI diagnostic metrics
    
    This endpoint provides a summary of detected anomalies in AI diagnostic
    metrics, including counts by severity and metric type.
    """
    try:
        service = AIDiagnosticsMetricsService(db)
        
        # Get anomalies summary
        anomalies = await service.get_anomalies_summary(
            model_name=model_name,
            days=days
        )
        
        return anomalies
    except Exception as e:
        logger.error(f"Error getting anomalies summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics/correlations", response_model=Dict[str, Any])
async def get_clinical_correlations(
    model_name: Optional[str] = None,
    diagnostic_type: Optional[str] = None,
    correlation_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Get clinical correlations for AI diagnostic metrics
    
    This endpoint provides correlations between AI diagnostic metrics and
    clinical outcomes.
    """
    try:
        service = AIDiagnosticsMetricsService(db)
        
        # Get clinical correlations
        correlations = await service.get_clinical_correlations(
            model_name=model_name,
            diagnostic_type=diagnostic_type,
            correlation_type=correlation_type
        )
        
        return correlations
    except Exception as e:
        logger.error(f"Error getting clinical correlations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Feedback Endpoints

@router.post("/feedback", response_model=Dict[str, Any])
async def submit_feedback(
    feedback: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit feedback on a diagnostic finding
    
    This endpoint allows clinicians to provide feedback on AI diagnostic
    findings, which can be used to improve model performance.
    """
    try:
        # Extract required fields
        finding_id = feedback.get("finding_id")
        provider_id = feedback.get("provider_id", str(current_user.id) if current_user else None)
        patient_id = feedback.get("patient_id")
        is_correct = feedback.get("is_correct")
        
        # Validate required fields
        if not finding_id or provider_id is None or not patient_id or is_correct is None:
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Get optional fields
        correction_type = feedback.get("correction_type")
        correction_details = feedback.get("correction_details")
        priority = feedback.get("priority", "medium")
        model_version = feedback.get("model_version")
        
        # Store feedback in database using the repository
        from ..models.ai_feedback import AIFeedback
        import uuid
        
        feedback_record = AIFeedback(
            id=uuid.uuid4(),
            finding_id=finding_id,
            provider_id=provider_id,
            patient_id=patient_id,
            is_correct=is_correct,
            correction_type=correction_type,
            correction_details=correction_details,
            priority=priority,
            model_version=model_version
        )
        
        db.add(feedback_record)
        db.commit()
        db.refresh(feedback_record)
        
        return {
            "success": True,
            "feedback_id": str(feedback_record.id),
            "message": "Feedback submitted successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/feedback/analytics", response_model=Dict[str, Any])
async def get_feedback_analytics(
    period: str = "month",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Get analytics on feedback collection
    
    This endpoint provides analytics on collected feedback, including counts
    by type and trends over time.
    """
    try:
        service = get_ai_training_service(db)
        
        # Get feedback analytics
        analytics = service.get_feedback_analytics(period=period)
        
        return analytics
    except Exception as e:
        logger.error(f"Error getting feedback analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Model Training Endpoints

@router.post("/training/trigger", response_model=Dict[str, Any])
async def trigger_model_training(
    request: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Trigger AI model training
    
    This endpoint triggers training of an AI diagnostic model with collected
    feedback data.
    """
    try:
        service = get_ai_training_service(db)
        
        # Extract request data
        model_name = request.get("model_name")
        model_version = request.get("model_version")
        triggered_by = request.get("triggered_by", str(current_user.id) if current_user else None)
        reason = request.get("reason")
        parameters = request.get("parameters")
        
        # Validate required fields
        if not model_name or not model_version:
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Trigger model training
        result = await service.trigger_model_training(
            model_name=model_name,
            model_version=model_version,
            triggered_by=triggered_by,
            reason=reason,
            parameters=parameters
        )
        
        return result
    except Exception as e:
        logger.error(f"Error triggering model training: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/training/status", response_model=Dict[str, Any])
async def get_training_status(
    model_name: str,
    model_version: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Get AI model training status
    
    This endpoint provides information about the training status of an AI
    diagnostic model, including active jobs and retraining recommendations.
    """
    try:
        service = get_ai_training_service(db)
        
        # Get training status
        status = await service.get_training_status(
            model_name=model_name,
            model_version=model_version
        )
        
        return status
    except Exception as e:
        logger.error(f"Error getting training status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models", response_model=Dict[str, Any])
async def get_diagnostic_models(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get available AI diagnostic models
    
    This endpoint provides a list of available AI diagnostic models
    and their versions.
    """
    try:
        # Query for unique model names and versions seen in metrics
        from sqlalchemy import distinct
        from ..models.ai_diagnostics_metrics import AIDiagnosticMetric
        
        query = db.query(
            AIDiagnosticMetric.model_name,
            AIDiagnosticMetric.model_version,
            AIDiagnosticMetric.timestamp
        ).distinct()
        
        models = {}
        for model_name, model_version, timestamp in query:
            if model_name not in models:
                models[model_name] = []
            models[model_name].append({
                "version": model_version,
                "last_seen": timestamp.isoformat()
            })
        
        # Format result
        result = {
            "models": [
                {
                    "model_name": model_name,
                    "model_version": versions[0]["version"],
                    "last_seen": versions[0]["last_seen"]
                }
                for model_name, versions in models.items()
            ],
            "count": len(models)
        }
        
        return result
    except Exception as e:
        logger.error(f"Error getting diagnostic models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 