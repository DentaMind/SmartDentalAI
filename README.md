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

