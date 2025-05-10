# DentaMind

DentaMind is a full-stack AI-powered dental operating platform that integrates diagnostics, patient management, treatment planning, and business intelligence into a single, modular ecosystem.

## 🧠 Core Features

- **AI Diagnostics**: Roboflow-integrated radiograph analysis with GPT-based reasoning
- **Clinical Dashboard**: Patient overview with diagnostic cards, 3D charts, perio status
- **Perio & Restorative Charting**: Complete dental charting with AI overlay
- **Treatment Planning**: AI-generated plans with insurance integration
- **Scheduler**: Comprehensive appointment scheduling system
- **Research Module**: IRB protocol tracking and AI model training

## 🛠️ Tech Stack

- **Frontend**: React (TypeScript), Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, PostgreSQL, Pydantic
- **AI Integration**: Roboflow for image models, GPT for reasoning
- **Infrastructure**: Dual-server architecture, virtual environment support

## 📋 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 13+
- Roboflow API key (for AI features)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/dentamind.git
   cd dentamind
   ```

2. Set up environment variables
   ```bash
   # Copy the template file
   cp .env.template .env
   # Edit the .env file with your configuration
   nano .env
   ```

3. Set up the Python virtual environment
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. Install frontend dependencies
   ```bash
   npm install
   ```

5. Initialize the database
   ```bash
   python -m backend.init_db
   ```

### Running the Application

1. Start the backend server
   ```bash
   ./start_dentamind.sh
   # Or manually:
   python run_backend.py
   ```

2. Start the frontend development server
   ```bash
   npm run dev
   ```

3. Access the application
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 📦 Project Structure

```
DentaMind/
├── backend/                  # FastAPI backend
│   ├── api/                  # API modules
│   │   ├── config/           # Configuration settings
│   │   ├── models/           # Database models
│   │   ├── routers/          # API routes
│   │   ├── schemas/          # Pydantic schemas
│   │   └── services/         # Business logic services
│   ├── alembic/              # Database migrations
│   └── migrations/           # Migration scripts
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility functions
│   │   ├── pages/            # Page components
│   │   └── services/         # API service clients
│   └── public/               # Static assets
├── attached_assets/          # Uploaded files
│   └── xrays/                # X-ray images
├── models/                   # ML models
│   └── imaging_ai/           # X-ray analysis models
└── scripts/                  # Utility scripts
```

## 📘 Documentation

- [API Documentation](http://localhost:8000/docs) - Swagger UI for API endpoints
- [Database Migration Strategy](docs/MIGRATION_STRATEGY.md) - Best practices for safe database migrations
- [AI Model Documentation](docs/AI_MODEL_DEPLOYMENT.md) - Guidelines for AI model deployment

## 🧪 Testing

```bash
# Run backend tests
pytest

