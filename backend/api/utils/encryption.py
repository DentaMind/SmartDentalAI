"""
Field-level encryption service for DentaMind.

This module provides encryption and decryption functions for protecting
sensitive patient health information (PHI) at the database field level.

Uses Fernet symmetric encryption from the cryptography package which provides:
- AES-128 in CBC mode with PKCS7 padding
- HMAC using SHA256 for authentication
- Securely random IVs for each encryption
"""

import os
import base64
from typing import Optional, Union, Dict, Any, Callable
import json
from datetime import datetime
import logging
from functools import wraps

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# Import configuration
from ..config.encryption_config import get_encryption_key, get_encryption_salt

# Configure logger
logger = logging.getLogger("dentamind.encryption")

class EncryptionError(Exception):
    """Base exception for encryption-related errors."""
    pass

class DecryptionError(EncryptionError):
    """Exception raised when decryption fails."""
    pass

class EncryptionService:
    """Service providing field-level encryption for sensitive data."""
    
    _instance = None
    
    def __new__(cls, *args, **kwargs):
        """Singleton pattern to ensure only one encryption service exists."""
        if cls._instance is None:
            cls._instance = super(EncryptionService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self, key: Optional[str] = None, salt: Optional[str] = None):
        """
        Initialize the encryption service with encryption keys.
        
        If no key is provided, it will try to load from the encryption_config module.
        If no salt is provided, it will try to load from the encryption_config module.
        
        Args:
            key: Base64-encoded key or None to use config
            salt: Base64-encoded salt or None to use config
        """
        # Only initialize once due to singleton pattern
        if self._initialized:
            return
            
        self._key = key or get_encryption_key()
        self._salt = salt or get_encryption_salt()
        
        if not self._key:
            raise ValueError(
                "Encryption key not provided. Set DENTAMIND_ENCRYPTION_KEY "
                "environment variable or pass key to constructor."
            )
            
        if not self._salt:
            raise ValueError(
                "Encryption salt not provided. Set DENTAMIND_ENCRYPTION_SALT "
                "environment variable or pass salt to constructor."
            )
        
        # Derive a key from the provided key material and salt
        try:
            # Convert from base64 if they're strings
            key_bytes = base64.b64decode(self._key) if isinstance(self._key, str) else self._key
            salt_bytes = base64.b64decode(self._salt) if isinstance(self._salt, str) else self._salt
            
            # Use PBKDF2 to derive a key
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt_bytes,
                iterations=100000,
            )
            
            derived_key = base64.urlsafe_b64encode(kdf.derive(key_bytes))
            self._fernet = Fernet(derived_key)
            self._initialized = True
            logger.info("Encryption service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize encryption service: {str(e)}")
            raise EncryptionError(f"Failed to initialize encryption: {str(e)}")
    
    def encrypt(self, data: Union[str, bytes, int, float, bool, Dict, None]) -> str:
        """
        Encrypt data (handles different data types by serializing as needed).
        
        Args:
            data: Data to encrypt (string, bytes, numbers, booleans, dicts, or None)
            
        Returns:
            Base64-encoded encrypted string
            
        Raises:
            EncryptionError: If encryption fails
        """
        if data is None:
            return None
            
        try:
            # Convert data to JSON string if it's not already bytes or string
            if not isinstance(data, (str, bytes)):
                serialized = json.dumps({
                    "value": data,
                    "type": type(data).__name__
                })
                data_to_encrypt = serialized.encode("utf-8")
            elif isinstance(data, str):
                # Mark strings so we know how to deserialize
                serialized = json.dumps({
                    "value": data,
                    "type": "str"
                })
                data_to_encrypt = serialized.encode("utf-8")
            else:
                # It's already bytes
                data_to_encrypt = data
                
            # Encrypt the data
            encrypted = self._fernet.encrypt(data_to_encrypt)
            # Return as base64 string
            return base64.urlsafe_b64encode(encrypted).decode("ascii")
            
        except Exception as e:
            logger.error(f"Encryption error: {str(e)}")
            raise EncryptionError(f"Failed to encrypt data: {str(e)}")
    
    def decrypt(self, encrypted_data: Optional[str]) -> Any:
        """
        Decrypt data and deserialize to original type if needed.
        
        Args:
            encrypted_data: Base64-encoded encrypted string
            
        Returns:
            Decrypted data in its original type
            
        Raises:
            DecryptionError: If decryption fails
        """
        if encrypted_data is None:
            return None
            
        try:
            # Convert from base64 string to bytes
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data)
            # Decrypt
            decrypted_bytes = self._fernet.decrypt(encrypted_bytes)
            
            # Try to deserialize JSON
            try:
                deserialized = json.loads(decrypted_bytes.decode("utf-8"))
                # If this has our type annotation, restore the original type
                if isinstance(deserialized, dict) and "type" in deserialized and "value" in deserialized:
                    value_type = deserialized["type"]
                    value = deserialized["value"]
                    
                    # Convert back to original type
                    if value_type == "int":
                        return int(value)
                    elif value_type == "float":
                        return float(value)
                    elif value_type == "bool":
                        return bool(value)
                    elif value_type == "str":
                        return str(value)
                    elif value_type == "dict":
                        return dict(value)
                    else:
                        return value
                else:
                    # Just return the JSON
                    return deserialized
            except json.JSONDecodeError:
                # Not JSON, return as string
                return decrypted_bytes.decode("utf-8")
                
        except InvalidToken:
            logger.error("Invalid token - decryption failed")
            raise DecryptionError("Invalid token - the data may be corrupted or was encrypted with a different key")
        except Exception as e:
            logger.error(f"Decryption error: {str(e)}")
            raise DecryptionError(f"Failed to decrypt data: {str(e)}")
    
    @staticmethod
    def generate_key() -> str:
        """
        Generate a new random encryption key.
        
        Returns:
            Base64-encoded key
        """
        key = Fernet.generate_key()
        return base64.urlsafe_b64encode(key).decode("ascii")
    
    @staticmethod
    def generate_salt() -> str:
        """
        Generate a new random salt for key derivation.
        
        Returns:
            Base64-encoded salt
        """
        salt = os.urandom(16)
        return base64.urlsafe_b64encode(salt).decode("ascii")
        
# Helper decorators for SQLAlchemy models
def encrypt_field(field_name: str):
    """
    Decorator for SQLAlchemy model methods to encrypt a field before saving.
    
    Example:
        class Patient(Base):
            __tablename__ = "patients"
            id = Column(Integer, primary_key=True)
            ssn_encrypted = Column(String)
            
            @property
            def ssn(self):
                return EncryptionService().decrypt(self.ssn_encrypted)
                
            @ssn.setter
            @encrypt_field("ssn_encrypted")
            def ssn(self, value):
                return value
    
    Args:
        field_name: Name of the field to store the encrypted value
        
    Returns:
        Decorator function
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, value):
            func(self, value)
            encrypted = EncryptionService().encrypt(value)
            setattr(self, field_name, encrypted)
            return value
        return wrapper
    return decorator 