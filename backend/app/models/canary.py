from pydantic import BaseModel, Field
from typing import Dict, Optional, Any
from datetime import datetime

class CanaryMetrics(BaseModel):
    requests_served: int = 0
    accuracy: float = 0.0
    errors: int = 0

class StartCanaryRequest(BaseModel):
    model_type: str = Field(..., description="Type of model to deploy (diagnosis, treatment, billing)")
    model_version: str = Field(..., description="Version identifier of the model")
    traffic_percentage: Optional[float] = Field(None, description="Percentage of traffic to route to canary (1-100)")
    evaluation_period_hours: Optional[int] = Field(None, description="Hours to run canary before evaluation")

class CanaryDeployment(BaseModel):
    model_type: str
    model_version: str
    status: str  # "active", "promoted", "rolled_back"
    traffic_percentage: float
    started_at: datetime
    evaluation_period_hours: int
    metrics: CanaryMetrics
    is_promoted: bool = False
    promoted_at: Optional[datetime] = None
    rolled_back_at: Optional[datetime] = None
    final_metrics: Optional[CanaryMetrics] = None

class CanaryThresholds(BaseModel):
    diagnosis_accuracy: float = Field(0.90, description="Minimum accuracy threshold for diagnosis models")
    treatment_accuracy: float = Field(0.90, description="Minimum accuracy threshold for treatment models")
    billing_accuracy: float = Field(0.95, description="Minimum accuracy threshold for billing models")
    max_error_rate: float = Field(0.01, description="Maximum allowed error rate")
    min_requests: int = Field(100, description="Minimum number of requests before evaluation")
    default_traffic_percentage: float = Field(5.0, description="Default percentage of traffic to route to canary")
    default_evaluation_hours: int = Field(24, description="Default evaluation period in hours")

class CanaryEvaluationResponse(BaseModel):
    status: str = Field(..., description="Status of evaluation (promoted, rolled_back, evaluation_ongoing, insufficient_data)")
    metrics: Optional[CanaryMetrics] = None 