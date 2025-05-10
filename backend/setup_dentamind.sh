#!/bin/bash

# DentaMind Setup Script
# This script sets up the DentaMind platform

echo "=== Setting Up DentaMind Platform ==="
echo "$(date)"

# Check if we're in a virtual environment
if [[ -z "$VIRTUAL_ENV" ]]; then
    echo "❌ No virtual environment activated. Please activate your virtual environment first."
    echo "   You can create and activate one with:"
    echo "   python -m venv .venv"
    echo "   source .venv/bin/activate"
    exit 1
fi

echo "✅ Using virtual environment: $VIRTUAL_ENV"

# Install required packages
echo "Installing required packages..."
pip install fastapi==0.88.0 uvicorn==0.15.0 python-multipart==0.0.5 pydantic==1.10.8 python-jose==3.3.0 passlib==1.7.4 bcrypt==3.2.0 httpx==0.23.0

# Generate secret key
if [[ ! -f .env ]]; then
    echo "Generating .env file with secret key..."
    python -c "import secrets; print(f'JWT_SECRET_KEY=\"{secrets.token_hex(32)}\"')" > .env
    echo "✅ Created .env file with secret key"
fi

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p attached_assets/xrays
mkdir -p logs

# Check for dependency conflicts
echo "Checking for dependency conflicts..."
python -c "
import sys
try:
    import fastapi
    import pydantic
    print(f'✅ FastAPI version: {fastapi.__version__}')
    print(f'✅ Pydantic version: {pydantic.__version__}')
    
    # Test that these versions work together
    from pydantic import BaseModel
    class TestModel(BaseModel):
        name: str
        value: int
        is_active: bool = True
        optional_value: str = None
    
    test = TestModel(name='Test', value=42)
    print(f'✅ Dependency test successful! Created model: {test.dict()}')
    
except ImportError as e:
    print(f'❌ Import error: {e}')
    sys.exit(1)
except Exception as e:
    print(f'❌ Error testing dependencies: {e}')
    sys.exit(1)
"

# Create config directory in client
echo "Creating config directory in frontend..."
mkdir -p ../client/src/config

echo "
=== DentaMind Setup Complete ===

You can now start the platform with:
./start_dentamind.sh

The platform consists of several microservices:
- Auth API (port 8085): Authentication and user management
- Patient API (port 8086): Patient records and appointments
- Imaging API (port 8087): Dental imaging and analysis
- Debug API (port 8090): Legacy API endpoints

Configuration files:
- .env: Contains environment variables like JWT_SECRET_KEY
- ../client/src/config/api.ts: Frontend API endpoint configuration
" 