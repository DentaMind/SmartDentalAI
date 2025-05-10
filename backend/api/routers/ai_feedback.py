from fastapi import APIRouter, Depends, HTTPException, Query, status, Path, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from sqlalchemy.sql import func

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
    AITrainingJobUpdate,
    TreatmentFeedbackCreate,
    TreatmentFeedback,
    EvidenceFeedbackCreate,
    EvidenceFeedback,
    BulkEvidenceFeedback,
    BulkOperationResponse,
    FeedbackSummary,
    EvidenceFeedbackSummary
)
from ..models.image_diagnosis import ImageDiagnosis
from ..auth.dependencies import get_current_user, get_current_admin_user, verify_provider_role

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Feedback"],
    responses={404: {"description": "Not found"}}
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

@router.get("/analytics", response_model=Dict[str, Any])
async def get_feedback_analytics(
    period: str = Query("month", description="Time period filter (week, month, quarter, year)"),
    provider_id: Optional[str] = Query(None, description="Filter by provider ID"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get analytics data about treatment suggestion feedback
    
    This endpoint provides statistics and visualizations for AI treatment 
    feedback, including acceptance rates, trends, and breakdown by specialty.
    """
    # Verify provider role (minimum required)
    verify_provider_role(current_user)
    
    # Set the time filter based on period
    period_filters = {
        "week": datetime.utcnow() - timedelta(days=7),
        "month": datetime.utcnow() - timedelta(days=30),
        "quarter": datetime.utcnow() - timedelta(days=90),
        "year": datetime.utcnow() - timedelta(days=365)
    }
    time_filter = period_filters.get(period, period_filters["month"])
    
    # Start building the base query
    base_query = db.query(TreatmentFeedback).filter(
        TreatmentFeedback.created_at >= time_filter
    )
    
    # Add provider filter if specified
    if provider_id:
        base_query = base_query.filter(TreatmentFeedback.provider_id == provider_id)
    
    # Get total count
    total_count = base_query.count()
    
    # If no feedback, return empty analytics
    if total_count == 0:
        return {
            "total_count": 0,
            "accepted_count": 0,
            "rejected_count": 0,
            "modified_count": 0,
            "acceptance_rate": 0,
            "by_specialty": [],
            "trend_data": []
        }
    
    # Get counts by action
    accepted_count = base_query.filter(TreatmentFeedback.action == 'accepted').count()
    rejected_count = base_query.filter(TreatmentFeedback.action == 'rejected').count()
    modified_count = base_query.filter(TreatmentFeedback.action == 'modified').count()
    
    # Get feedback by specialty
    specialty_results = []
    
    # Import the AITreatmentSuggestion model
    from ..models.ai_treatment_suggestion import AITreatmentSuggestion
    
    # Get unique specialties
    specialty_query = db.query(AITreatmentSuggestion.specialty_area).distinct().all()
    specialties = [s.specialty_area for s in specialty_query if s.specialty_area]
    
    for specialty in specialties:
        # Join with suggestions table to get specialty
        specialty_query = db.query(TreatmentFeedback).join(
            AITreatmentSuggestion,
            TreatmentFeedback.treatment_suggestion_id == AITreatmentSuggestion.id
        ).filter(
            AITreatmentSuggestion.specialty_area == specialty,
            TreatmentFeedback.created_at >= time_filter
        )
        
        # Apply provider filter if specified
        if provider_id:
            specialty_query = specialty_query.filter(TreatmentFeedback.provider_id == provider_id)
        
        specialty_total = specialty_query.count()
        
        if specialty_total > 0:
            specialty_accepted = specialty_query.filter(TreatmentFeedback.action == 'accepted').count()
            
            specialty_results.append({
                "name": specialty,
                "total": specialty_total,
                "accepted": specialty_accepted,
                "acceptance_rate": round((specialty_accepted / specialty_total) * 100)
            })
    
    # Get trend data (daily counts for the time period)
    trend_data = []
    
    # Determine the number of data points based on the period
    data_points = {
        "week": 7,      # Daily for a week
        "month": 15,    # Every other day for a month
        "quarter": 12,  # Weekly for a quarter
        "year": 12      # Monthly for a year
    }
    
    interval_days = {
        "week": 1,
        "month": 2,
        "quarter": 7,
        "year": 30
    }
    
    # Get the number of days and interval
    num_points = data_points.get(period, 15)
    interval = interval_days.get(period, 2)
    
    # Generate trend data points
    for i in range(num_points, 0, -1):
        date_start = datetime.utcnow() - timedelta(days=i * interval)
        date_end = datetime.utcnow() - timedelta(days=(i-1) * interval)
        
        # Query feedback in this date range
        date_query = base_query.filter(
            TreatmentFeedback.created_at >= date_start,
            TreatmentFeedback.created_at < date_end
        )
        
        date_total = date_query.count()
        
        if date_total > 0:
            date_accepted = date_query.filter(TreatmentFeedback.action == 'accepted').count()
            date_rejected = date_query.filter(TreatmentFeedback.action == 'rejected').count()
            
            trend_data.append({
                "date": date_start.strftime("%Y-%m-%d"),
                "total": date_total,
                "accepted": date_accepted,
                "rejected": date_rejected,
                "acceptance_rate": round((date_accepted / date_total) * 100),
                "rejection_rate": round((date_rejected / date_total) * 100)
            })
        else:
            # Include zero counts to maintain continuity in the chart
            trend_data.append({
                "date": date_start.strftime("%Y-%m-%d"),
                "total": 0,
                "accepted": 0,
                "rejected": 0,
                "acceptance_rate": 0,
                "rejection_rate": 0
            })
    
    return {
        "total_count": total_count,
        "accepted_count": accepted_count,
        "rejected_count": rejected_count,
        "modified_count": modified_count,
        "acceptance_rate": round((accepted_count / total_count) * 100) if total_count > 0 else 0,
        "by_specialty": specialty_results,
        "trend_data": trend_data
    }

@router.get("/evidence-analytics", response_model=Dict[str, Any])
async def get_evidence_feedback_analytics(
    period: str = Query("month", description="Time period filter (week, month, quarter, year)"),
    provider_id: Optional[str] = Query(None, description="Filter by provider ID"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get analytics data about evidence feedback
    
    This endpoint provides statistics and visualizations for evidence
    feedback, including quality ratings, evidence types, and most used sources.
    """
    # Verify provider role (minimum required)
    verify_provider_role(current_user)
    
    # Set the time filter based on period
    period_filters = {
        "week": datetime.utcnow() - timedelta(days=7),
        "month": datetime.utcnow() - timedelta(days=30),
        "quarter": datetime.utcnow() - timedelta(days=90),
        "year": datetime.utcnow() - timedelta(days=365)
    }
    time_filter = period_filters.get(period, period_filters["month"])
    
    # Start building the base query
    base_query = db.query(EvidenceFeedback).filter(
        EvidenceFeedback.created_at >= time_filter
    )
    
    # Add provider filter if specified
    if provider_id:
        base_query = base_query.filter(EvidenceFeedback.provider_id == provider_id)
    
    # Get total count
    total_count = base_query.count()
    
    # If no feedback, return empty analytics
    if total_count == 0:
        return {
            "total_count": 0,
            "avg_accuracy": 0,
            "avg_relevance": 0,
            "avg_evidence_quality": 0,
            "evidence_grades": {},
            "evidence_types": [],
            "top_evidence_sources": []
        }
    
    # Get average scores
    avg_accuracy = db.query(func.avg(EvidenceFeedback.accuracy)).filter(
        EvidenceFeedback.created_at >= time_filter
    )
    if provider_id:
        avg_accuracy = avg_accuracy.filter(EvidenceFeedback.provider_id == provider_id)
    avg_accuracy = avg_accuracy.scalar() or 0
    
    avg_relevance = db.query(func.avg(EvidenceFeedback.relevance_score)).filter(
        EvidenceFeedback.created_at >= time_filter
    )
    if provider_id:
        avg_relevance = avg_relevance.filter(EvidenceFeedback.provider_id == provider_id)
    avg_relevance = avg_relevance.scalar() or 0
    
    # Combined quality score (weighted average of accuracy and relevance)
    avg_evidence_quality = (avg_accuracy * 0.7) + (avg_relevance * 0.3 * 5)  # Scale relevance to 1-5
    
    # Import clinical evidence model
    from ..models.clinical_evidence import ClinicalEvidence
    
    # Get evidence grade distribution
    evidence_grades = {}
    grade_query = db.query(
        ClinicalEvidence.evidence_grade,
        func.count(EvidenceFeedback.id).label('count')
    ).join(
        EvidenceFeedback,
        EvidenceFeedback.evidence_id == ClinicalEvidence.id
    ).filter(
        EvidenceFeedback.created_at >= time_filter
    )
    
    if provider_id:
        grade_query = grade_query.filter(EvidenceFeedback.provider_id == provider_id)
    
    grade_query = grade_query.group_by(ClinicalEvidence.evidence_grade).all()
    
    for grade in grade_query:
        evidence_grades[grade.evidence_grade] = grade.count
    
    # Determine the top evidence grade by count
    top_evidence_grade = None
    max_count = 0
    for grade, count in evidence_grades.items():
        if count > max_count:
            max_count = count
            top_evidence_grade = grade
    
    # Get evidence type statistics
    evidence_types = []
    type_query = db.query(
        ClinicalEvidence.evidence_type,
        func.avg(EvidenceFeedback.accuracy).label('accuracy'),
        func.avg(EvidenceFeedback.relevance_score).label('relevance'),
        func.count(EvidenceFeedback.id).label('count')
    ).join(
        EvidenceFeedback,
        EvidenceFeedback.evidence_id == ClinicalEvidence.id
    ).filter(
        EvidenceFeedback.created_at >= time_filter
    )
    
    if provider_id:
        type_query = type_query.filter(EvidenceFeedback.provider_id == provider_id)
    
    type_query = type_query.group_by(ClinicalEvidence.evidence_type).all()
    
    for evidence_type in type_query:
        evidence_types.append({
            "name": evidence_type.evidence_type,
            "accuracy": float(evidence_type.accuracy) if evidence_type.accuracy else 0,
            "relevance": float(evidence_type.relevance) if evidence_type.relevance else 0,
            "count": evidence_type.count
        })
    
    # Get top evidence sources by usage
    top_sources_query = db.query(
        ClinicalEvidence.id,
        ClinicalEvidence.title,
        ClinicalEvidence.publication,
        ClinicalEvidence.evidence_grade,
        func.count(EvidenceFeedback.id).label('usage_count')
    ).join(
        EvidenceFeedback,
        EvidenceFeedback.evidence_id == ClinicalEvidence.id
    ).filter(
        EvidenceFeedback.created_at >= time_filter
    )
    
    if provider_id:
        top_sources_query = top_sources_query.filter(EvidenceFeedback.provider_id == provider_id)
    
    top_sources = top_sources_query.group_by(
        ClinicalEvidence.id,
        ClinicalEvidence.title,
        ClinicalEvidence.publication,
        ClinicalEvidence.evidence_grade
    ).order_by(
        func.count(EvidenceFeedback.id).desc()
    ).limit(10).all()
    
    top_evidence_sources = []
    for source in top_sources:
        top_evidence_sources.append({
            "id": str(source.id),
            "title": source.title,
            "publication": source.publication,
            "evidence_grade": source.evidence_grade,
            "usage_count": source.usage_count
        })
    
    # Add heatmap data combining evidence types with treatment categories
    # Import the AITreatmentSuggestion model
    from ..models.ai_treatment_suggestion import AITreatmentSuggestion
    
    # Get treatment categories
    categories_query = db.query(AITreatmentSuggestion.procedure_type).distinct().filter(
        AITreatmentSuggestion.procedure_type.isnot(None)
    ).order_by(AITreatmentSuggestion.procedure_type).all()
    
    categories = [c.procedure_type for c in categories_query]
    
    # Get evidence types
    evidence_types_list = [e.name for e in type_query]
    
    # Generate heatmap data
    heatmap_data = []
    
    for evidence_type in evidence_types_list:
        for category in categories:
            # Get the evidence for this type and category
            score_query = db.query(
                func.avg(EvidenceFeedback.accuracy).label('avg_accuracy')
            ).join(
                ClinicalEvidence,
                EvidenceFeedback.evidence_id == ClinicalEvidence.id
            ).join(
                AITreatmentSuggestion,
                EvidenceFeedback.treatment_suggestion_id == AITreatmentSuggestion.id
            ).filter(
                ClinicalEvidence.evidence_type == evidence_type,
                AITreatmentSuggestion.procedure_type == category,
                EvidenceFeedback.created_at >= time_filter
            )
            
            if provider_id:
                score_query = score_query.filter(EvidenceFeedback.provider_id == provider_id)
            
            avg_score = score_query.scalar()
            
            if avg_score:
                heatmap_data.append({
                    "evidence_type": evidence_type,
                    "category": category,
                    "score": float(avg_score)
                })
    
    # Create the heatmap structure
    evidence_heatmap = {
        "categories": categories,
        "evidence_types": evidence_types_list,
        "data": heatmap_data
    }
    
    return {
        "total_count": total_count,
        "avg_accuracy": float(avg_accuracy),
        "avg_relevance": float(avg_relevance),
        "avg_evidence_quality": float(avg_evidence_quality),
        "top_evidence_grade": top_evidence_grade,
        "evidence_grades": evidence_grades,
        "evidence_types": evidence_types,
        "top_evidence_sources": top_evidence_sources,
        "evidence_heatmap": evidence_heatmap
    }

@router.get("/treatment-patterns", response_model=Dict[str, Any])
async def get_treatment_patterns(
    period: str = Query("month", description="Time period filter (week, month, quarter, year)"),
    provider_id: Optional[str] = Query(None, description="Filter by provider ID"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get treatment pattern analysis data
    
    This endpoint provides analysis of treatment patterns, including
    distribution by type, top procedures, and correlation between
    confidence scores and acceptance rates.
    """
    # Verify provider role (minimum required)
    verify_provider_role(current_user)
    
    # Set the time filter based on period
    period_filters = {
        "week": datetime.utcnow() - timedelta(days=7),
        "month": datetime.utcnow() - timedelta(days=30),
        "quarter": datetime.utcnow() - timedelta(days=90),
        "year": datetime.utcnow() - timedelta(days=365)
    }
    time_filter = period_filters.get(period, period_filters["month"])
    
    # Import AI treatment suggestion model
    from ..models.ai_treatment_suggestion import AITreatmentSuggestion
    
    # Start building the base query for treatment feedback
    feedback_query = db.query(TreatmentFeedback).filter(
        TreatmentFeedback.created_at >= time_filter
    )
    
    # Add provider filter if specified
    if provider_id:
        feedback_query = feedback_query.filter(TreatmentFeedback.provider_id == provider_id)
    
    # Get total count of feedback
    total_feedback = feedback_query.count()
    
    # If no feedback, return empty patterns
    if total_feedback == 0:
        return {
            "total_count": 0,
            "by_procedure_type": {},
            "top_procedures": [],
            "confidence_vs_acceptance": []
        }
    
    # Get procedure type distribution
    procedure_types = {}
    
    # Join feedback with suggestions to get procedure types
    procedure_type_query = db.query(
        AITreatmentSuggestion.procedure_type,
        func.count(TreatmentFeedback.id).label('count')
    ).join(
        TreatmentFeedback,
        TreatmentFeedback.treatment_suggestion_id == AITreatmentSuggestion.id
    ).filter(
        TreatmentFeedback.created_at >= time_filter
    )
    
    if provider_id:
        procedure_type_query = procedure_type_query.filter(TreatmentFeedback.provider_id == provider_id)
    
    procedure_type_query = procedure_type_query.group_by(AITreatmentSuggestion.procedure_type).all()
    
    for proc_type in procedure_type_query:
        if proc_type.procedure_type:  # Avoid None values
            procedure_types[proc_type.procedure_type] = proc_type.count
    
    # Get top procedures
    top_procedures_query = db.query(
        AITreatmentSuggestion.procedure_name,
        AITreatmentSuggestion.procedure_code,
        func.count(TreatmentFeedback.id).label('count')
    ).join(
        TreatmentFeedback,
        TreatmentFeedback.treatment_suggestion_id == AITreatmentSuggestion.id
    ).filter(
        TreatmentFeedback.created_at >= time_filter
    )
    
    if provider_id:
        top_procedures_query = top_procedures_query.filter(TreatmentFeedback.provider_id == provider_id)
    
    top_procedures_query = top_procedures_query.group_by(
        AITreatmentSuggestion.procedure_name,
        AITreatmentSuggestion.procedure_code
    ).order_by(
        func.count(TreatmentFeedback.id).desc()
    ).limit(10).all()
    
    top_procedures = []
    for proc in top_procedures_query:
        name_with_code = f"{proc.procedure_name}"
        if proc.procedure_code:
            name_with_code += f" ({proc.procedure_code})"
            
        top_procedures.append({
            "name": name_with_code,
            "count": proc.count
        })
    
    # Get confidence vs. acceptance rate correlation
    confidence_ranges = [
        {"min": 0.0, "max": 0.2, "label": "0-20%"},
        {"min": 0.2, "max": 0.4, "label": "20-40%"},
        {"min": 0.4, "max": 0.6, "label": "40-60%"},
        {"min": 0.6, "max": 0.8, "label": "60-80%"},
        {"min": 0.8, "max": 1.0, "label": "80-100%"}
    ]
    
    confidence_vs_acceptance = []
    
    # For trendline calculation
    x_values = []  # Will store the midpoint of each confidence range (0.1, 0.3, 0.5, 0.7, 0.9)
    y_values = []  # Will store the acceptance rates
    
    for conf_range in confidence_ranges:
        # Get suggestions in this confidence range
        range_query = db.query(TreatmentFeedback).join(
            AITreatmentSuggestion,
            TreatmentFeedback.treatment_suggestion_id == AITreatmentSuggestion.id
        ).filter(
            TreatmentFeedback.created_at >= time_filter,
            AITreatmentSuggestion.confidence >= conf_range["min"],
            AITreatmentSuggestion.confidence < conf_range["max"]
        )
        
        if provider_id:
            range_query = range_query.filter(TreatmentFeedback.provider_id == provider_id)
        
        range_total = range_query.count()
        
        if range_total > 0:
            range_accepted = range_query.filter(TreatmentFeedback.action == 'accepted').count()
            acceptance_rate = round((range_accepted / range_total) * 100)
            
            # Store for trendline calculation
            midpoint = (conf_range["min"] + conf_range["max"]) / 2
            x_values.append(midpoint)
            y_values.append(acceptance_rate)
            
            confidence_vs_acceptance.append({
                "confidence_level": conf_range["label"],
                "total": range_total,
                "accepted": range_accepted,
                "acceptance_rate": acceptance_rate
            })
        else:
            confidence_vs_acceptance.append({
                "confidence_level": conf_range["label"],
                "total": 0,
                "accepted": 0,
                "acceptance_rate": 0
            })
    
    # Calculate trendline if we have enough data points
    if len(x_values) >= 2:
        try:
            import numpy as np
            from scipy import stats
            
            # Calculate linear regression
            slope, intercept, r_value, p_value, std_err = stats.linregress(x_values, y_values)
            
            # Add trendline values to each data point
            for i, item in enumerate(confidence_vs_acceptance):
                if item["total"] > 0:  # Only add trendline to points with data
                    midpoint = (confidence_ranges[i]["min"] + confidence_ranges[i]["max"]) / 2
                    trendline_value = slope * midpoint + intercept
                    item["trendline"] = round(trendline_value)
                else:
                    item["trendline"] = None
        except ImportError:
            # If scipy is not available, use a simpler approach for trendline
            if len(x_values) > 0:
                # Calculate average slope
                avg_x = sum(x_values) / len(x_values)
                avg_y = sum(y_values) / len(y_values)
                
                # Calculate slope and intercept
                numerator = sum((x - avg_x) * (y - avg_y) for x, y in zip(x_values, y_values))
                denominator = sum((x - avg_x) ** 2 for x in x_values)
                
                if denominator != 0:
                    slope = numerator / denominator
                    intercept = avg_y - slope * avg_x
                    
                    # Add trendline values to each data point
                    for i, item in enumerate(confidence_vs_acceptance):
                        if item["total"] > 0:  # Only add trendline to points with data
                            midpoint = (confidence_ranges[i]["min"] + confidence_ranges[i]["max"]) / 2
                            trendline_value = slope * midpoint + intercept
                            item["trendline"] = round(trendline_value)
                        else:
                            item["trendline"] = None
    
    return {
        "total_count": total_feedback,
        "by_procedure_type": procedure_types,
        "top_procedures": top_procedures,
        "confidence_vs_acceptance": confidence_vs_acceptance
    }

@router.post("/treatment", response_model=TreatmentFeedback)
async def record_treatment_feedback(
    feedback: TreatmentFeedbackCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> TreatmentFeedback:
    """
    Record feedback for an AI treatment suggestion
    
    This endpoint allows dental providers to submit feedback about
    a treatment suggestion, indicating whether they accepted, rejected,
    or modified the suggestion.
    """
    # Verify provider role
    verify_provider_role(current_user)
    
    # Create new feedback record
    new_feedback = TreatmentFeedback(**feedback.dict())
    
    # Add to database
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)
    
    return new_feedback

@router.post("/evidence", response_model=EvidenceFeedback)
async def record_evidence_feedback(
    feedback: EvidenceFeedbackCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> EvidenceFeedback:
    """
    Record feedback about clinical evidence
    
    This endpoint allows dental providers to submit feedback about
    the relevance and accuracy of clinical evidence associated with
    a treatment suggestion.
    """
    # Verify provider role
    verify_provider_role(current_user)
    
    # Create new feedback record
    new_feedback = EvidenceFeedback(**feedback.dict())
    
    # Add to database
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)
    
    return new_feedback

@router.post("/evidence/bulk", response_model=BulkOperationResponse)
async def record_bulk_evidence_feedback(
    data: BulkEvidenceFeedback = Body(...),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> BulkOperationResponse:
    """
    Record multiple evidence feedback entries at once
    
    This endpoint allows bulk submission of evidence feedback
    for improved performance when rating multiple evidence items.
    """
    # Verify provider role
    verify_provider_role(current_user)
    
    # Create and add all feedback records
    feedback_records = []
    for feedback_item in data.feedback:
        feedback_records.append(EvidenceFeedback(**feedback_item.dict()))
    
    # Add to database
    db.add_all(feedback_records)
    db.commit()
    
    for record in feedback_records:
        db.refresh(record)
    
    return BulkOperationResponse(
        count=len(feedback_records),
        success=True,
        message=f"Successfully recorded {len(feedback_records)} evidence feedback entries"
    )

@router.get("/diagnosis/{diagnosis_id}", response_model=FeedbackSummary)
async def get_feedback_summary_for_diagnosis(
    diagnosis_id: str = Path(..., description="ID of the diagnosis"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> FeedbackSummary:
    """
    Get a summary of feedback for a specific diagnosis
    
    This endpoint provides aggregate statistics about treatment
    feedback for a given diagnosis.
    """
    # Verify provider role
    verify_provider_role(current_user)
    
    # Count feedback records
    total_count = db.query(TreatmentFeedback).filter(
        TreatmentFeedback.diagnosis_id == diagnosis_id
    ).count()
    
    # If no feedback, return empty summary
    if total_count == 0:
        return FeedbackSummary(
            total_count=0,
            accepted_count=0,
            rejected_count=0,
            modified_count=0
        )
    
    # Count by action
    accepted_count = db.query(TreatmentFeedback).filter(
        TreatmentFeedback.diagnosis_id == diagnosis_id,
        TreatmentFeedback.action == 'accepted'
    ).count()
    
    rejected_count = db.query(TreatmentFeedback).filter(
        TreatmentFeedback.diagnosis_id == diagnosis_id,
        TreatmentFeedback.action == 'rejected'
    ).count()
    
    modified_count = db.query(TreatmentFeedback).filter(
        TreatmentFeedback.diagnosis_id == diagnosis_id,
        TreatmentFeedback.action == 'modified'
    ).count()
    
    # Calculate averages
    confidence_avg = db.query(func.avg(TreatmentFeedback.confidence)).filter(
        TreatmentFeedback.diagnosis_id == diagnosis_id,
        TreatmentFeedback.confidence.isnot(None)
    ).scalar()
    
    relevance_score_avg = db.query(func.avg(TreatmentFeedback.relevance_score)).filter(
        TreatmentFeedback.diagnosis_id == diagnosis_id,
        TreatmentFeedback.relevance_score.isnot(None)
    ).scalar()
    
    evidence_quality_rating_avg = db.query(func.avg(TreatmentFeedback.evidence_quality_rating)).filter(
        TreatmentFeedback.diagnosis_id == diagnosis_id,
        TreatmentFeedback.evidence_quality_rating.isnot(None)
    ).scalar()
    
    return FeedbackSummary(
        total_count=total_count,
        accepted_count=accepted_count,
        rejected_count=rejected_count,
        modified_count=modified_count,
        confidence_avg=confidence_avg,
        relevance_score_avg=relevance_score_avg,
        evidence_quality_rating_avg=evidence_quality_rating_avg
    )

@router.get("/evidence/{evidence_id}", response_model=EvidenceFeedbackSummary)
async def get_evidence_feedback_summary(
    evidence_id: str = Path(..., description="ID of the evidence"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> EvidenceFeedbackSummary:
    """
    Get a summary of all feedback for a specific evidence source
    
    This endpoint provides aggregate statistics about evidence
    feedback for a given evidence entry.
    """
    # Verify provider role
    verify_provider_role(current_user)
    
    # Count feedback records
    total_count = db.query(EvidenceFeedback).filter(
        EvidenceFeedback.evidence_id == evidence_id
    ).count()
    
    # If no feedback, return empty summary
    if total_count == 0:
        return EvidenceFeedbackSummary(
            total_count=0,
            relevance_score_avg=0.0,
            accuracy_avg=0.0,
            recent_comments=[]
        )
    
    # Calculate averages
    relevance_score_avg = db.query(func.avg(EvidenceFeedback.relevance_score)).filter(
        EvidenceFeedback.evidence_id == evidence_id
    ).scalar() or 0.0
    
    accuracy_avg = db.query(func.avg(EvidenceFeedback.accuracy)).filter(
        EvidenceFeedback.evidence_id == evidence_id
    ).scalar() or 0.0
    
    # Get recent comments
    recent_comments = []
    comments_query = db.query(EvidenceFeedback).filter(
        EvidenceFeedback.evidence_id == evidence_id,
        EvidenceFeedback.comment.isnot(None)
    ).order_by(EvidenceFeedback.created_at.desc()).limit(5)
    
    for comment in comments_query:
        recent_comments.append({
            "provider_id": comment.provider_id,
            "comment": comment.comment,
            "created_at": comment.created_at.isoformat() if comment.created_at else None
        })
    
    return EvidenceFeedbackSummary(
        total_count=total_count,
        relevance_score_avg=relevance_score_avg,
        accuracy_avg=accuracy_avg,
        recent_comments=recent_comments
    )

@router.get("/provider/{provider_id}", response_model=List[TreatmentFeedback])
async def get_provider_feedback_history(
    provider_id: str = Path(..., description="ID of the provider"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> List[TreatmentFeedback]:
    """
    Get treatment suggestion feedback history for a provider
    
    This endpoint retrieves a provider's feedback history,
    which can be used for analytics and training purposes.
    """
    # Verify provider role
    verify_provider_role(current_user)
    
    # Additional check that the current user can only see their own feedback
    # unless they have admin privileges
    if current_user.get("role") != "admin" and current_user.get("id") != provider_id:
        raise HTTPException(
            status_code=403,
            detail="You can only view your own feedback history"
        )
    
    # Get feedback history
    feedbacks = db.query(TreatmentFeedback).filter(
        TreatmentFeedback.provider_id == provider_id
    ).order_by(TreatmentFeedback.created_at.desc()).offset(offset).limit(limit).all()
    
    return feedbacks

@router.get("/providers-with-feedback", response_model=List[Dict[str, Any]])
async def get_providers_with_feedback(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Get providers who have submitted treatment or evidence feedback
    
    This endpoint retrieves a list of all providers who have submitted
    feedback, along with their feedback counts, which can be used for
    analytics filtering.
    """
    # Verify provider role (minimum required)
    verify_provider_role(current_user)
    
    # Get providers with treatment feedback counts
    treatment_counts = db.query(
        TreatmentFeedback.provider_id,
        func.count(TreatmentFeedback.id).label('treatment_count')
    ).group_by(
        TreatmentFeedback.provider_id
    ).all()
    
    # Get providers with evidence feedback counts
    evidence_counts = db.query(
        EvidenceFeedback.provider_id,
        func.count(EvidenceFeedback.id).label('evidence_count')
    ).group_by(
        EvidenceFeedback.provider_id
    ).all()
    
    # Convert to dictionaries for easier lookup
    treatment_count_dict = {str(x.provider_id): x.treatment_count for x in treatment_counts}
    evidence_count_dict = {str(x.provider_id): x.evidence_count for x in evidence_counts}
    
    # Get unique provider IDs from both feedback types
    provider_ids = set(treatment_count_dict.keys()) | set(evidence_count_dict.keys())
    
    # Get provider information for each ID
    from ..models.users import User  # Import here to avoid circular dependencies
    
    provider_data = []
    for provider_id in provider_ids:
        user = db.query(User).filter(User.id == provider_id).first()
        
        if user:
            provider_data.append({
                "id": str(user.id),
                "name": f"{user.first_name} {user.last_name}",
                "email": user.email,
                "specialty": getattr(user, 'specialty', None),
                "treatment_feedback_count": treatment_count_dict.get(provider_id, 0),
                "evidence_feedback_count": evidence_count_dict.get(provider_id, 0),
                "total_feedback_count": treatment_count_dict.get(provider_id, 0) + evidence_count_dict.get(provider_id, 0)
            })
    
    # Sort by total feedback count (descending)
    provider_data.sort(key=lambda x: x['total_feedback_count'], reverse=True)
    
    return provider_data 