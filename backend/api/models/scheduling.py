from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, JSON, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from api.models.base import Base
import uuid
from datetime import datetime
import enum

class ProcedureCategory(enum.Enum):
    PREVENTIVE = "preventive"
    RESTORATIVE = "restorative"
    ENDODONTIC = "endodontic"
    PERIODONTAL = "periodontal"
    ORTHODONTIC = "orthodontic"
    PROSTHODONTIC = "prosthodontic"
    SURGICAL = "surgical"
    OTHER = "other"

class AppointmentStatus(enum.Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class Procedure(Base):
    """Model for dental procedures with duration tracking."""
    __tablename__ = "procedures"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String, unique=True, nullable=False)  # CDT code
    name = Column(String, nullable=False)
    description = Column(String)
    category = Column(Enum(ProcedureCategory), nullable=False)
    default_duration_minutes = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    appointments = relationship("Appointment", back_populates="procedure")
    provider_profiles = relationship("ProviderProfile", back_populates="procedure")

    def __repr__(self):
        return f"<Procedure {self.code}: {self.name}>"

class ProviderProfile(Base):
    """Model for tracking provider-specific procedure durations."""
    __tablename__ = "provider_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    procedure_id = Column(UUID(as_uuid=True), ForeignKey("procedures.id"), nullable=False)
    duration_modifier = Column(Float, default=1.0)  # 1.0 = default, <1.0 = faster, >1.0 = slower
    average_duration_minutes = Column(Integer)  # Tracked actual average duration
    total_procedures = Column(Integer, default=0)  # Number of procedures performed
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    provider = relationship("User", back_populates="provider_profiles")
    procedure = relationship("Procedure", back_populates="provider_profiles")

    def __repr__(self):
        return f"<ProviderProfile {self.provider_id} - {self.procedure_id}>"

class Appointment(Base):
    """Enhanced appointment model with procedure and duration tracking."""
    __tablename__ = "appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    procedure_id = Column(UUID(as_uuid=True), ForeignKey("procedures.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.SCHEDULED)
    is_side_booking = Column(Boolean, default=False)
    notes = Column(String)
    metadata = Column(JSON)  # For additional data like cancellation reason, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="appointments")
    provider = relationship("User", back_populates="appointments")
    procedure = relationship("Procedure", back_populates="appointments")

    def __repr__(self):
        return f"<Appointment {self.id}: {self.start_time} - {self.end_time}>"

class CancellationList(Base):
    """Model for tracking patients who want to be notified of earlier appointments."""
    __tablename__ = "cancellation_lists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    procedure_id = Column(UUID(as_uuid=True), ForeignKey("procedures.id"), nullable=False)
    preferred_days = Column(JSON)  # List of preferred days of week
    preferred_times = Column(JSON)  # List of preferred time ranges
    earliest_date = Column(DateTime)  # Earliest date they can come in
    latest_date = Column(DateTime)  # Latest date they can come in
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="cancellation_lists")
    procedure = relationship("Procedure", back_populates="cancellation_lists")

    def __repr__(self):
        return f"<CancellationList {self.patient_id} - {self.procedure_id}>" 