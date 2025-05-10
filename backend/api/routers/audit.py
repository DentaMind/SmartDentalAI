from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..core.security import get_current_user
from ..services.audit_service import AuditService
from ..services.export_service import ExportService
from ..schemas.audit import (
    AuditLogResponse,
    AuditLogListResponse,
    AuditLogFilter,
    AuditLogExportResponse
)

router = APIRouter(prefix="/audit", tags=["audit"])

@router.get("/logs", response_model=AuditLogListResponse)
async def get_audit_logs(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get paginated audit logs with optional filtering.
    Only accessible by users with admin role.
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to view audit logs")

    filters = AuditLogFilter(
        action=action,
        entity_type=entity_type,
        search=search,
        start_date=start_date,
        end_date=end_date
    )

    audit_service = AuditService(db)
    logs, total = audit_service.get_audit_logs(page, per_page, filters)

    return {
        "logs": logs,
        "total": total,
        "page": page,
        "per_page": per_page
    }

@router.get("/logs/{log_id}", response_model=AuditLogResponse)
async def get_audit_log(
    log_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific audit log by ID.
    Only accessible by users with admin role.
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to view audit logs")

    audit_service = AuditService(db)
    log = audit_service.get_audit_log(log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Audit log not found")

    return log

@router.get("/logs/export", response_model=AuditLogExportResponse)
async def export_audit_logs(
    request: Request,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export audit logs as CSV.
    Only accessible by users with admin role.
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to export audit logs")

    filters = AuditLogFilter(
        action=action,
        entity_type=entity_type,
        search=search,
        start_date=start_date,
        end_date=end_date
    )

    audit_service = AuditService(db)
    logs = audit_service.export_audit_logs(filters)

    # Generate CSV content
    import csv
    from io import StringIO
    
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Timestamp", "User ID", "Action", "Entity Type", "Entity ID",
        "IP Address", "Details"
    ])
    
    # Write data
    for log in logs:
        writer.writerow([
            log["timestamp"],
            log["user_id"],
            log["action"],
            log["entity_type"],
            log["entity_id"],
            log["ip_address"],
            str(log["details"])
        ])
    
    content = output.getvalue()
    output.close()
    
    return {
        "filename": f"audit_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
        "content": content
    }

@router.get("/logs/user/{user_id}", response_model=AuditLogListResponse)
async def get_user_audit_logs(
    user_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get audit logs for a specific user.
    Only accessible by users with admin role or the user themselves.
    """
    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view these audit logs")

    audit_service = AuditService(db)
    logs, total = audit_service.get_user_audit_logs(user_id, page, per_page)

    return {
        "logs": logs,
        "total": total,
        "page": page,
        "per_page": per_page
    }

@router.get("/logs/entity/{entity_type}/{entity_id}", response_model=AuditLogListResponse)
async def get_entity_audit_logs(
    entity_type: str,
    entity_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get audit logs for a specific entity.
    Only accessible by users with admin role.
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to view entity audit logs")

    audit_service = AuditService(db)
    logs, total = audit_service.get_entity_audit_logs(entity_type, entity_id, page, per_page)

    return {
        "logs": logs,
        "total": total,
        "page": page,
        "per_page": per_page
    }

@router.get("/export/csv")
async def export_audit_logs_csv(
    request: Request,
    event_type: Optional[str] = None,
    user_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export audit logs to CSV format.
    Only accessible by users with admin role.
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to export audit logs")
    
    # Log the export action
    await AuditService.log_event(
        db=db,
        event_type="system",
        action="export_audit_logs",
        user_id=current_user.id,
        user_role=current_user.role,
        request=request
    )
    
    # Generate CSV file
    csv_data = ExportService.export_audit_logs_csv(
        db=db,
        event_type=event_type,
        user_id=user_id,
        resource_type=resource_type,
        from_date=start_date,
        to_date=end_date
    )
    
    # Create filename with current timestamp
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"audit_logs_export_{timestamp}.csv"
    
    # Return CSV file as attachment
    return Response(
        content=csv_data.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@router.get("/export/json")
async def export_audit_logs_json(
    request: Request,
    event_type: Optional[str] = None,
    user_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export audit logs to JSON format.
    Only accessible by users with admin role.
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to export audit logs")
    
    # Log the export action
    await AuditService.log_event(
        db=db,
        event_type="system",
        action="export_audit_logs",
        user_id=current_user.id,
        user_role=current_user.role,
        request=request
    )
    
    # Generate JSON data
    json_data = ExportService.export_audit_logs_json(
        db=db,
        event_type=event_type,
        user_id=user_id,
        resource_type=resource_type,
        from_date=start_date,
        to_date=end_date
    )
    
    # Create filename with current timestamp
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"audit_logs_export_{timestamp}.json"
    
    # Return JSON file as attachment
    return Response(
        content=json_data,
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@router.get("/diagnostic/export/csv")
async def export_diagnostic_logs_csv(
    request: Request,
    patient_id: Optional[str] = None,
    provider_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export diagnostic logs to CSV format.
    Only accessible by users with admin role or providers for their own logs.
    """
    # Check authorization
    if not current_user.is_admin:
        if current_user.role != "provider" or (provider_id and provider_id != current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to export these diagnostic logs")
    
    # Log the export action
    await AuditService.log_event(
        db=db,
        event_type="system",
        action="export_diagnostic_logs",
        user_id=current_user.id,
        user_role=current_user.role,
        request=request
    )
    
    # Generate CSV file
    csv_data = ExportService.export_diagnostic_logs_csv(
        db=db,
        patient_id=patient_id,
        provider_id=provider_id,
        from_date=start_date,
        to_date=end_date
    )
    
    # Create filename with current timestamp
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"diagnostic_logs_export_{timestamp}.csv"
    
    # Return CSV file as attachment
    return Response(
        content=csv_data.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    ) 