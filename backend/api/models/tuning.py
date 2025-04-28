from typing import Dict, Optional
from pydantic import BaseModel
from datetime import datetime

class TuningParameters(BaseModel):
    learning_rate: Optional[float] = None
    batch_size: Optional[int] = None
    threshold: Optional[float] = None
    class_weight: Optional[float] = None
    window_size: Optional[int] = None

class TuningRecommendation(BaseModel):
    metric: str
    timestamp: str
    current_value: float
    mean_value: float
    trend: float
    volatility: float
    seasonality: Optional[int]
    parameter_adjustments: Dict[str, float]
    confidence_score: float

    class Config:
        json_schema_extra = {
            "example": {
                "metric": "accuracy",
                "timestamp": datetime.now().isoformat(),
                "current_value": 0.85,
                "mean_value": 0.87,
                "trend": -0.02,
                "volatility": 0.05,
                "seasonality": 24,
                "parameter_adjustments": {
                    "learning_rate": 0.001,
                    "batch_size": 128
                },
                "confidence_score": 0.85
            }
        } 