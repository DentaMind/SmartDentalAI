"""
Role-Based Access Control (RBAC) Audit Utility

This module provides tools to audit FastAPI applications for:
1. Endpoints missing authentication dependencies
2. Endpoints with authentication but missing role checks
3. Inconsistent permission patterns across similar endpoints
4. Potential data leaks in patient-related endpoints

Usage:
    from .utils.rbac_audit import RBACSecurityAudit
    
    # Initialize the auditor with your FastAPI app
    auditor = RBACSecurityAudit(app)
    
    # Run the audit
    audit_results = auditor.run_audit()
    
    # Generate HTML report
    html_report = auditor.generate_html_report()
"""

import inspect
import os
from typing import List, Dict, Any, Set, Optional, Tuple
from enum import Enum
from fastapi import FastAPI, Depends, APIRouter
from fastapi.routing import APIRoute
import logging
from pydantic import BaseModel
import ast
import re

logger = logging.getLogger(__name__)

class SecurityIssueLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class EndpointSecurityStatus(str, Enum):
    UNAUTHORIZED = "unauthorized"  # No authentication at all
    AUTH_MISSING_RBAC = "auth_missing_rbac"  # Has auth but no role checks
    INCONSISTENT_RBAC = "inconsistent_rbac"  # Role checks inconsistent with similar endpoints
    POTENTIAL_DATA_LEAK = "potential_data_leak"  # Patient data without proper checks
    AUTHORIZED = "authorized"  # Properly secured

class SecurityIssue:
    def __init__(
        self,
        endpoint: str,
        method: str,
        description: str,
        level: SecurityIssueLevel,
        status: EndpointSecurityStatus,
        suggestion: str,
        code_location: Optional[str] = None,
        affected_route: Optional[APIRoute] = None
    ):
        self.endpoint = endpoint
        self.method = method
        self.description = description
        self.level = level
        self.status = status
        self.suggestion = suggestion
        self.code_location = code_location
        self.affected_route = affected_route

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "endpoint": self.endpoint,
            "method": self.method,
            "description": self.description,
            "level": self.level,
            "status": self.status,
            "suggestion": self.suggestion,
            "code_location": self.code_location or "Unknown"
        }

class RouteSecurityInfo(BaseModel):
    """Security information about a FastAPI route"""
    path: str
    methods: List[str]
    endpoint_function: str
    file_path: str
    line_number: int
    has_auth_dependency: bool
    has_role_check: bool
    auth_dependencies: List[str]
    role_dependencies: List[str]
    potential_data_leak: bool
    security_score: int
    route_tags: List[str]
    handler_source: Optional[str] = None
    risk_level: str = "Low"
    suggestion: str = ""

class RBACVulnerability(BaseModel):
    """Represents a security vulnerability in the system"""
    vulnerability_type: str
    description: str
    file_path: str
    line_number: int
    severity: str
    remediation: str
    code_snippet: str
    endpoints_affected: List[str] = []

class SecurityAuditResult(BaseModel):
    """Results of a security audit"""
    total_routes: int
    routes_with_auth: int
    routes_without_auth: int
    routes_with_role_checks: int
    total_vulnerabilities: int
    critical_vulnerabilities: int
    high_vulnerabilities: int
    medium_vulnerabilities: int
    low_vulnerabilities: int
    vulnerable_routes: List[RouteSecurityInfo]
    vulnerabilities: List[RBACVulnerability]

