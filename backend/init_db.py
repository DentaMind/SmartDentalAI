"""
Script to initialize the database with tables and test data.
"""
import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from backend.api.database import get_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import models to ensure they are registered with the ORM
from backend.api.models.base import Base
from backend.api.models.patient import Patient
from backend.api.models.medical_history import (
    MedicalHistory, 
    MedicalCondition, 
    Medication, 
    Allergy,
    MedicalHistoryStatus
)

# Import test data generator
from backend.tests.test_data import insert_test_data

def init_db():
    """
    Initialize the database by creating tables and inserting test data.
    """
    from backend.api.database import engine, SessionLocal
    
    # Create tables
    logger.info("Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully!")
    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")
        return False
    
    # Insert test data
    db = SessionLocal()
    try:
        logger.info("Inserting test data...")
        insert_test_data(db)
        logger.info("Test data inserted successfully!")
    except Exception as e:
        logger.error(f"Error inserting test data: {str(e)}")
        db.close()
        return False
    finally:
        db.close()
    
    return True

if __name__ == "__main__":
    success = init_db()
    if success:
        logger.info("Database initialization completed successfully.")
    else:
        logger.error("Database initialization failed.") 