from typing import Dict, List, Optional, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select
import json
import re

from api.models.communication import MessageTemplate
from api.schemas.communication import MessageCategory, CommunicationIntent

class TemplateService:
    def __init__(self, db: Session):
        self.db = db

    async def get_template(self, template_id: str) -> Optional[MessageTemplate]:
        """Get a template by its ID."""
        result = await self.db.execute(
            select(MessageTemplate).where(MessageTemplate.id == template_id)
        )
        return result.scalar_one_or_none()

    async def get_templates(
        self,
        category: Optional[MessageCategory] = None,
        intent: Optional[CommunicationIntent] = None,
        active_only: bool = True
    ) -> List[MessageTemplate]:
        """Get templates filtered by category and intent."""
        query = select(MessageTemplate)
        
        if active_only:
            query = query.where(MessageTemplate.is_active == True)
        if category:
            query = query.where(MessageTemplate.category == category)
        if intent:
            query = query.where(MessageTemplate.intent == intent)
            
        result = await self.db.execute(query)
        return result.scalars().all()

    def validate_variables(self, template: MessageTemplate, variables: Dict[str, Any]) -> List[str]:
        """Validate that all required variables are provided and of correct type."""
        errors = []
        required_vars = json.loads(template.variables) if template.variables else {}
        
        # Check for missing variables
        for var_name, var_type in required_vars.items():
            if var_name not in variables:
                errors.append(f"Missing required variable: {var_name}")
                continue
                
            # Validate variable types
            value = variables[var_name]
            if var_type == "string" and not isinstance(value, str):
                errors.append(f"Variable {var_name} must be a string")
            elif var_type == "date" and not isinstance(value, (datetime, str)):
                errors.append(f"Variable {var_name} must be a date")
            elif var_type == "time" and not isinstance(value, (datetime, str)):
                errors.append(f"Variable {var_name} must be a time")
            elif var_type == "decimal" and not isinstance(value, (int, float)):
                errors.append(f"Variable {var_name} must be a number")
                
        return errors

    def format_variable(self, value: Any, var_type: str) -> str:
        """Format a variable value according to its type."""
        if value is None:
            return ""
            
        if var_type == "date" and isinstance(value, datetime):
            return value.strftime("%Y-%m-%d")
        elif var_type == "time" and isinstance(value, datetime):
            return value.strftime("%H:%M")
        elif var_type == "decimal" and isinstance(value, (int, float)):
            return f"${value:,.2f}"
        else:
            return str(value)

    def render_template(self, template: MessageTemplate, variables: Dict[str, Any]) -> Dict[str, str]:
        """Render a template with the provided variables."""
        # Validate variables first
        errors = self.validate_variables(template, variables)
        if errors:
            raise ValueError(f"Template validation errors: {', '.join(errors)}")
            
        # Format variables according to their types
        formatted_vars = {}
        var_types = json.loads(template.variables) if template.variables else {}
        for var_name, var_type in var_types.items():
            formatted_vars[var_name] = self.format_variable(variables[var_name], var_type)
            
        # Render subject and body
        rendered_subject = template.subject.format(**formatted_vars)
        rendered_body = template.body.format(**formatted_vars)
        
        return {
            "subject": rendered_subject,
            "body": rendered_body
        }

    async def create_template(
        self,
        id: str,
        name: str,
        subject: str,
        body: str,
        category: Optional[MessageCategory] = None,
        intent: Optional[CommunicationIntent] = None,
        variables: Optional[Dict[str, str]] = None,
        is_active: bool = True
    ) -> MessageTemplate:
        """Create a new message template."""
        # Validate template variables in subject and body
        template_vars = set(re.findall(r'\{([^}]+)\}', subject + body))
        if variables:
            missing_vars = template_vars - set(variables.keys())
            if missing_vars:
                raise ValueError(f"Missing variable definitions: {', '.join(missing_vars)}")
        
        template = MessageTemplate(
            id=id,
            name=name,
            subject=subject,
            body=body,
            category=category,
            intent=intent,
            variables=json.dumps(variables) if variables else None,
            is_active=is_active
        )
        
        self.db.add(template)
        await self.db.commit()
        await self.db.refresh(template)
        return template

    async def update_template(
        self,
        template_id: str,
        **kwargs
    ) -> Optional[MessageTemplate]:
        """Update an existing template."""
        template = await self.get_template(template_id)
        if not template:
            return None
            
        for key, value in kwargs.items():
            if hasattr(template, key):
                setattr(template, key, value)
                
        await self.db.commit()
        await self.db.refresh(template)
        return template

    async def delete_template(self, template_id: str) -> bool:
        """Delete a template."""
        template = await self.get_template(template_id)
        if not template:
            return False
            
        await self.db.delete(template)
        await self.db.commit()
        return True

    async def deactivate_template(self, template_id: str) -> bool:
        """Deactivate a template."""
        template = await self.get_template(template_id)
        if not template:
            return False
            
        template.is_active = False
        await self.db.commit()
        return True

    async def activate_template(self, template_id: str) -> bool:
        """Activate a template."""
        template = await self.get_template(template_id)
        if not template:
            return False
            
        template.is_active = True
        await self.db.commit()
        return True 