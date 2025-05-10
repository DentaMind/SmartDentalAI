from sqlalchemy import Column, String, DateTime, JSON, Enum as SQLEnum
from sqlalchemy.sql import func
from ..models.prescriptions import PrescriptionStatus
from .base import Base

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(String, primary_key=True)
    patient_id = Column(String, nullable=False)
    medications = Column(JSON, nullable=False)
    notes = Column(String, nullable=True)
    status = Column(SQLEnum(PrescriptionStatus), nullable=False, default=PrescriptionStatus.DRAFT)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String, nullable=False)
    updated_by = Column(String, nullable=True)
    filled_by = Column(String, nullable=True)
    filled_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False) 