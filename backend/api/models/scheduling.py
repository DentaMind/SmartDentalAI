from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, JSON, DateTime, Enum, Text, ARRAY, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from api.models.base import Base
import uuid
from datetime import datetime, timedelta
import enum

class ProcedureCategory(str, enum.Enum):
    PREVENTIVE = "preventive"
    RESTORATIVE = "restorative"
    ENDODONTIC = "endodontic"
    PERIODONTAL = "periodontal"
    ORTHODONTIC = "orthodontic"
    PROSTHODONTIC = "prosthodontic"
    SURGICAL = "surgical"
    OTHER = "other"

class AppointmentStatus(str, enum.Enum):
    """Status of an appointment"""
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"
    RESCHEDULED = "rescheduled"

class RecurrenceFrequency(str, enum.Enum):
    """Frequency of recurring appointments"""
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"

class ProviderRole(str, enum.Enum):
    """Types of providers for scheduling"""
    DENTIST = "dentist"
    HYGIENIST = "hygienist"
    ASSISTANT = "assistant"
    ADMINISTRATIVE = "administrative"
    OTHER = "other"

class Procedure(Base):
    """Model for dental procedures with duration tracking."""
    __tablename__ = "procedures"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String, unique=True, nullable=False)  # CDT code
    name = Column(String, nullable=False)
    description = Column(Text)
    category = Column(Enum(ProcedureCategory), nullable=False)
    default_duration_minutes = Column(Integer, nullable=False)
    # Ensure default_duration_minutes is in 15-minute increments
    increment_size = Column(Integer, default=15)  # Default to 15 minutes
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # Relationships
    appointment_procedures = relationship("AppointmentProcedure", back_populates="procedure")
    provider_profiles = relationship("ProviderProfile", back_populates="procedure")

    def __repr__(self):
        return f"<Procedure {self.code}: {self.name}>"

class ProviderProfile(Base):
    """Model for tracking provider-specific procedure durations."""
    __tablename__ = "provider_profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    provider_id = Column(String, ForeignKey("providers.id"), nullable=False)
    procedure_id = Column(String, ForeignKey("procedures.id"), nullable=False)
    duration_modifier = Column(Float, default=1.0)  # 1.0 = default, <1.0 = faster, >1.0 = slower
    average_duration_minutes = Column(Integer)  # Tracked actual average duration
    total_procedures = Column(Integer, default=0)  # Number of procedures performed
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # Relationships
    provider = relationship("Provider", back_populates="provider_profiles")
    procedure = relationship("Procedure", back_populates="provider_profiles")

    def __repr__(self):
        return f"<ProviderProfile {self.provider_id} - {self.procedure_id}>"

class SchedulerColumn(Base):
    """Custom columns for the scheduler view"""
    __tablename__ = "scheduler_columns"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)  # Display name for the column
    order = Column(Integer, nullable=False)  # Order in the scheduler view
    color = Column(String)  # Color for the column
    provider_id = Column(String, ForeignKey("providers.id"), nullable=True)  # Optional link to a specific provider
    role = Column(Enum(ProviderRole), nullable=True)  # Optional specific role
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    provider = relationship("Provider", back_populates="scheduler_column")
    
    def __repr__(self):
        return f"<SchedulerColumn {self.name}>"

class Room(Base):
    """Rooms where appointments take place"""
    __tablename__ = "rooms"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)  # Room name/number
    description = Column(Text)
    floor = Column(String, nullable=True)
    features = Column(ARRAY(String), default=[])  # Equipment/features available in this room
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    appointments = relationship("Appointment", back_populates="room_details")
    
    def __repr__(self):
        return f"<Room {self.name}>"

class AppointmentType(Base):
    """Types of appointments that can be scheduled"""
    __tablename__ = "appointment_types"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text)
    default_duration = Column(Integer, nullable=False)  # Duration in minutes
    color = Column(String)  # Color code for calendar display
    requires_provider = Column(Boolean, default=True)
    allows_side_booking = Column(Boolean, default=False)  # Whether side booking is allowed for this type
    provider_role = Column(Enum(ProviderRole), nullable=True)  # Specific role needed for this appointment
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    appointments = relationship("Appointment", back_populates="appointment_type")
    
    def __repr__(self):
        return f"<AppointmentType {self.name}>"

