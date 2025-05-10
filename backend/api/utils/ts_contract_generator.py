"""
TypeScript Contract Generator

This module provides utilities to generate FastAPI route stubs from TypeScript contracts.
It allows backend-first development by generating route skeletons from frontend contracts.
"""

import json
import os
import re
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional, Set, Tuple

import jinja2
from fastapi import FastAPI
from pydantic import BaseModel

# Configuration
FRONTEND_OPENAPI_PATH = Path("../docs/openapi/frontend-openapi.json")
TEMPLATE_DIR = Path(__file__).parent / "templates"
OUTPUT_DIR = Path("api/routers/generated")
DEV_MODE = os.getenv("DENTAMIND_ENV", "development").lower() == "development"

# Ensure template directory exists
if not TEMPLATE_DIR.exists():
    TEMPLATE_DIR.mkdir(parents=True)

# Initialize Jinja2 environment
template_env = jinja2.Environment(
    loader=jinja2.FileSystemLoader(str(TEMPLATE_DIR)), 
    autoescape=jinja2.select_autoescape(['html', 'xml']),
    trim_blocks=True,
    lstrip_blocks=True
)

# Create default templates if they don't exist
ROUTER_TEMPLATE = """
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import List, Optional, Dict, Any
from datetime import datetime

from ..models.{{module_name}} import *

router = APIRouter(prefix="/api/{{route_prefix}}", tags=["{{tag}}"])

{% for endpoint in endpoints %}
@router.{{endpoint.method.lower()}}("{{endpoint.path}}"{% if endpoint.status_code %}, status_code={{endpoint.status_code}}{% endif %})
async def {{endpoint.function_name}}(
    {% for param in endpoint.params %}
    {{param.name}}: {{param.type}}{% if param.default %} = {{param.default}}{% endif %}{% if not loop.last %},{% endif %}
    {% endfor %}
):
    """
    {{endpoint.summary}}
    
    {{endpoint.description}}
    """
    # TODO: Implement {{endpoint.method}} {{endpoint.path}}
    raise HTTPException(status_code=501, detail="Not implemented")
{% endfor %}
"""

MODEL_TEMPLATE = """
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

{% for model in models %}
class {{model.name}}(BaseModel):
    {% for field in model.fields %}
    {{field.name}}: {{field.type}}{% if field.description %} = Field(description="{{field.description}}"){% endif %}
    {% endfor %}
    
    class Config:
        json_schema_extra = {
            "example": {
                {% for field in model.fields %}
                "{{field.name}}": {{field.example}}{% if not loop.last %},{% endif %}
                {% endfor %}
            }
        }
{% endfor %}
"""

# Write default templates if they don't exist
if not (TEMPLATE_DIR / "router.py.jinja").exists():
    with open(TEMPLATE_DIR / "router.py.jinja", "w") as f:
        f.write(ROUTER_TEMPLATE)

if not (TEMPLATE_DIR / "models.py.jinja").exists():
    with open(TEMPLATE_DIR / "models.py.jinja", "w") as f:
        f.write(MODEL_TEMPLATE)


def load_frontend_schema() -> Optional[Dict[str, Any]]:
    """Load the frontend OpenAPI schema if available"""
    try:
        if FRONTEND_OPENAPI_PATH.exists():
            with open(FRONTEND_OPENAPI_PATH, "r") as f:
                return json.load(f)
        return None
    except Exception as e:
        print(f"Error loading frontend schema: {e}")
        return None


def generate_route_stubs(app: FastAPI) -> List[Dict[str, Any]]:
    """Generate FastAPI route stubs from frontend contracts"""
    frontend_schema = load_frontend_schema()
    if not frontend_schema:
        return []
    
    # Group endpoints by tag
    endpoints_by_tag = {}
    
    # Process paths
    for path, path_item in frontend_schema.get("paths", {}).items():
        for method, operation in path_item.items():
            if method.lower() not in ("get", "post", "put", "delete", "patch"):
                continue
                
            # Extract tags
            tags = operation.get("tags", ["default"])
            
            # Get status code for successful response (usually 2xx)
            status_code = None
            for code in operation.get("responses", {}).keys():
                if code.startswith("2"):
                    status_code = code
                    break
            
            # Create endpoint info
            endpoint_info = {
                "path": path.replace("/api/", "/"),  # Remove /api prefix for router
                "method": method.upper(),
                "status_code": status_code,
                "summary": operation.get("summary", ""),
                "description": operation.get("description", ""),
                "function_name": generate_function_name(path, method),
                "params": extract_parameters(operation, frontend_schema),
            }
            
            # Add to endpoints by tag
            for tag in tags:
                if tag not in endpoints_by_tag:
                    endpoints_by_tag[tag] = []
                endpoints_by_tag[tag].append(endpoint_info)
    
    # Generate routers for each tag
    results = []
    for tag, endpoints in endpoints_by_tag.items():
        # Skip if no endpoints
        if not endpoints:
            continue
            
        # Generate models for this tag
        models = extract_models_for_tag(tag, endpoints, frontend_schema)
        
        # Determine route prefix from endpoints
        route_prefix = determine_route_prefix(endpoints)
        
        # Generate router file
        router_path = generate_router_file(tag, route_prefix, endpoints)
        
        # Generate models file
        models_path = generate_models_file(tag, models)
        
        results.append({
            "tag": tag,
            "router_path": router_path,
            "models_path": models_path,
            "endpoints_count": len(endpoints)
        })
    
    return results


