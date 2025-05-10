#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting DentaMind Migration Reset...${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
echo -e "${YELLOW}Checking required tools...${NC}"
if ! command_exists psql; then
    echo -e "${RED}PostgreSQL client (psql) is required but not installed.${NC}"
    exit 1
fi

if ! command_exists alembic; then
    echo -e "${RED}Alembic is required but not installed.${NC}"
    exit 1
fi

# Backup existing migrations
echo -e "${YELLOW}Backing up existing migrations...${NC}"
mkdir -p migrations_backup
cp -r backend/migrations/versions/* migrations_backup/ 2>/dev/null || true

# Remove existing migrations
echo -e "${YELLOW}Removing existing migrations...${NC}"
rm -f backend/migrations/versions/*.py

# Reset database
echo -e "${YELLOW}Resetting database...${NC}"
psql -U abrahamabdin -d postgres -c "DROP DATABASE IF EXISTS smartdental;" || {
    echo -e "${RED}Failed to drop database. Please check your PostgreSQL credentials.${NC}"
    exit 1
}

psql -U abrahamabdin -d postgres -c "CREATE DATABASE smartdental;" || {
    echo -e "${RED}Failed to create database. Please check your PostgreSQL credentials.${NC}"
    exit 1
}

# Create new migration
echo -e "${YELLOW}Creating new migration...${NC}"
cd backend
alembic revision --autogenerate -m "Initial full schema" || {
    echo -e "${RED}Failed to create new migration.${NC}"
    exit 1
}

# Apply migration
echo -e "${YELLOW}Applying new migration...${NC}"
alembic upgrade head || {
    echo -e "${RED}Failed to apply migration.${NC}"
    exit 1
}
cd ..

echo -e "${GREEN}✅ Migration reset completed successfully!${NC}"
echo -e "${GREEN}You can now run ./start_dev.sh to start DentaMind with a clean database.${NC}" 