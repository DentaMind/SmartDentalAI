# 🚀 DentaMind Deployment Guide

## 🔐 Security-First CI/CD Pipeline

This app uses a secure GitHub Actions pipeline that enforces:

### ✅ Token Validation
- Checks `JWT_SECRET` and `EMAIL_LINK_SECRET` for blacklisted values
- Validates these secrets before any deployment proceeds
- Automatic token rotation via `npm run rotate-tokens`

### ✅ Environment Validation
- Deployment will fail if any of the following are missing:
  - `JWT_SECRET`
  - `EMAIL_LINK_SECRET`
  - `OPENAI_API_KEY`
  - `REDIS_URL`
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`

### ✅ Testing & Linting
- All code is linted (`npm run lint`)
- Tests are run (`npm test`)
- Security audit is performed (`npm audit`)
- Failure in any step halts deployment

### ✅ Deployment to Vercel
- On push to `main`, code is deployed to production via Vercel
- Slack notifications are sent on success or failure
- Auto-rollback on deployment failure

## 📦 Environment Secrets Setup

Secrets must be stored in GitHub Actions:

| Name | Description |
|------|-------------|
| `JWT_SECRET` | Main token for user sessions |
| `EMAIL_LINK_SECRET` | Secure email token |
| `OPENAI_API_KEY` | For AI services |
| `REDIS_URL` | Redis connection |
| `VERCEL_TOKEN` | Personal Vercel token |
| `VERCEL_ORG_ID` | From Vercel org settings |
| `VERCEL_PROJECT_ID` | From Vercel project settings |
| `SLACK_WEBHOOK` | For deployment alerts |

## 🔁 Deployment Workflow Overview

```
git push origin main
⬇️
GitHub Actions triggers
⬇️
- Validate secrets
- Scan for blacklisted tokens
- Lint & test
- Run security audit
- Deploy to Vercel
- Notify Slack
```

## 🧪 Local Pre-Commit Safety

Before pushing, this pre-commit hook checks:

- ❌ `.env` file inclusion
- ❌ Private key or certificate file inclusion
- ❌ Large file inclusion (>10MB)
- ❌ Presence of blacklisted tokens in source

It must be executable:
```bash
chmod +x .git/hooks/pre-commit
```

## 🔑 Token Rotation

To rotate security tokens:

```bash
npm run rotate-tokens
```

This will:
1. Generate new secure tokens for:
   - `JWT_SECRET`
   - `EMAIL_LINK_SECRET`
2. Update the local `.env` file
3. Provide instructions for updating tokens in:
   - GitHub Secrets
   - Vercel Environment Variables
   - Other deployment environments

## 🧠 Deployment FAQ

- **Q: How do I preview changes?**  
  Create a PR. Use `vercel pull` or auto-preview links (coming soon).

- **Q: What if my deployment fails?**  
  Check GitHub Actions logs + Slack channel for the error.

- **Q: How do I add a new secret?**  
  Go to GitHub → Repository → Settings → Secrets → Actions.

- **Q: How often should I rotate tokens?**  
  Recommended: Every 90 days or after security incidents.

## 🔄 Auto-Rollback Configuration

The deployment pipeline includes automatic rollback on failure:

1. Vercel monitors deployment health
2. If deployment fails or health checks fail:
   - Previous version is automatically restored
   - Slack notification is sent with rollback details
   - GitHub Actions logs are updated

## 🌱 Staging Environment

PRs automatically deploy to staging:

1. Create a PR from feature branch
2. GitHub Actions:
   - Deploys to staging environment
   - Runs tests and validations
   - Provides preview URL in PR comments
3. After PR merge:
   - Staging is automatically promoted to production
   - Old staging deployment is cleaned up

## 📝 Version History

| Date | Version | Changes |
|------|---------|---------|
| 2024-03-20 | 1.0.0 | Initial deployment guide |
| 2024-03-20 | 1.1.0 | Added auto-rollback and staging |
| 2024-03-20 | 1.2.0 | Added token rotation and security audit | 