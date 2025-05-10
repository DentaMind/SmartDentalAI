#!/bin/bash
# Setup script for DentaMind security checks

set -e

REPO_DIR=$(pwd)
SCRIPT_DIR=$(dirname "$0")
GITHOOKS_DIR="${REPO_DIR}/.githooks"

# Print banner
echo "========================================"
echo "DentaMind Security Checks Setup"
echo "========================================"
echo

# Create necessary directories
mkdir -p "${REPO_DIR}/reports"
mkdir -p "${REPO_DIR}/logs"
mkdir -p "${GITHOOKS_DIR}"

# Make sure the pre-commit hook is executable
if [ -f "${GITHOOKS_DIR}/pre-commit" ]; then
    chmod +x "${GITHOOKS_DIR}/pre-commit"
    echo "✅ Pre-commit hook made executable"
else
    echo "❌ Pre-commit hook not found at ${GITHOOKS_DIR}/pre-commit"
    exit 1
fi

# Configure git to use our hooks directory
git config core.hooksPath .githooks
echo "✅ Git configured to use hooks from .githooks directory"

# Check if Python is available
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python not found. Please install Python to use security checks."
    exit 1
fi

# Install required Python packages
echo "Installing required Python packages..."
$PYTHON_CMD -m pip install -r requirements.txt
echo "✅ Python packages installed"

# Run an initial security scan
echo "Running initial security scan..."
$PYTHON_CMD backend/scripts/run_security_audit.py
echo "✅ Initial security scan completed"

# Create security documentation
mkdir -p docs
if [ ! -f "docs/SECURITY.md" ]; then
    cat > docs/SECURITY.md << 'EOF'
# Security Guidelines for DentaMind

## Overview

DentaMind is a dental practice management application that handles sensitive patient data. As such, it must adhere to strict security requirements, including HIPAA compliance for patient data protection.

This document outlines security practices that all developers must follow when working on this codebase.

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

## Security Checks

### Automated Checks

The project includes several automated security checks:

1. **Pre-commit hooks** - Scans staged files for security issues before commit
2. **Security audit** - Run `python backend/scripts/run_security_audit.py` to scan the entire codebase
3. **CI/CD pipeline** - Security checks run automatically on PR and block merge if critical issues are found

### Running Security Audits

To run a security audit on the entire application:

```bash
python backend/scripts/run_security_audit.py
```

To scan a specific directory:

```bash
python backend/scripts/run_security_audit.py scan --directory backend/api
```

### Security Reports

Security reports are generated in the `reports/` directory. The HTML reports provide a comprehensive overview of the security status of the application.

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

## Reporting Security Issues

If you discover a security vulnerability, please report it to [security@dentamind.com](mailto:security@dentamind.com) instead of creating a public issue.
EOF
    echo "✅ Created docs/SECURITY.md"
fi

if [ ! -f "docs/SECURITY_CHECKLIST.md" ]; then
    cat > docs/SECURITY_CHECKLIST.md << 'EOF'
# DentaMind Security Checklist

## API Endpoint Security

- [ ] All endpoints requiring authentication use `Depends(get_current_user)`
- [ ] Admin endpoints use proper role verification (e.g., `Depends(verify_admin_role)`)
- [ ] Patient data endpoints use proper authentication and authorization
- [ ] Critical operations (delete, update) have additional verification
- [ ] Input validation is performed on all data

## Data Security

- [ ] Sensitive data is never logged
- [ ] Proper error handling to avoid leaking data
- [ ] No hardcoded credentials or secrets
- [ ] Database queries are parameterized to prevent SQL injection
- [ ] Files with sensitive data have proper access controls

## Authentication

- [ ] Token expiration is enforced
- [ ] Password complexity requirements are enforced
- [ ] Two-factor authentication is available for sensitive roles
- [ ] Brute force protection is implemented

## Authorization

- [ ] Role-based access control is consistently applied
- [ ] Proper access checks for all sensitive operations
- [ ] Principle of least privilege is followed

## HIPAA Compliance

- [ ] All PHI (Protected Health Information) is properly secured
- [ ] Access to patient data is logged for audit purposes
- [ ] Patient data access requires specific permissions
- [ ] Data retention policies are properly implemented

## Infrastructure Security

- [ ] HTTPS is enforced for all communications
- [ ] Security headers are properly set
- [ ] CORS is properly configured
- [ ] Rate limiting is implemented

## Third-Party Dependencies

- [ ] All dependencies are reviewed for security issues
- [ ] Dependencies are kept up-to-date
- [ ] Minimal set of dependencies used

## Security Testing

- [ ] Security audit is run regularly
- [ ] Security issues are treated as high priority
- [ ] Code reviews include security considerations
EOF
    echo "✅ Created docs/SECURITY_CHECKLIST.md"
fi

# Update README to mention security features
if [ -f "README.md" ] && ! grep -q "Security Audit" "README.md"; then
    cat >> README.md << 'EOF'

## Security Features

DentaMind includes a comprehensive security audit system to ensure protection of sensitive patient data:

- **Security Audit**: Run `python backend/scripts/run_security_audit.py` to check for security issues
- **Pre-commit Hooks**: Automatically check for security issues before committing code
- **CI/CD Integration**: Security checks are run automatically during CI/CD
- **Security Documentation**: See `docs/SECURITY.md` for security guidelines

For more information, see the [Security Guidelines](docs/SECURITY.md).
EOF
    echo "✅ Updated README.md with security information"
fi

echo
echo "========================================"
echo "✅ Security checks setup complete!"
echo "========================================"
echo
echo "To run a security audit:"
echo "   python backend/scripts/run_security_audit.py"
echo
echo "The pre-commit hook will automatically run before each commit."
echo "Security reports will be generated in the reports/ directory." 