# Run frontend tests
npm test
```

## 🔄 Recent Improvements

- **Enhanced Backend**: Consolidated server architecture with standardized API patterns
- **Improved Security**: Environment-based configuration with proper security practices
- **AI Enhancements**: Better image analysis with caching and error handling
- **Database Connection**: Pooled database connections with proper session management
- **Frontend Structure**: Unified UI components with shadcn/ui design system
- **Scheduler Enhancement**: Comprehensive scheduler with mock data support
- **API Client**: Centralized API client with authentication and error handling
- **Documentation**: Improved code documentation and environment configuration
- **Patient Notification System**: Comprehensive multi-channel notification system for patient engagement
  - Real-time notifications via WebSockets
  - Customizable patient preferences
  - Clinical alerts for appointments, treatments, and prescriptions
  - [Detailed documentation](docs/patient_notifications.md)

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

# DentaMind: AI-Powered Dental Diagnostic Platform

DentaMind is a comprehensive dental diagnostic and practice management platform that uses AI to assist clinicians in diagnosis, treatment planning, charting, financial workflows, and clinical decision-making.

## ✨ Key Features

- **AI-Powered Diagnostics**: Analyze dental X-rays for caries, bone loss, and other conditions
- **3D Dental Charting**: Interactive dental chart with restoration tracking
- **Patient Management**: Comprehensive patient records and history
- **Treatment Planning**: Create and track treatment plans with cost estimates
- **Practice Management**: Scheduling, billing, and reporting
- **Voice-Driven Interface**: Voice commands for hands-free operation
- **Continuous Learning**: AI models that learn from clinician feedback

## 🧠 AI Capabilities

DentaMind's AI capabilities include:

- **X-ray Analysis**: Automatically detect conditions in radiographs
- **Risk Assessment**: Calculate patient risk profiles based on history and findings
- **Treatment Suggestions**: Recommend appropriate treatments based on findings
- **Voice Recognition**: Hands-free operation during procedures
- **Adaptive Learning**: Models that improve with clinician feedback

### 🔄 AI Feedback System

DentaMind includes a sophisticated AI feedback system that:

1. **Collects Clinician Input**: Providers can approve or reject AI findings with detailed corrections
2. **Improves Model Accuracy**: Uses feedback to retrain and fine-tune AI models
3. **Clinic-Specific Learning**: Creates customized models for each clinic's patient population
4. **Performance Tracking**: Monitors model accuracy and improvement over time

The feedback loop enables continuous improvement through:
- Rating AI findings as correct or incorrect
- Specifying the type of error (false positive, wrong classification, etc.)
- Prioritizing critical corrections
- Aggregating feedback across all providers

## 🚀 Getting Started

### Prerequisites

- Node.js v16+
- Python 3.9+
- PostgreSQL database

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/dentamind.git
   cd dentamind
   ```

