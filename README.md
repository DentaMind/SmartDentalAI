# DentaMind AI

## 🧠 Overview
DentaMind is an AI-driven diagnostic platform for dentistry and medicine. It links imaging, charting, patient records, scheduling, financials, treatment planning, insurance handling, and AI feedback-based diagnosis into one unified system.

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

![CI](https://github.com/DentaMind/SmartDentalAI/actions/workflows/deploy.yml/badge.svg)

A modern dental practice management system with AI-powered features for diagnosis, treatment planning, and patient communication.

## Local Development Setup

### Prerequisites

- Docker and Docker Compose installed on your system
- Git for version control

### Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd SmartDentalAI
```

2. Create a .env file from the example:
```bash
cp .env.example .env
```

3. Start the development environment:
```bash
docker compose up --build
```

The application will be available at http://localhost:3000

### Development Notes

- The development environment uses hot-reloading, so changes to the code will automatically update the running application
- PostgreSQL database is accessible at localhost:5432
- Database credentials (for development):
  - User: dentamind
  - Password: dentamind
  - Database: dentamind

### Running Without Docker

If you prefer to run the application without Docker:

1. Install Node.js 20.x
2. Install PostgreSQL 16
3. Create a database and update .env with your database credentials
4. Install dependencies:
```bash
npm ci
```

5. Run database migrations:
```bash
npm run db:push
```

6. Start the development server:
```bash
npm run dev
```

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes

### Environment Variables

Key environment variables needed for development:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token generation
- `SESSION_SECRET` - Secret for session management
- `NODE_ENV` - Environment (development/production)
- `PORT` - Port to run the server on (default: 3000)

For AI features, you'll need:
- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_ORGANIZATION_ID` - OpenAI organization ID

See `.env.example` for all available configuration options.

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and type checking
4. Submit a pull request

## License

MIT

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

