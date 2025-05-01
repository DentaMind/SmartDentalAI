from typing import Dict, Any
from datetime import timedelta
import os

# OpenAI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your-api-key-here")
OPENAI_MODEL = "gpt-4"
OPENAI_TEMPERATURE = 0.7

# Metric thresholds for auto-tuning
METRIC_THRESHOLDS: Dict[str, Any] = {
    "cpu_usage": 80.0,  # Percentage
    "memory_usage": 85.0,  # Percentage
    "response_time": 500.0,  # Milliseconds
    "error_rate": 1.0,  # Percentage
    "request_rate": 1000.0  # Requests per minute
}

# Intervals for retuning checks
RETUNING_INTERVALS = {
    "cpu_check": timedelta(minutes=5),
    "memory_check": timedelta(minutes=5),
    "performance_check": timedelta(minutes=15),
    "full_system_check": timedelta(hours=1)
}

# API rate limiting
RATE_LIMIT = {
    "default": "100/minute",
    "auth": "20/minute",
    "health_check": "1000/minute"
}

# Security settings
SECURITY_CONFIG = {
    "jwt_expiration": timedelta(hours=1),
    "refresh_token_expiration": timedelta(days=7),
    "password_reset_expiration": timedelta(hours=24),
    "max_failed_attempts": 5,
    "lockout_duration": timedelta(minutes=15)
}

# Feature flags
FEATURE_FLAGS = {
    "enable_auto_tuning": True,
    "enable_metrics_collection": True,
    "enable_performance_alerts": True,
    "enable_security_alerts": True
} 