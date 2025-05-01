#!/bin/bash

# Find any processes running on port 8000
processes=$(lsof -i :8000 | grep LISTEN | awk '{print $2}')

if [ -z "$processes" ]; then
  echo "No processes found running on port 8000"
else
  echo "Found processes running on port 8000: $processes"
  echo "Killing processes..."
  
  for pid in $processes; do
    echo "Killing process $pid"
    kill -9 $pid
  done
  
  echo "All processes on port 8000 have been terminated"
fi

# Wait for a moment to ensure port is released
sleep 2 