#!/usr/bin/env python3
"""
Test script to demonstrate the patient recall reminder system
"""

import asyncio
import sys
import os
import logging
from datetime import datetime, timedelta
from typing import List, Dict

# Add the project root to Python path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Import necessary components
from backend.api.database import get_db
from backend.api.models.patient import Patient
from backend.api.models.patient_recall import PatientRecallSchedule, RecallType, RecallFrequency, RecallStatus
from backend.api.services.patient_recall_service import patient_recall_service
from backend.api.schemas.patient_recall import (
    PatientRecallScheduleCreate,
    BatchRecallScheduleCreate
)

async def test_create_single_recall():
    """Test creating a single recall schedule"""
    logger.info("Testing creation of a single recall schedule")
    
    # Get database session
    db = next(get_db())
    
    try:
        # Get the first patient
        patient = db.query(Patient).first()
        if not patient:
            logger.error("No patients found in database")
            return
            
        logger.info(f"Found patient: {patient.first_name} {patient.last_name}")
        
        # Create recall data
        recall_data = PatientRecallScheduleCreate(
            patient_id=patient.id,
            recall_type=RecallType.HYGIENE,
            frequency=RecallFrequency.SIX_MONTHS,
            next_due_date=datetime.now() + timedelta(days=1),  # Due tomorrow for testing
            reminder_days_before=[30, 14, 7, 1],  # Remind at these intervals
            notes="Regular hygiene recall"
        )
        
        # Create recall schedule
        recall = await patient_recall_service.create_recall_schedule(
            db=db,
            recall_data=recall_data,
            created_by="test_script"
        )
        
        logger.info(f"Created recall schedule: {recall.id} for patient {patient.id}")
        logger.info(f"  Type: {recall.recall_type}")
        logger.info(f"  Due date: {recall.next_due_date}")
        logger.info(f"  Reminder days: {recall.reminder_days_before}")
        
        return recall
    
    except Exception as e:
        logger.error(f"Error creating recall: {e}")
        db.rollback()
    finally:
        db.close()

async def test_batch_recalls():
    """Test creating recalls for multiple patients"""
    logger.info("Testing batch creation of recall schedules")
    
    # Get database session
    db = next(get_db())
    
    try:
        # Get some patients
        patients = db.query(Patient).limit(5).all()
        if not patients:
            logger.error("No patients found in database")
            return
            
        patient_ids = [p.id for p in patients]
        logger.info(f"Found {len(patient_ids)} patients")
        
        # Create batch recall data
        batch_data = BatchRecallScheduleCreate(
            recall_type=RecallType.PERIO_MAINTENANCE,
            frequency=RecallFrequency.THREE_MONTHS,
            patient_ids=patient_ids,
            days_ahead=14,  # Due in two weeks
            reminder_days_before=[7, 3, 1],
            notes="Perio maintenance recall program"
        )
        
        # Create batch recalls
        results = await patient_recall_service.create_batch_recall_schedules(
            db=db,
            batch_data=batch_data,
            created_by="test_script"
        )
        
        logger.info(f"Batch recall creation results: {results}")
        logger.info(f"Created {results['created_count']} recalls, failed: {results['failed_count']}")
        
        return results
    
    except Exception as e:
        logger.error(f"Error creating batch recalls: {e}")
        db.rollback()
    finally:
        db.close()

async def test_process_reminders():
    """Test processing recall reminders"""
    logger.info("Testing recall reminder processing")
    
    # Get database session
    db = next(get_db())
    
    try:
        # Process reminders
        results = await patient_recall_service.process_recall_reminders(db)
        
        logger.info(f"Reminder processing results: {results}")
        logger.info(f"Sent {results['sent_count']} reminders")
        
        # Log details by type
        for recall_type, count in results.get("by_type", {}).items():
            logger.info(f"  {recall_type}: {count} reminders")
            
        return results
    
    except Exception as e:
        logger.error(f"Error processing reminders: {e}")
    finally:
        db.close()

async def test_get_statistics():
    """Test getting recall statistics"""
    logger.info("Testing recall statistics")
    
    # Get database session
    db = next(get_db())
    
    try:
        # Get statistics
        stats = await patient_recall_service.get_recall_statistics(db)
        
        logger.info("Recall statistics:")
        logger.info(f"  Active recalls: {stats.total_active}")
        logger.info(f"  Paused recalls: {stats.total_paused}")
        logger.info(f"  Completed recalls: {stats.total_completed}")
        logger.info(f"  Cancelled recalls: {stats.total_cancelled}")
        logger.info(f"  Recalls by type: {stats.by_type}")
        logger.info(f"  Overdue recalls: {stats.overdue_count}")
        logger.info(f"  Due within 30 days: {stats.due_within_30_days}")
        
        return stats
    
    except Exception as e:
        logger.error(f"Error getting statistics: {e}")
    finally:
        db.close()

async def main():
    """Main test function"""
    logger.info("Starting patient recall reminder tests")
    
    # Run tests
    logger.info("\n1. Create single recall schedule")
    await test_create_single_recall()
    
    logger.info("\n2. Create batch recall schedules")
    await test_batch_recalls()
    
    logger.info("\n3. Process recall reminders")
    await test_process_reminders()
    
    logger.info("\n4. Get recall statistics")
    await test_get_statistics()
    
    logger.info("\nTests completed")

if __name__ == "__main__":
    asyncio.run(main()) 