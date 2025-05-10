#!/bin/bash

echo "=== DentaMind Backend Reset Script ==="
echo "This script will completely reset your backend environment"
echo ""

# Kill all uvicorn processes
echo "Killing all uvicorn processes..."
pkill -9 -f uvicorn

# Remove any __pycache__ directories
echo "Cleaning up Python cache files..."
find . -type d -name "__pycache__" -exec rm -rf {} +

# Ensure the virtual environment has all the necessary packages
echo "Installing required packages..."
if [ -d "../.venv" ]; then
  source ../.venv/bin/activate
elif [ -d ".venv" ]; then
  source .venv/bin/activate
elif [ -d "venv" ]; then
  source venv/bin/activate
elif [ -d "../venv" ]; then
  source ../venv/bin/activate
else
  echo "No virtual environment found. Creating a new one..."
  python3 -m venv venv
  source venv/bin/activate
fi

# Upgrade pip
pip install --upgrade pip

# Install all required packages
pip install -r requirements.txt

# Create a special testing file to verify Pydantic is working
echo "Creating test file..."
cat > test_pydantic.py << 'EOL'
from pydantic import BaseModel
from typing import Optional

class TestModel(BaseModel):
    name: str
    value: int
    is_active: bool = True
    optional_value: Optional[str] = None

# Test creating a model instance
test = TestModel(name="Test", value=42)
print("Pydantic test successful!")
print(test.dict())
EOL

# Test Pydantic
echo "Testing Pydantic..."
python test_pydantic.py

# Run the backend
echo "Starting the backend..."
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000 