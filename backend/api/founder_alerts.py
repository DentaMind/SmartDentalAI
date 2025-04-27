from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from pydantic import BaseModel
import numpy as np
from scipy import stats
from sklearn.linear_model import LinearRegression

from database import get_db
from models.learning_insights import Alert, AlertType, AlertSeverity, LearningInsight
from services.alert_service import AlertService
from auth.founder import get_founder_user

router = APIRouter(prefix="/founder/alerts", tags=["founder"])

class AlertThresholdUpdate(BaseModel):
    diagnosis_accuracy: Optional[float] = None
    treatment_stability: Optional[float] = None
    billing_accuracy: Optional[float] = None
    user_experience: Optional[float] = None

class AlertControlUpdate(BaseModel):
    type: AlertType
    is_muted: bool
    mute_until: Optional[datetime] = None

class AlertResolution(BaseModel):
    resolution_notes: str
    trigger_retraining: bool = False

class MetricTrendPoint(BaseModel):
    timestamp: datetime
    value: float
    rolling_avg: float
    prediction: Optional[float] = None
    threshold: float

class MetricTrend(BaseModel):
    metric: str
    points: List[MetricTrendPoint]
    risk_level: str
    trend_direction: str

@router.get("/active")
async def get_active_alerts(
    db: Session = Depends(get_db),
    _: dict = Depends(get_founder_user)  # Ensure founder-only access
) -> List[Alert]:
    """Get all active (unresolved) alerts."""
    return db.query(Alert).filter(Alert.resolved_at.is_(None)).all()

@router.get("/history")
async def get_alert_history(
    db: Session = Depends(get_db),
    _: dict = Depends(get_founder_user),
    alert_type: Optional[AlertType] = None,
    severity: Optional[AlertSeverity] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None
) -> List[Alert]:
    """Get historical alerts with optional filters."""
    query = db.query(Alert)
    
    if alert_type:
        query = query.filter(Alert.type == alert_type)
    if severity:
        query = query.filter(Alert.severity == severity)
    if from_date:
        query = query.filter(Alert.created_at >= from_date)
    if to_date:
        query = query.filter(Alert.created_at <= to_date)
        
    return query.order_by(Alert.created_at.desc()).all()

@router.put("/thresholds")
async def update_alert_thresholds(
    thresholds: AlertThresholdUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_founder_user)
) -> dict:
    """Update alert threshold settings."""
    settings = db.query(Settings).first()
    
    if thresholds.diagnosis_accuracy is not None:
        settings.alert_thresholds.diagnosis_accuracy = thresholds.diagnosis_accuracy
    if thresholds.treatment_stability is not None:
        settings.alert_thresholds.treatment_stability = thresholds.treatment_stability
    if thresholds.billing_accuracy is not None:
        settings.alert_thresholds.billing_accuracy = thresholds.billing_accuracy
    if thresholds.user_experience is not None:
        settings.alert_thresholds.user_experience = thresholds.user_experience
    
    db.commit()
    return {"message": "Alert thresholds updated successfully"}

@router.put("/control/{alert_type}")
async def update_alert_control(
    alert_type: AlertType,
    control: AlertControlUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_founder_user)
) -> dict:
    """Update alert control settings (muting, etc)."""
    settings = db.query(Settings).first()
    
    # Update mute settings in the database
    settings.alert_controls = {
        **settings.alert_controls,
        alert_type: {
            "is_muted": control.is_muted,
            "mute_until": control.mute_until.isoformat() if control.mute_until else None
        }
    }
    
    db.commit()
    return {"message": f"Alert control settings updated for {alert_type}"}

@router.post("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: int,
    resolution: AlertResolution,
    db: Session = Depends(get_db),
    _: dict = Depends(get_founder_user)
) -> dict:
    """Resolve an alert and optionally trigger model retraining."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.resolved_at = datetime.utcnow()
    alert.resolution_notes = resolution.resolution_notes
    
    if resolution.trigger_retraining:
        # Trigger model retraining based on alert type
        await trigger_model_retraining(alert.type, db)
    
    db.commit()
    return {"message": "Alert resolved successfully"}

def calculate_trend_prediction(values: List[float], dates: List[datetime], days_to_predict: int = 7) -> List[float]:
    """Calculate future trend prediction using linear regression."""
    if len(values) < 2:
        return []
        
    X = np.array([(d - dates[0]).days for d in dates]).reshape(-1, 1)
    y = np.array(values)
    
    model = LinearRegression()
    model.fit(X, y)
    
    future_days = np.array(range(len(dates), len(dates) + days_to_predict)).reshape(-1, 1)
    predictions = model.predict(future_days)
    
    return predictions.tolist()

def calculate_risk_level(values: List[float], threshold: float) -> str:
    """Calculate risk level based on metric values and threshold."""
    if not values:
        return "low"
        
    latest_value = values[-1]
    max_value = max(values)
    
    if latest_value >= threshold * 0.9:
        return "high"
    elif latest_value >= threshold * 0.7:
        return "medium"
    return "low"

def calculate_trend_direction(values: List[float]) -> str:
    """Calculate trend direction using linear regression slope."""
    if len(values) < 2:
        return "stable"
        
    x = np.arange(len(values))
    slope, _, _, _, _ = stats.linregress(x, values)
    
    if abs(slope) < 0.01:  # Adjust threshold as needed
        return "stable"
    return "improving" if slope < 0 else "deteriorating"

@router.get("/trends/{metric_type}")
async def get_metric_trends(
    metric_type: str,
    days: int = 30,
    db: Session = Depends(get_db),
    _: dict = Depends(get_founder_user)
) -> MetricTrend:
    """Get trend data for a specific metric type."""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Get the appropriate metric column based on type
    metric_column = {
        "diagnosis_accuracy": LearningInsight.diagnosis_correction_rate,
        "treatment_stability": LearningInsight.treatment_edit_rate,
        "billing_accuracy": LearningInsight.billing_override_rate,
        "user_experience": LearningInsight.avg_page_time
    }.get(metric_type)
    
    if not metric_column:
        raise HTTPException(status_code=400, detail="Invalid metric type")
    
    # Get metric values
    insights = db.query(
        LearningInsight.created_at,
        metric_column
    ).filter(
        LearningInsight.created_at >= cutoff_date
    ).order_by(
        LearningInsight.created_at
    ).all()
    
    if not insights:
        raise HTTPException(status_code=404, detail="No data found for metric")
    
    # Get threshold value
    settings = db.query(Settings).first()
    threshold = getattr(settings.alert_thresholds, metric_type)
    
    # Calculate rolling average
    window_size = 7
    values = [x[1] for x in insights]
    dates = [x[0] for x in insights]
    rolling_avg = [
        sum(values[max(0, i-window_size):i+1]) / len(values[max(0, i-window_size):i+1])
        for i in range(len(values))
    ]
    
    # Calculate predictions
    predictions = calculate_trend_prediction(values, dates)
    
    # Create trend points
    points = []
    for i, (date, value) in enumerate(insights):
        point = MetricTrendPoint(
            timestamp=date,
            value=value,
            rolling_avg=rolling_avg[i],
            threshold=threshold
        )
        points.append(point)
    
    # Add prediction points
    last_date = dates[-1]
    for i, pred in enumerate(predictions, 1):
        points.append(MetricTrendPoint(
            timestamp=last_date + timedelta(days=i),
            value=None,
            rolling_avg=None,
            prediction=pred,
            threshold=threshold
        ))
    
    return MetricTrend(
        metric=metric_type,
        points=points,
        risk_level=calculate_risk_level(values, threshold),
        trend_direction=calculate_trend_direction(values)
    ) 