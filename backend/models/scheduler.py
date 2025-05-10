from datetime import datetime, time
from typing import List, Optional
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, Text, Time,
    ForeignKey, Enum, ARRAY, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import text
import enum

from database import Base

class ProviderType(enum.Enum):
    dentist = "dentist"
    hygienist = "hygienist"
    specialist = "specialist"
    virtual = "virtual"

class AppointmentStatus(enum.Enum):
    scheduled = "scheduled"
    confirmed = "confirmed"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"

class Provider(Base):
    __tablename__ = "providers"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(Enum(ProviderType), nullable=False)
    specialties = Column(ARRAY(String(50)))
    default_appointment_duration = Column(Integer, nullable=False, server_default="30")
    allow_double_booking = Column(Boolean, nullable=False, server_default="false")
    active_locations = Column(ARRAY(Integer), nullable=False)
    calendar_color = Column(String(7), nullable=False)
    scheduling_notes = Column(Text)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"))

    # Relationships
    user = relationship("User", back_populates="provider")
    availability = relationship("ProviderAvailability", back_populates="provider")
    time_off = relationship("ProviderTimeOff", back_populates="provider")
    appointments = relationship("Appointment", back_populates="provider")

class ProviderAvailability(Base):
    __tablename__ = "provider_availability"

    id = Column(Integer, primary_key=True)
    provider_id = Column(Integer, ForeignKey("providers.id", ondelete="CASCADE"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0 = Sunday, 6 = Saturday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_active = Column(Boolean, nullable=False, server_default="true")
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"))

    # Relationships
    provider = relationship("Provider", back_populates="availability")
    location = relationship("Location")

class ProviderTimeOff(Base):
    __tablename__ = "provider_time_off"

    id = Column(Integer, primary_key=True)
    provider_id = Column(Integer, ForeignKey("providers.id", ondelete="CASCADE"), nullable=False)
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=False)
    reason = Column(String(200))
    is_all_day = Column(Boolean, nullable=False, server_default="false")
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"))

    # Relationships
    provider = relationship("Provider", back_populates="time_off")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    provider_id = Column(Integer, ForeignKey("providers.id", ondelete="CASCADE"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    operatory_id = Column(Integer, ForeignKey("operatories.id", ondelete="SET NULL"))
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    appointment_type = Column(String(50), nullable=False)
    status = Column(Enum(AppointmentStatus), nullable=False)
    notes = Column(Text)
    group_id = Column(String(36))  # For linked family appointments
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"))

    # Analytics fields
    cancellation_reason = Column(String(200))
    cancellation_datetime = Column(DateTime)
    confirmation_datetime = Column(DateTime)
    check_in_datetime = Column(DateTime)
    completion_datetime = Column(DateTime)

    # Relationships
    patient = relationship("Patient", back_populates="appointments")
    provider = relationship("Provider", back_populates="appointments")
    location = relationship("Location", back_populates="appointments")
    operatory = relationship("Operatory", back_populates="appointments")
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])
    history = relationship("AppointmentHistory", back_populates="appointment")

class AppointmentHistory(Base):
    __tablename__ = "appointment_history"

    id = Column(Integer, primary_key=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(50), nullable=False)
    changes = Column(JSON, nullable=False)
    performed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))

    # Relationships
    appointment = relationship("Appointment", back_populates="history")
    user = relationship("User") 