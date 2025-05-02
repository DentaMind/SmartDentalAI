from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timedelta

from ..database import get_db
from ..services.diagnostic_feedback_service import DiagnosticFeedbackService
from ..models.diagnostic_feedback import (
    DiagnosticFindingResponse,
    DiagnosticFeedbackCreate,
    DiagnosticFeedbackResponse,
    ConversationMessageCreate,
    ConversationMessageResponse,
    AIResponseRequest,
    AIResponseData,
    DiagnosisStatus,
    FeedbackType,
    UserRole
)
from ..auth.dependencies import get_current_user, verify_user_role

router = APIRouter(
    prefix="/api/diagnostic-feedback",
    tags=["Diagnostic Feedback"]
)

# --- Patient Findings Endpoints ---

@router.get("/patients/{patient_id}/findings", response_model=List[DiagnosticFindingResponse])
async def get_patient_findings(
    patient_id: str = Path(..., description="The patient's ID"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all diagnostic findings for a patient"""
    service = DiagnosticFeedbackService(db)
    findings = await service.get_patient_findings(patient_id)
    return findings

@router.get("/findings/{finding_id}", response_model=DiagnosticFindingResponse)
async def get_finding(
    finding_id: str = Path(..., description="The finding's ID"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get a specific diagnostic finding"""
    service = DiagnosticFeedbackService(db)
    finding = await service.get_finding(finding_id)
    
    if not finding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Finding with ID {finding_id} not found"
        )
    
    return finding

# --- Feedback Endpoints ---

@router.post("/findings/{finding_id}/feedback", response_model=DiagnosticFindingResponse)
async def add_feedback(
    feedback: Dict[str, Any],
    finding_id: str = Path(..., description="The finding's ID"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Add provider feedback to a diagnostic finding"""
    # Add current user info if not provided
    if "provider_id" not in feedback:
        feedback["provider_id"] = current_user.get("id")
    if "provider_name" not in feedback:
        feedback["provider_name"] = current_user.get("name") or current_user.get("username")
    if "provider_role" not in feedback:
        feedback["provider_role"] = current_user.get("role", "dentist")
    
    service = DiagnosticFeedbackService(db)
    updated_finding = await service.add_feedback(finding_id, feedback)
    
    return updated_finding

@router.post("/findings/{finding_id}/correct", response_model=DiagnosticFindingResponse)
async def add_correction(
    correction_data: Dict[str, Any],
    finding_id: str = Path(..., description="The finding's ID"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Add a correction to a diagnostic finding"""
    # Add current user info if not provided
    if "provider_id" not in correction_data:
        correction_data["provider_id"] = current_user.get("id")
    if "provider_name" not in correction_data:
        correction_data["provider_name"] = current_user.get("name") or current_user.get("username")
    if "provider_role" not in correction_data:
        correction_data["provider_role"] = current_user.get("role", "dentist")
    
    service = DiagnosticFeedbackService(db)
    updated_finding = await service.add_correction(finding_id, correction_data)
    
    return updated_finding

@router.post("/findings/{finding_id}/ask", response_model=AIResponseData)
async def ask_ai(
    ai_request: AIResponseRequest,
    finding_id: str = Path(..., description="The finding's ID"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get a response from the AI about a finding"""
    service = DiagnosticFeedbackService(db)
    response = await service.get_ai_response(finding_id, ai_request.message)
    
    return AIResponseData(
        response=response,
        confidence=0.9,  # Placeholder
        references=None,
        alternatives=None
    )

# --- Owner-Only Review Endpoints ---

def verify_owner_access(current_user: Dict[str, Any]) -> Dict[str, Any]:
    """Verify the user is Dr. Abdin (the owner)"""
    username = current_user.get("username", "").lower()
    
    if username != "dr.abdin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires owner access. Only Dr. Abdin can perform this operation."
        )
    
    return current_user

@router.get("/owner/pending-reviews", response_model=List[Dict[str, Any]])
async def get_pending_owner_reviews(
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(verify_owner_access)
):
    """
    Get findings pending owner review (owner access only)
    
    This endpoint is restricted to Dr. Abdin only.
    """
    service = DiagnosticFeedbackService(db)
    pending_reviews = await service.get_pending_owner_reviews(limit, skip)
    
    return pending_reviews

@router.post("/owner/review/{finding_id}", response_model=Dict[str, Any])
async def submit_owner_review(
    finding_id: str,
    decision: str = Query(..., description="Decision: accept, reject, or escalate"),
    owner_note: str = Query("", description="Additional notes from the owner"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(verify_owner_access)
):
    """
    Submit owner's review decision on a finding (owner access only)
    
    This endpoint is restricted to Dr. Abdin only.
    
    - accept: Accept the provider's feedback/correction
    - reject: Reject the provider's feedback/correction (keep original AI diagnosis)
    - escalate: Mark for further review
    """
    if decision not in ["accept", "reject", "escalate"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision must be one of: accept, reject, escalate"
        )
    
    service = DiagnosticFeedbackService(db)
    updated_finding = await service.owner_review_decision(finding_id, decision, owner_note)
    
    return updated_finding

# --- DentaMind Owner Dashboard Endpoints ---

@router.get("/owner/dashboard/summary")
async def get_system_summary(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(verify_owner_access),
    time_period: str = Query("30d", description="Time period: 7d, 30d, 90d, 1y, all")
):
    """
    Get overall system summary for DentaMind owners and engineers
    
    This endpoint provides key performance indicators and system health metrics
    across all practices using DentaMind.
    """
    # Convert time period to days for filtering
    days_map = {"7d": 7, "30d": 30, "90d": 90, "1y": 365, "all": None}
    days = days_map.get(time_period)
    
    # In a real implementation, this would query the database
    # For demonstration, return mock data
    
    return {
        "system_health": {
            "status": "healthy",
            "uptime_percentage": 99.98,
            "api_response_time_ms": 127,
            "error_rate_percentage": 0.02,
            "active_users": 1245,
            "active_practices": 83
        },
        "ai_performance": {
            "overall_accuracy": 94.2,
            "confidence_threshold": 0.75,
            "false_positive_rate": 3.1,
            "false_negative_rate": 2.7,
            "total_diagnoses": 28750,
            "diagnoses_by_area": {
                "caries": 14230,
                "periapical": 5840,
                "periodontal": 4320,
                "tmj": 890,
                "orthodontic": 1120,
                "other": 2350
            }
        },
        "feedback_metrics": {
            "total_feedback_count": 4560,
            "accepted_percentage": 78.5,
            "corrected_percentage": 16.2,
            "rejected_percentage": 5.3,
            "average_confidence_score": 0.86,
            "top_correction_areas": [
                {"area": "periapical", "correction_rate": 23.4},
                {"area": "caries", "correction_rate": 15.7},
                {"area": "tmj", "correction_rate": 14.2}
            ]
        }
    }

@router.get("/owner/dashboard/ai-model-trends")
async def get_ai_model_trends(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(verify_owner_access)
):
    """
    Get AI model performance trends over time
    
    This endpoint provides detailed data about how the AI's performance has changed
    across versions and time periods.
    """
    # In a real implementation, this would query performance metrics by model version
    return {
        "versions": ["1.0.0", "1.1.0", "1.2.0", "1.3.0", "1.4.0"],
        "accuracy_trends": [91.2, 92.5, 93.0, 93.8, 94.2],
        "confidence_trends": [0.81, 0.82, 0.84, 0.85, 0.86],
        "correction_rate_trends": [18.6, 17.5, 16.9, 16.4, 16.2],
        "rejection_rate_trends": [8.8, 7.5, 6.8, 5.9, 5.3],
        "training_data_size": [10000, 15000, 22000, 28000, 35000],
        "improvement_areas": [
            {"version": "1.1.0", "area": "caries detection", "improvement": "+3.1%"},
            {"version": "1.2.0", "area": "periodontal assessment", "improvement": "+4.2%"},
            {"version": "1.3.0", "area": "periapical lesions", "improvement": "+5.3%"},
            {"version": "1.4.0", "area": "image quality adaptation", "improvement": "+2.7%"}
        ]
    }

@router.get("/owner/dashboard/practice-performance")
async def get_practice_performance(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(verify_owner_access),
    limit: int = Query(10, ge=1, le=100)
):
    """
    Get performance metrics broken down by dental practice
    
    This endpoint shows how different practices are utilizing and benefiting from DentaMind.
    """
    # In a real implementation, this would query practice-specific metrics
    return {
        "top_active_practices": [
            {"practice_id": "p1001", "name": "Smile Dental", "diagnoses_count": 1245, "accuracy": 95.2},
            {"practice_id": "p1002", "name": "Bright Smile Dentistry", "diagnoses_count": 1120, "accuracy": 94.7},
            {"practice_id": "p1003", "name": "Dental Excellence", "diagnoses_count": 980, "accuracy": 94.1},
            {"practice_id": "p1004", "name": "Family Dental Care", "diagnoses_count": 920, "accuracy": 93.8},
            {"practice_id": "p1005", "name": "Advanced Dental Associates", "diagnoses_count": 860, "accuracy": 93.5}
        ],
        "practices_by_volume": {
            "high_volume": {"count": 15, "avg_accuracy": 94.2, "avg_usage_hours": 28.5},
            "medium_volume": {"count": 32, "avg_accuracy": 93.1, "avg_usage_hours": 16.2},
            "low_volume": {"count": 36, "avg_accuracy": 92.4, "avg_usage_hours": 7.5}
        },
        "practice_growth": {
            "new_this_month": 4,
            "growth_rate": "+5.1%",
            "retention_rate": 97.8
        },
        "satisfaction_metrics": {
            "overall_nps": 72,
            "satisfaction_score": 4.7,
            "feature_usage": {
                "diagnostics": 92.4,
                "treatment_planning": 86.2,
                "patient_education": 79.1,
                "image_analysis": 94.5
            }
        }
    }

@router.get("/owner/dashboard/learning-opportunities")
async def get_learning_opportunities(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(verify_owner_access)
):
    """
    Get prioritized learning opportunities for AI improvement
    
    This endpoint highlights patterns in rejections and corrections that provide
    opportunities to improve the AI models.
    """
    # In a real implementation, this would analyze feedback patterns
    return {
        "high_priority_cases": [
            {"category": "Periapical abscess detection", "correction_rate": 24.3, "sample_count": 420},
            {"category": "Early caries distinction", "correction_rate": 18.7, "sample_count": 630},
            {"category": "Dental anomaly classification", "correction_rate": 17.2, "sample_count": 215}
        ],
        "common_correction_patterns": [
            {"from": "Periapical abscess", "to": "Periapical granuloma", "frequency": 84},
            {"from": "Moderate caries", "to": "Incipient caries", "frequency": 112},
            {"from": "Severe gingivitis", "to": "Early periodontitis", "frequency": 67}
        ],
        "training_recommendations": {
            "suggested_sample_size": 2500,
            "focus_areas": ["periapical lesions", "early caries detection", "periodontal assessment"],
            "expected_improvement": "+2.3% overall accuracy"
        },
        "provider_expertise_patterns": {
            "specialists_corrections": {
                "count": 420,
                "accuracy_impact": "high",
                "common_areas": ["endodontic assessment", "orthodontic analysis"]
            },
            "general_dentist_corrections": {
                "count": 1840,
                "accuracy_impact": "medium",
                "common_areas": ["caries detection", "restorative needs"]
            }
        }
    }

@router.get("/owner/dashboard/technical-metrics")
async def get_technical_metrics(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(verify_owner_access)
):
    """
    Get technical system performance metrics for engineering team
    
    This endpoint provides detailed technical metrics about system performance,
    resource utilization, and error rates.
    """
    # In a real implementation, this would collect system metrics from monitoring tools
    return {
        "system_load": {
            "current_cpu_usage": 42.3,
            "average_memory_usage": 68.7,
            "peak_requests_per_minute": 320,
            "average_response_time_ms": 127,
            "p95_response_time_ms": 248,
            "p99_response_time_ms": 412
        },
        "error_metrics": {
            "error_rate": 0.023,
            "most_common_errors": [
                {"type": "timeout", "count": 34, "percentage": 0.012},
                {"type": "validation", "count": 21, "percentage": 0.008},
                {"type": "auth", "count": 8, "percentage": 0.003}
            ],
            "error_trends": "decreasing"
        },
        "database_metrics": {
            "query_performance": {
                "average_query_time_ms": 18.2,
                "slow_queries_count": 12,
                "index_efficiency": "good"
            },
            "storage_usage": {
                "total_gb": 1240.5,
                "growth_rate_gb_per_month": 42.3,
                "images_storage_percentage": 87.2
            }
        },
        "model_inference": {
            "average_inference_time_ms": 215.3,
            "batch_processing_efficiency": 92.4,
            "gpu_utilization": 78.2,
            "model_loading_time_ms": 1876
        },
        "availability": {
            "uptime_percentage": 99.98,
            "scheduled_maintenance_hours": 4.5,
            "unplanned_downtime_minutes": 12
        }
    }

@router.get("/owner/dashboard/audit-log")
async def get_system_audit_log(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(verify_owner_access),
    days: int = Query(7, ge=1, le=90),
    limit: int = Query(50, ge=1, le=200)
):
    """
    Get system audit log of important actions
    
    This endpoint provides a record of significant system events, particularly
    owner review decisions and system configuration changes.
    """
    # In a real implementation, this would query an audit log table
    return {
        "audit_records": [
            {
                "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(),
                "action": "OWNER_REVIEW",
                "details": "Accepted correction for finding f-12345 (Periapical Abscess → Periapical Granuloma)",
                "user": "Dr.Abdin",
                "ip_address": "192.168.1.1"
            },
            {
                "timestamp": (datetime.now() - timedelta(hours=4)).isoformat(),
                "action": "OWNER_REVIEW",
                "details": "Rejected correction for finding f-12346 (Maintained original diagnosis of Moderate Caries)",
                "user": "Dr.Abdin",
                "ip_address": "192.168.1.1"
            },
            {
                "timestamp": (datetime.now() - timedelta(hours=6)).isoformat(),
                "action": "MODEL_UPDATE",
                "details": "Deployed AI model version 1.4.0 to production",
                "user": "system_engineer",
                "ip_address": "10.0.0.5"
            },
            {
                "timestamp": (datetime.now() - timedelta(hours=12)).isoformat(),
                "action": "CONFIGURATION_CHANGE",
                "details": "Updated confidence threshold from 0.72 to 0.75",
                "user": "Dr.Abdin",
                "ip_address": "192.168.1.1"
            },
            {
                "timestamp": (datetime.now() - timedelta(days=1)).isoformat(),
                "action": "OWNER_REVIEW",
                "details": "Escalated finding f-12347 for specialist review",
                "user": "Dr.Abdin",
                "ip_address": "192.168.1.1"
            }
        ],
        "action_summary": {
            "OWNER_REVIEW": 42,
            "CONFIGURATION_CHANGE": 5,
            "MODEL_UPDATE": 1,
            "USER_MANAGEMENT": 8,
            "SECURITY_EVENT": 0
        }
    }

# --- Analytics Endpoints ---

@router.get("/analytics/feedback-metrics")
async def get_feedback_metrics(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(verify_owner_access)
):
    """
    Get metrics on diagnostic feedback (owner access only)
    
    This endpoint is restricted to Dr. Abdin only.
    """
    # In a real implementation, this would calculate metrics from the database
    # For now, return mock data
    total_findings = 150
    reviewed_findings = 120
    
    return {
        "total_findings": total_findings,
        "reviewed_findings": reviewed_findings,
        "review_rate": round(reviewed_findings / total_findings * 100, 1),
        "status_breakdown": {
            "accepted": 80,
            "corrected": 25,
            "rejected": 15,
            "pending_owner_review": 20,
            "escalated": 10
        },
        "feedback_types": {
            "general": 70,
            "correction": 25,
            "question": 35,
            "error_report": 20
        },
        "provider_breakdown": {
            "dentist": 90,
            "hygienist": 20,
            "assistant": 10,
            "specialist": 0
        },
        "correction_rate": round(25 / 120 * 100, 1),  # percentage of findings that were corrected
        "rejection_rate": round(15 / 120 * 100, 1),  # percentage of findings that were rejected
        "avg_confidence": 0.84  # average confidence score of AI diagnoses
    } 