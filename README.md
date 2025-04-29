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

SmartDentalAI is an intelligent dental risk assessment and treatment planning system that leverages AI to provide personalized dental care recommendations.

## Features

- **Risk Assessment**: AI-powered evaluation of patient risk factors
- **Treatment Planning**: Automated generation of personalized treatment plans
- **Real-time Monitoring**: System health and performance monitoring
- **API Integration**: RESTful API for seamless integration with existing systems
- **Security**: JWT authentication and rate limiting
- **Scalability**: Designed for high availability and performance

## Tech Stack

- **Backend**: Python/FastAPI
- **Frontend**: React/TypeScript
- **Database**: PostgreSQL
- **Caching**: Redis
- **Monitoring**: Prometheus/Grafana
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Redis 6+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/DentaMind/SmartDentalAI.git
cd SmartDentalAI
```

2. Set up the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up the frontend:
```bash
cd frontend
npm install
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Initialize the database:
```bash
cd backend
alembic upgrade head
```

### Running the Application

1. Start the backend server:
```bash
cd backend
uvicorn main:app --reload
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## API Documentation

The API documentation is available at `/docs` when running the backend server. It includes:
- Detailed endpoint descriptions
- Request/response examples
- Authentication requirements
- Rate limiting information

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and contribution instructions.

## Security

- All API endpoints require authentication
- Rate limiting is implemented to prevent abuse
- Sensitive data is encrypted
- Regular security audits are performed

## Monitoring

The system includes:
- Real-time performance metrics
- Error tracking and logging
- Health check endpoints
- Automated alerts

## Deployment

See [deploy/README.md](deploy/README.md) for deployment instructions.

## License

Proprietary and Confidential.  
© 2025 DentaMind AI Solutions. All rights reserved.

## Support

For support, please:
1. Check the [documentation](docs/)
2. Open an issue on GitHub
3. Contact support@dentamind.com

## Acknowledgments

- OpenAI for GPT-4 integration
- FastAPI team for the excellent framework
- The open-source community for various dependencies

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

