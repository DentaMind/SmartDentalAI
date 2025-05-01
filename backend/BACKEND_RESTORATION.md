# DentaMind Backend Restoration Guide

This guide provides instructions for progressively restoring and expanding the DentaMind backend functionality after the initial recovery.

## Current Status

We have successfully established a stable backend with the following:

- ✅ Working server on port 8090
- ✅ Core endpoints:
  - `/` - Root endpoint
  - `/health` - Health check
  - `/api/health` - API health check
  - `/api/patients/sample` - Sample patient data
  - `/api/treatment/treatment-plans/patient/{patient_id}` - Treatment plans for a patient
  - `/api/prescriptions/patient/{patient_id}` - Prescriptions for a patient
  - `/api/knowledge/*` - Dental school knowledge base endpoints
- ✅ Compatible Pydantic and FastAPI versions
- ✅ Clean, simplified architecture

## Server Files

1. **`debug_routes.py`** - Currently the most stable server with explicit routes and debug logging. Use this for development.
2. **`simplified_server.py`** - An evolving simplified server.
3. **`evolving_server.py`** - An attempt to use router imports - needs more work.

## Knowledge Base Integration

The backend now includes a structured knowledge base for dental educational content:

1. **Knowledge Categories**:
   - anatomy
   - pathology
   - treatments
   - medications
   - procedures
   - diagnostics
   - materials
   - instruments
   - radiology
   - periodontics
   - orthodontics
   - endodontics
   - prosthodontics
   - oral_surgery
   - pediatric_dentistry

2. **Key Components**:
   - `knowledge_base.py` - Core service for storing and retrieving knowledge entries
   - `query_service.py` - Service for querying knowledge and integrating with diagnostics
   - `knowledge_simple.py` - API router for knowledge endpoints
   - Sample knowledge entries in JSON format

3. **Available Endpoints**:
   - `GET /api/knowledge/categories` - List all knowledge categories
   - `GET /api/knowledge/search?query=X&category=Y&tags=Z` - Search knowledge
   - `GET /api/knowledge/category/{category}` - Get all entries in a category
   - `GET /api/knowledge/entry/{entry_id}` - Get specific entry
   - `POST /api/knowledge/entry` - Add new knowledge entry
   - `PUT /api/knowledge/entry/{entry_id}` - Update existing entry
   - `DELETE /api/knowledge/entry/{entry_id}` - Delete entry

4. **Usage**:
   - Run `python load_sample_knowledge.py` to load sample dental knowledge entries
   - Access knowledge through the API or directly via the `query_service` in code

## Next Steps for Restoration

### 1. Fix Relative Import Issues

The main challenge is fixing the import paths in the backend. All imports referencing `backend.models` or similar absolute paths need to be changed to relative imports.

Example:
```python
# Bad - absolute import
from backend.models.patient import PatientSchema

# Good - relative import
from ...models.patient import PatientSchema
```

### 2. Add More Routers Incrementally

Follow this process to add more functionality:

1. Create a simplified version of each router in `api/routes/[router_name]_simple.py`
2. Add the router to `debug_routes.py` initially
3. Test thoroughly
4. Once stable, move to using proper router imports

### 3. Fix the Database Connection

The original code attempted to use SQLAlchemy with:
```python
from ..config.database import get_db
```

Once core routing is stable:
1. Create the necessary database configuration
2. Add minimal database connectivity
3. Test with simple database operations

### 4. Authentication System

Restore the authentication system:
1. Implement a simplified authentication mechanism
2. Add the necessary dependencies for protected routes
3. Test with both authenticated and unauthenticated requests

### 5. Error Handling

Add proper error handling to all routes:
1. Implement try/except blocks
2. Return appropriate HTTP status codes
3. Provide meaningful error messages

## Running the Backend

```bash
# Kill any existing processes
pkill -9 -f uvicorn

# Run the debug server
cd /path/to/SmartDentalAI/backend
python debug_routes.py

# Access the Swagger documentation
# Open http://localhost:8090/docs

# Load sample knowledge entries
python load_sample_knowledge.py
```

## Helpful Scripts

- `kill_uvicorn.sh` - Kills any existing uvicorn processes
- `reset_backend.sh` - Completely resets the backend environment
- `debug_backend.sh` - Runs the backend with detailed error logging
- `start_backend.sh` - Normal backend startup script
- `load_sample_knowledge.py` - Loads sample dental knowledge entries

## Troubleshooting

If you encounter import errors:
1. Check if you're using relative imports correctly
2. Ensure `__init__.py` files exist in all directories
3. Use debug logging to trace execution flow

Socket/port issues:
1. Kill any existing Python/uvicorn processes
2. Try a different port
3. Ensure no other application is using the same port

## Long-term Recommendations

1. Add comprehensive tests to ensure continued stability
2. Document all API endpoints and their parameters
3. Implement a consistent error handling strategy
4. Use environment variables for configuration
5. Add CI/CD integration for automated testing 