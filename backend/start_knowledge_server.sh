#!/bin/bash

# Set up error handling
set -e

echo "=== Starting DentaMind Knowledge Server ==="
date

# Check for running processes on port 8091
PID=$(lsof -ti:8091 2>/dev/null)
if [ ! -z "$PID" ]; then
    echo "Port 8091 is already in use by PID $PID. Stopping it first..."
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

# Start the server
echo "Starting Knowledge Server on port 8091..."
python knowledge_server.py

# Note: The script will pause here while the server is running

echo "Knowledge Server stopped." 