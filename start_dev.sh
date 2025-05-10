#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure the script starts from the project root
echo -e "${YELLOW}Changing to project root directory...${NC}"
cd "$(dirname "$0")"

echo -e "${GREEN}🚀 Starting DentaMind Development Environment...${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check database health
check_database_health() {
    echo -e "${YELLOW}🔍 Checking migration and DB health...${NC}"
    
    # Check if we're in the backend directory
    if [ -d "backend" ]; then
        cd backend
    fi
    
    # Check for multiple Alembic heads
    if alembic heads | grep -q "head"; then
        HEAD_COUNT=$(alembic heads | grep -c "head")
        if [ "$HEAD_COUNT" -gt 1 ]; then
            echo -e "${RED}❌ Multiple Alembic heads detected!${NC}"
            echo -e "${YELLOW}Please run: alembic merge heads${NC}"
            return 1
        fi
    fi
    
    # Check for pending migrations
    PENDING=$(alembic current | grep 'down_revision')
    if [ -n "$PENDING" ]; then
        echo -e "${RED}❌ Pending Alembic migrations!${NC}"
        echo -e "${YELLOW}Please run: alembic upgrade head${NC}"
        return 1
    fi
    
    # Check if current revision matches models
    if ! alembic current | grep -q "head"; then
        echo -e "${RED}❌ Database is not at the latest migration!${NC}"
        echo -e "${YELLOW}Please run: alembic upgrade head${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Alembic migration state: clean${NC}"
    echo -e "${GREEN}✅ Database schema is up to date${NC}"
    return 0
}

# Check for required tools
echo -e "${YELLOW}Checking required tools...${NC}"
if ! command_exists python3; then
    echo -e "${RED}Python 3 is required but not installed.${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}Node.js is required but not installed.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}npm is required but not installed.${NC}"
    exit 1
fi

# Kill any existing processes on port 8000
echo -e "${YELLOW}Checking for existing processes...${NC}"
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true

# Create and activate Python virtual environment
echo -e "${YELLOW}Setting up Python environment...${NC}"
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate

# Install Python dependencies
echo -e "${YELLOW}Installing Python dependencies...${NC}"
pip install -r requirements-dev.txt

# Check database health
if ! check_database_health; then
    echo -e "${RED}❌ Database health check failed. Please fix the issues above.${NC}"
    exit 1
fi

# Start backend server in background
echo -e "${YELLOW}🧠 Launching FastAPI backend...${NC}"
cd backend
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Install frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd frontend
npm install || {
    echo -e "${RED}Failed to install frontend dependencies.${NC}"
    exit 1
}

# Start frontend development server
echo -e "${YELLOW}🎨 Launching frontend...${NC}"
npm run dev &
FRONTEND_PID=$!
cd ..

# Function to handle cleanup on script exit
cleanup() {
    echo -e "${YELLOW}Shutting down DentaMind...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    deactivate
    echo -e "${GREEN}DentaMind has been shut down.${NC}"
    exit 0
}

# Set up trap to catch script termination
trap cleanup SIGINT SIGTERM

# Print health status
echo -e "\n${GREEN}✅ DentaMind Health Status:${NC}"
echo -e "${GREEN}   • Backend API: http://localhost:8000${NC}"
echo -e "${GREEN}   • Frontend: http://localhost:5173${NC}"
echo -e "${GREEN}   • API Documentation: http://localhost:8000/docs${NC}"
echo -e "\n${YELLOW}Press Ctrl+C to stop DentaMind${NC}"

# Keep the script running
wait 