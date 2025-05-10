#!/bin/bash

# Set up error handling
set -e

echo "=== Starting DentaMind Alt Debug Server ==="
date

# Check for running processes on port 8092
PID=$(lsof -ti:8092 2>/dev/null)
if [ ! -z "$PID" ]; then
    echo "Port 8092 is already in use by PID $PID. Stopping it first..."
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

# Start the alt debug server
echo "Starting alt debug server on port 8092..."
python debug_routes_alt.py

# This script will pause here while the server is running
echo "Alt debug server stopped." 