# DentaMind Security Checklist

## 🔒 Initial Setup

- [ ] Run `./setup-security-checks.sh` to install pre-commit hooks
- [ ] Read the full [Security Documentation](SECURITY.md)
- [ ] Ensure your development branch is protected with required status checks

## 🛡️ When Creating New Endpoints

- [ ] **Authentication**: Include `current_user: User = Depends(get_current_user)`
- [ ] **Role Validation**: Check `current_user.role` against allowed roles
- [ ] **Patient Data**: Verify user has access to the specific patient
- [ ] **Consistency**: Use the same security patterns as similar endpoints

## ✅ Before Committing Code

- [ ] Run `python backend/run_security_audit.py` if making significant API changes
- [ ] Address any high-severity issues identified by the pre-commit hook
- [ ] Consider medium-severity issues for future improvements
- [ ] Check that all patient-related endpoints have proper role validation

## 🔍 During Code Reviews

- [ ] Verify the GitHub Actions security audit passed on the PR
- [ ] Check that new endpoints follow security best practices
- [ ] Ensure consistent security patterns across similar endpoints
- [ ] Look for proper handling of patient data

## 🚀 Before Deployment

- [ ] Run a comprehensive security audit
- [ ] Ensure no critical or high security issues remain
- [ ] Verify security logs are properly configured
- [ ] Test API endpoints with various user roles

## 🔄 Regular Maintenance

- [ ] Run security audits at least monthly
- [ ] Update dependencies to address security vulnerabilities
- [ ] Review and update role permissions as needed
- [ ] Check for any unauthorized routes that might have been added

## 📊 Security Enforcement Tools

| Tool | Command/Location | Purpose |
|------|------------------|---------|
| Pre-commit Hook | `.githooks/pre-commit` | Blocks insecure commits |
| GitHub Action | `.github/workflows/security-audit.yml` | Audits PRs |
| Manual Audit | `python backend/run_security_audit.py` | Generate security report |
| API Endpoint | `/api/security/audit/rbac/report` | Admin dashboard |

## 🚩 Common Security Issues

- **Unauthorized Endpoint**: Missing authentication dependency
- **Missing RBAC**: Has authentication but no role checks
- **Inconsistent Security**: Different patterns than similar endpoints
- **Potential Data Leak**: Patient data without proper checks

## 🆘 When Security Issues Are Found

1. **Understand the issue**: Read the description and examine the code location
2. **Follow the suggestion**: Most issues have clear remediation steps
3. **Verify the fix**: Run the security audit again to confirm
4. **Document exceptions**: If an exception is needed, document why thoroughly

## 🔐 HIPAA Compliance Reminders

- **PHI Access**: Always verify authentication and authorization before accessing PHI
- **Minimum Necessary**: Only access the minimum patient data necessary for the task
- **Audit Trails**: Ensure all PHI access is logged with user, timestamp, and reason
- **Data Security**: Encrypt PHI in transit and at rest

---

For more detailed guidance, refer to the [DentaMind Security Documentation](SECURITY.md). 