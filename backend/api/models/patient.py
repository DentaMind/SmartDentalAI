from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, Enum, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from datetime import datetime

from .base import Base
from .encrypted_fields import EncryptedField, EncryptedJSON

class Gender(str, enum.Enum):
    """Patient gender"""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    UNKNOWN = "unknown"

class InsuranceType(str, enum.Enum):
    """Types of insurance"""
    PRIVATE = "private"
    MEDICARE = "medicare"
    MEDICAID = "medicaid"
    SELF_PAY = "self_pay"
    OTHER = "other"

class Patient(Base):
    """Patient information model"""
    __tablename__ = "patients"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Basic information - ENCRYPTED sensitive information
    first_name = Column(String, nullable=False)  # Keep non-encrypted for filtering/sorting
    last_name = Column(String, nullable=False)   # Keep non-encrypted for filtering/sorting
    first_name_encrypted = Column(EncryptedField(String), nullable=True)  # For full HIPAA compliance
    last_name_encrypted = Column(EncryptedField(String), nullable=True)   # For full HIPAA compliance
    date_of_birth = Column(DateTime, nullable=False)  # Keep non-encrypted for age calculations
    date_of_birth_encrypted = Column(EncryptedField(String), nullable=True)  # For full HIPAA compliance
    gender = Column(Enum(Gender), default=Gender.UNKNOWN)
    
    # ENCRYPTED Social Security Number (SSN)
    ssn_encrypted = Column(EncryptedField(String), nullable=True)
    
    # Contact information
    email = Column(String)
    phone = Column(String)
    address_encrypted = Column(EncryptedField(String), nullable=True)  # ENCRYPTED
    city = Column(String)
    state = Column(String)
    zip_code = Column(String)
    
    # Insurance information
    insurance_provider = Column(String)
    insurance_id_encrypted = Column(EncryptedField(String), nullable=True)  # ENCRYPTED
    insurance_group = Column(String)
    insurance_type = Column(Enum(InsuranceType), default=InsuranceType.OTHER)
    
    # Account information
    account_number = Column(String, unique=True)
    registration_date = Column(DateTime, default=datetime.now)
    
    # Status and metadata
    is_active = Column(Boolean, default=True)
    preferred_language = Column(String, default="English")
    preferred_contact_method = Column(String, default="email")
    emergency_contact_name_encrypted = Column(EncryptedField(String), nullable=True)  # ENCRYPTED
    emergency_contact_phone_encrypted = Column(EncryptedField(String), nullable=True)  # ENCRYPTED
    
    # Clinical notes - encrypted to protect PHI
    clinical_notes_encrypted = Column(EncryptedField(Text), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    last_visit = Column(DateTime)
    
    # Relationships
    medical_history = relationship("MedicalHistory", back_populates="patient", uselist=False, cascade="all, delete-orphan")
    allergies = relationship("Allergy", back_populates="patient", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="patient", cascade="all, delete-orphan")
    medical_history_status = relationship("MedicalHistoryStatus", back_populates="patient", uselist=False, cascade="all, delete-orphan")
    
    # Notification relationships
    notifications = relationship("PatientNotification", back_populates="patient", cascade="all, delete-orphan")
    notification_preferences = relationship("PatientNotificationPreference", back_populates="patient", cascade="all, delete-orphan")
    
    # Recall schedules relationship
    recall_schedules = relationship("PatientRecallSchedule", back_populates="patient", cascade="all, delete-orphan")
    
    # Patient intake form relationship
    intake_forms = relationship("PatientIntakeForm", back_populates="patient", cascade="all, delete-orphan")
    
    # Properties for accessing encrypted fields
    @property
    def ssn(self):
        """Get decrypted SSN"""
        return self.ssn_encrypted
    
    @ssn.setter
    def ssn(self, value):
        """Set encrypted SSN"""
        self.ssn_encrypted = value
    
    @property
    def address(self):
        """Get decrypted address"""
        return self.address_encrypted
    
    @address.setter
    def address(self, value):
        """Set encrypted address"""
        self.address_encrypted = value
    
    @property
    def insurance_id(self):
        """Get decrypted insurance ID"""
        return self.insurance_id_encrypted
    
    @insurance_id.setter
    def insurance_id(self, value):
        """Set encrypted insurance ID"""
        self.insurance_id_encrypted = value
    
    @property
    def emergency_contact_name(self):
        """Get decrypted emergency contact name"""
        return self.emergency_contact_name_encrypted
    
    @emergency_contact_name.setter
    def emergency_contact_name(self, value):
        """Set encrypted emergency contact name"""
        self.emergency_contact_name_encrypted = value
    
    @property
    def emergency_contact_phone(self):
        """Get decrypted emergency contact phone"""
        return self.emergency_contact_phone_encrypted
    
    @emergency_contact_phone.setter
    def emergency_contact_phone(self, value):
        """Set encrypted emergency contact phone"""
        self.emergency_contact_phone_encrypted = value
    
    @property
    def clinical_notes(self):
        """Get decrypted clinical notes"""
        return self.clinical_notes_encrypted
    
    @clinical_notes.setter
    def clinical_notes(self, value):
        """Set encrypted clinical notes"""
        self.clinical_notes_encrypted = value
    
    def __repr__(self):
        return f"<Patient {self.first_name} {self.last_name}, DOB: {self.date_of_birth}>"
    
    def sync_encrypted_fields(self):
        """
        Sync the plaintext fields to encrypted fields.
        
        This is useful when migrating existing data to the encrypted format.
        """
        self.first_name_encrypted = self.first_name
        self.last_name_encrypted = self.last_name
        if self.date_of_birth:
            self.date_of_birth_encrypted = self.date_of_birth.isoformat() 