from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, validator
from ..models.office import TimeClockBreak

class BusinessHours(BaseModel):
    start: str
    end: str

class OfficeSettingsBase(BaseModel):
    office_name: str
    office_email: str
    office_phone: str
    address: str
    city: str
    state: str
    zip_code: str
    timezone: str = "America/New_York"
    logo_url: Optional[str] = None
    sms_sender_id: Optional[str] = None
    email_signature: Optional[str] = None
    business_hours: Dict[str, BusinessHours]
    settings_metadata: Optional[Dict[str, Any]] = None

class OfficeSettingsCreate(OfficeSettingsBase):
    pass

class OfficeSettingsUpdate(OfficeSettingsBase):
    pass

class OfficeSettingsResponse(OfficeSettingsBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class TimeClockBreakBase(BaseModel):
    break_start: datetime
    break_end: Optional[datetime] = None
    break_type: str
    notes: Optional[str] = None

class TimeClockBreakCreate(TimeClockBreakBase):
    pass

class TimeClockBreakResponse(TimeClockBreakBase):
    id: str
    timeclock_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class EmployeeTimeClockBase(BaseModel):
    employee_id: str
    clock_in_time: datetime
    clock_out_time: Optional[datetime] = None
    breaks_taken: int = 0
    total_hours: Optional[float] = None
    is_manual_adjustment: bool = False
    adjustment_reason: Optional[str] = None
    adjustment_by: Optional[str] = None
    notes: Optional[str] = None

class EmployeeTimeClockCreate(EmployeeTimeClockBase):
    pass

class EmployeeTimeClockUpdate(BaseModel):
    clock_out_time: Optional[datetime] = None
    is_manual_adjustment: Optional[bool] = None
    adjustment_reason: Optional[str] = None
    adjustment_by: Optional[str] = None
    notes: Optional[str] = None

class EmployeeTimeClockResponse(EmployeeTimeClockBase):
    id: str
    created_at: datetime
    updated_at: datetime
    breaks: List[TimeClockBreakResponse] = []

    class Config:
        orm_mode = True

class TimeClockSummary(BaseModel):
    employee_id: str
    date: str
    total_hours: float
    breaks_taken: int
    clock_in_time: datetime
    clock_out_time: Optional[datetime] = None
    is_manual_adjustment: bool = False

class TimeClockExport(BaseModel):
    start_date: datetime
    end_date: datetime
    employee_ids: Optional[List[str]] = None
    include_breaks: bool = True
    format: str = "csv"  # csv, json, pdf

class OfficeExport(BaseModel):
    include_settings: bool = True
    include_staff: bool = True
    include_patients: bool = True
    include_schedules: bool = True
    format: str = "json"  # json, zip

class TimeClockEntryResponse(BaseModel):
    id: str
    employee_id: str
    employee_name: str
    clock_in_time: datetime
    clock_out_time: Optional[datetime] = None
    breaks_taken: int
    total_hours: Optional[float] = None
    is_manual_adjustment: bool
    adjustment_reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class BreakAnalysis(BaseModel):
    total_breaks: int
    average_break_duration: float
    break_types: Dict[str, int]

class EmployeeSummary(BaseModel):
    employee_id: str
    employee_name: str
    total_hours: float
    entries_count: int

class TimeClockAnalyticsResponse(BaseModel):
    total_entries: int
    total_hours: float
    average_hours_per_day: float
    break_analysis: BreakAnalysis
    employee_summaries: List[EmployeeSummary]

class TimeClockExportResponse(BaseModel):
    content: Any
    content_type: str
    filename: str 