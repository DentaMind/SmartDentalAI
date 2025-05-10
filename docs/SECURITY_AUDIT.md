# DentaMind RBAC Security Audit

This document describes the Role-Based Access Control (RBAC) security audit system for DentaMind and how to use it.

## Overview

The RBAC security audit system is designed to identify potential security vulnerabilities in the DentaMind API, particularly focusing on:

1. **Endpoints missing authentication** - Routes that don't require user authentication
2. **Endpoints with authentication but missing role checks** - Routes that authenticate users but don't verify permissions
3. **Inconsistent permission patterns** - Routes with different security patterns than similar endpoints
4. **Potential patient data leaks** - Endpoints handling patient data without proper access controls

The system is particularly important for healthcare applications like DentaMind that must maintain HIPAA compliance.

## Running an Audit

### Option 1: Quick Run

The easiest way to run a security audit is using the provided script:

```bash
python audit_security.py
```

This will:
1. Find your application's FastAPI instance
2. Analyze all routes 
3. Generate an HTML report in the `security_reports` directory
4. Display a summary of findings in the console

### Option 2: API Endpoint (Admin Only)

If you have the application running, admins can access:

- `GET /api/security/audit/rbac` - Returns JSON data of security issues
- `GET /api/security/audit/rbac/report` - Renders an HTML dashboard of security issues

### Option 3: Programmatic Use

You can also use the audit system programmatically in your code:

```python
from backend.api.utils.rbac_audit import RBACSecurityAudit

# Create an auditor instance
auditor = RBACSecurityAudit(app)  # app is your FastAPI instance

# Run the audit
audit_results = auditor.run_audit()

# Get summary statistics
summary = auditor.get_summary()

# Generate HTML report
html_report = auditor.generate_html_report()
```

## Understanding the Report

The HTML report provides:

- **Summary dashboard** - Overall statistics and critical findings
- **Charts and visualizations** - Distribution of issues by severity and type
- **Detailed issue list** - Searchable and filterable table of all findings
- **Suggested fixes** - Recommendations for addressing each issue

### Security Issue Levels

Issues are categorized by severity:

| Level | Description |
|-------|-------------|
| Critical | Completely unprotected endpoint with patient data or admin functionality |
| High | Authenticated but lacks proper role-based checks for sensitive data |
| Medium | Inconsistent security pattern compared to similar endpoints |
| Low | Missing optimal security practice but not directly exploitable |
| Info | Informational finding with no direct security impact |

### Security Status Types

Issues are also categorized by their status:

| Status | Description |
|--------|-------------|
| Unauthorized | Endpoint has no authentication requirements |
| Auth Missing RBAC | Endpoint authenticates users but doesn't check roles |
| Inconsistent RBAC | Endpoint has different security pattern than similar endpoints |
| Potential Data Leak | Endpoint likely handles patient data without proper checks |

## Best Practices for Fixing Issues

### Missing Authentication

Add authentication dependency to route:

```python
@router.get("/patients/{patient_id}")
async def get_patient(
    patient_id: str,
    current_user: User = Depends(get_current_user)  # Add this line
):
    # Function body
```

### Missing Role Checks

Add role validation after authentication:

```python
@router.get("/patients/{patient_id}")
async def get_patient(
    patient_id: str,
    current_user: User = Depends(get_current_user)
):
    # Add this check
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    # Function body
```

### Consistent Permission Patterns

Use helper functions for common permission checks:

```python
def check_patient_access(current_user: User, patient_id: str):
    """Check if user has permission to access this patient's data"""
    # Implementation
    
@router.get("/patients/{patient_id}")
async def get_patient(
    patient_id: str,
    current_user: User = Depends(get_current_user)
):
    check_patient_access(current_user, patient_id)
    # Function body
```

## Regular Security Audits

It's recommended to:

1. Run security audits before major releases
2. Include audits in your CI/CD pipeline 
3. Review findings as part of code reviews
4. Address all critical and high severity issues before deploying to production

## Customizing the Audit

The audit system can be customized by modifying:

- `role_check_patterns` - Regular expressions to identify role checks in code
- `patient_data_patterns` - Patterns to identify endpoints handling patient data
- `auth_dependency_names` - Names of authentication dependencies

See `backend/api/utils/rbac_audit.py` for details.

## HIPAA Compliance Notes

Remember that HIPAA requires:

- Strict access controls for PHI (Protected Health Information)
- Audit trails for access to patient data
- Encryption of data at rest and in transit
- Minimum necessary access principle

The RBAC audit helps enforce some of these requirements by ensuring proper authentication and authorization controls are in place.

## Questions and Support

For questions about the security audit system or assistance with fixing identified issues, please contact the DentaMind security team. 