#!/bin/bash

# Stop execution if any command fails
set -e

echo "=== DentaMind Environment Fix ==="
echo "This script will fix the Python environment by installing compatible versions"
date

# Activate virtual environment
if [ -d "../.venv" ]; then
    echo "Activating virtual environment..."
    source "../.venv/bin/activate"
else
    echo "No virtual environment found at ../.venv"
    echo "Do you want to create one? (y/n)"
    read create_venv
    if [ "$create_venv" == "y" ]; then
        echo "Creating virtual environment..."
        python -m venv ../.venv
        source "../.venv/bin/activate"
    else
        echo "Continuing without virtual environment..."
    fi
fi

# Uninstall conflicting packages
echo "Removing conflicting packages..."
pip uninstall -y fastapi pydantic starlette

# Install fixed requirements
echo "Installing fixed requirements..."
pip install -r requirements_fixed.txt

# Test pydantic
echo "Testing Pydantic installation..."
PYTHON_CODE=$(cat <<EOF
from pydantic import BaseModel
from typing import Optional

class TestModel(BaseModel):
    name: str
    value: int
    is_active: bool = True
    optional_value: Optional[str] = None

test = TestModel(name="Test", value=42)
print(test.dict())
EOF
)

python -c "$PYTHON_CODE"

if [ $? -eq 0 ]; then
    echo "✅ Pydantic test successful!"
else
    echo "❌ Pydantic test failed!"
    exit 1
fi

# Create required directories
echo "Creating required directories..."
mkdir -p data/knowledge
mkdir -p attached_assets/xrays

echo "Environment fixed successfully!" 