from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .base import Base

class TreatmentStatus(enum.Enum):
    PLANNED = "planned"
    CONSENT_SIGNED = "consent_signed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TreatmentPlan(Base):
    __tablename__ = "treatment_plans"

    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, nullable=False)
    dentist_id = Column(Integer, nullable=False)
    status = Column(Enum(TreatmentStatus), nullable=False, default=TreatmentStatus.PLANNED)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    notes = Column(Text)

    # Consent-related fields
    consent_signed_at = Column(DateTime(timezone=True), nullable=True)
    consent_signed_by = Column(String(255), nullable=True)
    consent_signature_data = Column(Text, nullable=True)  # Base64 encoded signature image
    consent_ip_address = Column(String(45), nullable=True)  # IPv6 addresses can be up to 45 chars

    procedures = relationship("TreatmentPlanProcedure", back_populates="treatment_plan")

    def sign_consent(self, signed_by: str, signature_data: str, ip_address: str) -> None:
        """Sign the treatment plan consent form."""
        self.status = TreatmentStatus.CONSENT_SIGNED
        self.consent_signed_at = func.now()
        self.consent_signed_by = signed_by
        self.consent_signature_data = signature_data
        self.consent_ip_address = ip_address

    @property
    def is_locked(self) -> bool:
        """Check if the treatment plan is locked for editing."""
        return self.status in (TreatmentStatus.CONSENT_SIGNED, TreatmentStatus.IN_PROGRESS, TreatmentStatus.COMPLETED)

class TreatmentPlanProcedure(Base):
    __tablename__ = "treatment_plan_procedures"

    id = Column(Integer, primary_key=True)
    treatment_plan_id = Column(Integer, ForeignKey("treatment_plans.id"), nullable=False)
    procedure_code = Column(String(10), nullable=False)  # ADA/CDT code
    tooth_number = Column(String(2))  # Universal numbering system
    surface = Column(String(5))  # M, O, D, F/B, L
    description = Column(Text, nullable=False)
    fee = Column(Float, nullable=False)
    status = Column(Enum(TreatmentStatus), nullable=False, default=TreatmentStatus.PLANNED)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    treatment_plan = relationship("TreatmentPlan", back_populates="procedures") 