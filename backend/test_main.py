#!/usr/bin/env python3
"""
Test script for the main.py server
"""

import sys
import os
import importlib
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_main_imports():
    """Test importing the main module"""
    try:
        # Verify required packages
        import fastapi
        import pydantic
        import jose
        import passlib
        import bcrypt
        
        logger.info(f"FastAPI version: {fastapi.__version__}")
        logger.info(f"Pydantic version: {pydantic.__version__}")
        
        # Check if main.py exists
        if not os.path.exists("main.py"):
            logger.error("main.py file not found in the current directory")
            return False
            
        # Try to import the module directly
        try:
            sys.path.append(os.getcwd())
            main = importlib.import_module("main")
            logger.info("Successfully imported main module")
            return True
        except Exception as e:
            logger.error(f"Error importing main module: {e}")
            return False
            
    except ImportError as e:
        logger.error(f"Missing required package: {e}")
        return False

if __name__ == "__main__":
    logger.info("Testing main.py imports...")
    if test_main_imports():
        logger.info("All imports are working correctly")
    else:
        logger.error("Failed to import main.py. Check the logs for details") 