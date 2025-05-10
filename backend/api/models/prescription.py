from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from enum import Enum as PyEnum
from typing import List, Optional

from ..database import Base

class PrescriptionStatus(str, PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    SENT = "sent"
    FILLED = "filled"
    DECLINED = "declined"
    CANCELLED = "cancelled"

class PrescriptionItem(Base):
    """
    Model for prescription items (medications)
    """
    __tablename__ = "prescription_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prescription_id = Column(UUID(as_uuid=True), ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False)
    medication_name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)
    form = Column(String, nullable=False)
    route = Column(String, nullable=False)
    frequency = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    days_supply = Column(Integer)
    refills = Column(Integer, default=0)
    dispense_as_written = Column(Boolean, default=False)
    notes = Column(Text)
    
    # Relationship back to prescription
    prescription = relationship("Prescription", back_populates="items")
    
    def __repr__(self):
        return f"<PrescriptionItem {self.id}: {self.medication_name}>"

class Prescription(Base):
    """
    Model for prescriptions
    """
    __tablename__ = "prescriptions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(String, nullable=False)
    provider_id = Column(String, nullable=False)
    prescription_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    status = Column(
        Enum(PrescriptionStatus), 
        nullable=False, 
        default=PrescriptionStatus.PENDING
    )
    treatment_plan_id = Column(String)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    sent_date = Column(DateTime)
    filled_date = Column(DateTime)
    notes = Column(Text)
    
    # Relationships
    items = relationship("PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Prescription {self.id}: {self.status.value}>"
    
    @property
    def has_warnings(self) -> bool:
        """
        Check if this prescription has any safety warnings
        This is a computed property that would be populated by calling 
        the prescription validation service
        """
        # In a real implementation, this would check a related table
        # or call the validation service
        return False
    
    @property
    def patient_name(self) -> str:
        """
        Get the patient name from the patient ID
        This is a computed property that would be populated from the patient table
        """
        # In a real implementation, this would look up the patient's name
        # from the patient table using self.patient_id
        return "Patient Name"
    
    @property
    def provider_name(self) -> str:
        """
        Get the provider name from the provider ID
        This is a computed property that would be populated from the provider table
        """
        # In a real implementation, this would look up the provider's name
        # from the provider table using self.provider_id
        return "Provider Name"
    
    @property
    def treatment_plan_name(self) -> Optional[str]:
        """
        Get the treatment plan name from the treatment plan ID
        This is a computed property that would be populated from the treatment plan table
        """
        # In a real implementation, this would look up the treatment plan's name
        # from the treatment plan table using self.treatment_plan_id
        if not self.treatment_plan_id:
            return None
        return "Treatment Plan Name" 