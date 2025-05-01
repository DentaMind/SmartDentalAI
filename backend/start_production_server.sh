#!/bin/bash

# Set up error handling
set -e

echo "=== Starting DentaMind Production Server ==="
date

# Check for running processes on port 8000
PID=$(lsof -ti:8000 2>/dev/null)
if [ ! -z "$PID" ]; then
    echo "Port 8000 is already in use by PID $PID. Stopping it first..."
    kill -9 $PID || true
    sleep 2
fi

# Activate virtual environment if it exists
if [ -d "../.venv" ]; then
    echo "Activating virtual environment..."
    source "../.venv/bin/activate"
fi

# Install dependencies if needed
if [ ! -f ".dependencies_checked" ]; then
    echo "Checking dependencies..."
    pip install -r ../requirements.txt
    touch .dependencies_checked
fi

# Create necessary directories
echo "Ensuring required directories exist..."
mkdir -p ./data/knowledge
mkdir -p ./attached_assets/xrays

# Start the server
echo "Starting Production Server on port 8000..."
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

# Note: The script will pause here while the server is running

echo "Production Server stopped." 