class RBACSecurityAudit:
    def __init__(self, app: FastAPI):
        self.app = app
        self.issues: List[SecurityIssue] = []
        
        # Common patterns for role/permission checks
        self.role_check_patterns = [
            r"current_user\.role\s*(?:==|!=|in)\s*",
            r"check_user_role\(current_user,",
            r"has_permission\(current_user\.role,",
            r"verify_admin_role\(current_user\)",
            r"verify_provider_role\(current_user\)",
            r"UserRole\..*?\s*(?:==|!=|in)\s*",
            r"if\s+not\s+current_user\.is_admin",
        ]
        
        # Patterns for patient data access
        self.patient_data_patterns = [
            r"/patient",
            r"/patients",
            r"/{patient_id}",
            r"/health",
            r"/treatment",
            r"/diagnos",
            r"/xray",
            r"/record",
            r"/chart",
        ]
        
        # Common auth dependencies
        self.auth_dependency_names = [
            "get_current_user",
            "get_current_active_user",
            "get_current_admin_user",
            "get_optional_user"
        ]
        
        # Security level definitions
        self.security_level_definitions = {
            SecurityIssueLevel.CRITICAL: "Completely unprotected endpoint with patient data or admin functionality",
            SecurityIssueLevel.HIGH: "Authenticated but lacks proper role-based checks for sensitive data",
            SecurityIssueLevel.MEDIUM: "Inconsistent security pattern compared to similar endpoints",
            SecurityIssueLevel.LOW: "Missing optimal security practice but not directly exploitable",
            SecurityIssueLevel.INFO: "Informational finding with no direct security impact"
        }
    
    def _get_route_source_code(self, route: APIRoute) -> Optional[str]:
        """Get the source code for a route handler"""
        if not hasattr(route, "endpoint") or not callable(route.endpoint):
            return None
            
        try:
            source_code = inspect.getsource(route.endpoint)
            return source_code
        except (TypeError, OSError):
            # Source code not available, possibly a lambda or built-in
            return None
    
    def _get_route_file_location(self, route: APIRoute) -> str:
        """Get the file and line number where route handler is defined"""
        try:
            if not hasattr(route, "endpoint") or not callable(route.endpoint):
                return "Unknown location"
                
            # Get the source file and line number
            source_file = inspect.getsourcefile(route.endpoint)
            _, line_number = inspect.getsourcelines(route.endpoint)
            
            if source_file:
                # Make the path relative to improve readability
                source_file = source_file.replace("/".join(source_file.split("/")[:3]), "...")
                return f"{source_file}:{line_number}"
            
            return "Unknown location"
        except (TypeError, OSError):
            return "Unknown location"
    
    def _extract_role_checks(self, source_code: str) -> List[str]:
        """Extract role check statements from source code"""
        role_checks = []
        
        for pattern in self.role_check_patterns:
            matches = re.findall(pattern, source_code)
            role_checks.extend(matches)
            
        return role_checks
    
    def _has_auth_dependency(self, route: APIRoute) -> bool:
        """Check if route has authentication dependency"""
        if not hasattr(route, "dependencies") or not route.dependencies:
            # Check if route endpoint has Depends(get_current_user) in its signature
            signature = inspect.signature(route.endpoint)
            for param in signature.parameters.values():
                # Check if parameter has a default value that's a Depends
                if param.default is not param.empty and str(param.default).startswith("Depends("):
                    for auth_dep in self.auth_dependency_names:
                        if auth_dep in str(param.default):
                            return True
            return False
            
        # Check direct route dependencies
        for dep in route.dependencies:
            if (hasattr(dep, "dependency") and 
                any(auth_dep in str(dep.dependency) for auth_dep in self.auth_dependency_names)):
                return True
                
        return False
    
    def _has_role_check(self, route: APIRoute) -> bool:
        """Check if route has any role-based access control check"""
        source_code = self._get_route_source_code(route)
        if not source_code:
            return False
            
        role_checks = self._extract_role_checks(source_code)
        return len(role_checks) > 0
    
    def _is_patient_data_endpoint(self, route: APIRoute) -> bool:
        """Check if endpoint likely deals with patient data"""
        endpoint_path = route.path.lower()
        
        # Check if path contains patient-related patterns
        return any(pattern.lower() in endpoint_path for pattern in self.patient_data_patterns)
    
    def _determine_security_issue_level(
        self, 
        has_auth: bool, 
        has_role_check: bool, 
        is_patient_data: bool
    ) -> SecurityIssueLevel:
        """Determine security issue level based on endpoint characteristics"""
        if not has_auth and is_patient_data:
            return SecurityIssueLevel.CRITICAL
        elif not has_auth:
            return SecurityIssueLevel.HIGH
        elif has_auth and not has_role_check and is_patient_data:
            return SecurityIssueLevel.HIGH
        elif has_auth and not has_role_check:
            return SecurityIssueLevel.MEDIUM
        else:
            return SecurityIssueLevel.LOW
    
    def _determine_security_status(
        self, 
        has_auth: bool, 
        has_role_check: bool, 
        is_patient_data: bool
    ) -> EndpointSecurityStatus:
        """Determine endpoint security status"""
        if not has_auth:
            return EndpointSecurityStatus.UNAUTHORIZED
        elif has_auth and not has_role_check:
            return EndpointSecurityStatus.AUTH_MISSING_RBAC
        elif is_patient_data and not (has_auth and has_role_check):
            return EndpointSecurityStatus.POTENTIAL_DATA_LEAK
        else:
            return EndpointSecurityStatus.AUTHORIZED
    
    def _get_suggestion(self, status: EndpointSecurityStatus) -> str:
        """Get suggestion based on security status"""
        if status == EndpointSecurityStatus.UNAUTHORIZED:
            return "Add authentication dependency: current_user = Depends(get_current_user)"
        elif status == EndpointSecurityStatus.AUTH_MISSING_RBAC:
            return "Add role check: if current_user.role not in [allowed_roles]: raise HTTPException"
        elif status == EndpointSecurityStatus.POTENTIAL_DATA_LEAK:
            return "Implement proper patient data access control checks"
        elif status == EndpointSecurityStatus.INCONSISTENT_RBAC:
            return "Align role check pattern with similar endpoints"
        else:
            return ""
    
    def _collect_routes(self) -> List[APIRoute]:
        """Collect all routes from the FastAPI application"""
        routes = []
        
        # Get direct routes from app
        for route in self.app.routes:
            if isinstance(route, APIRoute):
                routes.append(route)
        
        # Process mounted routers
        for route in self.app.routes:
            if hasattr(route, "app") and isinstance(route.app, FastAPI):
                for subroute in route.app.routes:
                    if isinstance(subroute, APIRoute):
                        # Adjust the path to include the mount point
                        subroute.path = f"{route.path}{subroute.path}"
                        routes.append(subroute)
        
        return routes
    
    def _group_similar_endpoints(self, routes: List[APIRoute]) -> Dict[str, List[APIRoute]]:
        """Group endpoints that appear to be similar in functionality"""
        groups = {}
        
        # Group by pattern, removing IDs and specific identifiers
        for route in routes:
            # Replace route parameters with placeholders
            pattern = re.sub(r"{[^}]+}", "{param}", route.path)
            
            # Group routes by their pattern
            if pattern not in groups:
                groups[pattern] = []
            groups[pattern].append(route)
        
        return groups
    
    def _check_inconsistent_security(self, routes: List[APIRoute]) -> None:
        """Check for inconsistent security patterns across similar endpoints"""
        groups = self._group_similar_endpoints(routes)
        
        for pattern, group_routes in groups.items():
            # Skip if only one route in the group
            if len(group_routes) <= 1:
                continue
                
            # Count routes with auth and role checks
            with_auth = sum(1 for r in group_routes if self._has_auth_dependency(r))
            with_role_check = sum(1 for r in group_routes if self._has_role_check(r))
            
            # If we have inconsistent auth or role checks within the group
            if 0 < with_auth < len(group_routes) or 0 < with_role_check < len(group_routes):
                # Flag routes with weaker security as inconsistent
                for route in group_routes:
                    has_auth = self._has_auth_dependency(route)
                    has_role = self._has_role_check(route)
                    
                    # If most routes have auth/role but this one doesn't
                    if (with_auth > len(group_routes) / 2 and not has_auth) or \
                       (with_role_check > len(group_routes) / 2 and not has_role):
                        issue = SecurityIssue(
                            endpoint=route.path,
                            method=route.methods[0] if route.methods else "GET",
                            description=(
                                f"Inconsistent security pattern compared to similar endpoints. "
                                f"{with_auth}/{len(group_routes)} similar endpoints have auth, "
                                f"{with_role_check}/{len(group_routes)} have role checks."
                            ),
                            level=SecurityIssueLevel.MEDIUM,
                            status=EndpointSecurityStatus.INCONSISTENT_RBAC,
                            suggestion=self._get_suggestion(EndpointSecurityStatus.INCONSISTENT_RBAC),
                            code_location=self._get_route_file_location(route),
                            affected_route=route
                        )
                        self.issues.append(issue)
    
    def run_audit(self) -> List[Dict[str, Any]]:
        """Run a full RBAC security audit on the FastAPI application"""
        self.issues = []  # Reset issues
        routes = self._collect_routes()
        
        # First, analyze each route individually
        for route in routes:
            # Skip built-in docs endpoints
            if route.path in ("/docs", "/redoc", "/openapi.json"):
                continue
                
            has_auth = self._has_auth_dependency(route)
            has_role_check = self._has_role_check(route)
            is_patient_data = self._is_patient_data_endpoint(route)
            
            # Skip fully authorized endpoints
            if has_auth and has_role_check:
                continue
                
            # Determine security status and issue level
            status = self._determine_security_status(has_auth, has_role_check, is_patient_data)
            level = self._determine_security_issue_level(has_auth, has_role_check, is_patient_data)
            
            # Create issue
            if status != EndpointSecurityStatus.AUTHORIZED:
                description = f"Endpoint with {status.value} issue"
                if is_patient_data:
                    description += " dealing with patient data"
                
                issue = SecurityIssue(
                    endpoint=route.path,
                    method=route.methods[0] if route.methods else "GET",
                    description=description,
                    level=level,
                    status=status,
                    suggestion=self._get_suggestion(status),
                    code_location=self._get_route_file_location(route),
                    affected_route=route
                )
                self.issues.append(issue)
        
        # Then, check for inconsistencies across similar endpoints
        self._check_inconsistent_security(routes)
        
        # Sort issues by level (critical first)
        level_order = {
            SecurityIssueLevel.CRITICAL: 0,
            SecurityIssueLevel.HIGH: 1,
            SecurityIssueLevel.MEDIUM: 2,
            SecurityIssueLevel.LOW: 3,
            SecurityIssueLevel.INFO: 4
        }
        self.issues.sort(key=lambda issue: level_order.get(issue.level, 5))
        
        # Convert to dictionaries for serialization
        return [issue.to_dict() for issue in self.issues]
    
    def get_summary(self) -> Dict[str, Any]:
        """Get a summary of the audit results"""
        if not self.issues:
            self.run_audit()
            
        # Count issues by level
        level_counts = {level.value: 0 for level in SecurityIssueLevel}
        for issue in self.issues:
            level_counts[issue.level] += 1
        
        # Count issues by status
        status_counts = {status.value: 0 for status in EndpointSecurityStatus}
        for issue in self.issues:
            status_counts[issue.status] += 1
            
        # Group endpoints by security pattern
        pattern_counts = {}
        for issue in self.issues:
            pattern = f"{issue.status}_{issue.level}"
            if pattern not in pattern_counts:
                pattern_counts[pattern] = 0
            pattern_counts[pattern] += 1
            
        return {
            "total_issues": len(self.issues),
            "by_level": level_counts,
            "by_status": status_counts,
            "by_pattern": pattern_counts,
            "security_levels": self.security_level_definitions
        }

    def generate_html_report(self) -> str:
        """Generate HTML report for visualization"""
        from .rbac_html_report import generate_html_report
        return generate_html_report(self.issues, self.get_summary())

