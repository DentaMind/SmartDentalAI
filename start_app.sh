#!/bin/bash

# Kill any existing npm processes
pkill -f "npm run dev" || true

# Kill any existing uvicorn processes 
pkill -f "uvicorn" || true

# Set environment (development by default)
export ENVIRONMENT=${ENVIRONMENT:-development}
echo "Starting DentaMind application in $ENVIRONMENT mode..."

# Make sure we're in the project directory
cd "$(dirname "$0")"

# Create data directories if they don't exist
mkdir -p data/clinical/{BU,HMS,UCSF,Mayo}/test/patient0001/{xray,panoramic,cbct,photo,scan}
mkdir -p logs
mkdir -p attached_assets/analysis

# Start backend API server
cd backend
echo "Starting backend API server..."
if [ "$ENVIRONMENT" = "production" ]; then
  # Production mode: No reload, optimized
  python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 &
else
  # Development mode: With reload
  python3 -m uvicorn api.main:app --reload --port 8000 &
fi
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Start frontend
cd client
echo "Starting frontend server..."
if [ "$ENVIRONMENT" = "production" ]; then
  # Production mode: build and serve
  npm run build && npm run preview &
else
  # Development mode: with hot reload
  npm run dev &
fi
FRONTEND_PID=$!
cd ..

echo "Both backend and frontend should now be running"
echo "- Frontend: http://localhost:3001"
echo "- Backend API: http://localhost:8000"
echo "- Backend API docs: http://localhost:8000/docs"
echo ""
echo "Environment: $ENVIRONMENT"
echo ""
echo "Press Ctrl+C to stop all processes"

# Trap ctrl-c and kill processes
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true" INT TERM EXIT

wait 