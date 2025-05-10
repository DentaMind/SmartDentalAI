"""
API Audit Logging Middleware

This module provides middleware for logging all API requests with detailed
information required for HIPAA compliance and security monitoring.
"""

import time
import json
import logging
import uuid
from typing import Dict, Any, Optional, Callable
from datetime import datetime
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import asyncio
import ipaddress

from ..models.audit_log import AuditLog
from ..utils.auth_utils import extract_user_from_token

logger = logging.getLogger("api.audit")

class AuditLogMiddleware(BaseHTTPMiddleware):
    """
    Middleware for logging all API requests with HIPAA-compliant audit trails.
    
    This middleware captures:
    - User ID and role (if authenticated)
    - IP address
    - Endpoint accessed
    - Method (GET, POST, etc.)
    - Status code
    - Response time
    - Request body (can be anonymized for sensitive endpoints)
    - Patient IDs accessed (extracted from path or body)
    """
    
    def __init__(
        self, 
        app: ASGIApp,
        exclude_paths: list = None,
        anonymize_paths: list = None,
        sensitive_fields: list = None
    ):
        super().__init__(app)
        self.exclude_paths = exclude_paths or ["/api/health", "/docs", "/openapi.json"]
        # Paths where request/response bodies should be anonymized
        self.anonymize_paths = anonymize_paths or [
            "/api/auth/login", 
            "/api/patients", 
            "/api/prescriptions",
            "/api/diagnosis",
            "/api/treatments"
        ]
        # Fields that should be redacted in logs
        self.sensitive_fields = sensitive_fields or [
            "password", 
            "token", 
            "ssn", 
            "social_security",
            "credit_card", 
            "insurance_id"
        ]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if self._should_skip_logging(request.url.path):
            return await call_next(request)
            
        # Create a correlation ID for this request
        correlation_id = str(uuid.uuid4())
        
        # Start timing the request
        start_time = time.time()
        
        # Extract user info before processing (if available)
        user_info = await self._extract_user_info(request)
        
        # Capture request details safely
        request_details = await self._capture_request_details(request)
        
        # Process the request
        try:
            response = await call_next(request)
            status_code = response.status_code
            response_body = await self._safely_read_response(response)
        except Exception as e:
            # Log exception if one occurs during request handling
            status_code = 500
            response_body = {"error": str(e)}
            # Re-raise the exception after logging
            raise
        finally:
            # Calculate processing time
            duration_ms = round((time.time() - start_time) * 1000)
            
            # Parse the request path to check for patient data access
            patient_id = self._extract_patient_id(request.url.path, request_details.get("body", {}))
            
            # Determine if this is PHI access
            is_phi_access = self._is_phi_access(request.url.path, patient_id)
            
            # Get client IP address
            client_ip = self._get_client_ip(request)
            
            # Determine if anonymization is needed
            should_anonymize = self._should_anonymize(request.url.path)
            
            # Anonymize sensitive data if needed
            request_body = self._anonymize_data(request_details.get("body", {})) if should_anonymize else request_details.get("body", {})
            response_data = self._anonymize_data(response_body) if should_anonymize else response_body
            
            # Create the audit log entry
            log_entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "correlation_id": correlation_id,
                "user_id": user_info.get("user_id", "anonymous"),
                "user_role": user_info.get("role", "anonymous"),
                "ip_address": client_ip,
                "method": request.method,
                "path": request.url.path,
                "query_params": dict(request.query_params),
                "status_code": status_code,
                "duration_ms": duration_ms,
                "request_body": request_body if request_body else None,
                "response_data": response_data if not isinstance(response_data, bytes) else "<binary_data>",
                "patient_id": patient_id,
                "is_phi_access": is_phi_access,
                "user_agent": request.headers.get("user-agent", ""),
                "referrer": request.headers.get("referer", "")
            }
            
            # Store in database asynchronously 
            asyncio.create_task(self._store_audit_log(log_entry))
            
            # Also log to the audit logger
            logger.info(
                f"AUDIT: {request.method} {request.url.path} - Status: {status_code} - "
                f"User: {user_info.get('user_id', 'anonymous')} ({user_info.get('role', 'anonymous')}) - "
                f"IP: {client_ip} - Duration: {duration_ms}ms"
                + (f" - Patient: {patient_id}" if patient_id else "")
            )
        
        return response
    
    def _should_skip_logging(self, path: str) -> bool:
        """Check if this path should be excluded from logging"""
        return any(path.startswith(excluded) for excluded in self.exclude_paths)
    
    def _should_anonymize(self, path: str) -> bool:
        """Check if this path contains sensitive data that should be anonymized"""
        return any(path.startswith(pattern) for pattern in self.anonymize_paths)
    
    def _is_phi_access(self, path: str, patient_id: Optional[str]) -> bool:
        """Determine if this request accesses Protected Health Information"""
        # If a patient ID was extracted, this is likely PHI access
        if patient_id:
            return True
            
        # Check for path patterns that typically include PHI
        phi_patterns = [
            "/api/patients/", 
            "/api/charts/",
            "/api/diagnosis/", 
            "/api/treatments/",
            "/api/medical-history/",
            "/api/prescriptions/",
            "/api/appointments/patient/",
            "/api/xrays/",
            "/api/lab-results/",
        ]
        
        return any(path.startswith(pattern) for pattern in phi_patterns)
    
    async def _extract_user_info(self, request: Request) -> Dict[str, Any]:
        """Extract user information from the request, if available"""
        # Default to anonymous/unknown
        user_info = {
            "user_id": "anonymous",
            "role": "anonymous"
        }
        
        # Try to extract user from authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
            try:
                user_data = await extract_user_from_token(token)
                if user_data:
                    user_info = user_data
            except Exception as e:
                logger.warning(f"Failed to extract user from token: {str(e)}")
                
        return user_info
    
    async def _capture_request_details(self, request: Request) -> Dict[str, Any]:
        """Safely capture details from the request"""
        details = {}
        
        # Capture request body if possible
        try:
            # Save the request body content
            body = await request.body()
            # Try to parse as JSON
            if body:
                try:
                    # Decode and parse as JSON
                    body_str = body.decode()
                    details["body"] = json.loads(body_str)
                except (UnicodeDecodeError, json.JSONDecodeError):
                    # If we can't decode or parse, store as binary
                    details["body"] = "<binary_data>"
                    
            # Replace the request body since we've already consumed it
            # This allows other middleware and route handlers to read it
            async def receive():
                return {"type": "http.request", "body": body}
                
            request._receive = receive
        except Exception as e:
            logger.warning(f"Failed to capture request body: {str(e)}")
            details["body"] = {}
            
        return details
    
    async def _safely_read_response(self, response: Response) -> Any:
        """Safely read the response body without consuming it"""
        try:
            # Get the response body
            body = b''
            async for chunk in response.body_iterator:
                body += chunk
                
            # Reset the response body
            response.body_iterator = iter([body])
            
            # Try to decode and parse as JSON
            try:
                body_str = body.decode()
                return json.loads(body_str)
            except (UnicodeDecodeError, json.JSONDecodeError):
                return "<binary_data>"
        except Exception as e:
            logger.warning(f"Failed to capture response body: {str(e)}")
            return {}
    
    def _anonymize_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Anonymize sensitive fields in data"""
        if not data or not isinstance(data, dict):
            return data
            
        anonymized = {}
        for key, value in data.items():
            if key.lower() in self.sensitive_fields:
                anonymized[key] = "***REDACTED***"
            elif isinstance(value, dict):
                anonymized[key] = self._anonymize_data(value)
            elif isinstance(value, list):
                anonymized[key] = [
                    self._anonymize_data(item) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                anonymized[key] = value
                
        return anonymized
    
    def _extract_patient_id(self, path: str, body: Dict[str, Any]) -> Optional[str]:
        """Extract patient ID from the path or request body"""
        # Check path for patient ID pattern
        # Example: /api/patients/12345 or /api/charts/12345/dental
        path_segments = path.split('/')
        for i, segment in enumerate(path_segments):
            if segment == "patients" and i < len(path_segments) - 1:
                # Next segment might be the patient ID
                potential_id = path_segments[i+1]
                # Simple validation that it's not another path segment
                if potential_id and not potential_id.startswith("api") and "/" not in potential_id:
                    return potential_id
        
        # Check request body for patient ID
        if body and isinstance(body, dict):
            patient_id = body.get("patient_id")
            if patient_id:
                return str(patient_id)
        
        return None
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract the client IP address, considering proxy headers"""
        # Try X-Forwarded-For header first (common with proxies)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # X-Forwarded-For can contain multiple IPs; use the leftmost one
            ip = forwarded_for.split(",")[0].strip()
            try:
                # Validate that this is a legitimate IP
                ipaddress.ip_address(ip)
                return ip
            except ValueError:
                pass  # Fall back to direct connection IP
        
        # If no valid forwarded IP, use direct connection
        client_host = request.client.host if request.client else "unknown"
        return client_host
    
    async def _store_audit_log(self, log_entry: Dict[str, Any]) -> None:
        """Store the audit log entry in the database"""
        try:
            # Convert to model and save to database
            audit_log = AuditLog(
                correlation_id=log_entry["correlation_id"],
                timestamp=datetime.fromisoformat(log_entry["timestamp"]),
                user_id=log_entry["user_id"],
                user_role=log_entry["user_role"],
                ip_address=log_entry["ip_address"],
                method=log_entry["method"],
                path=log_entry["path"],
                query_params=log_entry["query_params"],
                status_code=log_entry["status_code"],
                duration_ms=log_entry["duration_ms"],
                request_body=log_entry["request_body"],
                response_data=log_entry["response_data"] if not isinstance(log_entry["response_data"], bytes) else None,
                patient_id=log_entry["patient_id"],
                is_phi_access=log_entry["is_phi_access"],
                user_agent=log_entry["user_agent"],
                referrer=log_entry["referrer"]
            )
            await audit_log.save()
        except Exception as e:
            logger.error(f"Failed to store audit log: {str(e)}")
            # If database storage fails, write to file as backup
            self._write_to_backup_log(log_entry)
    
    def _write_to_backup_log(self, log_entry: Dict[str, Any]) -> None:
        """Write audit log to backup file if database storage fails"""
        try:
            with open("logs/audit_backup.log", "a") as f:
                f.write(json.dumps(log_entry) + "\n")
        except Exception as e:
            logger.error(f"Failed to write to backup audit log: {str(e)}")

def setup_audit_logging(app: ASGIApp) -> None:
    """Set up audit logging for the application"""
    # Configure file logging for audit trail
    audit_file_handler = logging.FileHandler("logs/audit.log")
    audit_file_handler.setLevel(logging.INFO)
    audit_formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s'
    )
    audit_file_handler.setFormatter(audit_formatter)
    
    # Add handler to logger
    logger.addHandler(audit_file_handler)
    logger.setLevel(logging.INFO)
    
    # Add middleware to app
    app.add_middleware(
        AuditLogMiddleware,
        exclude_paths=[
            "/api/health", 
            "/docs", 
            "/openapi.json", 
            "/favicon.ico",
            "/static/"
        ],
        anonymize_paths=[
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/reset-password",
            "/api/users/profile",
            "/api/patients",
            "/api/billing"
        ]
    ) 