# Factory function to create an auditor instance
def create_rbac_auditor(app: FastAPI) -> RBACSecurityAudit:
    """Create a new RBAC Security Audit instance for the given FastAPI app"""
    return RBACSecurityAudit(app)

def scan_file_for_vulnerabilities(file_path: str) -> List[RBACVulnerability]:
    """Scan a single file for potential security vulnerabilities"""
    vulnerabilities = []
    
    try:
        with open(file_path, 'r') as f:
            content = f.read()
            
        # Parse the file with ast
        tree = ast.parse(content)
        
        # Look for function definitions
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                func_name = node.name
                line_number = node.lineno
                
                # Check for route decorators
                has_route_decorator = False
                for decorator in node.decorator_list:
                    if isinstance(decorator, ast.Call):
                        if hasattr(decorator.func, 'attr') and decorator.func.attr in ['get', 'post', 'put', 'delete', 'patch']:
                            has_route_decorator = True
                            break
                
                if has_route_decorator:
                    # Check for authentication dependencies
                    has_auth = False
                    for arg in node.args.args:
                        arg_annotation = arg.annotation
                        if arg_annotation and isinstance(arg_annotation, ast.Subscript):
                            if 'Depends' in ast.dump(arg_annotation) and 'current_user' in arg.arg:
                                has_auth = True
                                break
                    
                    if not has_auth:
                        # Check function body for any auth checks
                        function_source = ast.get_source_segment(content, node)
                        if not function_source:
                            continue
                            
                        # Look for common auth patterns
                        auth_patterns = [
                            r"Depends\(get_current_user\)",
                            r"verify_\w+\(current_user\)",
                            r"current_user\[\"role\"\]\s*==",
                            r"current_user\.role\s*=="
                        ]
                        
                        if not any(re.search(pattern, function_source) for pattern in auth_patterns):
                            vulnerabilities.append(RBACVulnerability(
                                vulnerability_type="Missing Authentication",
                                description=f"Function {func_name} may be a route handler without authentication",
                                file_path=file_path,
                                line_number=line_number,
                                severity="Medium",
                                remediation="Add authentication dependency or check",
                                code_snippet=function_source[:200] + "..." if len(function_source) > 200 else function_source,
                                endpoints_affected=[]
                            ))
    except Exception as e:
        print(f"Error scanning file {file_path}: {str(e)}")
    
    return vulnerabilities

def scan_directory_for_vulnerabilities(directory: str) -> List[RBACVulnerability]:
    """Scan a directory recursively for potential security vulnerabilities"""
    vulnerabilities = []
    
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                file_vulns = scan_file_for_vulnerabilities(file_path)
                vulnerabilities.extend(file_vulns)
    
    return vulnerabilities 