2. Install dependencies:
   ```
   # Backend
   pip install -r requirements.txt
   
   # Frontend
   npm install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. Run database migrations:
   ```
   python -m backend.api.migrations.run
   ```

5. Start the development servers:
   ```
   # Backend
   ./start_dev.sh
   
   # Frontend
   npm run dev
   ```

## 📁 Project Structure

DentaMind uses a microservice-oriented architecture:

- **Core Services** (backend/api): Patient data, appointments, clinical records
- **Smart Services** (AI): Diagnosis, risk scoring, automation
- **Operations Layer**: Auth, security, notifications, messaging

Key directories:
- `backend/api`: FastAPI server with database models
- `backend/api/models`: Database and Pydantic models
- `backend/api/routers`: API endpoints
- `backend/api/services`: Business logic services
- `frontend/src`: React frontend application
- `frontend/src/components`: Reusable UI components
- `frontend/src/pages`: Application pages
- `frontend/src/hooks`: Custom React hooks

## 📝 License

[MIT License](LICENSE)

## ✉️ Contact

For questions or support, please contact [your-email@example.com]

## 🙏 Acknowledgements

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://reactjs.org/)
- [Roboflow](https://roboflow.com/) for image analysis

# DentaMind AI

## 🧠 Overview
DentaMind is an AI-driven diagnostic platform for dentistry and medicine. It links imaging, charting, patient records, scheduling, financials, treatment planning, insurance handling, and AI feedback-based diagnosis into one unified system.

## 🎯 Core Principles

### 1. Dentist-First Design
DentaMind is built for **dentists**, not insurance companies. Our goal is to empower clinicians to diagnose faster, treat smarter, and improve patient outcomes — not to police them, slow them down, or interfere with clinical judgment.

- 🦷 Assist the dentist, never override
- 🦷 Reduce cognitive load, never add it
- 🦷 Preserve and enhance clinical autonomy

### 2. Clinical Accuracy and Speed
Accuracy is essential, but **speed is clinical reality**. DentaMind provides AI insights **in real-time**, with **minimal clicks** and **zero friction** inside daily workflows.

- ⚡ Instantaneous analysis where possible
- ⚡ No lag, no bulky external viewers
- ⚡ Seamless integration into imaging and charting systems

### 3. Transparency and Trust
Dentists must **trust** DentaMind like they trust their loupes or scalers — invisible when not needed, precise when needed most.

- 👁️‍🗨️ Show the AI's findings clearly — but always allow human override
- 👁️‍🗨️ No hidden "black box" decisions
- 👁️‍🗨️ Make it easy to **agree, disagree, or adjust** AI suggestions

### 4. Clinical Research-Backed
Every feature we offer is **validated by clinical research**, academic collaborations, and real-world trials.

- 📈 DentaMind leads in publishing independent clinical performance studies
- 📈 Blind and non-blind research modules embedded
- 📈 Transparent reporting of AI performance (sensitivity, specificity, time saved)

### 5. Modularity and Flexibility
Every dental office is different. DentaMind **adapts to the clinic**, not force the clinic to adapt to us.

- 🛠️ Modular features: enable/disable diagnostics, treatment planning, prescriptions, billing tools
- 🛠️ Support different practice types: solo, group, DSO, academic, hospital
- 🛠️ Allow dentists to **customize AI confidence thresholds**, overlay visibility, and notifications

### 6. Ethical Commercialization
DentaMind's success is tied to helping dentists, **not exploiting them**.

- 💬 Transparent, flexible pricing — no predatory contracts
- 💬 No secret data-sharing with insurance companies
- 💬 Data belongs to the clinic — with full patient privacy protections (HIPAA, GDPR)

### 7. Constant Improvement
We ship fast, learn fast, and improve fast — always in collaboration with real clinicians.

- 🚀 Feedback loops built into the platform
- 🚀 Regular upgrades based on real-world usage
- 🚀 Open beta channels for early adopters to shape future features

## 🎯 Goal
Build an advanced AI assistant that connects all modules and continuously improves through feedback-based learning. The AI should reason like a senior general dentist and developer.

## 📁 Folder Structure
- `models/imaging_ai`: X-ray, CBCT, MRI AI training and prediction
- `roboflow`: Image datasets and Roboflow integration
- `feedback_system`: Interfaces and backend for doctor feedback training
- `api`: FastAPI or Flask-based endpoints
- `data/raw`: Uploaded medical data (unprocessed)
- `data/processed`: Cleaned and transformed data
- `notebooks`: Experiments and model training walkthroughs
- `utils`: Reusable code for preprocessing, analysis, helpers

## 🚀 How to Run
1. Clone the repo
2. Activate your virtual environment
3. Install requirements:
   `pip install -r requirements.txt`
4. Run the app:
   `python3 main.py`

## 🤖 AI Agents
- SmartDentalAI: Core platform
- CodeGPT Agent: Assists development inside VS Code
- Roboflow AI: Handles object detection on dental imaging

## 🔁 Feedback Learning
- Doctor feedback triggers retraining loops
- AI models improve accuracy over time using real case data

## ✅ Next Steps
- Expand the dataset (minimum 1000+ images)
- Link diagnosis engine with X-ray + clinical chart
- Automate documentation, coding, and claims

# SmartDentalAI

A comprehensive dental practice management system with AI-powered features.

## Environment Setup

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Environment
ENVIRONMENT=development  # development, staging, production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dentamind
DB_USER=postgres
DB_PASSWORD=your_password_here

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
WORKERS=4

# JWT Configuration
JWT_SECRET_KEY=your_jwt_secret_here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Security
ENCRYPTION_KEY=your_encryption_key_here  # Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_PERIOD=60  # seconds

# AWS Configuration (for production)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_specific_password
EMAIL_FROM=noreply@dentamind.com

# Monitoring
MONITORING_ENABLED=True
MONITORING_INTERVAL=300  # seconds
ALERT_THRESHOLD=80  # percentage

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/dentamind.log
LOG_MAX_SIZE=10485760  # 10MB
LOG_BACKUP_COUNT=5
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/SmartDentalAI.git
cd SmartDentalAI
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
cd frontend
npm install
```

4. Set up the database:
```bash
# Create database
createdb dentamind

# Run migrations
cd backend
alembic upgrade head
```

5. Start the development server:
```bash
# Backend
cd backend
uvicorn api.main:app --reload

# Frontend
cd frontend
npm run dev
```

## Configuration

### Database

The application uses PostgreSQL as its database. Configure the connection in the `.env` file:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dentamind
DB_USER=postgres
DB_PASSWORD=your_password_here
```

### Security

Generate a secure JWT secret key and encryption key:

```bash
# Generate JWT secret key
openssl rand -hex 32

