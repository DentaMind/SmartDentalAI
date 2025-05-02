"""
Test data generator for the patient intake module.
"""
import uuid
from datetime import datetime, date, timedelta
from backend.api.models.patient import Patient, Gender
from backend.api.models.medical_history import (
    MedicalHistory, 
    MedicalCondition, 
    Medication, 
    Allergy,
    AllergyType,
    AllergyReaction,
    AllergyStatus,
    MedicationType,
    ASAClassification,
    MedicalHistoryStatus
)

def create_test_patient():
    """
    Create a test patient with medical history, allergies, and medications.
    
    Returns:
        dict: A dictionary with the test patient data
    """
    patient_id = str(uuid.uuid4())
    
    patient = {
        "id": patient_id,
        "first_name": "John",
        "last_name": "Doe",
        "date_of_birth": date(1980, 1, 15),
        "gender": Gender.MALE,
        "email": "john.doe@example.com",
        "phone": "555-123-4567",
        "address": "123 Main St, Anytown, USA",
        "created_at": datetime.now(),
    }
    
    medical_history = {
        "id": str(uuid.uuid4()),
        "patient_id": patient_id,
        "has_heart_disease": False,
        "has_diabetes": True,
        "has_hypertension": False,
        "has_respiratory_disease": False,
        "has_bleeding_disorder": False,
        "current_smoker": False,
        "pregnant": False,
        "notes": "Patient reports well-controlled Type 2 Diabetes",
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }
    
    conditions = [
        {
            "id": str(uuid.uuid4()),
            "medical_history_id": medical_history["id"],
            "name": "Type 2 Diabetes",
            "icd_code": "E11.9",
            "severity": "moderate",
            "is_controlled": True,
            "diagnosis_date": date(2015, 3, 10),
            "notes": "Controlled with medication and diet",
            "dental_considerations": [
                "Monitor for delayed healing",
                "Increased risk of infection"
            ]
        }
    ]
    
    allergies = [
        {
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "allergen": "Penicillin",
            "type": AllergyType.MEDICATION,
            "reaction": AllergyReaction.RASH,
            "severity": "moderate",
            "status": AllergyStatus.ACTIVE,
            "onset_date": date(2010, 5, 12),
            "notes": "Rash appears within 24 hours of administration",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
    ]
    
    medications = [
        {
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "name": "Metformin",
            "dosage": "500mg",
            "frequency": "twice daily",
            "type": MedicationType.PRESCRIPTION,
            "start_date": date(2015, 3, 15),
            "prescribing_provider": "Dr. Smith",
            "reason": "Type 2 Diabetes management",
            "dental_considerations": [
                "May cause taste alterations",
                "Can contribute to dry mouth"
            ],
            "notes": "Patient reports good compliance",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
    ]
    
    medical_history_status = {
        "id": str(uuid.uuid4()),
        "patient_id": patient_id,
        "asa_classification": ASAClassification.CLASS_II,
        "last_reviewed": datetime.now(),
        "status": "current",
        "reviewed_by": "Dr. Johnson"
    }
    
    return {
        "patient": patient,
        "medical_history": medical_history,
        "conditions": conditions,
        "allergies": allergies,
        "medications": medications,
        "medical_history_status": medical_history_status
    }

def insert_test_data(db):
    """
    Insert test data into the database.
    
    Args:
        db: SQLAlchemy database session
    """
    test_data = create_test_patient()
    
    # Create patient
    patient = Patient(**test_data["patient"])
    db.add(patient)
    db.flush()
    
    # Create medical history
    medical_history = MedicalHistory(**test_data["medical_history"])
    db.add(medical_history)
    db.flush()
    
    # Create conditions
    for condition_data in test_data["conditions"]:
        condition = MedicalCondition(**condition_data)
        db.add(condition)
    
    # Create allergies
    for allergy_data in test_data["allergies"]:
        allergy = Allergy(**allergy_data)
        db.add(allergy)
    
    # Create medications
    for medication_data in test_data["medications"]:
        medication = Medication(**medication_data)
        db.add(medication)
    
    # Create medical history status
    status = MedicalHistoryStatus(**test_data["medical_history_status"])
    db.add(status)
    
    db.commit()
    
    return test_data 