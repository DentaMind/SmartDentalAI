from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, FileResponse
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
from sqlalchemy.orm import Session
import shutil
import os
from pathlib import Path

from api.services.email_service import email_service
from api.middleware.auth import get_current_user
from api.models.user import User
from api.database import get_db
from api.models.email import Email, EmailTemplate
from api.schemas.email import (
    EmailCreate,
    EmailResponse,
    EmailTemplateCreate,
    EmailTemplateResponse,
    EmailStats
)
from api.services.template_loader import template_loader
from api.config import settings

router = APIRouter(prefix="/api/email", tags=["email"])
email_service = email_service

class EmailRequest(BaseModel):
    to: EmailStr
    subject: str
    body: str
    template: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = None

class EmailStats(BaseModel):
    total: int
    categories: Dict[str, int]
    priorities: Dict[str, int]
    processed: int
    errors: int

@router.post("/send", response_model=EmailResponse)
async def send_email(
    to: str = Form(...),
    subject: str = Form(...),
    body: str = Form(...),
    cc: Optional[str] = Form(None),
    bcc: Optional[str] = Form(None),
    priority: str = Form("normal"),
    category: str = Form("general"),
    attachments: List[UploadFile] = File([]),
    db: Session = Depends(get_db)
):
    try:
        # Save attachments
        attachment_paths = []
        for attachment in attachments:
            file_path = Path(settings.ATTACHMENTS_DIR) / f"{datetime.now().timestamp()}_{attachment.filename}"
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(attachment.file, buffer)
            attachment_paths.append(str(file_path))

        # Create email
        email_data = EmailCreate(
            to=to,
            subject=subject,
            body=body,
            cc=cc,
            bcc=bcc,
            priority=priority,
            category=category,
            attachments=attachment_paths
        )
        
        email = email_service.send_email(db, email_data)
        return email
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list", response_model=List[EmailResponse])
async def list_emails(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    emails = email_service.get_emails(db, page=page, limit=limit)
    return emails

@router.get("/{email_id}", response_model=EmailResponse)
async def get_email(email_id: int, db: Session = Depends(get_db)):
    email = email_service.get_email(db, email_id)
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    return email

@router.patch("/{email_id}/read")
async def mark_as_read(email_id: int, db: Session = Depends(get_db)):
    success = email_service.mark_as_read(db, email_id)
    if not success:
        raise HTTPException(status_code=404, detail="Email not found")
    return {"message": "Email marked as read"}

@router.patch("/{email_id}/star")
async def toggle_star(email_id: int, db: Session = Depends(get_db)):
    success = email_service.toggle_star(db, email_id)
    if not success:
        raise HTTPException(status_code=404, detail="Email not found")
    return {"message": "Email star status toggled"}

@router.delete("/{email_id}")
async def delete_email(email_id: int, db: Session = Depends(get_db)):
    success = email_service.delete_email(db, email_id)
    if not success:
        raise HTTPException(status_code=404, detail="Email not found")
    return {"message": "Email deleted"}

@router.get("/templates", response_model=List[EmailTemplateResponse])
async def list_templates():
    return template_loader.get_all_templates()

@router.get("/templates/{template_id}", response_model=EmailTemplateResponse)
async def get_template(template_id: str):
    template = template_loader.get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@router.post("/templates", response_model=EmailTemplateResponse)
async def create_template(template: EmailTemplateCreate):
    success = template_loader.update_template(
        template.name,
        template.subject,
        template.body
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to create template")
    return template_loader.get_template(template.name)

@router.put("/templates/{template_id}", response_model=EmailTemplateResponse)
async def update_template(
    template_id: str,
    template: EmailTemplateCreate
):
    success = template_loader.update_template(
        template_id,
        template.subject,
        template.body
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update template")
    return template_loader.get_template(template_id)

@router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    success = template_loader.delete_template(template_id)
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted"}

@router.get("/stats", response_model=EmailStats)
async def get_stats(db: Session = Depends(get_db)):
    return email_service.get_stats(db)

@router.get("/search", response_model=List[EmailResponse])
async def search_emails(
    q: str,
    db: Session = Depends(get_db)
):
    return email_service.search_emails(db, q)

@router.get("/filter", response_model=List[EmailResponse])
async def filter_emails(
    category: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return email_service.filter_emails(db, category, priority)

@router.get("/{email_id}/attachments/{attachment_id}")
async def get_attachment(
    email_id: int,
    attachment_id: str,
    db: Session = Depends(get_db)
):
    attachment_path = email_service.get_attachment_path(db, email_id, attachment_id)
    if not attachment_path:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    return FileResponse(
        attachment_path,
        media_type="application/octet-stream",
        filename=os.path.basename(attachment_path)
    ) 