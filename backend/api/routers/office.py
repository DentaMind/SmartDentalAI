from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case
from ..database import get_db
from ..models.office import OfficeSettings, EmployeeTimeClock, TimeClockBreak, User
from ..schemas.office import (
    OfficeSettingsCreate,
    OfficeSettingsUpdate,
    OfficeSettingsResponse,
    EmployeeTimeClockCreate,
    EmployeeTimeClockUpdate,
    EmployeeTimeClockResponse,
    TimeClockBreakCreate,
    TimeClockBreakResponse,
    TimeClockSummary,
    TimeClockExport,
    OfficeExport,
    TimeClockEntryResponse,
    TimeClockSummaryResponse,
    TimeClockAnalyticsResponse,
    TimeClockExportResponse,
)
from ..auth import get_current_user
from ..models.user import User
from ..utils import calculate_hours_worked

router = APIRouter(prefix="/office", tags=["office"])

@router.get("/settings", response_model=OfficeSettingsResponse)
async def get_office_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current office settings"""
    settings = db.query(OfficeSettings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Office settings not found")
    return settings

@router.put("/settings", response_model=OfficeSettingsResponse)
async def update_office_settings(
    settings: OfficeSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update office settings"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can update office settings")
    
    db_settings = db.query(OfficeSettings).first()
    if not db_settings:
        db_settings = OfficeSettings(**settings.dict())
        db.add(db_settings)
    else:
        for key, value in settings.dict().items():
            setattr(db_settings, key, value)
    
    db.commit()
    db.refresh(db_settings)
    return db_settings

@router.post("/timeclock/clock-in", response_model=EmployeeTimeClockResponse)
async def clock_in(
    timeclock: EmployeeTimeClockCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clock in an employee"""
    # Check if employee is already clocked in
    active_clock = db.query(EmployeeTimeClock).filter(
        EmployeeTimeClock.employee_id == timeclock.employee_id,
        EmployeeTimeClock.clock_out_time == None
    ).first()
    
    if active_clock:
        raise HTTPException(status_code=400, detail="Employee is already clocked in")
    
    new_clock = EmployeeTimeClock(**timeclock.dict())
    db.add(new_clock)
    db.commit()
    db.refresh(new_clock)
    return new_clock

