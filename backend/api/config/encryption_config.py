"""
Encryption Configuration

This module manages configuration for the DentaMind encryption system,
providing a centralized way to manage encryption keys and settings.
"""

import os
import logging
from typing import Optional, Dict, Any
import json
from pathlib import Path

logger = logging.getLogger("dentamind.encryption_config")

# Constants for environment variables
ENV_KEY_NAME = "DENTAMIND_ENCRYPTION_KEY"
ENV_SALT_NAME = "DENTAMIND_ENCRYPTION_SALT"
ENV_KEY_FILE = "DENTAMIND_ENCRYPTION_KEY_FILE"
ENV_SALT_FILE = "DENTAMIND_ENCRYPTION_SALT_FILE"

class EncryptionConfig:
    """Singleton class for managing encryption configuration."""
    
    _instance = None
    
    def __new__(cls, *args, **kwargs):
        """Singleton pattern."""
        if cls._instance is None:
            cls._instance = super(EncryptionConfig, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """Initialize encryption configuration."""
        if self._initialized:
            return
            
        self._key = None
        self._salt = None
        self._env_loaded = False
        self._file_loaded = False
        
        # Load configuration from environment or file
        self._load_from_environment()
        if not self._env_loaded:
            self._load_from_file()
            
        self._initialized = True
    
    def _load_from_environment(self):
        """Load encryption keys from environment variables."""
        self._key = os.environ.get(ENV_KEY_NAME)
        self._salt = os.environ.get(ENV_SALT_NAME)
        
        if self._key and self._salt:
            logger.info("Loaded encryption keys from environment variables")
            self._env_loaded = True
        else:
            logger.warning("Encryption keys not found in environment variables")
    
    def _load_from_file(self):
        """Load encryption keys from files."""
        key_file = os.environ.get(ENV_KEY_FILE)
        salt_file = os.environ.get(ENV_SALT_FILE)
        
        if key_file and salt_file:
            try:
                key_path = Path(key_file)
                salt_path = Path(salt_file)
                
                if key_path.exists() and salt_path.exists():
                    with open(key_path, 'r') as f:
                        self._key = f.read().strip()
                    
                    with open(salt_path, 'r') as f:
                        self._salt = f.read().strip()
                    
                    logger.info("Loaded encryption keys from files")
                    self._file_loaded = True
                else:
                    logger.warning("Encryption key files not found")
            except Exception as e:
                logger.error(f"Error loading encryption keys from files: {str(e)}")
    
    @property
    def key(self) -> Optional[str]:
        """Get the encryption key."""
        return self._key
    
    @property
    def salt(self) -> Optional[str]:
        """Get the encryption salt."""
        return self._salt
    
    @property
    def is_configured(self) -> bool:
        """Check if encryption is properly configured."""
        return bool(self._key and self._salt)
    
    def get_config_status(self) -> Dict[str, Any]:
        """Get configuration status information."""
        return {
            "is_configured": self.is_configured,
            "env_loaded": self._env_loaded,
            "file_loaded": self._file_loaded,
            "key_available": bool(self._key),
            "salt_available": bool(self._salt)
        }

# Initialize configuration on module import
encryption_config = EncryptionConfig()

def get_encryption_key() -> Optional[str]:
    """Get the configured encryption key."""
    return encryption_config.key

def get_encryption_salt() -> Optional[str]:
    """Get the configured encryption salt."""
    return encryption_config.salt

def is_encryption_configured() -> bool:
    """Check if encryption is properly configured."""
    return encryption_config.is_configured 

def set_encryption_keys_for_testing(key: str, salt: str) -> None:
    """
    Set encryption keys directly for testing purposes.
    This should ONLY be used in testing environments.
    
    Args:
        key: Base64-encoded encryption key
        salt: Base64-encoded salt
    """
    global encryption_config
    encryption_config._key = key
    encryption_config._salt = salt
    encryption_config._env_loaded = True
    encryption_config._initialized = True
    
    # Also set environment variables for redundancy
    os.environ[ENV_KEY_NAME] = key
    os.environ[ENV_SALT_NAME] = salt
    
    logger.info("Set encryption keys for testing") 