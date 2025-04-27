from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from models.learning_insight import LearningInsight
from services.learning_aggregator import LearningAggregator
from services.auth import get_current_user, User, admin_only
from services.database import get_db
from config import get_settings

router = APIRouter(prefix="/api/v1/insights", tags=["insights"])
settings = get_settings()

@router.get("/daily", response_model=Dict[str, Any])
@admin_only
async def get_daily_insights(
    date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get insights for a specific date."""
    try:
        # Use today if no date provided
        target_date = date or datetime.utcnow()
        
        # Query insights
        insight = db.query(LearningInsight).filter(
            LearningInsight.date == target_date.date()
        ).first()
        
        if not insight:
            # Generate insights if they don't exist
            aggregator = LearningAggregator(db)
            insight_data = await aggregator.aggregate_daily_insights(target_date)
            return insight_data
        
        return insight.to_dict()
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get daily insights: {str(e)}"
        )

@router.get("/range", response_model=List[Dict[str, Any]])
@admin_only
async def get_insights_range(
    start_date: datetime,
    end_date: datetime,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get insights for a date range."""
    try:
        insights = db.query(LearningInsight).filter(
            LearningInsight.date >= start_date,
            LearningInsight.date <= end_date
        ).order_by(LearningInsight.date).all()
        
        return [insight.to_dict() for insight in insights]
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get insights range: {str(e)}"
        )

@router.get("/alerts", response_model=List[Dict[str, Any]])
@admin_only
async def get_recent_alerts(
    days: int = Query(7, gt=0, le=30),
    min_severity: str = Query("low", regex="^(low|medium|high)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get recent alerts above specified severity."""
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        insights = db.query(LearningInsight).filter(
            LearningInsight.date >= start_date,
            LearningInsight.has_alerts == True
        ).order_by(LearningInsight.date.desc()).all()
        
        # Filter alerts by severity
        severity_levels = {
            'low': 0,
            'medium': 1,
            'high': 2
        }
        min_severity_level = severity_levels[min_severity]
        
        alerts = []
        for insight in insights:
            for alert in insight.alerts:
                if severity_levels[alert['severity']] >= min_severity_level:
                    alerts.append({
                        'date': insight.date.date().isoformat(),
                        **alert
                    })
        
        return alerts
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get recent alerts: {str(e)}"
        )

@router.get("/summary", response_model=Dict[str, Any])
@admin_only
async def get_system_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get high-level system learning summary."""
    try:
        # Get last 30 days of insights
        start_date = datetime.utcnow() - timedelta(days=30)
        insights = db.query(LearningInsight).filter(
            LearningInsight.date >= start_date
        ).order_by(LearningInsight.date).all()
        
        if not insights:
            return {
                'status': 'no_data',
                'message': 'No learning data available for the past 30 days'
            }
        
        # Calculate trends
        diagnosis_rates = []
        treatment_rates = []
        billing_rates = []
        
        for insight in insights:
            metrics = insight.metrics
            if 'diagnosis' in metrics:
                diagnosis_rates.append(metrics['diagnosis'].get('correction_rate', 0))
            if 'treatment' in metrics:
                treatment_rates.append(metrics['treatment'].get('edit_rate', 0))
            if 'billing' in metrics:
                billing_rates.append(metrics['billing'].get('override_rate', 0))
        
        def calculate_trend(values):
            if not values:
                return 0
            # Simple linear regression slope
            x = list(range(len(values)))
            mean_x = sum(x) / len(x)
            mean_y = sum(values) / len(values)
            slope = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, values))
            slope /= sum((xi - mean_x) ** 2 for xi in x)
            return slope
        
        return {
            'status': 'success',
            'period': '30d',
            'trends': {
                'diagnosis_correction': {
                    'direction': 'improving' if calculate_trend(diagnosis_rates) < 0 else 'degrading',
                    'current_rate': diagnosis_rates[-1] if diagnosis_rates else 0,
                    'change': (diagnosis_rates[-1] - diagnosis_rates[0]) if diagnosis_rates else 0
                },
                'treatment_edits': {
                    'direction': 'improving' if calculate_trend(treatment_rates) < 0 else 'degrading',
                    'current_rate': treatment_rates[-1] if treatment_rates else 0,
                    'change': (treatment_rates[-1] - treatment_rates[0]) if treatment_rates else 0
                },
                'billing_overrides': {
                    'direction': 'improving' if calculate_trend(billing_rates) < 0 else 'degrading',
                    'current_rate': billing_rates[-1] if billing_rates else 0,
                    'change': (billing_rates[-1] - billing_rates[0]) if billing_rates else 0
                }
            },
            'alerts': {
                'total': sum(len(insight.alerts) for insight in insights),
                'high_severity': sum(
                    sum(1 for alert in insight.alerts if alert['severity'] == 'high')
                    for insight in insights
                )
            },
            'patterns': {
                'total': sum(len(insight.patterns) for insight in insights)
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get system summary: {str(e)}"
        ) 