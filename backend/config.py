from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime

class AlertThresholds(BaseModel):
    diagnosis_accuracy: float = 0.05  # 5% change in diagnosis correction rate
    treatment_stability: float = 0.08  # 8% change in treatment edit rate
    billing_accuracy: float = 0.03  # 3% change in billing override rate
    user_experience: float = 10.0  # 10 second change in average page time

class RetrainingThresholds(BaseModel):
    diagnosis_accuracy: float = 0.10  # 10% correction rate triggers retraining
    treatment_stability: float = 0.15  # 15% edit rate triggers retraining
    billing_accuracy: float = 0.08  # 8% override rate triggers retraining
    min_samples: int = 50  # Minimum samples needed before retraining

class AlertControl(BaseModel):
    is_muted: bool = False
    mute_until: Optional[datetime] = None

class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/dentamind"
    test_database_url: str = "postgresql://postgres:postgres@localhost:5432/dentamind_test"

    # Alert settings
    alert_check_interval: int = 300  # 5 minutes
    alert_thresholds: AlertThresholds = AlertThresholds()
    alert_controls: Dict[str, AlertControl] = {}  # Alert type -> control settings

    # Retraining settings
    retraining_thresholds: RetrainingThresholds = RetrainingThresholds()
    retraining_cooldown: int = 7  # Days between retraining attempts
    max_retraining_samples: int = 1000  # Maximum samples to use for retraining
    validation_split: float = 0.2  # Portion of data to use for validation

    # Notification settings
    slack_webhook_url: Optional[str] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: Optional[str] = None
    smtp_port: int = 587
    smtp_server: str = "smtp.gmail.com"
    smtp_use_tls: bool = True
    founder_email: Optional[str] = None
    app_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings() 