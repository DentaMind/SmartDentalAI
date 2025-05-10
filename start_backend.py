#!/usr/bin/env python3
"""
Simple script to start the backend server.
"""
import uvicorn
import os
import sys

# Add the current directory to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

if __name__ == "__main__":
    print("Starting backend server on http://localhost:8000")
    uvicorn.run(
        "backend.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    ) 