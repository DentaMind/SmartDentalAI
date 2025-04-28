from sqlalchemy import Column, String, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from .base import Base
from ..api.models.prescriptions import PrescriptionStatus

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False)
    doctor_id = Column(String, ForeignKey("users.id"), nullable=False)
    medication = Column(String, nullable=False)
    dosage = Column(String, nullable=False)
    frequency = Column(String, nullable=False)
    duration = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    status = Column(Enum(PrescriptionStatus), default=PrescriptionStatus.PENDING, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    patient = relationship("Patient", back_populates="prescriptions")
    case = relationship("Case", back_populates="prescriptions")
    doctor = relationship("User", back_populates="prescriptions") 