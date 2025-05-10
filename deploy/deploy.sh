#!/bin/bash

# Exit on error
set -e

# Load environment variables
source .env

# Function to display usage
usage() {
    echo "Usage: $0 [environment] [version]"
    echo "  environment: development, staging, or production"
    echo "  version: version tag to deploy"
    exit 1
}

# Check arguments
if [ $# -ne 2 ]; then
    usage
fi

ENVIRONMENT=$1
VERSION=$2

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo "Error: Invalid environment. Must be development, staging, or production."
    usage
fi

# Load configuration
CONFIG_FILE="deploy/config.yaml"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Configuration file not found: $CONFIG_FILE"
    exit 1
fi

# Parse configuration
DB_HOST=$(yq e ".environments.$ENVIRONMENT.database.host" $CONFIG_FILE)
DB_PORT=$(yq e ".environments.$ENVIRONMENT.database.port" $CONFIG_FILE)
DB_NAME=$(yq e ".environments.$ENVIRONMENT.database.name" $CONFIG_FILE)
DB_USER=$(yq e ".environments.$ENVIRONMENT.database.user" $CONFIG_FILE)
DB_PASSWORD=$(yq e ".environments.$ENVIRONMENT.database.password" $CONFIG_FILE)

# Function to check database connection
check_db_connection() {
    echo "Checking database connection..."
    if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1; then
        echo "Error: Could not connect to database"
        exit 1
    fi
    echo "Database connection successful"
}

# Function to run database migrations
run_migrations() {
    echo "Running database migrations..."
    cd backend
    alembic upgrade head
    cd ..
}

# Function to build and deploy
deploy() {
    echo "Deploying version $VERSION to $ENVIRONMENT..."
    
    # Build frontend
    echo "Building frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
    
    # Build backend
    echo "Building backend..."
    cd backend
    python -m pip install -r requirements.txt
    cd ..
    
    # Run database migrations
    run_migrations
    
    # Start services
    echo "Starting services..."
    if [ "$ENVIRONMENT" = "production" ]; then
        # Use gunicorn for production
        cd backend
        gunicorn -w 8 -b 0.0.0.0:8000 main:app
    else
        # Use uvicorn for development/staging
        cd backend
        uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    fi
}

# Main deployment process
echo "Starting deployment to $ENVIRONMENT..."
check_db_connection
deploy

echo "Deployment completed successfully!" 