from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta

from ..database import get_db
from ..models.ai_feedback import (
    AIFeedback, 
    AIModelMetrics, 
    AITrainingJob,
    AIFeedbackCreate, 
    AIFeedbackResponse,
    AIModelMetricsResponse,
    AITrainingJobCreate,
    AITrainingJobResponse,
    AITrainingJobUpdate
)
from ..models.image_diagnosis import ImageDiagnosis
from ..auth.dependencies import get_current_user, get_current_admin_user

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Feedback"]
)

# ----- Feedback Endpoints -----

@router.post("/feedback", response_model=AIFeedbackResponse)
async def create_feedback(
    feedback: AIFeedbackCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Submit feedback on an AI finding"""
    # Create new feedback record
    db_feedback = AIFeedback(
        id=uuid.uuid4(),
        finding_id=feedback.finding_id,
        provider_id=feedback.provider_id,
        patient_id=feedback.patient_id,
        is_correct=feedback.is_correct,
        correction_type=feedback.correction_type,
        correction_details=feedback.correction_details,
        priority=feedback.priority,
        model_version=feedback.model_version,
        clinic_id=feedback.clinic_id or current_user.get("clinic_id")
    )
    
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    
    # Automatically trigger retraining if high priority feedback threshold is reached
    high_priority_count = db.query(AIFeedback).filter(
        AIFeedback.priority == "high",
        AIFeedback.created_at > datetime.now() - timedelta(days=7)
    ).count()
    
    if high_priority_count >= 10:
        # Create a training job
        latest_model = db.query(AIModelMetrics).order_by(AIModelMetrics.last_trained.desc()).first()
        model_version = f"{latest_model.model_version.split('.')[0]}.{latest_model.model_version.split('.')[1]}.{int(latest_model.model_version.split('.')[2]) + 1}" if latest_model else "1.0.0"
        
        training_job = AITrainingJob(
            id=uuid.uuid4(),
            model_version=model_version,
            status="queued",
            triggered_by=current_user.get("username", "system"),
            feedback_count=high_priority_count,
            clinic_id=current_user.get("clinic_id")
        )
        
        db.add(training_job)
        db.commit()
    
    return db_feedback

@router.get("/feedback", response_model=List[AIFeedbackResponse])
async def get_feedback(
    patientId: Optional[str] = None,
    providerId: Optional[str] = None,
    findingId: Optional[str] = None,
    clinic_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get feedback items with optional filtering"""
    query = db.query(AIFeedback)
    
    if patientId:
        query = query.filter(AIFeedback.patient_id == patientId)
    
    if providerId:
        query = query.filter(AIFeedback.provider_id == providerId)
    
    if findingId:
        query = query.filter(AIFeedback.finding_id == findingId)
    
    # Default to user's clinic if no clinic_id provided
    clinic_id = clinic_id or current_user.get("clinic_id")
    if clinic_id:
        query = query.filter(AIFeedback.clinic_id == clinic_id)
    
    # Sort by most recent first
    query = query.order_by(AIFeedback.created_at.desc())
    
    feedback_items = query.offset(skip).limit(limit).all()
    return feedback_items

# ----- AI Findings Endpoints -----

@router.get("/diagnosis/{patient_id}/findings", response_model=List[Dict[str, Any]])
async def get_ai_findings(
    patient_id: str,
    imageId: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get AI findings for a patient, optionally filtered by image"""
    query = db.query(ImageDiagnosis).filter(ImageDiagnosis.patient_id == patient_id)
    
    if imageId:
        query = query.filter(ImageDiagnosis.image_id == imageId)
    
    diagnoses = query.order_by(ImageDiagnosis.created_at.desc()).all()
    
    # Extract findings from diagnoses
    all_findings = []
    for diagnosis in diagnoses:
        findings = diagnosis.findings
        if isinstance(findings, dict) and "findings" in findings:
            # Add metadata to each finding
            for finding in findings["findings"]:
                finding["id"] = finding.get("id", str(uuid.uuid4()))
                finding["created_at"] = diagnosis.created_at.isoformat()
                finding["model_version"] = findings.get("model_version", "1.0.0")
                all_findings.append(finding)
    
    return all_findings

# ----- Model Metrics Endpoints -----

@router.get("/metrics", response_model=AIModelMetricsResponse)
async def get_model_metrics(
    model_version: Optional[str] = None,
    model_type: Optional[str] = None,
    clinicId: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get AI model performance metrics"""
    query = db.query(AIModelMetrics)
    
    if model_version:
        query = query.filter(AIModelMetrics.model_version == model_version)
    
    if model_type:
        query = query.filter(AIModelMetrics.model_type == model_type)
    
    # Default to global model metrics or clinic-specific if available
    clinic_id = clinicId or current_user.get("clinic_id")
    if clinic_id:
        # Try to get clinic-specific metrics first
        clinic_metrics = query.filter(AIModelMetrics.clinic_id == clinic_id).order_by(AIModelMetrics.last_trained.desc()).first()
        if clinic_metrics:
            return clinic_metrics
    
    # Fall back to latest global metrics
    metrics = query.filter(AIModelMetrics.clinic_id.is_(None)).order_by(AIModelMetrics.last_trained.desc()).first()
    
    if not metrics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="No metrics found for the specified criteria"
        )
    
    return metrics

# ----- Training Job Endpoints -----

@router.post("/training", response_model=AITrainingJobResponse)
async def create_training_job(
    job: AITrainingJobCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)  # Only admins can manually trigger training
):
    """Create a new AI model training job"""
    # Check if there's already a job in progress
    active_job = db.query(AITrainingJob).filter(
        AITrainingJob.status.in_(["queued", "in_progress"])
    ).first()
    
    if active_job:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A training job is already {active_job.status}"
        )
    
    # Get feedback count to include in the job
    feedback_query = db.query(AIFeedback)
    if job.clinic_id:
        feedback_query = feedback_query.filter(AIFeedback.clinic_id == job.clinic_id)
    
    feedback_count = feedback_query.count()
    
    # Create the training job
    db_job = AITrainingJob(
        id=uuid.uuid4(),
        model_version=job.model_version,
        status="queued",
        triggered_by=job.triggered_by or current_user.get("username"),
        feedback_count=feedback_count,
        parameters=job.parameters,
        clinic_id=job.clinic_id
    )
    
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    
    # TODO: In a production environment, this would trigger an async worker
    # to perform the actual training
    
    return db_job