class Appointment(Base):
    """Appointment information"""
    __tablename__ = "appointments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    provider_id = Column(String, ForeignKey("providers.id"), nullable=True)
    appointment_type_id = Column(String, ForeignKey("appointment_types.id"), nullable=False)
    room_id = Column(String, ForeignKey("rooms.id"), nullable=True)  # Link to specific room
    scheduler_column_id = Column(String, ForeignKey("scheduler_columns.id"), nullable=True)  # For custom column display
    
    # Timing
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    
    # Status
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.SCHEDULED)
    
    # Side booking support
    is_side_booking = Column(Boolean, default=False)  # Whether this is a side-booked appointment
    parent_appointment_id = Column(String, ForeignKey("appointments.id"), nullable=True)  # For side bookings
    
    # Details
    notes = Column(Text)
    location = Column(String)  # General location (e.g., Main Office, Satellite Office)
    room_number = Column(String)  # Legacy room number (use room_id for new integrations)
    
    # Patient quick info (denormalized for hover display)
    patient_quick_info = Column(JSONB, nullable=True)  # Contains basic patient info for hover display
    
    # Recurrence
    is_recurring = Column(Boolean, default=False)
    recurrence_frequency = Column(Enum(RecurrenceFrequency), default=RecurrenceFrequency.NONE)
    recurrence_pattern = Column(JSONB)  # JSON pattern for recurrence
    recurrence_group_id = Column(String)  # ID to group recurring appointments
    
    # Metadata
    created_by = Column(String)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    cancelled_at = Column(DateTime)
    cancellation_reason = Column(Text)
    
    # Relationships
    patient = relationship("Patient", back_populates="appointments")
    provider = relationship("Provider", back_populates="appointments")
    appointment_type = relationship("AppointmentType", back_populates="appointments")
    room_details = relationship("Room", back_populates="appointments")
    scheduler_column = relationship("SchedulerColumn")
    procedures = relationship("AppointmentProcedure", back_populates="appointment", cascade="all, delete-orphan")
    # Side booking relationship
    parent_appointment = relationship("Appointment", remote_side=[id], backref="side_bookings")
    
    def __repr__(self):
        return f"<Appointment {self.id} - {self.start_time}>"
    
    @property
    def duration_minutes(self):
        """Calculate appointment duration in minutes"""
        if not self.start_time or not self.end_time:
            return 0
        delta = self.end_time - self.start_time
        return int(delta.total_seconds() / 60)
    
    def round_to_increment(self, time_value, increment_minutes=15):
        """Round a datetime to the nearest increment"""
        minutes = time_value.hour * 60 + time_value.minute
        rounded_minutes = round(minutes / increment_minutes) * increment_minutes
        
        return time_value.replace(
            hour=rounded_minutes // 60,
            minute=rounded_minutes % 60,
            second=0,
            microsecond=0
        )
    
    def update_patient_quick_info(self, patient_obj):
        """Update the patient_quick_info field with current patient data"""
        if not patient_obj:
            return
            
        self.patient_quick_info = {
            "id": str(patient_obj.id),
            "name": f"{patient_obj.first_name} {patient_obj.last_name}",
            "dob": patient_obj.date_of_birth.isoformat() if patient_obj.date_of_birth else None,
            "phone": patient_obj.phone,
            "email": patient_obj.email,
            "insuranceProvider": getattr(patient_obj, "insurance_provider", None),
            "medicalAlerts": [],  # This would be populated by a separate function
            "lastVisit": getattr(patient_obj, "last_visit", None),
            "preferredLanguage": getattr(patient_obj, "preferred_language", "English"),
        }

