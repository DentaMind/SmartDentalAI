from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class EmailBase(BaseModel):
    to: str
    subject: str
    body: str
    cc: Optional[str] = None
    bcc: Optional[str] = None
    priority: str = "normal"
    category: str = "general"
    attachments: Optional[List[str]] = None

class EmailCreate(EmailBase):
    pass

class EmailResponse(EmailBase):
    id: int
    date: datetime
    is_read: bool
    is_starred: bool

    class Config:
        orm_mode = True

class EmailTemplateBase(BaseModel):
    name: str
    subject: str
    body: str
    variables: Optional[List[str]] = None

class EmailTemplateCreate(EmailTemplateBase):
    pass

class EmailTemplateResponse(EmailTemplateBase):
    id: int

    class Config:
        orm_mode = True

class EmailStats(BaseModel):
    total: int
    unread: int
    starred: int 