@router.put("/timeclock/{clock_id}/clock-out", response_model=EmployeeTimeClockResponse)
async def clock_out(
    clock_id: str,
    timeclock: EmployeeTimeClockUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clock out an employee"""
    db_clock = db.query(EmployeeTimeClock).filter(EmployeeTimeClock.id == clock_id).first()
    if not db_clock:
        raise HTTPException(status_code=404, detail="Time clock entry not found")
    
    if db_clock.clock_out_time:
        raise HTTPException(status_code=400, detail="Employee is already clocked out")
    
    for key, value in timeclock.dict().items():
        setattr(db_clock, key, value)
    
    # Calculate total hours
    if db_clock.clock_out_time:
        duration = db_clock.clock_out_time - db_clock.clock_in_time
        db_clock.total_hours = round(duration.total_seconds() / 3600, 2)
    
    db.commit()
    db.refresh(db_clock)
    return db_clock

@router.post("/timeclock/{clock_id}/breaks", response_model=TimeClockBreakResponse)
async def add_break(
    clock_id: str,
    break_data: TimeClockBreakCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a break to a time clock entry"""
    db_clock = db.query(EmployeeTimeClock).filter(EmployeeTimeClock.id == clock_id).first()
    if not db_clock:
        raise HTTPException(status_code=404, detail="Time clock entry not found")
    
    new_break = TimeClockBreak(**break_data.dict(), timeclock_id=clock_id)
    db.add(new_break)
    
    # Update breaks count
    db_clock.breaks_taken += 1
    
    db.commit()
    db.refresh(new_break)
    return new_break

@router.get("/timeclock/summary", response_model=List[TimeClockSummary])
async def get_timeclock_summary(
    start_date: datetime = Query(..., description="Start date for summary"),
    end_date: datetime = Query(..., description="End date for summary"),
    employee_ids: Optional[List[str]] = Query(None, description="Filter by employee IDs"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get time clock summary for specified period"""
    query = db.query(EmployeeTimeClock).filter(
        EmployeeTimeClock.clock_in_time >= start_date,
        EmployeeTimeClock.clock_in_time <= end_date
    )
    
    if employee_ids:
        query = query.filter(EmployeeTimeClock.employee_id.in_(employee_ids))
    
    timeclocks = query.all()
    return timeclocks

@router.post("/timeclock/export")
async def export_timeclock_data(
    export_data: TimeClockExport,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export time clock data"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can export time clock data")
    
    query = db.query(EmployeeTimeClock).filter(
        EmployeeTimeClock.clock_in_time >= export_data.start_date,
        EmployeeTimeClock.clock_in_time <= export_data.end_date
    )
    
    if export_data.employee_ids:
        query = query.filter(EmployeeTimeClock.employee_id.in_(export_data.employee_ids))
    
    timeclocks = query.all()
    
    # TODO: Implement export logic based on format
    return {"message": "Export functionality to be implemented"}

@router.post("/export")
async def export_office_data(
    export_data: OfficeExport,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export office data"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can export office data")
    
    # TODO: Implement export logic based on format and included data
    return {"message": "Export functionality to be implemented"}

@router.get("/timeclock/summary", response_model=List[TimeClockEntryResponse])
async def get_time_clock_summary(
    start_date: datetime = Query(..., description="Start date for the summary"),
    end_date: datetime = Query(..., description="End date for the summary"),
    employee_id: Optional[str] = Query(None, description="Filter by employee ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get time clock entries summary for the specified date range.
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can view time clock summaries")

    query = db.query(EmployeeTimeClock).join(User).filter(
        EmployeeTimeClock.clock_in_time >= start_date,
        EmployeeTimeClock.clock_in_time <= end_date
    )

    if employee_id:
        query = query.filter(EmployeeTimeClock.employee_id == employee_id)

    entries = query.order_by(EmployeeTimeClock.clock_in_time.desc()).all()
    return entries

@router.get("/timeclock/analytics", response_model=TimeClockAnalyticsResponse)
async def get_time_clock_analytics(
    start_date: datetime = Query(..., description="Start date for analytics"),
    end_date: datetime = Query(..., description="End date for analytics"),
    employee_id: Optional[str] = Query(None, description="Filter by employee ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get time clock analytics for the specified date range.
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can view time clock analytics")

    # Base query for time entries
    time_query = db.query(EmployeeTimeClock).filter(
        EmployeeTimeClock.clock_in_time >= start_date,
        EmployeeTimeClock.clock_in_time <= end_date
    )

    if employee_id:
        time_query = time_query.filter(EmployeeTimeClock.employee_id == employee_id)

    # Calculate total entries and hours
    total_entries = time_query.count()
    total_hours = db.query(
        func.sum(
            case(
                [
                    (
                        EmployeeTimeClock.clock_out_time.isnot(None),
                        func.extract('epoch', EmployeeTimeClock.clock_out_time - EmployeeTimeClock.clock_in_time) / 3600
                    )
                ],
                else_=0
            )
        )
    ).scalar() or 0

    # Calculate average hours per day
    days_in_range = (end_date - start_date).days + 1
    average_hours_per_day = total_hours / days_in_range if days_in_range > 0 else 0

    # Break analysis
    break_query = db.query(TimeClockBreak).join(EmployeeTimeClock).filter(
        EmployeeTimeClock.clock_in_time >= start_date,
        EmployeeTimeClock.clock_in_time <= end_date
    )

    if employee_id:
        break_query = break_query.filter(EmployeeTimeClock.employee_id == employee_id)

    total_breaks = break_query.count()
    break_types = db.query(
        TimeClockBreak.break_type,
        func.count(TimeClockBreak.id)
    ).group_by(TimeClockBreak.break_type).all()

    # Calculate average break duration
    avg_break_duration = db.query(
        func.avg(
            func.extract('epoch', TimeClockBreak.break_end - TimeClockBreak.break_start) / 60
        )
    ).scalar() or 0

    # Employee summaries
    employee_summaries = db.query(
        User.id.label('employee_id'),
        User.full_name.label('employee_name'),
        func.sum(
            case(
                [
                    (
                        EmployeeTimeClock.clock_out_time.isnot(None),
                        func.extract('epoch', EmployeeTimeClock.clock_out_time - EmployeeTimeClock.clock_in_time) / 3600
                    )
                ],
                else_=0
            )
        ).label('total_hours'),
        func.count(EmployeeTimeClock.id).label('entries_count')
    ).join(EmployeeTimeClock).filter(
        EmployeeTimeClock.clock_in_time >= start_date,
        EmployeeTimeClock.clock_in_time <= end_date
    ).group_by(User.id, User.full_name).all()

    return TimeClockAnalyticsResponse(
        total_entries=total_entries,
        total_hours=total_hours,
        average_hours_per_day=average_hours_per_day,
        break_analysis={
            "total_breaks": total_breaks,
            "average_break_duration": avg_break_duration,
            "break_types": dict(break_types)
        },
        employee_summaries=[
            {
                "employee_id": summary.employee_id,
                "employee_name": summary.employee_name,
                "total_hours": summary.total_hours or 0,
                "entries_count": summary.entries_count
            }
            for summary in employee_summaries
        ]
    )

@router.get("/timeclock/export", response_model=TimeClockExportResponse)
async def export_time_clock_data(
    start_date: datetime = Query(..., description="Start date for export"),
    end_date: datetime = Query(..., description="End date for export"),
    employee_id: Optional[str] = Query(None, description="Filter by employee ID"),
    format: str = Query("csv", description="Export format (csv or json)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export time clock data for the specified date range.
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can export time clock data")

    query = db.query(EmployeeTimeClock).join(User).filter(
        EmployeeTimeClock.clock_in_time >= start_date,
        EmployeeTimeClock.clock_in_time <= end_date
    )

    if employee_id:
        query = query.filter(EmployeeTimeClock.employee_id == employee_id)

    entries = query.order_by(EmployeeTimeClock.clock_in_time).all()

    if format.lower() == "csv":
        # Generate CSV content
        csv_content = "Employee,Clock In,Clock Out,Total Hours,Breaks,Status,Notes\n"
        for entry in entries:
            csv_content += f"{entry.user.full_name},"
            csv_content += f"{entry.clock_in_time},"
            csv_content += f"{entry.clock_out_time or 'In Progress'},"
            csv_content += f"{entry.total_hours or '-'},"
            csv_content += f"{entry.breaks_taken},"
            csv_content += f"{'Adjusted' if entry.is_manual_adjustment else 'Normal'},"
            csv_content += f"{entry.notes or ''}\n"

        return TimeClockExportResponse(
            content=csv_content,
            content_type="text/csv",
            filename=f"timeclock-export-{datetime.now().strftime('%Y-%m-%d')}.csv"
        )
    else:
        # Return JSON response
        return TimeClockExportResponse(
            content=[entry.dict() for entry in entries],
            content_type="application/json",
            filename=f"timeclock-export-{datetime.now().strftime('%Y-%m-%d')}.json"
        ) 