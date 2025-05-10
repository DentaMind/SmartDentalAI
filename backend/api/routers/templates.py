from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from api.services.template_service import TemplateService
from api.models.communication import MessageTemplate
from api.schemas.communication import MessageCategory, CommunicationIntent
from api.dependencies import get_db

router = APIRouter(prefix="/templates", tags=["templates"])

class TemplateCreate(BaseModel):
    id: str = Field(..., description="Unique identifier for the template")
    name: str = Field(..., description="Display name of the template")
    subject: str = Field(..., description="Template subject with variables")
    body: str = Field(..., description="Template body with variables")
    category: Optional[MessageCategory] = Field(None, description="Message category")
    intent: Optional[CommunicationIntent] = Field(None, description="Communication intent")
    variables: Optional[Dict[str, str]] = Field(None, description="Variable definitions")
    is_active: bool = Field(True, description="Whether the template is active")

class TemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Display name of the template")
    subject: Optional[str] = Field(None, description="Template subject with variables")
    body: Optional[str] = Field(None, description="Template body with variables")
    category: Optional[MessageCategory] = Field(None, description="Message category")
    intent: Optional[CommunicationIntent] = Field(None, description="Communication intent")
    variables: Optional[Dict[str, str]] = Field(None, description="Variable definitions")
    is_active: Optional[bool] = Field(None, description="Whether the template is active")

class TemplateRender(BaseModel):
    variables: Dict[str, Any] = Field(..., description="Variables to render in the template")

class TemplateResponse(BaseModel):
    id: str
    name: str
    subject: str
    body: str
    category: Optional[MessageCategory]
    intent: Optional[CommunicationIntent]
    variables: Optional[Dict[str, str]]
    is_active: bool

    class Config:
        from_attributes = True

class RenderedTemplate(BaseModel):
    subject: str
    body: str

@router.get("/", response_model=List[TemplateResponse])
async def list_templates(
    category: Optional[MessageCategory] = None,
    intent: Optional[CommunicationIntent] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """List all templates, optionally filtered by category and intent."""
    service = TemplateService(db)
    templates = await service.get_templates(category, intent, active_only)
    return templates

@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific template by ID."""
    service = TemplateService(db)
    template = await service.get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@router.post("/", response_model=TemplateResponse)
async def create_template(
    template: TemplateCreate,
    db: Session = Depends(get_db)
):
    """Create a new template."""
    service = TemplateService(db)
    try:
        created_template = await service.create_template(
            id=template.id,
            name=template.name,
            subject=template.subject,
            body=template.body,
            category=template.category,
            intent=template.intent,
            variables=template.variables,
            is_active=template.is_active
        )
        return created_template
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: str,
    template: TemplateUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing template."""
    service = TemplateService(db)
    updated_template = await service.update_template(template_id, **template.dict(exclude_unset=True))
    if not updated_template:
        raise HTTPException(status_code=404, detail="Template not found")
    return updated_template

@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    db: Session = Depends(get_db)
):
    """Delete a template."""
    service = TemplateService(db)
    success = await service.delete_template(template_id)
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted successfully"}

@router.post("/{template_id}/render", response_model=RenderedTemplate)
async def render_template(
    template_id: str,
    variables: TemplateRender,
    db: Session = Depends(get_db)
):
    """Render a template with the provided variables."""
    service = TemplateService(db)
    template = await service.get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    try:
        rendered = service.render_template(template, variables.variables)
        return rendered
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{template_id}/activate")
async def activate_template(
    template_id: str,
    db: Session = Depends(get_db)
):
    """Activate a template."""
    service = TemplateService(db)
    success = await service.activate_template(template_id)
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template activated successfully"}

@router.post("/{template_id}/deactivate")
async def deactivate_template(
    template_id: str,
    db: Session = Depends(get_db)
):
    """Deactivate a template."""
    service = TemplateService(db)
    success = await service.deactivate_template(template_id)
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deactivated successfully"} 