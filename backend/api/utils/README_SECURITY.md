# DentaMind Security Utilities

This directory contains security-related utilities for the DentaMind API.

## RBAC Security Audit

The RBAC (Role-Based Access Control) security audit system helps identify potential security vulnerabilities in the API routes, focusing on:

1. Endpoints missing authentication
2. Endpoints with authentication but missing role checks
3. Inconsistent permission patterns across similar endpoints
4. Potential data leaks in patient-related endpoints

### Key Files

- `rbac_audit.py` - Core audit logic to analyze FastAPI routes
- `rbac_html_report.py` - HTML report generator for visualizing findings

### How to Use

From Python code:

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

### Running from CLI

For convenience, you can run security audits using:

```bash
python audit_security.py
```

or directly with:

```bash
python backend/run_security_audit.py
```

### Security Router

A security router is also provided at `backend/api/routers/security_audit.py` that exposes audit functionality through API endpoints (admin-only access):

- `GET /api/security/audit/rbac` - Returns JSON data of security issues
- `GET /api/security/audit/rbac/report` - Renders an HTML dashboard of security issues

## Extending the System

### Adding New Security Checks

To add new security checks, modify the `RBACSecurityAudit` class in `rbac_audit.py`:

1. Add new patterns to check for (e.g., `role_check_patterns`, `patient_data_patterns`)
2. Implement new detection methods
3. Add appropriate security levels and status types

### Customizing Reports

To customize the HTML report, modify `generate_html_report` in `rbac_html_report.py`.

## Security Best Practices

When implementing API routes in DentaMind, always follow these security best practices:

1. **Every endpoint should use authentication**:
   ```python
   @router.get("/some-endpoint")
   async def some_endpoint(current_user: User = Depends(get_current_user)):
       # ...
   ```

2. **Check user roles for sensitive operations**:
   ```python
   if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR]:
       raise HTTPException(status_code=403, detail="Insufficient permissions")
   ```

3. **Validate patient access**:
   ```python
   # When accessing patient data, verify the user has permission
   # to access that specific patient's information
   if not has_patient_access(current_user, patient_id):
       raise HTTPException(status_code=403, detail="Not authorized to access this patient")
   ```

4. **Use consistent permission patterns**:
   ```python
   # Use helper functions for common permission checks
   check_treatment_permissions(current_user, treatment_id)
   ```

5. **HIPAA Compliance**:
   - Remember that DentaMind operates in a healthcare context where HIPAA compliance is crucial
   - All patient data access must be properly authenticated, authorized, and audited
   - Ensure minimum necessary access principle is followed 

# DentaMind Security Alert Management System

## Overview

The DentaMind Security Alert Management System is a comprehensive solution for detecting, tracking, and resolving security incidents in a HIPAA-compliant dental practice management platform. The system is designed to help identify potential security threats, track their resolution, and maintain detailed audit logs for compliance purposes.

## Key Components

1. **Anomaly Detection System**
   - Monitors audit logs for suspicious patterns
   - Analyzes user behavior, access patterns, and system metrics
   - Detects anomalies such as:
     - Multiple failed login attempts
     - Unusual access patterns to patient records
     - API abuse or scraping
     - Access from new or suspicious locations
     - Access during unusual hours

2. **Security Alert Database**
   - Tracks alerts through their entire lifecycle
   - Maintains detailed metadata about affected entities
   - Stores resolution actions and status changes
   - Categories include: access, auth, API, location, behavior, system
   - Severity levels: low, medium, high, critical
   - Resolution statuses: open, acknowledged, false positive, resolved, escalated

3. **Security Alerts API**
   - Endpoints for listing and filtering alerts
   - Status management (acknowledge, resolve, mark as false positive)
   - Assignment functionality
   - Alert statistics and metrics
   - On-demand security scanning

4. **Notification System**
   - Real-time notifications for critical security alerts
   - Weekly security digests with resolution statistics
   - HTML and plain text email formats for all notifications

## HIPAA Compliance Features

The Security Alert Management System helps ensure HIPAA compliance through:

1. **Audit Trails**
   - Detailed tracking of all access to PHI (Protected Health Information)
   - Record of all security-related actions and status changes
   - Timestamps for detection, acknowledgment, and resolution

2. **Incident Management**
   - Structured workflow for security incident handling
   - Assignment capabilities to ensure accountability
   - Resolution tracking for regulatory reporting

3. **Resolution Metrics**
   - Average resolution times
   - False positive tracking
   - Categorization of security events

4. **Proactive Monitoring**
   - Early detection of potential security breaches
   - Scheduled security scans
   - Pattern recognition for unusual behavior

## Security Alert Workflow

1. **Detection**
   - Anomaly detected through automated monitoring
   - Alert created with appropriate severity level
   - Critical alerts trigger immediate notifications

2. **Triage**
   - Security/admin user acknowledges the alert
   - Alert is assigned to appropriate personnel
   - Initial assessment of severity and impact

3. **Investigation**
   - Review of alert details and affected entities
   - Analysis of audit logs and related events
   - Determination of actual threat level

4. **Resolution**
   - Implementation of necessary security measures
   - Documentation of resolution actions
   - Status update to "resolved" or "false positive"

5. **Reporting**
   - Weekly security digests for management review
   - Resolution metrics for compliance reporting
   - Historical data for security trend analysis

## Using the Security Alerts API

### Listing Security Alerts

```
GET /api/security/alerts
```

Parameters:
- `start_time`: Start timestamp (ISO format)
- `end_time`: End timestamp (ISO format)
- `alert_type`: Filter by alert type
- `category`: Filter by alert category
- `severity`: Filter by severity levels (comma-separated)
- `status`: Filter by alert status (comma-separated)
- `user_id`: Filter by affected user ID
- `ip_address`: Filter by IP address
- `patient_id`: Filter by patient ID
- `limit`: Maximum number of alerts to return (default: 100)
- `offset`: Number of alerts to skip (for pagination)

### Updating Alert Status

```
PUT /api/security/alerts/{alert_id}/status
```

Request body:
```json
{
  "status": "acknowledged",
  "assigned_to": "security_team_member",
  "resolution_notes": "Under investigation"
}
```

### Running a Security Scan

```
POST /api/security/alerts/scan
```

Parameters:
- `days`: Number of days to scan (1-30, default: 1)

### Sending a Security Digest

```
POST /api/security/alerts/digest
```

Parameters:
- `days`: Number of days to include in digest (1-30, default: 7)
- `recipients`: Optional list of email recipients

## Best Practices

1. **Immediate Response**
   - Critical and high-severity alerts should be acknowledged within 1 hour
   - Document all investigation steps and findings

2. **Regular Reviews**
   - Review weekly security digests with the security team
   - Analyze patterns of alerts to identify systemic issues

3. **Escalation Protocol**
   - Establish clear criteria for when to escalate security issues
   - Define escalation paths for different types of security alerts

4. **Documentation**
   - Maintain detailed notes about resolution actions
   - Record false positives to improve detection algorithms

## Scheduled Tasks

The system automatically performs these security-related scheduled tasks:

1. **Weekly Security Digest**: Sent every Monday morning at 7:00 AM
2. **Security Scans**: Performed daily at midnight

## Further Development

The security alert system can be extended with:

1. Machine learning to improve anomaly detection accuracy
2. Integration with third-party security tools
3. Advanced reporting and visualization dashboard
4. Mobile notifications for critical alerts 