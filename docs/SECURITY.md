# DentaMind Security Documentation

## Overview
This document outlines the security measures and best practices implemented in the DentaMind application to protect sensitive patient data and ensure secure system operations.

## Security Features

### Authentication & Authorization
- JWT-based authentication with secure token management
- Role-based access control (RBAC)
- Session management with secure cookie handling
- Multi-factor authentication support
- Password policies and secure storage

### Data Protection
- End-to-end encryption for sensitive data
- Secure storage of patient records
- HIPAA-compliant data handling
- Regular data backups with encryption
- Secure file upload/download mechanisms

### API Security
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS policy implementation
- API authentication tokens
- Request logging and monitoring

### Infrastructure Security
- Secure environment variable handling
- Git security measures (pre-commit hooks)
- Large file handling with Git LFS
- Docker container security
- Database security measures

### Audit & Monitoring
- Comprehensive audit logging
- Security event monitoring
- Performance monitoring
- Error tracking and alerting
- Regular security scans

## Security Protocols

### Environment Variables
- Never commit `.env` files
- Use `.env.example` for templates
- Secure storage of production secrets
- Regular rotation of sensitive keys

### Code Security
- Automated security scanning
- Dependency vulnerability checks
- Code review requirements
- Secure deployment process

### Access Control
- Principle of least privilege
- Regular access reviews
- Secure password policies
- Session management

### Incident Response
1. Immediate threat containment
2. Impact assessment
3. System recovery
4. Post-incident analysis
5. Security improvement implementation

## Best Practices

### Development
- Follow secure coding guidelines
- Regular security training
- Code review requirements
- Testing requirements

### Deployment
- Secure CI/CD pipeline
- Production deployment checks
- Rollback procedures
- Monitoring setup

### Maintenance
- Regular security updates
- Dependency management
- System monitoring
- Backup procedures

## Compliance

### HIPAA Compliance
- Patient data protection
- Access controls
- Audit logging
- Security assessments

### Data Privacy
- GDPR considerations
- Data retention policies
- Data access procedures
- Privacy impact assessments

## Security Contacts

### Emergency Contacts
- Security Team: security@dentamind.com
- Emergency Response: emergency@dentamind.com
- On-call Support: oncall@dentamind.com

### Reporting
- Security Issues: security@dentamind.com
- Bug Reports: bugs@dentamind.com
- General Inquiries: support@dentamind.com

## Version History

### Current Version: 1.0.0
- Initial security documentation
- Basic security measures
- HIPAA compliance implementation

### Planned Updates
- Enhanced MFA implementation
- Advanced audit logging
- Automated security testing
- Additional compliance measures

## HIPAA Compliance

As a dental practice management platform, DentaMind handles protected health information (PHI) and must comply with HIPAA regulations. Key security requirements include:

- **Authentication and Authorization**: All users must be authenticated and authorized to access specific resources.
- **Role-Based Access Control**: Different user roles (doctor, assistant, admin, etc.) must have appropriate permissions.
- **Audit Trails**: All access to PHI must be logged and auditable.
- **Data Encryption**: PHI must be encrypted both in transit and at rest.
- **Access Controls**: Minimum necessary access principle must be enforced.

## RBAC Security Audit System

DentaMind includes a comprehensive RBAC security audit system that automatically:

1. **Detects unprotected endpoints**: Identifies API routes missing authentication requirements.
2. **Identifies missing role checks**: Finds endpoints that authenticate users but don't verify appropriate role permissions.
3. **Flags inconsistent security patterns**: Highlights endpoints with different security implementations than similar endpoints.
4. **Detects potential data leaks**: Identifies patient data that might be accessible without proper controls.

### Using the Audit System

#### Option 1: Automated CI/CD Checks

The RBAC audit runs automatically as part of the CI/CD pipeline:

- On every pull request (via GitHub Actions)
- Blocks merging code with critical security issues
- Posts detailed reports as PR comments

#### Option 2: Pre-commit Hooks

Local development security checks are available through Git pre-commit hooks:

```bash
# Install the pre-commit hooks
./setup-security-checks.sh
```

This will install a hook that checks staged code for security issues before each commit.

#### Option 3: Manual Audit

Run a full security audit and generate an HTML report manually:

```bash
python backend/run_security_audit.py
```

This will:
- Analyze all endpoints in the application
- Generate a detailed HTML report
- Save the report in the `security_reports` directory

#### Option 4: Admin API Endpoints

When the application is running, administrators can access security audit functionality through API endpoints:

- `GET /api/security/audit/rbac` - Run audit and return JSON
- `GET /api/security/audit/rbac/report` - Generate HTML dashboard

### Understanding Audit Results

#### Security Issue Levels

Issues are categorized by severity:

| Level | Description |
|-------|-------------|
| Critical | Completely unprotected endpoint with patient data or admin functionality |
| High | Authenticated but lacks proper role-based checks for sensitive data |
| Medium | Inconsistent security pattern compared to similar endpoints |
| Low | Missing optimal security practice but not directly exploitable |
| Info | Informational finding with no direct security impact |

#### Security Status Types

Issues are also categorized by status:

| Status | Description |
|--------|-------------|
| Unauthorized | Endpoint has no authentication requirements |
| Auth Missing RBAC | Endpoint authenticates users but doesn't check roles |
| Inconsistent RBAC | Endpoint has different security pattern than similar endpoints |
| Potential Data Leak | Endpoint likely handles patient data without proper checks |

## Security Best Practices for Development

### Authentication

Always add authentication dependency to routes:

