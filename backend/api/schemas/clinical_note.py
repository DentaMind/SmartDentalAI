from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum

# Enum definitions
class NoteType(str, Enum):
    EXAMINATION = "examination"
    FINDINGS = "findings"
    PROCEDURE = "procedure"
    TREATMENT_PLAN = "treatment_plan"
    FOLLOWUP = "followup"
    GENERAL = "general"

class NoteStatus(str, Enum):
    DRAFT = "draft"
    FINAL = "final"
    AMENDED = "amended"
    DELETED = "deleted"

# Base schemas
class NoteBase(BaseModel):
    title: str
    type: NoteType = NoteType.GENERAL
    content: str
    metadata: Optional[Dict[str, Any]] = None

# Schema for creating new notes
class NoteCreate(NoteBase):
    patient_id: str
    status: NoteStatus = NoteStatus.DRAFT

# Schema for updating existing notes
class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    status: Optional[NoteStatus] = None

# Schema for approving notes
class NoteApprove(BaseModel):
    edits: Optional[Dict[str, Any]] = None
    approved_by: str

# Schema for responses
class NoteResponse(NoteBase):
    id: str
    patient_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    status: NoteStatus
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    source: Optional[str] = None
    is_ai_generated: bool = False
    
    class Config:
        orm_mode = True

# Schema for listing notes
class NoteSummary(BaseModel):
    id: str
    title: str
    type: NoteType
    created_at: datetime
    status: NoteStatus
    is_ai_generated: bool = False
    
    class Config:
        orm_mode = True

# Schema for filtering notes
class NoteFilter(BaseModel):
    patient_id: Optional[str] = None
    type: Optional[NoteType] = None
    status: Optional[NoteStatus] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    is_ai_generated: Optional[bool] = None 