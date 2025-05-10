"""
Security Audit Router

This module provides endpoints for running security audits on the API.
"""

import logging
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, BackgroundTasks
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
import os
import datetime
from pathlib import Path

from ..dependencies.auth import get_current_admin_user
from ..utils.rbac_audit import (
    RBACSecurityAuditor,
    SecurityAuditResult,
    scan_directory_for_vulnerabilities,
    scan_file_for_vulnerabilities
)
from ..utils.rbac_html_report import SecurityAuditHTMLReportGenerator
from ..auth.dependencies import get_current_user

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/security",
    tags=["security"],
    responses={404: {"description": "Not found"}}
)

class FileVulnerabilityRequest(BaseModel):
    """Request to scan a file for vulnerabilities"""
    file_path: str

class DirectoryScanRequest(BaseModel):
    """Request to scan a directory for vulnerabilities"""
    directory_path: str
    recursive: bool = True
    include_patterns: Optional[List[str]] = None
    exclude_patterns: Optional[List[str]] = None

class SecurityIssue(BaseModel):
    """Security issue found during scan"""
    issue_type: str
    description: str
    file_path: str
    line_number: int
    severity: str
    remediation: str

class SecurityAuditRequest(BaseModel):
    """Request to run a security audit"""
    generate_report: bool = True
    scan_files: bool = True
    scan_routes: bool = True
    
class SecurityAuditResponse(BaseModel):
    """Response from a security audit"""
    total_routes: int = 0
    routes_with_auth: int = 0
    routes_without_auth: int = 0 
    routes_with_role_checks: int = 0
    total_vulnerabilities: int = 0
    report_path: Optional[str] = None

REPORTS_DIR = Path("reports")
REPORTS_DIR.mkdir(exist_ok=True)

@router.post("/audit", response_model=SecurityAuditResponse)
async def run_security_audit(
    request: SecurityAuditRequest,
    background_tasks: BackgroundTasks,
    app_request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Run a security audit on the application.
    
    This endpoint requires authentication and must be called by an admin or founder.
    """
    # Check if user has appropriate role
    if current_user.get("role") not in ["admin", "founder"]:
        raise HTTPException(status_code=403, detail="Only admins can run security audits")
    
    # Get the FastAPI app instance from the request
    app = app_request.app
    
    # Run audit in main app
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        auditor = RBACSecurityAuditor(app, base_dir)
        audit_result = auditor.audit_application()
        
        response = SecurityAuditResponse(
            total_routes=audit_result.total_routes,
            routes_with_auth=audit_result.routes_with_auth,
            routes_without_auth=audit_result.routes_without_auth,
            routes_with_role_checks=audit_result.routes_with_role_checks,
            total_vulnerabilities=len(audit_result.vulnerabilities)
        )
        
        # Generate HTML report if requested
        if request.generate_report:
            report_generator = SecurityAuditHTMLReportGenerator(audit_result)
            report_path = report_generator.generate_report()
            response.report_path = report_path
            
        return response
    except Exception as e:
        logger.error(f"Error during security audit: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during security audit: {str(e)}")

@router.get("/audit/reports")
async def list_audit_reports(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    List all security audit reports
    """
    # Check if user has appropriate role
    if current_user.get("role") not in ["admin", "founder"]:
        raise HTTPException(status_code=403, detail="Only admins can view security audit reports")
    
    reports = []
    try:
        for file in REPORTS_DIR.glob("security_audit_*.html"):
            timestamp = file.stem.replace("security_audit_", "")
            reports.append({
                "filename": file.name,
                "path": str(file),
                "created_at": timestamp,
                "size": file.stat().st_size
            })
        
        # Sort by most recent first
        reports.sort(key=lambda x: x["created_at"], reverse=True)
        return reports
    except Exception as e:
        logger.error(f"Error listing audit reports: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listing audit reports: {str(e)}")

@router.get("/audit/reports/{report_name}")
async def get_audit_report(
    report_name: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> FileResponse:
    """
    Get a specific security audit report
    """
    # Check if user has appropriate role
    if current_user.get("role") not in ["admin", "founder"]:
        raise HTTPException(status_code=403, detail="Only admins can view security audit reports")
    
    report_path = REPORTS_DIR / report_name
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    
    return FileResponse(str(report_path))

@router.post("/scan/file", response_model=List[SecurityIssue])
async def scan_file(
    request: FileVulnerabilityRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Scan a specific file for security vulnerabilities
    """
    # Check if user has appropriate role
    if current_user.get("role") not in ["admin", "founder"]:
        raise HTTPException(status_code=403, detail="Only admins can run security scans")
    
    try:
        vulnerabilities = scan_file_for_vulnerabilities(request.file_path)
        
        # Convert to response model
        issues = []
        for vuln in vulnerabilities:
            issues.append({
                "issue_type": vuln.vulnerability_type,
                "description": vuln.description,
                "file_path": vuln.file_path,
                "line_number": vuln.line_number,
                "severity": vuln.severity,
                "remediation": vuln.remediation
            })
            
        return issues
    except Exception as e:
        logger.error(f"Error scanning file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error scanning file: {str(e)}")

@router.post("/scan/directory", response_model=List[SecurityIssue])
async def scan_directory(
    request: DirectoryScanRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Scan a directory for security vulnerabilities
    """
    # Check if user has appropriate role
    if current_user.get("role") not in ["admin", "founder"]:
        raise HTTPException(status_code=403, detail="Only admins can run security scans")
    
    try:
        vulnerabilities = scan_directory_for_vulnerabilities(request.directory_path)
        
        # Convert to response model
        issues = []
        for vuln in vulnerabilities:
            issues.append({
                "issue_type": vuln.vulnerability_type,
                "description": vuln.description,
                "file_path": vuln.file_path,
                "line_number": vuln.line_number,
                "severity": vuln.severity,
                "remediation": vuln.remediation
            })
            
        return issues
    except Exception as e:
        logger.error(f"Error scanning directory: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error scanning directory: {str(e)}")

@router.get("/status")
async def get_security_status(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get a summary of the current security status
    """
    # For now, return a mock status
    return {
        "status": "healthy",
        "last_scan": datetime.datetime.now().isoformat(),
        "critical_issues": 0,
        "high_issues": 2,
        "medium_issues": 5,
        "low_issues": 8,
        "total_issues": 15
    } 