def generate_function_name(path: str, method: str) -> str:
    """Generate a Python function name from path and method"""
    # Remove API prefix and parameters
    clean_path = re.sub(r"{([^}]+)}", r"\1", path.replace("/api/", ""))
    
    # Replace slashes with underscores
    parts = [p for p in clean_path.split("/") if p]
    
    # Generate function name
    if method.lower() == "get" and not any(["by" in p.lower() for p in parts]) and not any(["{" in p for p in parts]):
        if len(parts) == 1:
            return f"get_all_{parts[0]}"
        else:
            return f"get_{parts[-1]}"
    elif method.lower() == "get" and any(["{" in p for p in parts]):
        return f"get_{parts[-2]}_by_{parts[-1].replace('{', '').replace('}', '')}"
    elif method.lower() == "post":
        return f"create_{parts[-1]}"
    elif method.lower() == "put":
        return f"update_{parts[-1]}"
    elif method.lower() == "delete":
        return f"delete_{parts[-1]}"
    elif method.lower() == "patch":
        return f"patch_{parts[-1]}"
    else:
        return f"{method.lower()}_{'_'.join(parts)}"


def extract_parameters(operation: Dict[str, Any], schema: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract parameters from operation"""
    params = []
    
    # Add path parameters
    for param in operation.get("parameters", []):
        if param.get("in") == "path":
            params.append({
                "name": param.get("name"),
                "type": get_python_type_from_param(param.get("schema", {})),
                "default": None,
                "required": True
            })
    
    # Add query parameters
    for param in operation.get("parameters", []):
        if param.get("in") == "query":
            param_schema = param.get("schema", {})
            default = "None" if not param.get("required", False) else None
            if "default" in param_schema:
                default = repr(param_schema["default"])
            
            params.append({
                "name": param.get("name"),
                "type": get_python_type_from_param(param_schema),
                "default": default,
                "required": param.get("required", False)
            })
    
    # Add request body if present
    if "requestBody" in operation:
        content = operation["requestBody"].get("content", {})
        json_content = content.get("application/json", {})
        if "schema" in json_content:
            schema_ref = json_content["schema"].get("$ref")
            if schema_ref:
                schema_name = schema_ref.split("/")[-1]
                params.append({
                    "name": "payload",
                    "type": schema_name,
                    "default": None,
                    "required": True
                })
    
    return params


def get_python_type_from_param(schema: Dict[str, Any]) -> str:
    """Convert OpenAPI schema type to Python type string"""
    schema_type = schema.get("type")
    schema_format = schema.get("format")
    
    if schema_type == "string":
        if schema_format == "date-time":
            return "datetime"
        elif schema_format == "date":
            return "datetime.date"
        elif schema_format == "email":
            return "str  # email"
        elif schema_format == "uuid":
            return "UUID"
        else:
            return "str"
    elif schema_type == "integer":
        if schema_format == "int64":
            return "int"
        else:
            return "int"
    elif schema_type == "number":
        if schema_format == "float":
            return "float"
        else:
            return "float"
    elif schema_type == "boolean":
        return "bool"
    elif schema_type == "array":
        items = schema.get("items", {})
        item_type = get_python_type_from_param(items)
        return f"List[{item_type}]"
    elif schema_type == "object":
        return "Dict[str, Any]"
    
    # Default to Any for unknown types
    return "Any"


def extract_models_for_tag(tag: str, endpoints: List[Dict[str, Any]], schema: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract models from schema for a specific tag"""
    models = []
    model_names = set()
    
    # Collect all schema references
    schema_refs = set()
    for endpoint in endpoints:
        # Check for request body schema
        for param in endpoint.get("params", []):
            if param.get("type") not in ["str", "int", "float", "bool", "datetime", "Any"]:
                schema_refs.add(param.get("type"))
    
    # Recursively find all referenced schemas
    processed_schemas = set()
    while schema_refs:
        schema_name = schema_refs.pop()
        if schema_name in processed_schemas:
            continue
        
        processed_schemas.add(schema_name)
        
        schema_def = schema.get("components", {}).get("schemas", {}).get(schema_name)
        if not schema_def:
            continue
        
        # Check if this model already exists
        if schema_name in model_names:
            continue
        
        model_names.add(schema_name)
        
        # Process fields
        fields = []
        for prop_name, prop_schema in schema_def.get("properties", {}).items():
            field_type = get_python_type_from_param(prop_schema)
            
            # Check for new references
            if "$ref" in prop_schema:
                ref_name = prop_schema["$ref"].split("/")[-1]
                schema_refs.add(ref_name)
            elif prop_schema.get("type") == "array" and "$ref" in prop_schema.get("items", {}):
                ref_name = prop_schema["items"]["$ref"].split("/")[-1]
                schema_refs.add(ref_name)
            
            fields.append({
                "name": prop_name,
                "type": field_type,
                "description": prop_schema.get("description", ""),
                "example": get_example_value(prop_schema)
            })
        
        models.append({
            "name": schema_name,
            "fields": fields
        })
    
    return models


def get_example_value(schema: Dict[str, Any]) -> str:
    """Generate example value for a schema property"""
    schema_type = schema.get("type")
    schema_format = schema.get("format")
    
    if "example" in schema:
        return repr(schema["example"])
    
    if schema_type == "string":
        if schema_format == "date-time":
            return '"2023-01-01T00:00:00Z"'
        elif schema_format == "date":
            return '"2023-01-01"'
        elif schema_format == "email":
            return '"user@example.com"'
        elif schema_format == "uuid":
            return '"00000000-0000-0000-0000-000000000000"'
        else:
            return '"example"'
    elif schema_type == "integer":
        return "0"
    elif schema_type == "number":
        return "0.0"
    elif schema_type == "boolean":
        return "False"
    elif schema_type == "array":
        return "[]"
    elif schema_type == "object":
        return "{}"
    
    return '""'


def determine_route_prefix(endpoints: List[Dict[str, Any]]) -> str:
    """Determine route prefix from endpoints"""
    # Find common prefix
    paths = [endpoint["path"] for endpoint in endpoints]
    
    if not paths:
        return ""
    
    # Split paths into segments
    segments = [path.strip("/").split("/") for path in paths]
    
    # Find common prefix segments
    common_prefix = []
    for i in range(min(len(s) for s in segments)):
        segment = segments[0][i]
        
        # Skip parameter segments
        if segment.startswith("{") and segment.endswith("}"):
            break
            
        # Check if all paths have this segment
        if all(s[i] == segment for s in segments):
            common_prefix.append(segment)
        else:
            break
    
    return "/".join(common_prefix)


def generate_router_file(tag: str, route_prefix: str, endpoints: List[Dict[str, Any]]) -> str:
    """Generate router file for a tag"""
    # Ensure output directory exists
    if not OUTPUT_DIR.exists():
        OUTPUT_DIR.mkdir(parents=True)
    
    # Generate snake case tag for filename
    tag_snake = tag.lower().replace(" ", "_").replace("-", "_")
    
    # Generate router file
    template = template_env.get_template("router.py.jinja")
    output = template.render(
        tag=tag,
        module_name=tag_snake,
        route_prefix=route_prefix,
        endpoints=endpoints
    )
    
    # Write to file
    output_path = OUTPUT_DIR / f"{tag_snake}_router.py"
    with open(output_path, "w") as f:
        f.write(output)
    
    return str(output_path)


def generate_models_file(tag: str, models: List[Dict[str, Any]]) -> str:
    """Generate models file for a tag"""
    # Ensure output directory exists
    if not (OUTPUT_DIR / "models").exists():
        (OUTPUT_DIR / "models").mkdir(parents=True)
    
    # Generate snake case tag for filename
    tag_snake = tag.lower().replace(" ", "_").replace("-", "_")
    
    # Generate models file
    template = template_env.get_template("models.py.jinja")
    output = template.render(models=models)
    
    # Write to file
    output_path = OUTPUT_DIR / "models" / f"{tag_snake}.py"
    with open(output_path, "w") as f:
        f.write(output)
    
    return str(output_path)


def setup_contract_generator(app: FastAPI) -> None:
    """Set up contract generator"""
    # Only run in development mode
    if not DEV_MODE:
        return
    
    # Generate route stubs from frontend contracts
    results = generate_route_stubs(app)
    
    if results:
        print(f"Generated {len(results)} router stubs from frontend contracts:")
        for result in results:
            print(f"  - {result['tag']}: {result['endpoints_count']} endpoints")
            print(f"    Router: {result['router_path']}")
            print(f"    Models: {result['models_path']}")
    else:
        print("No frontend contracts found for stub generation")


# Command-line interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate FastAPI stubs from TypeScript contracts")
    parser.add_argument("--force", action="store_true", help="Force generation even if files exist")
    
    args = parser.parse_args()
    
    # Mock FastAPI app for standalone use
    app = FastAPI()
    
    # Generate stubs
    results = generate_route_stubs(app)
    
    if results:
        print(f"Generated {len(results)} router stubs from frontend contracts:")
        for result in results:
            print(f"  - {result['tag']}: {result['endpoints_count']} endpoints")
            print(f"    Router: {result['router_path']}")
            print(f"    Models: {result['models_path']}")
    else:
        print("No frontend contracts found for stub generation") 