from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float, JSON, Boolean
from sqlalchemy.orm import relationship
from ..models.base import Base

class OfficeSettings(Base):
    """Model for storing office-wide settings and metadata."""
    
    __tablename__ = "office_settings"
    
    id = Column(String, primary_key=True)
    office_name = Column(String, nullable=False)
    office_email = Column(String, nullable=False)
    office_phone = Column(String, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    zip_code = Column(String, nullable=False)
    timezone = Column(String, nullable=False, default="America/New_York")
    logo_url = Column(String, nullable=True)
    sms_sender_id = Column(String, nullable=True)
    email_signature = Column(String, nullable=True)
    business_hours = Column(JSON, nullable=False)  # Store as JSON: {"monday": {"start": "09:00", "end": "17:00"}, ...}
    settings_metadata = Column(JSON, nullable=True)  # For additional settings
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<OfficeSettings {self.office_name}>"

class EmployeeTimeClock(Base):
    """Model for tracking employee time clock entries."""
    
    __tablename__ = "employee_timeclock"
    
    id = Column(String, primary_key=True)
    employee_id = Column(String, ForeignKey("users.id"), nullable=False)
    clock_in_time = Column(DateTime, nullable=False)
    clock_out_time = Column(DateTime, nullable=True)
    breaks_taken = Column(Integer, default=0)  # Number of breaks taken
    total_hours = Column(Float, nullable=True)  # Calculated total hours
    is_manual_adjustment = Column(Boolean, default=False)
    adjustment_reason = Column(String, nullable=True)
    adjustment_by = Column(String, ForeignKey("users.id"), nullable=True)  # Admin who made the adjustment
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    employee = relationship("User", foreign_keys=[employee_id])
    adjusted_by = relationship("User", foreign_keys=[adjustment_by])

    def __repr__(self) -> str:
        return f"<EmployeeTimeClock {self.employee_id} {self.clock_in_time}>"

class TimeClockBreak(Base):
    """Model for tracking individual breaks within a time clock entry."""
    
    __tablename__ = "timeclock_breaks"
    
    id = Column(String, primary_key=True)
    timeclock_id = Column(String, ForeignKey("employee_timeclock.id"), nullable=False)
    break_start = Column(DateTime, nullable=False)
    break_end = Column(DateTime, nullable=True)
    break_type = Column(String, nullable=False)  # lunch, rest, other
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship
    timeclock = relationship("EmployeeTimeClock", back_populates="breaks")

    def __repr__(self) -> str:
        return f"<TimeClockBreak {self.timeclock_id} {self.break_start}>"

# Add back-populates to EmployeeTimeClock
EmployeeTimeClock.breaks = relationship("TimeClockBreak", back_populates="timeclock") 