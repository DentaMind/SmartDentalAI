#!/bin/bash

echo "=== DentaMind Backend Update & Run Script ==="

# Kill all uvicorn processes
echo "Killing all uvicorn processes..."
pkill -9 -f uvicorn

# Check Python version
echo "Python version:"
python3 --version

# Activate virtual environment
if [ -d "../.venv" ]; then
  echo "Using ../.venv environment"
  source ../.venv/bin/activate
elif [ -d ".venv" ]; then
  echo "Using .venv environment"
  source .venv/bin/activate
elif [ -d "venv" ]; then
  echo "Using venv environment"
  source venv/bin/activate
elif [ -d "../venv" ]; then
  echo "Using ../venv environment"
  source ../venv/bin/activate
else
  echo "No virtual environment found!"
  exit 1
fi

# Upgrade dependencies
echo "Upgrading dependencies..."
pip install -r requirements.txt

# Create a simple test to verify Pydantic is working
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

# Clear __pycache__ directories
echo "Clearing Python cache..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true

# Wait for any processes on port 8000 to fully release
echo "Ensuring port 8000 is free..."
for i in {1..5}; do
  if lsof -i :8000 > /dev/null; then
    echo "Port 8000 still in use, waiting..."
    sleep 2
  else
    echo "Port 8000 is free!"
    break
  fi
done

# Start the backend
echo "Starting the backend..."
python -m uvicorn api.main:app --reload --port 8000 