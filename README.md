# DentaMind - AI-Powered Dental Practice Management Platform

DentaMind is a comprehensive dental practice management system featuring AI-driven diagnostic tools, patient management, and clinical workflow automation.

## Key Features

- **AI-Powered Diagnostics**: Automatic analysis of dental X-rays, periodontal assessments, and treatment planning
- **Patient Management**: Complete patient records, appointment scheduling, and treatment history
- **Financial Tools**: Insurance claim management, billing, and financial reporting
- **Clinical Workflows**: Customizable clinical workflows for different procedure types
- **Multi-modal Imaging**: Support for FMX, panoramic, and CBCT imaging with AI analysis

## System Architecture

DentaMind uses a microservices architecture with these components:

- **Authentication Service**: User authentication and session management (port 8085)
- **Patient Service**: Patient records and appointments (port 8086)
- **Imaging Service**: Dental imaging processing and analysis (port 8087)
- **Legacy API**: Backward compatibility for older components (port 8090)
- **React Frontend**: Modern UI built with React, TypeScript, and Tailwind CSS

For detailed architecture information, see [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Virtual environment tool (venv, conda, etc.)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/dentamind.git
   cd dentamind
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Run the setup script to install dependencies:
   ```bash
   cd backend
   ./setup_dentamind.sh
   cd ..
   ```

4. Install frontend dependencies:
   ```bash
   cd client
   npm install
   cd ..
   ```

### Running the Application

Start all services with a single command:

```bash
./start_dentamind.sh
```

This will start:
- Authentication service on port 8085
- Patient service on port 8086
- Imaging service on port 8087
- Legacy API on port 8090
- React frontend on port 3000

To stop all services:

```bash
./stop_dentamind.sh
```

### Demo Credentials

Use these credentials to log in:

- **Doctor Account**:
  - Email: demo@dentamind.com
  - Password: password123

- **Admin Account**:
  - Email: admin@dentamind.com
  - Password: admin123

## Development

### Backend Development

Each backend service is a separate FastAPI application:

- `auth_server.py` - Authentication service
- `patient_server.py` - Patient records service
- `imaging_server.py` - Imaging service
- `debug_routes.py` - Legacy API service

To run a single service for development:

```bash
cd backend
python auth_server.py  # Or any other service file
```

### Frontend Development

The frontend is built with React, TypeScript, and Tailwind CSS:

```bash
cd client
npm run dev
```

## Testing

We use pytest for backend testing and Jest for frontend testing:

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd client
npm test
```

## Deployment

For production deployment, we recommend:

1. Using Docker containers for each service
2. Setting up a reverse proxy (like Nginx) in front of all services
3. Configuring PostgreSQL with proper backup routines
4. Using a proper secrets management solution

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please contact support@dentamind.com

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
```bash
./deploy/deploy.sh staging v1.0.0
```

## API Documentation

The API documentation is available at `/docs` when running the server. It includes:
- OpenAPI/Swagger documentation
- ReDoc documentation
- Example requests and responses

## Testing

Run the test suite:
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# SmartDentalAI Founder Console

A real-time monitoring and alerting system for SmartDentalAI's founder console.

## Features

- Real-time system health monitoring (CPU, Memory, Disk)
- Critical threshold alerts with sound notifications
- Email and SMS alerting capabilities
- Mobile-responsive dashboard
- Founder-only access with authentication

## Setup

### Backend

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
cp config.env .env
# Edit .env with your actual credentials
```

4. Start the backend server:
```bash
uvicorn api.main:app --reload
```

### Frontend

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm start
```

## Configuration

### Email Alerts
- Set up SMTP credentials in the backend `.env` file
- Configure sender and recipient email addresses

### SMS Alerts
- Set up Twilio credentials in the backend `.env` file
- Configure sender and recipient phone numbers

### Alert Thresholds
- CPU: 80%
- Memory: 85%
- Disk: 90%

## Security

- All API endpoints are protected with JWT authentication
- Environment variables are used for sensitive credentials
- CORS is configured for specific origins in production

## API Endpoints

### Health Monitoring
- `GET /api/health` - Get system health metrics

### Alert Management
- `GET /api/alerts/config` - Get alert configuration
- `POST /api/alerts/config` - Update alert configuration
- `POST /api/alerts/test/{type}` - Send test alert (email/sms)

## Development

### Adding New Metrics
1. Update the `SystemMetrics` interface in `frontend/src/pages/SystemHealthPage.tsx`
2. Add the metric collection in `backend/api/routes/health.py`
3. Update the dashboard UI to display the new metric

### Customizing Alerts
1. Modify thresholds in `backend/api/routes/alerts.py`
2. Update alert messages in the `send_email_alert` and `send_sms_alert` functions
3. Add new alert types in the `AlertConfig` model

## License

MIT License

# Crown & Bridge Module

A comprehensive module for dental crown and bridge design, featuring AI-powered analysis, 3D visualization, and validation capabilities.

## Features

- AI-driven analysis of preparation and material selection
- 3D design generation with STL export
- Real-time validation of fit and clearance
- Detailed PDF reports
- Modern, responsive UI with step-by-step workflow

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- Three.js for 3D geometry
- PDFKit for report generation
- Jest for testing

### Frontend
- React with TypeScript
- Three.js for 3D visualization
- Ant Design for UI components
- React Query for API state management

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Analysis
- `POST /api/crown-bridge/analyze`
  - Analyzes preparation and recommends material/design
  - Returns analysis results with confidence scores

### Design Generation
- `POST /api/crown-bridge/generate`
  - Generates 3D design based on analysis
  - Returns STL file for 3D printing

### Validation
- `POST /api/crown-bridge/validate`
  - Validates design fit and clearance
  - Returns validation metrics and suggestions

### PDF Export
- `POST /api/crown-bridge/export-pdf`
  - Generates detailed PDF report
  - Includes design specifications and validation results

## Type Definitions

### Materials
- `zirconia`
- `lithium-disilicate`
- `metal-ceramic`
- `gold`

### Design Types
- `full-coverage`
- `onlay`
- `inlay`
- `veneer`
- `bridge`

### Margin Types
- `chamfer`
- `shoulder`
- `feather`
- `bevel`

### Occlusion Types
- `centric`
- `eccentric`
- `balanced`

## Testing

Run the test suite:
```bash
npm test
```

## Development

### Backend Structure
```
server/
├── routes/
│   └── crown-bridge.ts       # API endpoints
├── services/
│   └── crown-bridge-ai.ts    # AI service
├── utils/
│   └── mock-geometry.ts      # Test utilities
├── types/
│   └── crown-bridge.ts       # Type definitions
└── tests/
    └── crown-bridge.test.ts  # Test suite
```

### Frontend Structure
```
client/src/components/crown-bridge/
├── steps/
│   ├── AnalysisStep.tsx
│   ├── DesignStep.tsx
│   ├── PreviewStep.tsx
│   └── ValidationStep.tsx
├── CrownBridgePreview.tsx
└── CrownBridgeDesignWorkflow.tsx
```

## Next Steps

1. **AI Integration**
   - Replace mock implementations with actual AI models
   - Implement real geometry processing
   - Add margin detection and prep analysis

2. **Frontend Enhancement**
   - Add real-time 3D preview
   - Implement scan upload
   - Add validation feedback
   - Enhance PDF report visualization

3. **Production Readiness**
   - Add error logging
   - Implement rate limiting
   - Add authentication
   - Set up monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT

# Dental Insurance API

Real-time insurance coverage validation and benefits tracking API built with FastAPI.

## Features

- Real-time coverage validation for dental procedures
- Benefits tracking and utilization
- Procedure history tracking
- Pre-authorization requirements checking
- Frequency limit validation
- Alternate benefits handling

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the development server:
```bash
uvicorn insurance.main:app --reload
```

The API will be available at http://localhost:8000

## API Documentation

Interactive API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Coverage Validation

`POST /insurance/validate`

Validate insurance coverage for one or more procedures. Returns estimated coverage, patient portion, and any applicable warnings or requirements.

Example request:
```json
{
  "patient_id": "12345",
  "procedures": [
    {
      "cdt_code": "D2392",
      "tooth_number": "14",
      "surfaces": ["M", "O"],
      "procedure_cost": 236.00
    }
  ],
  "service_date": "2023-11-15T00:00:00Z"
}
```

### Benefits Snapshot

`GET /insurance/benefits/{patient_id}`

Get current benefits utilization and remaining benefits for a patient.

### Procedure History

`GET /insurance/history/{patient_id}`

Get procedure history for a patient.

## Development

The API uses SQLite for development. For production, update the database configuration in `insurance/database/database.py` to use a production-ready database like PostgreSQL.

## License

MIT