```python
@router.get("/example")
async def example_endpoint(
    current_user: User = Depends(get_current_user)  # Add this
):
    # Function body
```

### Role-Based Access Control

Add role validation after authentication:

```python
@router.get("/example")
async def example_endpoint(
    current_user: User = Depends(get_current_user)
):
    # Add role check
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    # Function body
```

### Handling Patient Data

When accessing patient data, always verify the user has appropriate permissions:

```python
@router.get("/patients/{patient_id}")
async def get_patient(
    patient_id: str,
    current_user: User = Depends(get_current_user)
):
    # Check if user has permission to access this patient
    if not has_patient_access(current_user, patient_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this patient"
        )
    
    # Function body
```

### Consistent Security Patterns

Use helper functions for common security patterns to ensure consistency:

```python
# Reusable helper for patient data access
def check_patient_access(user: User, patient_id: str) -> bool:
    """Check if user has permission to access this patient's data"""
    # Implementation
    
# Reusable helper for requiring specific role
def require_role(user: User, allowed_roles: List[UserRole]) -> None:
    """Verify user has one of the allowed roles or raise exception"""
    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
```

## Data Protection

### Database Security

- Use parameterized queries to prevent SQL injection
- Encrypt sensitive data at rest
- Follow the principle of least privilege for database access

### API Security

- Validate and sanitize all user inputs
- Set appropriate CORS policies
- Use HTTPS for all traffic

### Sensitive Data Handling

- Never log PHI
- Sanitize error messages to avoid revealing sensitive information
- Implement proper data retention and deletion policies

## Security Reporting and Response

If you discover a security vulnerability in DentaMind:

1. **Do not** disclose it publicly
2. Contact the security team at security@dentamind.example.com
3. Include detailed information about the vulnerability
4. We will acknowledge receipt within 24 hours
5. We will provide a timeline for addressing the issue

## Regular Security Maintenance

Regularly perform these security tasks:

1. Run security audits before major releases
2. Update dependencies to address security vulnerabilities
3. Review and update role permissions as needed
4. Conduct security training for the development team

# Security Guidelines for DentaMind

## Overview

DentaMind is a dental practice management application that handles sensitive patient data. As such, it must adhere to strict security requirements, including HIPAA compliance for patient data protection.

This document outlines security practices that all developers must follow when working on this codebase.

## HIPAA Compliance Requirements

As a dental practice management system, DentaMind handles Protected Health Information (PHI) and must comply with HIPAA regulations:

### Required Safeguards

1. **Administrative Safeguards**
   - Access Control: Only authorized users can access patient data
   - Audit Controls: All PHI access is logged and auditable
   - Security Management: Regular risk assessments
   - Training: Security awareness training documentation

2. **Technical Safeguards**
   - Access Controls: Unique user identification, automatic logoff, encryption
   - Audit Controls: Logging of all PHI access and modifications
   - Integrity Controls: Data cannot be improperly altered
   - Transmission Security: Data encrypted in transit

3. **Physical Safeguards**
   - For deployment environments, ensure physical access restrictions

## Authentication and Authorization

All API endpoints that handle patient data **MUST** include:

1. **Authentication** - Verify the user is logged in using `Depends(get_current_user)` dependency
2. **Authorization** - Verify the user has the correct role/permissions to access the data

Example:

```python
@router.get("/patients/{patient_id}")
async def get_patient(
    patient_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)  # Authentication
):
    # Authorization
    if current_user["role"] not in ["admin", "dentist", "staff"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Handle the request
    # ...
```

## Secrets Management

### Environment Variables

- **Never commit `.env` files or any file containing secrets**
- Always use `.env.example` files with placeholder values
- Use a secrets manager for production environments
- Rotate secrets immediately if they are accidentally exposed

### Secret Detection

Pre-commit hooks are configured to detect and prevent committing secrets:

- Run `./setup-security-checks.sh` to set up pre-commit hooks
- Never bypass these checks with `--no-verify` unless absolutely necessary
- If secrets are exposed, run `./rotate-secrets.sh` immediately

## Common Security Issues

### Missing Authentication

All endpoints should use `Depends(get_current_user)` to ensure the request is authenticated.

### Missing Role Checks

After verifying authentication, verify that the user has the appropriate role to access the resource.

### SQL Injection

Always use parameterized queries instead of string concatenation.

**Incorrect:**
```python
query = f"SELECT * FROM users WHERE username = '{username}'"
```

**Correct:**
```python
query = "SELECT * FROM users WHERE username = :username"
db.execute(query, {"username": username})
```

### Sensitive Data Exposure

- Never log sensitive information (passwords, tokens, patient data)
- Encrypt sensitive data at rest
- Use HTTPS for all communications

## Security Practices for Development

1. **Isolation of Environments**
   - Use separate development, staging, and production environments
   - Never use production data in development

2. **Dependency Management**
   - Regularly update dependencies
   - Use `npm audit` and `pip-audit` to check for vulnerabilities

3. **Code Review**
   - Security-focused code reviews
   - Check for exposed secrets, authentication, and authorization

4. **Regular Security Audits**
   - Schedule regular security audits
   - Use automated scanning tools

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** create a public issue
2. Report it to [security@dentamind.com](mailto:security@dentamind.com)
3. Include detailed information about the vulnerability
4. Do not disclose to others until it's resolved

## Security Tools

- **Pre-commit Hooks**: Prevent committing secrets
- **detect-secrets**: Detect high entropy strings and secrets
- **TruffleHog**: Scan for credentials in Git history
- **GitHub Secret Scanning**: Automatic detection of common credential formats 