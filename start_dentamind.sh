#!/bin/bash

# DentaMind Platform - Unified Launcher
# Starts all required services for the DentaMind platform

echo "==========================================="
echo "      DentaMind Platform - Unified Launcher  "
echo "==========================================="
echo "$(date)"

# Check for existing processes
echo "Checking for existing processes..."
existing_procs=$(ps aux | grep uvicorn | grep -v grep | wc -l)
if [ $existing_procs -gt 0 ]; then
  echo "Found existing uvicorn processes:"
  ps aux | grep uvicorn | grep -v grep
  echo "You may want to run './stop_dentamind.sh' first."
else
  echo "No uvicorn processes found."
fi

# Check required ports
echo "Checking required ports..."
check_port() {
  port=$1
  if lsof -i:$port -t >/dev/null; then
    echo "Port $port is already in use."
    if [ "$2" = "critical" ]; then
      echo "Killing process on port $port..."
      lsof -ti:$port | xargs kill -9
      echo "Port $port is now free"
    fi
    return 1
  else
    echo "Port $port is free."
    return 0
  fi
}

# Check all required ports
check_port 3000 "noncritical"  # Debug server
check_port 8000 "critical"     # Main API server 
check_port 8001 "critical"     # Unified API server
check_port 8085 "noncritical"  # Auth service
check_port 8086 "noncritical"  # Patient service
check_port 8087 "noncritical"  # Imaging service
check_port 8088 "noncritical"  # Debug alt server
check_port 8090 "noncritical"  # Test server
check_port 8092 "noncritical"  # Debug alt server 2

# Determine virtual environment
VENV_PATH=".venv"
if [ -d "$VENV_PATH" ]; then
  echo "Using virtual environment: $PWD/$VENV_PATH"
  source "$VENV_PATH/bin/activate"
elif [ -d "venv" ]; then
  echo "Using virtual environment: $PWD/venv"
  source "venv/bin/activate"
else
  echo "No virtual environment found. Using system Python."
fi

# Ensure required packages are installed with correct versions
echo "Ensuring required packages are installed with correct versions..."
echo "Running dependency fixer..."
python fix_dependencies.py

# Configure frontend API endpoints
echo "Configuring frontend API endpoints..."

# Start the debug server as fallback
echo "Starting debug server as fallback..."
nohup python debug_routes_simple.py > logs/debug_server.log 2>&1 &
DEBUG_SERVER_PID=$!
sleep 2

# Check if debug server started successfully
if ps -p $DEBUG_SERVER_PID > /dev/null; then
  echo "✅ Debug server started on port 3000"
else
  echo "❌ Debug server failed to start"
  cat logs/debug_server.log | tail -10
fi

# Start the main unified server
echo "Starting main unified server..."
nohup python dentamind_server.py > logs/main_server.log 2>&1 &
MAIN_SERVER_PID=$!
sleep 2

# Check if main server started successfully
if ps -p $MAIN_SERVER_PID > /dev/null; then
  echo "✅ Main unified server started on port 8001"
else
  echo "❌ Main server failed to start. Check logs/main_server.log for details"
  echo "Last 10 lines of log:"
  cat logs/main_server.log | tail -10
  echo "Continuing with debug server only..."
fi

# Output status
echo "==========================================="
echo "   DentaMind Platform Started!"
echo "=========================================="
echo "Services Running:"
if ps -p $MAIN_SERVER_PID > /dev/null; then
  echo "- Main Unified API:     http://localhost:8001"
  echo "- Main API Docs:        http://localhost:8001/docs"
fi
if ps -p $DEBUG_SERVER_PID > /dev/null; then
  echo "- Debug API:            http://localhost:3000"
  echo "- Debug API Docs:       http://localhost:3000/docs"
fi
echo "Demo Credentials:"
echo "- Username: demo@dentamind.com"
echo "- Password: password123"
echo "Admin Credentials:"
echo "- Username: admin@dentamind.com"
echo "- Password: admin123"
echo "Press Ctrl+C to stop all services"

# Keep script running unless CTRL+C
trap 'echo "Stopping services..."; ./stop_dentamind.sh; exit 0' INT
wait 