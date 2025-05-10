"""
DentaMind Configuration Settings

This module provides a centralized configuration system using Pydantic BaseSettings
to validate environment variables and provide type checking.
"""

import os
from typing import List, Dict, Any, Optional
from pydantic import BaseSettings, validator, PostgresDsn, SecretStr, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings(BaseSettings):
    """Application settings with environment variable validation"""
    
    # General settings
    ENVIRONMENT: str = Field(os.getenv("ENVIRONMENT", "development"), description="Current environment (development, staging, production)")
    DEBUG: bool = Field(ENVIRONMENT != "production", description="Debug mode flag")
    API_VERSION: str = Field("1.0.0", description="API version string")
    
    # Application URLs and server settings
    BASE_URL: str = Field("http://localhost:8000", description="Base URL for the application")
    PORT: int = Field(8000, description="Port for the API server")
    ALLOWED_ORIGINS: List[str] = Field(os.getenv("ALLOWED_ORIGINS", "*").split(","), description="CORS allowed origins")
    
    # Security settings
    SECRET_KEY: SecretStr = Field(os.getenv("SECRET_KEY", "dev_secret_key_change_in_production"), description="Secret key for tokens and encryption")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")), description="JWT token expiration in minutes")
    PASSWORD_HASH_ALGORITHM: str = Field("bcrypt", description="Password hashing algorithm")
    
    # Database settings
    DATABASE_URL: PostgresDsn = Field(os.getenv("DATABASE_URL", "sqlite:///./dentamind.db"), description="Database connection string")
    DATABASE_POOL_SIZE: int = Field(5, description="Database connection pool size")
    DATABASE_MAX_OVERFLOW: int = Field(10, description="Maximum overflow connections")
    
    # AI Services
    ROBOFLOW_API_KEY: Optional[SecretStr] = Field(None, description="Roboflow API key")
    ROBOFLOW_MODEL_ID: str = Field("dental-xray-analysis", description="Roboflow model ID")
    ROBOFLOW_MODEL_VERSION: str = Field("1", description="Roboflow model version")
    USE_MOCK_AI: bool = Field(False, description="Use mock AI responses instead of real API")
    
    # Storage settings
    UPLOAD_DIR: str = Field(os.getenv("UPLOAD_DIR", "attached_assets"), description="Directory for uploaded files")
    
    # Logging
    LOG_LEVEL: str = Field("INFO", description="Log level")
    
    # Email settings
    SMTP_HOST: Optional[str] = Field(None, description="SMTP server host")
    SMTP_PORT: Optional[int] = Field(None, description="SMTP server port")
    SMTP_USER: Optional[str] = Field(None, description="SMTP username")
    SMTP_PASSWORD: Optional[SecretStr] = Field(None, description="SMTP password")
    EMAIL_FROM: Optional[str] = Field(None, description="Sender email address")
    
    # WebSocket settings
    WEBSOCKET_WORKER_COUNT: int = Field(4, description="Number of WebSocket worker processes")
    WEBSOCKET_CONNECTIONS_PER_WORKER: int = Field(500, description="Maximum connections per worker")
    WEBSOCKET_AUTO_SCALING: bool = Field(True, description="Enable auto-scaling of WebSocket workers")
    WEBSOCKET_MAX_WORKERS: int = Field(16, description="Maximum number of WebSocket workers")
    WEBSOCKET_MAX_MESSAGE_SIZE: int = Field(100 * 1024, description="Maximum WebSocket message size in bytes")
    WEBSOCKET_RATE_LIMIT: int = Field(60, description="Maximum WebSocket messages per minute")
    
    # Validators
    @validator("ALLOWED_ORIGINS", pre=True)
    def parse_allowed_origins(cls, v):
        """Parse ALLOWED_ORIGINS from string to list if needed"""
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    @validator("UPLOAD_DIR")
    def create_upload_dir(cls, v):
        """Create upload directory if it doesn't exist"""
        os.makedirs(v, exist_ok=True)
        return v
    
    class Config:
        """Pydantic configuration"""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

# Create a global settings instance
settings = Settings()

# Export settings for easy import
__all__ = ["settings"] 