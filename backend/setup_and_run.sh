#!/bin/bash

# DentaMind Backend Setup and Run Script
# This script prepares the environment and starts the debug server

echo "===== DentaMind Backend Setup and Run Script ====="
echo "$(date)"
echo

# Kill any existing processes
echo "Cleaning up existing processes..."
pkill -9 -f uvicorn 2>/dev/null || true
pkill -9 -f "python debug_routes.py" 2>/dev/null || true
sleep 2

# Activate virtual environment if available
if [ -d "../.venv" ]; then
  echo "Activating virtual environment (.venv)..."
  source ../.venv/bin/activate
elif [ -d "venv" ]; then
  echo "Activating virtual environment (venv)..."
  source venv/bin/activate
elif [ -d "../venv" ]; then
  echo "Activating virtual environment (../venv)..."
  source ../venv/bin/activate
fi

# Install required packages
echo "Checking packages..."
pip install fastapi==0.88.0 pydantic==1.10.8 uvicorn==0.15.0 > /dev/null

# Check if needed directories exist
if [ ! -d "api/routes" ]; then
  echo "Creating api/routes directory..."
  mkdir -p api/routes
fi

# Create __init__.py files if needed
for dir in "api" "api/routes"; do
  if [ ! -f "$dir/__init__.py" ]; then
    echo "Creating $dir/__init__.py..."
    echo "# This file makes the directory a proper Python package" > "$dir/__init__.py"
  fi
done

# Ensure all simplified router files exist
for router in "health_simple" "risk_simple" "treatment_simple" "prescriptions_simple"; do
  if [ ! -f "api/routes/${router}.py" ]; then
    echo "Warning: api/routes/${router}.py does not exist. Some functionality may be missing."
  else
    echo "Found api/routes/${router}.py ✓"
  fi
done

# Ensure debug_routes.py exists
if [ ! -f "debug_routes.py" ]; then
  echo "Error: debug_routes.py not found. Please run the setup process again."
  exit 1
else
  echo "Found debug_routes.py ✓"
fi

# Check if port 8090 is already in use
if lsof -i :8090 >/dev/null 2>&1; then
  echo "Warning: Port 8090 is already in use. Attempting to kill process..."
  lsof -ti:8090 | xargs kill -9 2>/dev/null || true
  sleep 2
fi

# Start the debug server
echo
echo "===== Starting DentaMind Debug Server ====="
echo "Starting server on http://localhost:8090"
echo "Press CTRL+C to stop the server"
echo
python debug_routes.py 