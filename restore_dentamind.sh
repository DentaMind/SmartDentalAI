#!/bin/bash

# DentaMind Platform Restore Script

echo "==============================================="
echo "    DentaMind Platform - Restore Script"
echo "==============================================="
echo "$(date)"

# Color variables
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Stop any running services
echo -e "${BLUE}Stopping any running services...${NC}"
./stop_all_services.sh

# Check virtual environment
if [[ -z "$VIRTUAL_ENV" ]]; then
    echo -e "${YELLOW}No virtual environment activated. Activating...${NC}"
    if [[ -d ".venv" ]]; then
        source .venv/bin/activate
        echo -e "${GREEN}Activated virtual environment: $VIRTUAL_ENV${NC}"
    else
        echo -e "${RED}No .venv directory found. Creating new virtual environment...${NC}"
        python -m venv .venv
        source .venv/bin/activate
        echo -e "${GREEN}Created and activated virtual environment: $VIRTUAL_ENV${NC}"
    fi
else
    echo -e "${GREEN}Using virtual environment: $VIRTUAL_ENV${NC}"
fi

# Install specific versions of dependencies
echo -e "${BLUE}Installing correct versions of dependencies...${NC}"
pip install fastapi==0.88.0 pydantic==1.10.8 starlette==0.22.0 uvicorn==0.15.0

# Create required directories
echo -e "${BLUE}Creating required directories...${NC}"
mkdir -p backend/logs
mkdir -p backend/attached_assets/xrays
mkdir -p client/src/config

# Configure API endpoints for frontend
echo -e "${BLUE}Configuring frontend API endpoints...${NC}"
cat > client/src/config/api.ts << EOL
// API Endpoints Configuration - Automatically generated
export const API_ENDPOINTS = {
  AUTH_API: 'http://localhost:8085',
  PATIENT_API: 'http://localhost:8086',
  IMAGING_API: 'http://localhost:8087',
  DEBUG_API: 'http://localhost:8092'
};
EOL

# Start the debug server
echo -e "${BLUE}Starting debug server...${NC}"
cd backend
python debug_routes_simple.py > logs/debug_server.log 2>&1 &
DEBUG_SERVER_PID=$!
sleep 3

# Check if debug server started successfully
if ps -p $DEBUG_SERVER_PID > /dev/null; then
    echo -e "${GREEN}✅ Debug server started successfully on port 8092${NC}"
else
    echo -e "${RED}❌ Failed to start debug server. Check logs/debug_server.log for details${NC}"
    echo -e "${YELLOW}Last 10 lines of log:${NC}"
    tail -n 10 logs/debug_server.log
    exit 1
fi

# Go back to the root directory
cd ..

# Success message
echo -e "
${GREEN}===========================================
   DentaMind Platform Successfully Restored!
==========================================${NC}

${BLUE}Services Running:${NC}
- ${GREEN}Debug API:${NC}             http://localhost:3000

${BLUE}Access Information:${NC}
- Visit ${GREEN}http://localhost:3000/docs${NC} to see the API documentation
- Use ${GREEN}http://localhost:3000/api/patients/sample${NC} to test patient data

To stop all services, run:
./stop_all_services.sh

${YELLOW}The platform is now running in minimal mode with the debug server.${NC}
${YELLOW}You can access the API endpoints for development and testing.${NC}
" 