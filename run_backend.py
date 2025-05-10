#!/usr/bin/env python3
"""
Script to run the DentaMind backend server.
"""
import os
import sys
import uvicorn
import logging

# Add current directory to Python path to make imports work
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("backend")

# Initialize database (create tables and insert test data)
logger.info("Initializing database...")
try:
    from backend.init_db import init_db
    init_db()
    logger.info("Database initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing database: {str(e)}")
    logger.info("Continuing without database initialization...")

def main():
    """Run the FastAPI server"""
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    logger.info(f"Starting DentaMind backend server on {host}:{port}")
    
    # Run the server
    uvicorn.run(
        "backend.api.main:app", 
        host=host, 
        port=port, 
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main() 