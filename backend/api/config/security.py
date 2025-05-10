import os
from typing import Dict, Any
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SecurityConfig:
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")
    JWT_ALGORITHM = "HS256"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)
    
    # Password Configuration
    PASSWORD_MIN_LENGTH = 8
    PASSWORD_REQUIRE_UPPERCASE = True
    PASSWORD_REQUIRE_LOWERCASE = True
    PASSWORD_REQUIRE_NUMBERS = True
    PASSWORD_REQUIRE_SPECIAL_CHARS = True
    PASSWORD_RESET_EXPIRES = timedelta(hours=1)
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS = 100
    RATE_LIMIT_PERIOD = 60  # seconds
    
    # Session Security
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    
    # CORS Configuration
    CORS_ORIGINS = [
        "http://localhost:3000",
        "https://dentamind.com",
    ]
    
    # API Key Configuration
    API_KEY_HEADER = "X-API-Key"
    API_KEY_LENGTH = 32
    
    # Security Headers
    SECURITY_HEADERS: Dict[str, str] = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'",
    }
    
    # Audit Logging
    AUDIT_LOG_ENABLED = True
    AUDIT_LOG_FILE = "logs/audit.log"
    
    # Encryption
    ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "your-encryption-key-here")
    ENCRYPTION_ALGORITHM = "AES-256-GCM"
    
    # Two-Factor Authentication
    TFA_ENABLED = True
    TFA_ISSUER = "DentaMind"
    
    # Security Monitoring
    MONITORING_ENABLED = True
    ALERT_THRESHOLD = 5  # Number of failed attempts before alert
    LOCKOUT_DURATION = timedelta(minutes=30)
    
    @classmethod
    def get_security_headers(cls) -> Dict[str, str]:
        """Get security headers with environment-specific values."""
        headers = cls.SECURITY_HEADERS.copy()
        if os.getenv("ENVIRONMENT") == "production":
            headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        return headers 