class Provider(Base):
    """Provider information for scheduling"""
    __tablename__ = "providers"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=True)  # Link to user account if applicable
    
    # Basic info
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    title = Column(String)  # Dr., Hygienist, etc.
    role = Column(Enum(ProviderRole), nullable=False, default=ProviderRole.OTHER)  # Provider role for scheduling
    specialty = Column(String)
    email = Column(String)
    phone = Column(String)
    
    # Scheduling
    is_active = Column(Boolean, default=True)
    color = Column(String)  # Color for calendar display
    display_name = Column(String)  # Custom name to display in scheduler column
    default_appointment_duration = Column(Integer, default=30)  # In minutes
    column_number = Column(Integer, nullable=True)  # For organizing providers in columns
    max_side_bookings = Column(Integer, default=0)  # Number of allowed side bookings (0 = none)
    default_room_id = Column(String, ForeignKey("rooms.id"), nullable=True)  # Default room for this provider
    
    # Metadata
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    appointments = relationship("Appointment", back_populates="provider")
    availability = relationship("ProviderAvailability", back_populates="provider", cascade="all, delete-orphan")
    provider_profiles = relationship("ProviderProfile", back_populates="provider")
    scheduler_column = relationship("SchedulerColumn", back_populates="provider", uselist=False)
    default_room = relationship("Room")
    
    def __repr__(self):
        return f"<Provider {self.first_name} {self.last_name} ({self.role.value})>"
    
    @property
    def full_name(self):
        """Get the provider's full name"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def scheduler_display_name(self):
        """Get the name to display in the scheduler"""
        if self.display_name:
            return self.display_name
        return self.full_name

class ProviderAvailability(Base):
    """Provider availability schedule"""
    __tablename__ = "provider_availability"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    provider_id = Column(String, ForeignKey("providers.id"), nullable=False)
    
    # Schedule
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(String, nullable=False)  # Format: "HH:MM" 24hr time (will be rounded to 15 min increments)
    end_time = Column(String, nullable=False)  # Format: "HH:MM" 24hr time (will be rounded to 15 min increments)
    
    # Exceptions
    is_exception = Column(Boolean, default=False)  # True if this is an exception to regular schedule
    exception_date = Column(DateTime)  # Date of exception (if is_exception is True)
    
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    provider = relationship("Provider", back_populates="availability")
    
    def __repr__(self):
        if self.is_exception and self.exception_date:
            return f"<ProviderAvailability - Exception on {self.exception_date.strftime('%Y-%m-%d')}>"
        return f"<ProviderAvailability - Day {self.day_of_week}>"

class AppointmentProcedure(Base):
    """Procedures associated with an appointment"""
    __tablename__ = "appointment_procedures"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    appointment_id = Column(String, ForeignKey("appointments.id"), nullable=False)
    procedure_id = Column(String, ForeignKey("procedures.id"), nullable=True)  # Link to procedure definition
    
    # Procedure details
    procedure_code = Column(String, nullable=False)  # CDT code
    procedure_name = Column(String, nullable=False)
    tooth_number = Column(String)
    surface = Column(String)
    quadrant = Column(String)
    estimated_time = Column(Integer)  # Minutes (in 15 min increments)
    notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    appointment = relationship("Appointment", back_populates="procedures")
    procedure = relationship("Procedure", back_populates="appointment_procedures")
    
    def __repr__(self):
        return f"<AppointmentProcedure {self.procedure_code}>"

class WaitingList(Base):
    """Patient waiting list for appointments"""
    __tablename__ = "waiting_list"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    appointment_type_id = Column(String, ForeignKey("appointment_types.id"), nullable=False)
    
    # Request details
    requested_provider_id = Column(String, ForeignKey("providers.id"), nullable=True)
    provider_role = Column(Enum(ProviderRole), nullable=True)  # If patient prefers a specific role type
    preferred_days = Column(ARRAY(Integer))  # Array of days of week (0=Monday, 6=Sunday)
    preferred_time_start = Column(String)  # Format: "HH:MM" 24hr time
    preferred_time_end = Column(String)  # Format: "HH:MM" 24hr time
    requested_date = Column(DateTime)  # Specific date if any
    room_preference = Column(String, ForeignKey("rooms.id"), nullable=True)  # If they have a preferred room
    
    # Status
    priority = Column(Integer, default=0)  # Higher number = higher priority
    accepts_side_booking = Column(Boolean, default=False)  # Whether patient accepts side booking
    notes = Column(Text)
    is_filled = Column(Boolean, default=False)
    filled_appointment_id = Column(String, ForeignKey("appointments.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    patient = relationship("Patient")
    appointment_type = relationship("AppointmentType")
    requested_provider = relationship("Provider")
    preferred_room = relationship("Room")
    
    def __repr__(self):
        return f"<WaitingList {self.id} - {'Filled' if self.is_filled else 'Pending'}>"

class CancellationList(Base):
    """Model for tracking patients who want to be notified of earlier appointments."""
    __tablename__ = "cancellation_lists"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    appointment_type_id = Column(String, ForeignKey("appointment_types.id"), nullable=False)
    preferred_days = Column(JSONB)  # List of preferred days of week
    preferred_times = Column(JSONB)  # List of preferred time ranges
    earliest_date = Column(DateTime)  # Earliest date they can come in
    latest_date = Column(DateTime)  # Latest date they can come in
    accepts_side_booking = Column(Boolean, default=False)  # Whether patient accepts side booking
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # Relationships
    patient = relationship("Patient")
    appointment_type = relationship("AppointmentType")

    def __repr__(self):
        return f"<CancellationList {self.patient_id} - {self.appointment_type_id}>" 