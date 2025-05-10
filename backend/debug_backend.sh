#!/bin/bash

echo "=== DentaMind Backend Debug Script ==="
echo "$(date)"
echo ""

# Kill any existing processes
echo "Checking for existing processes on port 8000..."
existing_processes=$(lsof -i :8000 | grep LISTEN | awk '{print $2}')
if [ -n "$existing_processes" ]; then
  echo "Found processes: $existing_processes"
  for pid in $existing_processes; do
    echo "Killing process $pid"
    kill -9 $pid
  done
  sleep 2
fi

# Check Python version
echo "Python version:"
python3 --version

# Check virtual environment
if [ -d "../.venv" ]; then
  echo "Using ../.venv environment"
  source ../.venv/bin/activate
elif [ -d ".venv" ]; then
  echo "Using .venv environment"
  source .venv/bin/activate
elif [ -d "venv" ]; then
  echo "Using venv environment"
  source venv/bin/activate
elif [ -d "../venv" ]; then
  echo "Using ../venv environment"
  source ../venv/bin/activate
else
  echo "No virtual environment found!"
fi

# Check installed packages
echo "Checking critical package versions:"
pip list | grep -E 'fastapi|uvicorn|pydantic' | cat

# Check if main.py exists
echo "Checking API files:"
if [ -f "api/main.py" ]; then
  echo "- api/main.py exists ✓"
else
  echo "- api/main.py MISSING ✗"
fi

# Create a debug log for detailed error capture
LOG_FILE="backend_debug.log"
echo "Logs will be saved to $LOG_FILE"
echo "Starting backend with detailed error logging..."

# Try to start the backend with full logging
echo "=== Starting Backend $(date) ===" > $LOG_FILE
python -m uvicorn api.main:app --reload --port 8000 --log-level debug 2>&1 | tee -a $LOG_FILE

# If it fails, provide help
if [ $? -ne 0 ]; then
  echo "Backend failed to start. See $LOG_FILE for details."
  echo "Common issues:"
  echo "1. Port 8000 already in use"
  echo "2. Pydantic model errors"
  echo "3. Missing dependencies"
  echo "4. Syntax errors in Python code"
fi 