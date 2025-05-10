"""
AI Diagnostics Metrics Router

This module provides API endpoints for AI diagnostics metrics and monitoring.
"""

import logging
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import time
import asyncio

from ..database import get_db
from ..services.ai_diagnostics_metrics_service import AIDiagnosticsMetricsService
from ..dependencies.auth import get_current_user, get_current_admin_user

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/ai/diagnostics", tags=["ai-diagnostics"])

# Pydantic models for request/response validation
class DiagnosticMetricsRequest(BaseModel):
    """Request model for submitting diagnostic metrics"""
    model_name: str = Field(..., description="Name of the AI model")
    model_version: str = Field(..., description="Version of the AI model")
    request_id: str = Field(..., description="Unique request identifier")
    metrics: Dict[str, Any] = Field(..., description="Diagnostic metrics data")
    patient_id: Optional[str] = Field(None, description="Optional patient ID")
    location_info: Optional[Dict[str, Any]] = Field(None, description="Optional geographic information")

class DiagnosticMetricsResponse(BaseModel):
    """Response model for diagnostic metrics submission"""
    success: bool = Field(..., description="Success status")
    message: str = Field(..., description="Status message")
    timestamp: str = Field(..., description="Processing timestamp")

class CorrelationSubmissionRequest(BaseModel):
    """Request model for submitting clinical correlations"""
    model_name: str = Field(..., description="Name of the AI model")
    model_version: str = Field(..., description="Version of the AI model")
    diagnostic_type: str = Field(..., description="Type of diagnosis")
    correlation_type: str = Field(..., description="Type of correlation (accuracy, treatment_change, etc.)")
    correlation_value: float = Field(..., description="Correlation value (-1 to 1)")
    sample_size: int = Field(..., description="Number of samples in the correlation study")
    p_value: Optional[float] = Field(None, description="Statistical p-value (if applicable)")
    confidence_interval: Optional[str] = Field(None, description="Confidence interval (if applicable)")
    study_period_start: Optional[datetime] = Field(None, description="Start of study period")
    study_period_end: Optional[datetime] = Field(None, description="End of study period")
    description: Optional[str] = Field(None, description="Description of the correlation")
    correlation_data: Optional[Dict[str, Any]] = Field(None, description="Additional correlation data")

# Endpoints for submitting metrics
@router.post("/metrics", response_model=DiagnosticMetricsResponse)
async def submit_diagnostic_metrics(
    request: DiagnosticMetricsRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Submit AI diagnostic metrics

    This endpoint receives metrics from AI diagnostic operations and
    processes them for monitoring and analysis.
    """
    metrics_service = AIDiagnosticsMetricsService(db)
    
    success = await metrics_service.process_diagnostic_metrics(
        model_name=request.model_name,
        model_version=request.model_version,
        request_id=request.request_id,
        metrics=request.metrics,
        user_id=current_user.id if current_user else None,
        patient_id=request.patient_id,
        location_info=request.location_info
    )
    
    if success:
        return DiagnosticMetricsResponse(
            success=True,
            message="Metrics processed successfully",
            timestamp=datetime.utcnow().isoformat()
        )
    else:
        raise HTTPException(
            status_code=500,
            detail="Failed to process diagnostic metrics"
        )

@router.post("/correlations", response_model=Dict[str, Any])
async def submit_clinical_correlation(
    request: CorrelationSubmissionRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """
    Submit clinical correlation data
    
    This endpoint allows admins to submit correlation data between AI diagnostic
    metrics and clinical outcomes.
    """
    # Authentication check is handled by get_current_admin_user dependency
    
    metrics_service = AIDiagnosticsMetricsService(db)
    
    # Use the repository through the service
    correlation = metrics_service.repository.store_clinical_correlation(
        model_name=request.model_name,
        model_version=request.model_version,
        diagnostic_type=request.diagnostic_type,
        correlation_type=request.correlation_type,
        correlation_value=request.correlation_value,
        sample_size=request.sample_size,
        p_value=request.p_value,
        confidence_interval=request.confidence_interval,
        study_period_start=request.study_period_start,
        study_period_end=request.study_period_end,
        description=request.description,
        correlation_data=request.correlation_data
    )
    
    return {
        "success": True,
        "message": "Clinical correlation stored successfully",
        "correlation_id": correlation.id,
        "timestamp": datetime.utcnow().isoformat()
    }

# Endpoints for retrieving analytics
@router.get("/metrics/summary")
async def get_metrics_summary(
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """
    Get a summary of AI diagnostic metrics
    
    Returns aggregated statistics about AI diagnostic metrics across all models.
    Restricted to admin users only.
    """
    metrics_service = AIDiagnosticsMetricsService(db)
    return await metrics_service.get_model_metrics_summary(start_time, end_time)

@router.get("/metrics/geographic")
async def get_geographic_metrics(
    model_name: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """
    Get geographic analysis of AI diagnostic metrics
    
    Returns metrics broken down by geographic region.
    Restricted to admin users only.
    """
    metrics_service = AIDiagnosticsMetricsService(db)
    return await metrics_service.get_geographic_analysis(model_name, start_time, end_time)

@router.get("/metrics/anomalies")
async def get_anomalies_summary(
    model_name: Optional[str] = None,
    days: int = Query(1, description="Number of days to include"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """
    Get a summary of anomalies in AI diagnostic metrics
    
    Returns information about detected anomalies in AI diagnostic performance.
    Restricted to admin users only.
    """
    metrics_service = AIDiagnosticsMetricsService(db)
    return await metrics_service.get_anomalies_summary(model_name, days)

@router.get("/metrics/correlations")
async def get_clinical_correlations(
    model_name: Optional[str] = None,
    diagnostic_type: Optional[str] = None,
    correlation_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """
    Get clinical correlations for AI diagnostic metrics
    
    Returns correlation data between AI diagnostic metrics and clinical outcomes.
    Restricted to admin users only.
    """
    metrics_service = AIDiagnosticsMetricsService(db)
    return await metrics_service.get_clinical_correlations(model_name, diagnostic_type, correlation_type)

@router.get("/models")
async def get_diagnostic_models(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """
    Get a list of available AI diagnostic models
    
    Returns information about all available AI diagnostic models.
    Restricted to admin users only.
    """
    metrics_service = AIDiagnosticsMetricsService(db)
    
    # Get all model aggregations to extract unique models
    aggregations = metrics_service.repository.get_aggregations(limit=1000)
    
    # Extract unique models
    models = {}
    for agg in aggregations:
        model_key = f"{agg.model_name}_{agg.model_version}"
        if model_key not in models:
            models[model_key] = {
                "model_name": agg.model_name,
                "model_version": agg.model_version,
                "last_seen": agg.timestamp.isoformat()
            }
    
    return {
        "models": list(models.values()),
        "count": len(models)
    } 