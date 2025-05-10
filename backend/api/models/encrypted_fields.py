"""
SQLAlchemy mixins and helpers for encrypted fields.

This module provides field types and helpers for implementing
encrypted fields in SQLAlchemy models to protect sensitive PHI data.
"""

from typing import Any, Optional, Type, TypeVar, Dict, Generic, List, Union, cast
import json
from sqlalchemy import TypeDecorator, String, event
from sqlalchemy.ext.declarative import declared_attr

from ..utils.encryption import EncryptionService

T = TypeVar('T')

class EncryptedField(TypeDecorator, Generic[T]):
    """
    SQLAlchemy TypeDecorator for transparently encrypting fields.
    
    This field type can wrap any Python type and automatically encrypt/decrypt
    values when loading or saving to the database.
    
    Example:
        class Patient(Base):
            __tablename__ = 'patients'
            id = Column(Integer, primary_key=True)
            ssn = Column(EncryptedField(String), nullable=True)
            notes = Column(EncryptedField(Text), nullable=True)
    """
    
    # The SQLAlchemy storage type - encrypted data is always stored as a string
    impl = String
    
    # Cache for the encryption service singleton
    _encryption_service = None
    
    def __init__(self, impl_type=None):
        """
        Initialize the field with an optional implementation type.
        
        Args:
            impl_type: The SQLAlchemy type to wrap (e.g., String, Integer)
        """
        super().__init__()
        # The implementation type is just for documentation - all encrypted data is stored as a string
        self.impl_type = impl_type
    
    @property
    def encryption_service(self) -> EncryptionService:
        """Get or create the encryption service singleton."""
        if EncryptedField._encryption_service is None:
            EncryptedField._encryption_service = EncryptionService()
        return EncryptedField._encryption_service
    
    def process_bind_param(self, value: Optional[T], dialect) -> Optional[str]:
        """
        Process a value before saving to the database (encrypt).
        
        Args:
            value: The value to encrypt
            dialect: The SQLAlchemy dialect
            
        Returns:
            Encrypted value as a string
        """
        if value is None:
            return None
            
        # Encrypt the value
        return self.encryption_service.encrypt(value)
    
    def process_result_value(self, value: Optional[str], dialect) -> Optional[T]:
        """
        Process a value after loading from the database (decrypt).
        
        Args:
            value: The encrypted value
            dialect: The SQLAlchemy dialect
            
        Returns:
            Decrypted value
        """
        if value is None:
            return None
            
        # Decrypt the value
        return self.encryption_service.decrypt(value)

class EncryptedJSON(EncryptedField[Dict[str, Any]]):
    """Field for storing encrypted JSON data."""
    
    def process_bind_param(self, value: Optional[Dict[str, Any]], dialect) -> Optional[str]:
        """Encrypt a JSON object."""
        if value is None:
            return None
            
        # Convert to JSON string
        json_str = json.dumps(value)
        # Encrypt
        return self.encryption_service.encrypt(json_str)
    
    def process_result_value(self, value: Optional[str], dialect) -> Optional[Dict[str, Any]]:
        """Decrypt and parse a JSON object."""
        if value is None:
            return None
            
        # Decrypt
        json_str = self.encryption_service.decrypt(value)
        # Parse JSON
        return json.loads(json_str) if json_str else {}

class EncryptedList(EncryptedField[List[Any]]):
    """Field for storing encrypted lists."""
    
    def process_bind_param(self, value: Optional[List[Any]], dialect) -> Optional[str]:
        """Encrypt a list."""
        if value is None:
            return None
            
        # Convert to JSON string
        json_str = json.dumps(value)
        # Encrypt
        return self.encryption_service.encrypt(json_str)
    
    def process_result_value(self, value: Optional[str], dialect) -> Optional[List[Any]]:
        """Decrypt and parse a list."""
        if value is None:
            return None
            
        # Decrypt
        json_str = self.encryption_service.decrypt(value)
        # Parse JSON
        return json.loads(json_str) if json_str else []

# SQLAlchemy event listeners for encrypted fields
def _setup_encryption_events():
    """
    Set up SQLAlchemy event listeners for encrypted fields.
    This ensures proper encryption/decryption during attribute access.
    """
    pass  # Currently not needed as TypeDecorator handles most cases

# Initialize the event listeners
_setup_encryption_events() 