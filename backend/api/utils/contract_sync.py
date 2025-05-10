"""
Contract Sync Utility

This module provides utilities to automatically sync FastAPI schemas with frontend contracts.
It generates Pydantic models from OpenAPI schemas derived from the frontend Zod contracts.
"""

import json
import os
import tempfile
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional, Set, Tuple

import httpx
import datetime
from fastapi import FastAPI, APIRouter, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from pydantic import BaseModel, create_model, Field
from pydantic.json_schema import JsonSchemaValue

# Import contract generator
from .ts_contract_generator import generate_route_stubs

# Configuration
FRONTEND_OPENAPI_PATH = Path("../docs/openapi/frontend-openapi.json")
DEV_MODE = os.getenv("DENTAMIND_ENV", "development").lower() == "development"


class ContractViolation(BaseModel):
    """A model representing a contract violation"""
    endpoint: str
    method: str
    violation_type: str
    message: str
    timestamp: str
    request_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class ContractViolationReport(BaseModel):
    """A report containing all contract violations"""
    violations: List[ContractViolation] = []
    total_count: int = 0
    last_updated: str


class GenerationResult(BaseModel):
    """Result of contract generation"""
    success: bool
    generated_files: List[Dict[str, str]] = []
    message: str


# Global storage for contract violations
contract_violations: List[ContractViolation] = []


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


def generate_pydantic_from_schema(schema: Dict[str, Any], name: str) -> BaseModel:
    """Generate a Pydantic model from a JSON schema"""
    # Extract field definitions
    properties = schema.get("properties", {})
    required = schema.get("required", [])
    
    # Create field definitions for Pydantic
    fields = {}
    for prop_name, prop_schema in properties.items():
        field_type = get_python_type_from_schema(prop_schema)
        is_required = prop_name in required
        
        if is_required:
            fields[prop_name] = (field_type, Field(description=prop_schema.get("description", "")))
        else:
            fields[prop_name] = (Optional[field_type], Field(None, description=prop_schema.get("description", "")))
    
    # Create the Pydantic model
    return create_model(name, **fields)


def get_python_type_from_schema(schema: Dict[str, Any]) -> Any:
    """Convert JSON schema type to Python type"""
    schema_type = schema.get("type")
    
    if schema_type == "string":
        return str
    elif schema_type == "integer":
        return int
    elif schema_type == "number":
        return float
    elif schema_type == "boolean":
        return bool
    elif schema_type == "array":
        items = schema.get("items", {})
        item_type = get_python_type_from_schema(items)
        return List[item_type]
    elif schema_type == "object":
        # For objects, we'll need to create a nested model
        properties = schema.get("properties", {})
        if not properties:
            return Dict[str, Any]
        
        fields = {}
        for prop_name, prop_schema in properties.items():
            field_type = get_python_type_from_schema(prop_schema)
            fields[prop_name] = (field_type, Field(description=prop_schema.get("description", "")))
        
        return create_model(f"NestedModel_{hash(json.dumps(schema))}", **fields)
    
    # Default to Any for unknown types
    return Any


def extract_endpoint_schemas(
    openapi_schema: Dict[str, Any]
) -> Dict[str, Dict[str, Dict[str, Any]]]:
    """Extract schemas for each endpoint and method from OpenAPI schema"""
    endpoint_schemas = {}
    
    # Process paths
    for path, path_item in openapi_schema.get("paths", {}).items():
        endpoint_schemas[path] = {}
        
        # Process operations (GET, POST, etc.)
        for method, operation in path_item.items():
            if method.lower() in ("get", "post", "put", "delete", "patch"):
                endpoint_schemas[path][method.upper()] = {
                    "request": {
                        "body": None,
                        "params": {},
                        "query": {}
                    },
                    "response": {}
                }
                
                # Process request body
                if "requestBody" in operation:
                    content = operation["requestBody"].get("content", {})
                    json_content = content.get("application/json", {})
                    if "schema" in json_content:
                        schema_ref = json_content["schema"].get("$ref")
                        if schema_ref:
                            schema_name = schema_ref.split("/")[-1]
                            endpoint_schemas[path][method.upper()]["request"]["body"] = (
                                openapi_schema.get("components", {}).get("schemas", {}).get(schema_name)
                            )
                
                # Process parameters
                for param in operation.get("parameters", []):
                    param_in = param.get("in")
                    param_name = param.get("name")
                    param_schema = param.get("schema", {})
                    
                    if param_in == "path":
                        endpoint_schemas[path][method.upper()]["request"]["params"][param_name] = param_schema
                    elif param_in == "query":
                        endpoint_schemas[path][method.upper()]["request"]["query"][param_name] = param_schema
                
                # Process responses
                for status_code, response in operation.get("responses", {}).items():
                    if status_code.startswith("2"):  # Only process success responses (2xx)
                        content = response.get("content", {})
                        json_content = content.get("application/json", {})
                        if "schema" in json_content:
                            schema_ref = json_content["schema"].get("$ref")
                            if schema_ref:
                                schema_name = schema_ref.split("/")[-1]
                                endpoint_schemas[path][method.upper()]["response"][status_code] = (
                                    openapi_schema.get("components", {}).get("schemas", {}).get(schema_name)
                                )
    
    return endpoint_schemas


