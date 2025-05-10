#!/bin/bash

echo "🔄 Cleaning up and resetting DentaMind..."

# Step 1: Kill anything blocking backend (port 8000)
PORT=8000
PID=$(lsof -ti :$PORT)
if [ -n "$PID" ]; then
  echo "⚠️ Killing process on port $PORT (PID: $PID)..."
  kill -9 $PID
fi

# Step 2: Install backend Python dependencies (if using venv)
echo "📦 Installing backend Python packages..."
cd backend || exit
python -m pip install -r ../requirements.txt

# Step 3: Reset Alembic environment if needed
if [ ! -d "migrations" ]; then
  echo "🧹 Setting up Alembic migrations..."
  alembic init migrations
fi

# Step 4: Install frontend dependencies
echo "📦 Installing frontend npm packages..."
cd ../client || exit

# Remove existing node_modules and package-lock.json for clean install
rm -rf node_modules package-lock.json

# Install all dependencies including the missing ones
npm install
npm install i18next react-i18next @tanstack/react-query

# Step 5: Install root project dependencies
cd ..
npm install

echo "✅ Installation complete!"
echo "🚀 To start DentaMind, run: npm run dev" 