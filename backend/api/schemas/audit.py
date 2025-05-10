from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class AuditLogBase(BaseModel):
    user_id: str
    action: str
    entity_type: str
    entity_id: str
    ip_address: str
    details: Dict[str, Any]

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogResponse(AuditLogBase):
    id: str
    timestamp: datetime

    class Config:
        orm_mode = True

class AuditLogListResponse(BaseModel):
    logs: List[AuditLogResponse]
    total: int
    page: int
    per_page: int

class AuditLogExportResponse(BaseModel):
    filename: str
    content: str

class AuditLogFilter(BaseModel):
    action: Optional[str] = None
    entity_type: Optional[str] = None
    search: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None 