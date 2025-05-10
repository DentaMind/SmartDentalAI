# Environment Setup Guide

This guide explains how to properly set up environment variables for DentaMind while maintaining security best practices.

## Security First

Environment variables often contain sensitive information like API keys, database credentials, and other secrets. Always follow these principles:

1. **Never commit `.env` files to version control**
2. **Rotate secrets immediately if they are accidentally exposed**
3. **Use different credentials for development, staging, and production**

## Setting Up Your Environment

Create a `.env` file in the appropriate directories:

### For Backend (FastAPI)

Create a file named `.env` in the `backend/` directory with the following variables:

```
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/dentamind
DATABASE_USER=dentamind_user
DATABASE_PASSWORD=your_db_password_here
DATABASE_NAME=dentamind
DATABASE_HOST=localhost
DATABASE_PORT=5432

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
ENVIRONMENT=development

# Security
SECRET_KEY=your_secret_key_here  # Generate with: python -c 'import secrets; print(secrets.token_hex(32))'
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALGORITHM=HS256

# Email Configuration
SMTP_SERVER=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_smtp_password_here
EMAIL_FROM=noreply@dentamind.ai

# Twilio Configuration (for SMS)
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567

# AI Service Configuration
AI_API_KEY=your_openai_api_key_here
AI_MODEL=gpt-4o
AI_MAX_TOKENS=4096
AI_TEMPERATURE=0.7

# Storage Configuration
STORAGE_TYPE=local  # Options: local, s3
STORAGE_PATH=./attached_assets
```

### For Frontend (React)

Create a file named `.env` in the `frontend/` directory:

```
VITE_API_URL=http://localhost:8000/api
VITE_WEBSOCKET_URL=ws://localhost:8000/ws
VITE_ENVIRONMENT=development
```

## Generating Secure Values

For generating secure random values:

```bash
# Generate a secure SECRET_KEY
python -c 'import secrets; print(secrets.token_hex(32))'
```

## Accessing Environment Variables

### In Python (Backend)

```python
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Access variables
database_url = os.getenv("DATABASE_URL")
secret_key = os.getenv("SECRET_KEY")
```

### In TypeScript/JavaScript (Frontend)

```typescript
// Access variables
const apiUrl = import.meta.env.VITE_API_URL;
const environment = import.meta.env.VITE_ENVIRONMENT;
```

## Environment Variables in CI/CD

For GitHub Actions or other CI/CD pipelines, use repository secrets instead of committing `.env` files:

1. Go to your repository settings
2. Navigate to Secrets and Variables → Actions
3. Add each required environment variable
4. Reference them in workflow files using `${{ secrets.SECRET_NAME }}`

## Environment Variables in Production

For production environments:

1. Use your hosting provider's environment variable management (Vercel, Heroku, AWS, etc.)
2. Consider using a secrets manager for sensitive information (AWS Secrets Manager, HashiCorp Vault, etc.)
3. Rotate production secrets regularly

## Security Checklist

- [ ] Verified `.env` is in `.gitignore`
- [ ] Created separate credentials for each environment
- [ ] Limited permissions to only what's necessary
- [ ] Set up secret rotation schedule
- [ ] Added environment validation on application startup 