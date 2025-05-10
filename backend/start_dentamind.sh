#!/bin/bash

# DentaMind Server Startup Script
# This script starts all components of the DentaMind platform

echo "=== Starting DentaMind Platform ==="
echo "$(date)"

# Check for running processes
echo "Checking for existing processes..."
if pgrep -f "python.*uvicorn" > /dev/null; then
    echo "Warning: Found existing uvicorn processes. These may cause port conflicts."
    
    # Show the processes
    echo "Running servers:"
    ps aux | grep -v grep | grep "python.*uvicorn"
    
    # Ask the user what to do
    read -p "Do you want to kill these processes before starting? (y/n): " choice
    if [[ "$choice" =~ ^[Yy] ]]; then
        echo "Killing existing uvicorn processes..."
        pkill -f "python.*uvicorn"
        sleep 2  # Give them time to shut down
    fi
fi

# Function to start a server
start_server() {
    server_file=$1
    port=$2
    log_file=$3
    
    echo "Starting $server_file on port $port..."
    python $server_file > $log_file 2>&1 &
    pid=$!
    
    # Wait a moment and check if the process is still running
    sleep 2
    if ps -p $pid > /dev/null; then
        echo "✅ Server started with PID $pid. Logs at $log_file"
        return 0
    else
        echo "❌ Failed to start $server_file. Check $log_file for errors."
        return 1
    fi
}

# Create log directory
mkdir -p logs

# Start the auth server
start_server "auth_server.py" 8085 "logs/auth_server.log"

# Start the patient server
start_server "patient_server.py" 8086 "logs/patient_server.log"

# Start the imaging server
start_server "imaging_server.py" 8087 "logs/imaging_server.log"

# Start debug server for backwards compatibility
start_server "debug_routes.py" 8090 "logs/debug_server.log"

# Create a simple proxy configuration file for the frontend
echo "
export const API_ENDPOINTS = {
  AUTH_API: 'http://localhost:8085',
  PATIENT_API: 'http://localhost:8086',
  IMAGING_API: 'http://localhost:8087',
  DEBUG_API: 'http://localhost:8090'
};
" > ../client/src/config/api.ts

echo "
All DentaMind servers have been started!

Server Summary:
- Auth API:      http://localhost:8085
- Patient API:   http://localhost:8086  
- Imaging API:   http://localhost:8087
- Debug API:     http://localhost:8090

Usage:
- To stop all servers: ./stop_dentamind.sh
- View logs in the logs/ directory
"

# Make the stop script executable
echo '#!/bin/bash
echo "Stopping all DentaMind servers..."
pkill -f "python.*auth_server.py"
pkill -f "python.*patient_server.py"
pkill -f "python.*imaging_server.py"
pkill -f "python.*debug_routes.py"
echo "Servers stopped."
' > stop_dentamind.sh
chmod +x stop_dentamind.sh 