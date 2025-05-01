#!/bin/bash

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install pytest pytest-cov

# Create test database
export TEST_DATABASE_URL="sqlite:///./test.db"
export ENVIRONMENT="test"

# Run migrations
alembic upgrade head

# Run tests with coverage
pytest tests/test_bulk_matching.py -v --cov=api --cov-report=term-missing

# Deactivate virtual environment
deactivate 