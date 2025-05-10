"""
Configuration module for DentaMind API

Centralizes all configuration settings and loads environment-specific values
"""

import os
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# Load appropriate .env file based on environment
ENV = os.getenv("ENVIRONMENT", "development")
env_file = f".env.{ENV}"
load_dotenv(env_file)
load_dotenv()  # Also load default .env if it exists

# Basic settings
DEBUG = ENV != "production"
LOG_LEVEL = os.getenv("LOG_LEVEL", "DEBUG" if DEBUG else "INFO")
USE_MOCK_DATA = os.getenv("USE_MOCK_DATA", "true" if DEBUG else "false").lower() == "true"

# API settings
API_PREFIX = "/api"
API_VERSION = "v1"
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

# Database settings
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dentamind.db")
DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "5"))
DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "10"))
DB_POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "3600"))

# Security settings
SECRET_KEY = os.getenv("SECRET_KEY", "development_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# File storage settings
UPLOADED_FILES_PATH = os.getenv("UPLOADED_FILES_PATH", "./attached_assets")
MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", "52428800"))  # 50MB

# Clinical data paths
CLINICAL_DATA_PATH = os.getenv("CLINICAL_DATA_PATH", "./data/clinical")
SUPPORTED_INSTITUTES = ["BU", "HMS", "UCSF", "Mayo"]
SUPPORTED_IMAGE_TYPES = ["xray", "panoramic", "cbct", "photo", "scan"]

# Audit log settings
AUDIT_LOG_RETENTION_DAYS = int(os.getenv("AUDIT_LOG_RETENTION_DAYS", "730"))  # 2 years default
AUDIT_LOG_ARCHIVE_ENABLED = os.getenv("AUDIT_LOG_ARCHIVE_ENABLED", "true").lower() == "true"
AUDIT_LOG_ARCHIVE_PATH = os.getenv("AUDIT_LOG_ARCHIVE_PATH", "./data/audit_archive")
AUDIT_LOG_CRITICAL_RETENTION_DAYS = int(os.getenv("AUDIT_LOG_CRITICAL_RETENTION_DAYS", "3650"))  # 10 years for critical logs

# Configure logging
def setup_logging() -> None:
    """Configure application logging based on environment"""
    log_level = getattr(logging, LOG_LEVEL)
    
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler(f"logs/dentamind_{ENV}.log"),
        ]
    )
    
    # Set specific levels for some loggers
    if not DEBUG:
        # Reduce noise from libraries in production
        logging.getLogger("uvicorn").setLevel(logging.WARNING)
        logging.getLogger("sqlalchemy").setLevel(logging.WARNING)

# Create clinical data directories if they don't exist
def ensure_directories() -> None:
    """Create necessary directories for the application"""
    # Create upload directory
    Path(UPLOADED_FILES_PATH).mkdir(parents=True, exist_ok=True)
    
    # Create logs directory
    Path("logs").mkdir(exist_ok=True)
    
    # Create clinical data directory structure
    for institute in SUPPORTED_INSTITUTES:
        institute_path = Path(CLINICAL_DATA_PATH) / institute
        institute_path.mkdir(parents=True, exist_ok=True)
        
        # Example patient directory for testing
        test_patient_path = institute_path / "test" / "patient0001"
        test_patient_path.mkdir(parents=True, exist_ok=True)
        
        # Create directories for each image type
        for image_type in SUPPORTED_IMAGE_TYPES:
            image_type_path = test_patient_path / image_type
            image_type_path.mkdir(exist_ok=True)

# Bundle settings into a class for easier imports
class Settings:
    """Application settings that can be imported elsewhere"""
    ENV = ENV
    DEBUG = DEBUG
    LOG_LEVEL = LOG_LEVEL
    USE_MOCK_DATA = USE_MOCK_DATA
    API_PREFIX = API_PREFIX
    API_VERSION = API_VERSION
    ALLOWED_ORIGINS = ALLOWED_ORIGINS
    DATABASE_URL = DATABASE_URL
    DB_POOL_SIZE = DB_POOL_SIZE
    DB_MAX_OVERFLOW = DB_MAX_OVERFLOW
    DB_POOL_RECYCLE = DB_POOL_RECYCLE
    SECRET_KEY = SECRET_KEY
    ALGORITHM = ALGORITHM
    ACCESS_TOKEN_EXPIRE_MINUTES = ACCESS_TOKEN_EXPIRE_MINUTES
    UPLOADED_FILES_PATH = UPLOADED_FILES_PATH
    MAX_UPLOAD_SIZE = MAX_UPLOAD_SIZE
    CLINICAL_DATA_PATH = CLINICAL_DATA_PATH
    SUPPORTED_INSTITUTES = SUPPORTED_INSTITUTES
    SUPPORTED_IMAGE_TYPES = SUPPORTED_IMAGE_TYPES
    AUDIT_LOG_RETENTION_DAYS = AUDIT_LOG_RETENTION_DAYS
    AUDIT_LOG_ARCHIVE_ENABLED = AUDIT_LOG_ARCHIVE_ENABLED
    AUDIT_LOG_ARCHIVE_PATH = AUDIT_LOG_ARCHIVE_PATH
    AUDIT_LOG_CRITICAL_RETENTION_DAYS = AUDIT_LOG_CRITICAL_RETENTION_DAYS

# Export settings as a singleton
settings = Settings() 