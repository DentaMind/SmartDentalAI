import os
import yaml
from typing import Dict, Any, Optional
from pathlib import Path
from datetime import datetime

class TemplateLoader:
    def __init__(self):
        self.templates: Dict[str, Dict[str, str]] = {}
        self.template_path = Path(__file__).parent.parent / "config" / "email_templates.yaml"
        self.load_templates()
        
    def load_templates(self) -> None:
        """Load templates from YAML file."""
        try:
            with open(self.template_path, 'r') as file:
                data = yaml.safe_load(file)
                self.templates = data.get('templates', {})
        except Exception as e:
            print(f"Error loading templates: {str(e)}")
            self.templates = {}
            
    def get_template(self, template_name: str) -> Optional[Dict[str, str]]:
        """Get a specific template by name."""
        return self.templates.get(template_name)
        
    def get_all_templates(self) -> Dict[str, Dict[str, str]]:
        """Get all available templates."""
        return self.templates
        
    def format_template(self, template_name: str, **kwargs) -> Optional[Dict[str, str]]:
        """Format a template with provided variables."""
        template = self.get_template(template_name)
        if not template:
            return None
            
        try:
            formatted = {
                'subject': template['subject'].format(**kwargs),
                'body': template['body'].format(**kwargs)
            }
            return formatted
        except KeyError as e:
            print(f"Missing template variable: {str(e)}")
            return None
            
    def validate_template_variables(self, template_name: str, **kwargs) -> bool:
        """Validate that all required variables are provided."""
        template = self.get_template(template_name)
        if not template:
            return False
            
        try:
            template['subject'].format(**kwargs)
            template['body'].format(**kwargs)
            return True
        except KeyError:
            return False
            
    def get_template_variables(self, template_name: str) -> set:
        """Get all variables used in a template."""
        template = self.get_template(template_name)
        if not template:
            return set()
            
        variables = set()
        for text in [template['subject'], template['body']]:
            parts = text.split('{')
            for part in parts[1:]:
                var = part.split('}')[0]
                variables.add(var)
        return variables
        
    def update_template(self, template_name: str, subject: str, body: str) -> bool:
        """Update or add a new template."""
        try:
            self.templates[template_name] = {
                'subject': subject,
                'body': body
            }
            
            # Save to file
            with open(self.template_path, 'w') as file:
                yaml.dump({'templates': self.templates}, file)
                
            return True
        except Exception as e:
            print(f"Error updating template: {str(e)}")
            return False
            
    def delete_template(self, template_name: str) -> bool:
        """Delete a template."""
        try:
            if template_name in self.templates:
                del self.templates[template_name]
                
                # Save to file
                with open(self.template_path, 'w') as file:
                    yaml.dump({'templates': self.templates}, file)
                    
                return True
            return False
        except Exception as e:
            print(f"Error deleting template: {str(e)}")
            return False

# Singleton instance
template_loader = TemplateLoader() 