# Generate encryption key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### Monitoring

The application includes built-in monitoring capabilities. Configure the settings in `.env`:

```env
MONITORING_ENABLED=True
MONITORING_INTERVAL=300  # Check every 5 minutes
ALERT_THRESHOLD=80  # Alert when usage exceeds 80%
```

## Deployment

### Production Deployment

1. Set up environment variables for production
2. Configure AWS credentials for secrets management
3. Run the deployment script:
```bash
./deploy/deploy.sh production v1.0.0
```

### Staging Deployment

1. Set up environment variables for staging
2. Run the deployment script:
```

## Security and HIPAA Compliance

DentaMind includes a comprehensive Role-Based Access Control (RBAC) security audit system to ensure proper authentication and authorization throughout the application, supporting HIPAA compliance requirements.

### Security Features

- **RBAC Audit System**: Automatically detects unprotected endpoints, missing role checks, and potential data leaks
- **CI/CD Integration**: Blocks merges of code with critical security issues (via GitHub Actions)
- **Pre-commit Hooks**: Prevents committing code with security issues
- **Security Documentation**: Comprehensive security documentation in `docs/SECURITY.md`
- **Security Checklist**: Quick reference guide in [`docs/SECURITY_CHECKLIST.md`](docs/SECURITY_CHECKLIST.md)

### Setup Security Features

```bash
# Install security checks (pre-commit hooks, etc.)
./setup-security-checks.sh
```

### Run Security Audit

```bash
# Run comprehensive security audit and generate HTML report
python backend/run_security_audit.py
```

For more details, see the [Security Documentation](docs/SECURITY.md) and [Security Checklist](docs/SECURITY_CHECKLIST.md).

# DentaMind Frontend

A modern, AI-powered dental practice management system that helps dental professionals streamline their workflow, improve patient care, and increase efficiency.

## Features

- **AI-Assisted Diagnosis**: Upload X-rays and intraoral photos for automated analysis and treatment suggestions
- **Patient Management**: Comprehensive patient profiles with medical history, treatment records, and communication preferences
- **Treatment Planning**: Multi-visit treatment plans with procedures, cost estimates, and insurance coverage
- **Periodontal Charting**: Digital periodontal charts with recording capabilities (integration with purchased UI)
- **Restorative Charting**: Digital odontogram with treatment status tracking
- **Appointment Scheduling**: Calendar view with patient booking and reminders
- **Billing & Insurance**: Insurance verification and patient billing
- **Analytics**: Practice performance and patient health metrics

## Tech Stack

- **Frontend**: React, React Router, Bootstrap
- **State Management**: React Context API, React Query
- **API Communication**: Axios
- **Authentication**: JWT
- **Styling**: CSS/SCSS, Bootstrap

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm v8 or higher
- Backend API running (see [DentaMind Backend](https://github.com/dentalmind/api))

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/dentalmind/frontend.git
   cd frontend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your configuration
   ```
   REACT_APP_API_URL=http://localhost:8000
   REACT_APP_SOCKET_URL=ws://localhost:8000/ws
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view it in the browser

## Project Structure

```
src/
├── assets/         # Static assets (images, fonts, etc.)
├── components/     # Reusable UI components
├── contexts/       # React context providers
├── hooks/          # Custom React hooks
├── pages/          # Application pages
│   ├── AI/         # AI diagnostic pages
│   ├── ClinicalNotes/ # Clinical notes management
│   ├── PerioChart/ # Periodontal charting
│   ├── RestorativeChart/ # Restorative charting
│   ├── TreatmentPlans/ # Treatment planning
│   └── XRayViewer/ # X-ray viewing and management
├── services/       # API services
└── utils/          # Utility functions
```

## Integration with Purchased Periodontal UI

The periodontal charting module is designed to work with a purchased UI component. The integration is handled via the `PerioChart` component which serves as a wrapper around the purchased UI. See `src/pages/PerioChart/PerioChart.js` for implementation details.

## License

This project is proprietary and confidential. All rights reserved.