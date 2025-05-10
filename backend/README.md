# DentaMind Backend

This directory contains the backend server for the DentaMind dental practice management and AI diagnostic platform.

## Setup

1. Ensure you have Python 3.8+ installed
2. Fix the environment with compatible package versions:

```bash
./fix_environment.sh
```

This script will:
- Create a virtual environment if one doesn't exist
- Install compatible versions of FastAPI, Pydantic, and other dependencies
- Verify the Pydantic installation works correctly
- Create required directories

## Running the Server

There are several options for running the server:

### Debug Server (Port 8090)

```bash
./start_debug_server.sh
```

The debug server provides simplified routes that don't require a database or other external services.

### Alternative Debug Server (Port 8092)

```bash
./start_alt_server.sh
```

This server runs on a different port and can be used for testing while the main debug server is running.

### Production Server (Port 8000)

```bash
./start_production_server.sh
```

The production server includes all modules and is intended for deployment.

## API Endpoints

Once running, the following key endpoints are available:

- `/docs` - Swagger documentation
- `/health` - Health check endpoint
- `/api/health` - API health check endpoint
- `/api/knowledge/*` - Knowledge base endpoints
- `/api/diagnose/*` - Diagnostic endpoints
- `/api/perio/*` - Periodontal charting endpoints
- `/api/image/*` - Image analysis endpoints
- `/api/risk/*` - Medical risk assessment endpoints
- `/api/treatment/*` - Treatment plan endpoints
- `/api/prescriptions/*` - Prescription endpoints

## Testing

You can test the API endpoints using:

```bash
python test_all_routes.py --port 8090  # For debug server
python test_all_routes.py --port 8092  # For alt server
python test_main_api.py --port 8000    # For production server
```

## Troubleshooting

If you encounter the "'not' is not a valid parameter name" error, it means you have an incompatible version of Pydantic. Run the `fix_environment.sh` script to install compatible versions.

Port conflicts can be resolved by:
1. Checking for running processes: `lsof -ti:8090`
2. Killing any existing processes: `kill -9 $(lsof -ti:8090)`

## File Structure

- `api/` - Main API modules
  - `routes/` - Route handlers for each module
  - `services/` - Service implementations
  - `models/` - Data models
- `debug_routes.py` - Simplified server for debugging
- `debug_routes_alt.py` - Alternative debug server
- `api/main_clean.py` - Clean main.py for production
- `test_all_routes.py` - Test script for API endpoints 