#!/bin/bash

# Function to find and kill processes
kill_processes() {
    # Kill any process using port 8000
    echo "Finding and killing processes on port 8000..."
    for pid in $(lsof -t -i:8000); do
        echo "Killing process $pid..."
        kill -9 $pid 2>/dev/null
    done

    # Kill any stray uvicorn processes
    echo "Finding and killing any stray uvicorn processes..."
    pkill -9 -f "uvicorn.*api.main:app" 2>/dev/null

    # Wait a moment for processes to clean up
    sleep 2
}

# Function to check if port is free
check_port() {
    if lsof -i:8000 >/dev/null 2>&1; then
        echo "Port 8000 is still in use. Forcing cleanup..."
        kill_processes
        sleep 1
    fi
}

# Function to activate virtual environment
activate_venv() {
    if [ -d ".venv" ]; then
        echo "Activating virtual environment..."
        source .venv/bin/activate
    elif [ -d "venv" ]; then
        echo "Activating virtual environment..."
        source venv/bin/activate
    fi
}

# Main script
echo "🔄 Restarting backend server..."

# Kill any existing processes
kill_processes

# Double check port is free
check_port

# Navigate to backend directory
if [ -d "backend" ]; then
    cd backend
elif [ "$(basename $PWD)" != "backend" ]; then
    echo "❌ Error: Cannot find backend directory"
    exit 1
fi

# Activate virtual environment
activate_venv

# Install/update dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "📦 Checking dependencies..."
    pip install -r requirements.txt >/dev/null 2>&1
fi

# Start the backend server
echo "🚀 Starting backend server..."
uvicorn api.main:app --reload --port 8000 