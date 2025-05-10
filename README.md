# DentaMind: AI-Enhanced Dental Practice Management

![HIPAA Compliant](https://img.shields.io/badge/HIPAA-Ready-blue?style=flat&logo=security)
![Security Scanning Enabled](https://img.shields.io/badge/Security-Scanning%20Enabled-brightgreen?style=flat&logo=github)
![Version](https://img.shields.io/badge/version-v1.0.0--secure-orange?style=flat&logo=git)

DentaMind is a comprehensive dental practice management system enhanced with AI capabilities for better diagnostics, treatment planning, and practice operations.

## 🔐 Security & Compliance

DentaMind has been hardened with healthcare-grade security measures to ensure HIPAA compliance and protect sensitive patient data:

- **End-to-end encryption** for all patient data
- **Role-based access control** with fine-grained permissions
- **Comprehensive audit logging** for all PHI access
- **Automated security scanning** in CI/CD pipeline
- **Secret leak prevention** with pre-commit hooks

For detailed security information, see [SECURITY-COMPLIANCE.md](SECURITY-COMPLIANCE.md).

## ✨ Features

- **AI-Assisted Diagnostics:** Enhance radiograph analysis and clinical findings
- **Interactive Treatment Planning:** Visual treatment builder with AI suggestions
- **Patient Intake System:** Digital forms with AI-powered assistance
- **Perio & Restorative Charting:** Modern, voice-enabled digital charts
- **Scheduling & Appointments:** Smart scheduling with AI optimization
- **Billing & Insurance:** Automated claim processing and verification
- **Clinical Notes:** AI-assisted documentation and template system
- **Patient Portal:** Secure communication and record access

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- Docker (optional for containerized deployment)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YourOrg/DentaMind.git
   cd DentaMind
   ```

2. Set up environment:
   ```bash
   # Create environment files from examples
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   
   # Fill in your configuration values in the .env files
   ```

3. Install dependencies:
   ```bash
   # Backend
   pip install -r requirements.txt
   
   # Frontend
   cd frontend
   npm install
   ```

4. Run database migrations:
   ```bash
   python -m alembic upgrade head
   ```

5. Start the development servers:
   ```bash
   # Backend API
   python main.py
   
   # Frontend (in a separate terminal)
   cd frontend
   npm run dev
   ```

## 🛠️ Development

### Project Structure

```
DentaMind/
├── backend/         # FastAPI backend
├── frontend/        # React TypeScript frontend
├── models/          # AI models and inference
├── shared/          # Shared types and utilities
└── docs/            # Documentation
```

### Security Setup

Set up security checks before contributing:

```bash
./setup-security-checks.sh
```

This installs pre-commit hooks to prevent accidental secret leaks and maintain code quality.

## 🔄 Release History

- **v1.0.0-secure** (Current) - Security hardened release with HIPAA compliance
- Previous versions - Initial development and feature iterations

## 📄 License

This project is licensed under the [License Name] - see the LICENSE file for details.

## 🙏 Acknowledgments

- All contributors to this project
- DentaMind team and advisors
- Healthcare security experts who provided guidance