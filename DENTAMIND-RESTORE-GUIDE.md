# DentaMind Platform Restoration Guide

This guide provides instructions for restoring, configuring, and maintaining the DentaMind dental practice management and AI diagnostics platform.

## System Architecture

DentaMind consists of several integrated components:

1. **Main API Server (Port 8001)**
   - Core FastAPI server with JWT authentication
   - Handles patients, imaging, treatments, and prescriptions
   - Requires specific FastAPI and Pydantic versions for stability

2. **Debug/Development Server (Port 3000)**
   - Simplified API for testing and development
   - No authentication required for easy debugging
   - Contains mock data endpoints

3. **Frontend Client**
   - React SPA with TypeScript
   - Material UI components
   - Communicates with backend via RESTful API

## Prerequisites

- Python 3.11+ with venv or virtualenv
- Node.js 18+ and npm
- PostgreSQL (optional, for full functionality)

## Setup and Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dentamind.git
   cd dentamind
   ```

2. **Set up backend environment**
   ```bash
   # Create and activate a virtual environment
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   
   # Install dependencies with fixed versions
   pip install -r requirements.txt
   ```

3. **Set up frontend**
   ```bash
   cd client
   npm install
   ```

4. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Update database connection strings if using PostgreSQL
   - Set `SECRET_KEY` for JWT token encryption

## Starting and Stopping Services

### Starting all services
```bash
# From project root
./start_dentamind.sh
```

The startup script will:
- Check for port conflicts and clear them if needed
- Install required dependencies
- Start the debug server on port 3000
- Start the main API server on port 8001

### Stopping all services
```bash
# From project root
./stop_dentamind.sh
```

## Authentication

The platform uses JWT authentication:

1. **Demo credentials**:
   - Username: demo@dentamind.com
   - Password: password123

2. **Admin credentials**:
   - Username: admin@dentamind.com
   - Password: admin123

3. **Authentication flow**:
   - POST to `/token` with username and password
   - Use the returned token in the Authorization header for all API requests
   - Format: `Authorization: Bearer <token>`

## Known Issues and Fixes

### FastAPI/Pydantic Compatibility

The system requires specific package versions to function correctly:
- FastAPI 0.88.0
- Pydantic 1.10.8
- Starlette 0.22.0

If you see `'not' is not a valid parameter name` errors, run:
```bash
python fix_dependencies.py
```

### Port Conflicts

If you get "Address already in use" errors, manually stop the services:
```bash
pkill -f uvicorn
```

Or check/kill the specific process using the port:
```bash
lsof -ti:8001 | xargs kill -9
```

## Troubleshooting

### Backend not starting
1. Check logs in `logs/main_server.log` and `logs/debug_server.log`
2. Verify package versions match requirements
3. Ensure ports 3000 and 8001 are available

### Frontend errors
1. Check browser console for errors
2. Verify API endpoints in `client/src/config/api.ts`
3. Check if backend servers are running

### Authentication issues
1. Verify correct credentials
2. Check token expiration (default: 30 minutes)
3. Ensure the Authorization header is properly formatted

## Development Guidelines

When extending the platform:

1. **Backend APIs**
   - Follow RESTful conventions
   - Document all endpoints with docstrings
   - Use Pydantic models for request/response validation

2. **Frontend**
   - Use TypeScript for all components
   - Follow existing component patterns
   - Update API client when adding new endpoints

## Restoring from backup

To restore from a backup:
```bash
./restore_dentamind.sh <backup_file>
```

## Support

For additional assistance:
- Email: support@dentamind.com
- Documentation: https://docs.dentamind.com

---

Last updated: May 2024 