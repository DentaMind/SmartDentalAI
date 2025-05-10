from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime

class ModelPerformance(BaseModel):
    accuracy: float
    validation_loss: float

class RetrainingMetrics(BaseModel):
    last_retrained: datetime
    status: str  # "pending", "completed", "failed"
    performance: ModelPerformance
    retraining_count_30d: int

class RetrainingStatus(BaseModel):
    metrics: Dict[str, RetrainingMetrics]  # model_type -> metrics

class RetrainingHistoryEvent(BaseModel):
    model_type: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    performance_metrics: Optional[ModelPerformance] = None
    triggered_by: str  # user ID
    reason: str
    force: bool = False

class RetrainingConfig(BaseModel):
    diagnosis_accuracy: float = 0.10  # 10% threshold
    treatment_stability: float = 0.15  # 15% threshold
    billing_accuracy: float = 0.08  # 8% threshold
    min_samples: int = 50  # minimum samples needed
    max_retraining_frequency_days: int = 7  # minimum days between retraining
    validation_split: float = 0.2  # 20% validation split
    epochs: int = 10
    batch_size: int = 32
    learning_rate: float = 0.001 