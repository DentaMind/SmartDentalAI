from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from ..database import get_db
from ..services.diagnostic_qa_system import DiagnosticQASystem
from ..auth.dependencies import get_current_user, verify_admin_role

router = APIRouter(
    prefix="/api/qa",
    tags=["Quality Assurance"],
    responses={404: {"description": "Not found"}}
)

@router.post("/check")
async def run_qa_check(
    lookback_days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Run a full diagnostic quality assurance check
    
    Args:
        lookback_days: Number of days to analyze
        
    Returns:
        QA check results with alerts and recommendations
    """
    # Only admins can run QA checks
    verify_admin_role(current_user)
    
    qa_system = DiagnosticQASystem(db)
    report = await qa_system.run_diagnostic_qa_check(lookback_days)
    
    return report

@router.get("/reports")
async def get_qa_reports(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get recent QA reports
    
    Args:
        limit: Maximum number of reports to return
        
    Returns:
        List of recent QA reports
    """
    # Only admins can view QA reports
    verify_admin_role(current_user)
    
    qa_system = DiagnosticQASystem(db)
    reports = await qa_system.get_recent_qa_reports(limit)
    
    return {
        "total": len(reports),
        "reports": reports
    }

@router.get("/rejection-rates")
async def check_rejection_rates(
    lookback_days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Check for high rejection rates in diagnostics
    
    Args:
        lookback_days: Number of days to analyze
        
    Returns:
        List of alerts for high rejection rates
    """
    # Only admins can view rejection rates
    verify_admin_role(current_user)
    
    qa_system = DiagnosticQASystem(db)
    alerts = await qa_system.check_rejection_rates(lookback_days)
    
    return {
        "lookback_days": lookback_days,
        "total_alerts": len(alerts),
        "alerts": alerts
    }

@router.get("/unusual-patterns")
async def check_unusual_patterns(
    lookback_days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Check for unusual diagnostic patterns
    
    Args:
        lookback_days: Number of days to analyze
        
    Returns:
        List of alerts for unusual patterns
    """
    # Only admins can view pattern alerts
    verify_admin_role(current_user)
    
    qa_system = DiagnosticQASystem(db)
    alerts = await qa_system.check_unusual_patterns(lookback_days)
    
    return {
        "lookback_days": lookback_days,
        "total_alerts": len(alerts),
        "alerts": alerts
    }

@router.get("/model-versions")
async def check_model_versions(
    lookback_days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Check for issues with specific model versions
    
    Args:
        lookback_days: Number of days to analyze
        
    Returns:
        List of alerts for model version issues
    """
    # Only admins can view model version alerts
    verify_admin_role(current_user)
    
    qa_system = DiagnosticQASystem(db)
    alerts = await qa_system.check_model_versions(lookback_days)
    
    return {
        "lookback_days": lookback_days,
        "total_alerts": len(alerts),
        "alerts": alerts
    }

@router.get("/practice-variances")
async def check_practice_variances(
    lookback_days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Check for unusual variances between practices
    
    Args:
        lookback_days: Number of days to analyze
        
    Returns:
        List of alerts for practice variance issues
    """
    # Only admins can view practice variance alerts
    verify_admin_role(current_user)
    
    qa_system = DiagnosticQASystem(db)
    alerts = await qa_system.check_practice_variances(lookback_days)
    
    return {
        "lookback_days": lookback_days,
        "total_alerts": len(alerts),
        "alerts": alerts
    } 