def validate_endpoint_schema(app: FastAPI) -> Set[str]:
    """Validate app endpoints against frontend schema and return missing endpoints"""
    frontend_schema = load_frontend_schema()
    if not frontend_schema:
        return set()
    
    endpoint_schemas = extract_endpoint_schemas(frontend_schema)
    
    # Track missing endpoints
    implemented_endpoints = set()
    
    # Check each route in the FastAPI app
    for route in app.routes:
        if isinstance(route, APIRoute):
            path = route.path
            methods = route.methods
            
            for method in methods:
                if path in endpoint_schemas and method in endpoint_schemas[path]:
                    implemented_endpoints.add(f"{method}:{path}")
    
    # Find missing endpoints
    all_endpoints = {
        f"{method}:{path}" 
        for path, methods in endpoint_schemas.items() 
        for method in methods
    }
    
    return all_endpoints - implemented_endpoints


def setup_contract_validation(app: FastAPI) -> None:
    """Set up contract validation middleware and routes"""
    if not DEV_MODE:
        return
    
    @app.middleware("http")
    async def validate_contracts(request: Request, call_next) -> Response:
        """Middleware to validate requests and responses against contracts"""
        frontend_schema = load_frontend_schema()
        if not frontend_schema:
            return await call_next(request)
        
        # Extract path and method
        path = request.url.path
        method = request.method
        
        # Check if path exists in schema
        endpoint_schemas = extract_endpoint_schemas(frontend_schema)
        if path not in endpoint_schemas or method not in endpoint_schemas[path]:
            return await call_next(request)
        
        # Get schema for this endpoint
        schema = endpoint_schemas[path][method]
        
        # Validate request body if applicable
        request_body_schema = schema["request"]["body"]
        if request_body_schema and request.method not in ("GET", "DELETE"):
            try:
                request_body = await request.json()
                # TODO: Validate request body against schema
                # This would require a proper JSON schema validator
            except Exception as e:
                # Log validation error
                violation = ContractViolation(
                    endpoint=path,
                    method=method,
                    violation_type="request_validation",
                    message=f"Request validation failed: {str(e)}",
                    timestamp=datetime.datetime.now().isoformat(),
                    request_id=request.headers.get("X-Request-ID"),
                    details={"error": str(e)}
                )
                contract_violations.append(violation)
        
        # Continue to the endpoint
        response = await call_next(request)
        
        # Validate response body if applicable
        response_schema = schema["response"].get(str(response.status_code))
        if response_schema and hasattr(response, "body"):
            try:
                response_body = response.body.decode()
                response_json = json.loads(response_body)
                # TODO: Validate response body against schema
            except Exception as e:
                # Log validation error
                violation = ContractViolation(
                    endpoint=path,
                    method=method,
                    violation_type="response_validation",
                    message=f"Response validation failed: {str(e)}",
                    timestamp=datetime.datetime.now().isoformat(),
                    request_id=request.headers.get("X-Request-ID"),
                    details={"error": str(e)}
                )
                contract_violations.append(violation)
        
        return response
    
    # Add contract validation routes
    contract_router = APIRouter(prefix="/api/_dev/contracts", tags=["Development"])
    
    @contract_router.get("/violations", response_model=ContractViolationReport)
    async def get_contract_violations():
        """Get all contract violations"""
        return ContractViolationReport(
            violations=contract_violations,
            total_count=len(contract_violations),
            last_updated=datetime.datetime.now().isoformat()
        )
    
    @contract_router.delete("/violations")
    async def clear_contract_violations():
        """Clear all contract violations"""
        contract_violations.clear()
        return {"message": "Contract violations cleared"}
    
    @contract_router.get("/missing-endpoints")
    async def get_missing_endpoints():
        """Get all endpoints defined in frontend but missing in backend"""
        missing_endpoints = validate_endpoint_schema(app)
        return {
            "missing_endpoints": list(missing_endpoints),
            "count": len(missing_endpoints)
        }
    
    @contract_router.post("/generate", response_model=GenerationResult)
    async def generate_contracts():
        """Generate FastAPI routes from frontend contracts"""
        try:
            # Generate route stubs
            results = generate_route_stubs(app)
            
            if results:
                files = []
                for result in results:
                    files.append({
                        "router": result["router_path"],
                        "models": result["models_path"],
                        "tag": result["tag"]
                    })
                
                return GenerationResult(
                    success=True,
                    generated_files=files,
                    message=f"Generated {len(results)} routers successfully"
                )
            else:
                return GenerationResult(
                    success=False,
                    message="No contracts found to generate from"
                )
        except Exception as e:
            return GenerationResult(
                success=False,
                message=f"Failed to generate contracts: {str(e)}"
            )
    
    app.include_router(contract_router)


# Add this function to setup at app startup
def setup_contract_sync(app: FastAPI) -> None:
    """Set up contract synchronization and validation"""
    # Only run in development mode
    if not DEV_MODE:
        return
    
    # Add middleware and routes for contract validation
    setup_contract_validation(app) 