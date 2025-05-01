#!/bin/bash

# Set up error handling
set -e

echo "=== Starting DentaMind Debug Server ==="
date

# Check for running processes on port 8090
PID=$(lsof -ti:8090 2>/dev/null)
if [ ! -z "$PID" ]; then
    echo "Port 8090 is already in use by PID $PID. Stopping it first..."
    kill -9 $PID || true
    sleep 2
fi

# Activate virtual environment if it exists
if [ -d "../.venv" ]; then
    echo "Activating virtual environment..."
    source "../.venv/bin/activate"
fi

# Check python version
echo "Python version: $(python --version)"

# Install dependencies if needed
if [ ! -f ".dependencies_checked" ]; then
    echo "Checking dependencies..."
    pip install -r ../requirements.txt
    touch .dependencies_checked
fi

# Start the debug server
echo "Starting debug server on port 8090..."
python debug_routes.py

# This script will pause here while the server is running
echo "Debug server stopped." 