@router.get("/training", response_model=List[AITrainingJobResponse])
async def get_training_jobs(
    status: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get AI model training jobs"""
    query = db.query(AITrainingJob)
    
    if status:
        query = query.filter(AITrainingJob.status == status)
    
    # Filter by clinic id if user is not an admin
    if not current_user.get("is_admin", False):
        clinic_id = current_user.get("clinic_id")
        if clinic_id:
            query = query.filter(AITrainingJob.clinic_id == clinic_id)
    
    # Sort by most recent first
    query = query.order_by(AITrainingJob.created_at.desc())
    
    jobs = query.offset(skip).limit(limit).all()
    return jobs

@router.put("/training/{job_id}", response_model=AITrainingJobResponse)
async def update_training_job_status(
    job_id: str,
    job_update: AITrainingJobUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)  # Only admins can update training jobs
):
    """Update the status of a training job (admin only)"""
    job = db.query(AITrainingJob).filter(AITrainingJob.id == job_id).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training job not found"
        )
    
    # Update the job
    job.status = job_update.status
    
    if job_update.completed_at:
        job.completed_at = job_update.completed_at
    
    if job_update.error_message:
        job.error_message = job_update.error_message
    
    if job_update.metrics_id:
        job.metrics_id = job_update.metrics_id
    
    # If status is changing to in_progress, set started_at
    if job.status == "in_progress" and not job.started_at:
        job.started_at = datetime.now()
    
    # If status is changing to completed or failed, set completed_at
    if job.status in ["completed", "failed"] and not job.completed_at:
        job.completed_at = datetime.now()
    
    db.commit()
    db.refresh(job)
    
    return job

# ----- Analytics Endpoints -----

@router.get("/analytics/feedback")
async def get_feedback_analytics(
    period: str = Query("month", regex="^(week|month|quarter|year)$"),
    clinic_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get analytics on feedback collection"""
    # Determine date range based on period
    now = datetime.now()
    if period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    elif period == "quarter":
        start_date = now - timedelta(days=90)
    else:  # year
        start_date = now - timedelta(days=365)
    
    # Base query for all feedback in the period
    query = db.query(AIFeedback).filter(AIFeedback.created_at >= start_date)
    
    # Filter by clinic id
    clinic_id = clinic_id or current_user.get("clinic_id")
    if clinic_id:
        query = query.filter(AIFeedback.clinic_id == clinic_id)
    
    # Count total feedback
    total_count = query.count()
    
    # Count by correctness
    correct_count = query.filter(AIFeedback.is_correct == True).count()
    incorrect_count = query.filter(AIFeedback.is_correct == False).count()
    
    # Count by priority
    low_priority = query.filter(AIFeedback.priority == "low").count()
    medium_priority = query.filter(AIFeedback.priority == "medium").count()
    high_priority = query.filter(AIFeedback.priority == "high").count()
    
    # Count by correction type (for incorrect feedback)
    correction_types = {}
    if incorrect_count > 0:
        for correction_type in ["false_positive", "wrong_location", "wrong_classification", "wrong_severity", "other"]:
            count = query.filter(
                AIFeedback.is_correct == False,
                AIFeedback.correction_type == correction_type
            ).count()
            correction_types[correction_type] = count
    
    return {
        "period": period,
        "start_date": start_date.isoformat(),
        "end_date": now.isoformat(),
        "total_feedback": total_count,
        "correct_count": correct_count,
        "incorrect_count": incorrect_count,
        "by_priority": {
            "low": low_priority,
            "medium": medium_priority,
            "high": high_priority
        },
        "by_correction_type": correction_types
    } 