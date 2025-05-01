#!/bin/bash

# First, kill any existing processes on port 8000
echo "Checking for existing uvicorn processes..."
source ./kill_uvicorn.sh

# Activate the virtual environment if needed
if [ -d ".venv" ]; then
  echo "Activating virtual environment..."
  source .venv/bin/activate
elif [ -d "../.venv" ]; then
  echo "Activating virtual environment..."
  source ../.venv/bin/activate
elif [ -d "venv" ]; then
  echo "Activating virtual environment..."
  source venv/bin/activate
elif [ -d "../venv" ]; then
  echo "Activating virtual environment..."
  source ../venv/bin/activate
fi

# Start the backend
echo "Starting the backend server..."
cd "$(dirname "$0")"
uvicorn api.main:app --reload --port 8000

# If the server fails to start, print a helpful message
if [ $? -ne 0 ]; then
  echo "Failed to start the backend server. Please check the logs above for errors."
  exit 1
fi 