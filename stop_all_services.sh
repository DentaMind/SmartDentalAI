#!/bin/bash

# DentaMind Stop All Services Script

echo "==============================================="
echo "    DentaMind Platform - Service Manager"
echo "==============================================="

# Color variables
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Kill processes on specific ports
for port in 8000 8085 8086 8087 8088 8090 8092; do
  echo -e "${BLUE}Checking port $port...${NC}"
  if lsof -ti :$port > /dev/null; then
    echo -e "${YELLOW}Found processes on port $port. Killing...${NC}"
    lsof -ti :$port | xargs kill -9
    echo -e "${GREEN}Processes on port $port terminated.${NC}"
  else
    echo -e "${GREEN}No processes found on port $port.${NC}"
  fi
done

# Kill specific service processes
echo -e "${BLUE}Checking for server processes...${NC}"
pkill -f "uvicorn" || echo -e "${GREEN}No uvicorn processes found.${NC}"
pkill -f "debug_routes" || echo -e "${GREEN}No debug_routes processes found.${NC}"
pkill -f "simple_test.py" || echo -e "${GREEN}No simple_test processes found.${NC}"
pkill -f "auth_server" || echo -e "${GREEN}No auth_server processes found.${NC}"
pkill -f "patient_server" || echo -e "${GREEN}No patient_server processes found.${NC}"
pkill -f "imaging_server" || echo -e "${GREEN}No imaging_server processes found.${NC}"

echo -e "${GREEN}All DentaMind services have been stopped.${NC}"
echo "===============================================" 