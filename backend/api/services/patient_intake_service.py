from typing import Dict, List, Any, Optional, Union
import logging
from datetime import datetime
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from pydantic import BaseModel, Field, validator

from ..models.patient import Patient
from ..models.medical_history import (
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

logger = logging.getLogger(__name__)

class PatientIntakeService:
    """
    Comprehensive service for handling patient intake, medical history, 
    and clinical screening for dental patients.
    
    This service:
    1. Processes new patient registration
    2. Manages medical history including conditions, medications, and allergies
    3. Identifies potential medical-dental interactions
    4. Evaluates ASA classification for procedural risk assessment
    5. Identifies medical alerts relevant to dental care
    """
    
    def __init__(self, db: Session):
        """Initialize the patient intake service"""
        self.db = db
        
    async def process_new_patient(self, patient_data: Dict[str, Any]) -> Patient:
        """
        Process data for a new patient registration, creating patient record
        and associated medical history
        
        Args:
            patient_data: Dictionary containing patient registration data
            
        Returns:
            Created Patient record
        
        Raises:
            ValueError: If required fields are missing
        """
        # Validate required patient fields
        required_fields = ["first_name", "last_name", "date_of_birth", "email"]
        for field in required_fields:
            if field not in patient_data:
                raise ValueError(f"Required field missing: {field}")
        
        # Extract basic patient information
        patient_info = {
            "id": str(uuid.uuid4()),
            "first_name": patient_data["first_name"],
            "last_name": patient_data["last_name"],
            "date_of_birth": patient_data["date_of_birth"],
            "email": patient_data["email"],
            "phone": patient_data.get("phone"),
            "address": patient_data.get("address"),
            "gender": patient_data.get("gender"),
            "created_at": datetime.now(),
        }
        
        # Create patient record
        patient = Patient(**patient_info)
        self.db.add(patient)
        self.db.flush()  # Flush to get the patient ID without committing
        
        # Process medical history if provided
        if "medical_history" in patient_data:
            await self.create_medical_history(
                patient.id, patient_data["medical_history"]
            )
        
        # Process allergies if provided
        if "allergies" in patient_data:
            await self.add_patient_allergies(
                patient.id, patient_data["allergies"]
            )
        
        # Process medications if provided
        if "medications" in patient_data:
            await self.add_patient_medications(
                patient.id, patient_data["medications"]
            )
        
        # Evaluate ASA classification based on medical data
        asa_class = self._evaluate_asa_classification(patient_data)
        
        # Create medical history status record with ASA classification
        history_status = MedicalHistoryStatus(
            id=str(uuid.uuid4()),
            patient_id=patient.id,
            asa_classification=asa_class,
            last_reviewed=datetime.now(),
            status="current"
        )
        self.db.add(history_status)
        
        # Generate medical alerts based on history, medications, allergies
        alerts = await self.generate_medical_alerts(patient.id)
        
        # Commit all changes
        try:
            self.db.commit()
            logger.info(f"Successfully registered new patient: {patient.id}")
            return patient
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating patient: {str(e)}")
            raise ValueError(f"Failed to create patient: {str(e)}")
    
    async def create_medical_history(
        self, 
        patient_id: str, 
        medical_data: Dict[str, Any]
    ) -> MedicalHistory:
        """
        Create medical history record for a patient
        
        Args:
            patient_id: ID of the patient
            medical_data: Dictionary containing medical history data
            
        Returns:
            Created MedicalHistory record
        """
        # Create main medical history record
        medical_history = MedicalHistory(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            has_heart_disease=medical_data.get("has_heart_disease", False),
            has_diabetes=medical_data.get("has_diabetes", False),
            has_hypertension=medical_data.get("has_hypertension", False),
            has_respiratory_disease=medical_data.get("has_respiratory_disease", False),
            has_bleeding_disorder=medical_data.get("has_bleeding_disorder", False),
            current_smoker=medical_data.get("current_smoker", False),
            pregnant=medical_data.get("pregnant", False),
            notes=medical_data.get("notes", ""),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        self.db.add(medical_history)
        
        # Process specific medical conditions if provided
        if "conditions" in medical_data and isinstance(medical_data["conditions"], list):
            for condition in medical_data["conditions"]:
                medical_condition = MedicalCondition(
                    id=str(uuid.uuid4()),
                    medical_history_id=medical_history.id,
                    name=condition["name"],
                    icd_code=condition.get("icd_code"),
                    severity=condition.get("severity", "moderate"),
                    is_controlled=condition.get("is_controlled", False),
                    last_episode=condition.get("last_episode"),
                    diagnosis_date=condition.get("diagnosis_date"),
                    notes=condition.get("notes", ""),
                    dental_considerations=condition.get("dental_considerations", [])
                )
                self.db.add(medical_condition)
        
        self.db.flush()
        return medical_history
    
    async def add_patient_allergies(
        self, 
        patient_id: str, 
        allergies: List[Dict[str, Any]]
    ) -> List[Allergy]:
        """
        Add allergies to a patient's record
        
        Args:
            patient_id: ID of the patient
            allergies: List of allergies to add
            
        Returns:
            List of created Allergy records
        """
        created_allergies = []
        
        for allergy_data in allergies:
            # Create allergy record
            allergy = Allergy(
                id=str(uuid.uuid4()),
                patient_id=patient_id,
                allergen=allergy_data["allergen"],
                type=AllergyType(allergy_data.get("type", "MEDICATION")),
                reaction=AllergyReaction(allergy_data.get("reaction", "UNKNOWN")),
                severity=allergy_data.get("severity", "moderate"),
                status=AllergyStatus(allergy_data.get("status", "ACTIVE")),
                onset_date=allergy_data.get("onset_date"),
                notes=allergy_data.get("notes", ""),
                created_at=datetime.now()
            )
            
            self.db.add(allergy)
            created_allergies.append(allergy)
        
        self.db.flush()
        return created_allergies
    
    async def add_patient_medications(
        self, 
        patient_id: str, 
        medications: List[Dict[str, Any]]
    ) -> List[Medication]:
        """
        Add medications to a patient's record
        
        Args:
            patient_id: ID of the patient
            medications: List of medications to add
            
        Returns:
            List of created Medication records
        """
        created_medications = []
        
        for med_data in medications:
            # Create medication record
            medication = Medication(
                id=str(uuid.uuid4()),
                patient_id=patient_id,
                name=med_data["name"],
                dosage=med_data.get("dosage"),
                frequency=med_data.get("frequency"),
                type=MedicationType(med_data.get("type", "PRESCRIPTION")),
                start_date=med_data.get("start_date"),
                end_date=med_data.get("end_date"),
                prescribing_provider=med_data.get("prescribing_provider"),
                reason=med_data.get("reason"),
                dental_considerations=med_data.get("dental_considerations", []),
                notes=med_data.get("notes", ""),
                created_at=datetime.now()
            )
            
            self.db.add(medication)
            created_medications.append(medication)
        
        self.db.flush()
        return created_medications
    
    def _evaluate_asa_classification(self, patient_data: Dict[str, Any]) -> ASAClassification:
        """
        Evaluate ASA physical status classification based on patient data
        
        Args:
            patient_data: Dictionary containing patient and medical data
            
        Returns:
            ASA classification (I-VI)
        """
        # Default to ASA I (healthy patient)
        asa_class = ASAClassification.CLASS_I
        
        # Get medical history data
        medical_data = patient_data.get("medical_history", {})
        conditions = medical_data.get("conditions", [])
        medications = patient_data.get("medications", [])
        
        # Check if patient has systemic disease
        has_systemic_disease = (
            medical_data.get("has_heart_disease", False) or
            medical_data.get("has_diabetes", False) or
            medical_data.get("has_hypertension", False) or
            medical_data.get("has_respiratory_disease", False) or
            medical_data.get("has_bleeding_disorder", False) or
            len(conditions) > 0
        )
        
        # Check if patient is on multiple medications
        on_multiple_medications = len(medications) >= 3
        
        # Check if conditions are controlled
        uncontrolled_conditions = [
            c for c in conditions 
            if "is_controlled" in c and not c["is_controlled"]
        ]
        
        # Apply ASA classification logic
        if not has_systemic_disease and not on_multiple_medications:
            # Healthy patient
            asa_class = ASAClassification.CLASS_I
        elif has_systemic_disease and not uncontrolled_conditions:
            # Mild systemic disease, well controlled
            asa_class = ASAClassification.CLASS_II
        elif has_systemic_disease and uncontrolled_conditions:
            # Severe systemic disease that limits activity but is not incapacitating
            asa_class = ASAClassification.CLASS_III
        
        # Note: ASA IV-VI require more detailed clinical assessment
        # and should be determined by a healthcare provider
        
        return asa_class
    
    async def generate_medical_alerts(self, patient_id: str) -> List[Dict[str, Any]]:
        """
        Generate dental-relevant medical alerts for a patient
        
        Args:
            patient_id: ID of the patient
            
        Returns:
            List of medical alerts
        """
        alerts = []
        
        # Get patient's medical history
        medical_history = self.db.query(MedicalHistory).filter(
            MedicalHistory.patient_id == patient_id
        ).first()
        
        # Get patient's allergies
        allergies = self.db.query(Allergy).filter(
            Allergy.patient_id == patient_id,
            Allergy.status == AllergyStatus.ACTIVE
        ).all()
        
        # Get patient's medications
        medications = self.db.query(Medication).filter(
            Medication.patient_id == patient_id,
            or_(
                Medication.end_date.is_(None),
                Medication.end_date >= datetime.now()
            )
        ).all()
        
        # Check for specific allergies relevant to dentistry
        for allergy in allergies:
            if allergy.type == AllergyType.MEDICATION:
                dental_allergens = [
                    "penicillin", "amoxicillin", "lidocaine", "epinephrine",
                    "codeine", "ibuprofen", "latex"
                ]
                
                for allergen in dental_allergens:
                    if allergen.lower() in allergy.allergen.lower():
                        alerts.append({
                            "type": "allergy",
                            "severity": "high",
                            "description": f"Allergic to {allergy.allergen}",
                            "reaction": allergy.reaction.value,
                            "considerations": "Avoid use during procedures"
                        })
        
        # Check for medical conditions requiring antibiotic prophylaxis
        if medical_history:
            if medical_history.has_heart_disease:
                alerts.append({
                    "type": "medical",
                    "severity": "high",
                    "description": "History of heart disease",
                    "considerations": "Consider antibiotic prophylaxis"
                })
            
            if medical_history.has_bleeding_disorder:
                alerts.append({
                    "type": "medical",
                    "severity": "high",
                    "description": "Bleeding disorder",
                    "considerations": "Risk of excessive bleeding during procedures"
                })
        
        # Check for medications with dental implications
        for medication in medications:
            # Anticoagulants
            anticoagulants = [
                "warfarin", "heparin", "dabigatran", "rivaroxaban", "apixaban",
                "edoxaban", "clopidogrel", "prasugrel", "ticagrelor"
            ]
            
            for anticoag in anticoagulants:
                if anticoag.lower() in medication.name.lower():
                    alerts.append({
                        "type": "medication",
                        "severity": "high",
                        "description": f"Patient taking {medication.name}",
                        "considerations": "Increased bleeding risk during procedures"
                    })
            
            # Bisphosphonates
            bisphosphonates = [
                "alendronate", "risedronate", "ibandronate", "zoledronic",
                "pamidronate", "etidronate"
            ]
            
            for bisphos in bisphosphonates:
                if bisphos.lower() in medication.name.lower():
                    alerts.append({
                        "type": "medication",
                        "severity": "high",
                        "description": f"Patient taking {medication.name}",
                        "considerations": "Risk of medication-related osteonecrosis of the jaw"
                    })
        
        # Get ASA classification
        history_status = self.db.query(MedicalHistoryStatus).filter(
            MedicalHistoryStatus.patient_id == patient_id,
            MedicalHistoryStatus.status == "current"
        ).first()
        
        if history_status and history_status.asa_classification in [
            ASAClassification.CLASS_III,
            ASAClassification.CLASS_IV
        ]:
            alerts.append({
                "type": "asa",
                "severity": "high",
                "description": f"ASA Classification {history_status.asa_classification.value}",
                "considerations": "Consider medical consultation before invasive procedures"
            })
        
        return alerts
    
    async def check_medication_allergies(
        self, 
        patient_id: str, 
        medication_name: str
    ) -> Optional[Dict[str, Any]]:
        """
        Check if a patient is allergic to a specific medication
        
        Args:
            patient_id: ID of the patient
            medication_name: Name of the medication to check
            
        Returns:
            Allergy details if found, None otherwise
        """
        # Get patient's allergies
        allergies = self.db.query(Allergy).filter(
            Allergy.patient_id == patient_id,
            Allergy.status == AllergyStatus.ACTIVE,
            Allergy.type == AllergyType.MEDICATION
        ).all()
        
        # Check each allergy
        for allergy in allergies:
            # Direct match with allergen name
            if medication_name.lower() in allergy.allergen.lower():
                return {
                    "allergen": allergy.allergen,
                    "reaction": allergy.reaction.value,
                    "severity": allergy.severity
                }
            
            # Check for drug class allergies (e.g., penicillin class)
            if "penicillin" in allergy.allergen.lower() and any(
                med in medication_name.lower() for med in 
                ["amoxicillin", "ampicillin", "dicloxacillin"]
            ):
                return {
                    "allergen": allergy.allergen,
                    "reaction": allergy.reaction.value,
                    "severity": allergy.severity,
                    "note": "Cross-sensitivity with penicillin class"
                }
        
        return None
    
    async def update_medical_history(
        self, 
        patient_id: str, 
        medical_data: Dict[str, Any]
    ) -> MedicalHistory:
        """
        Update a patient's medical history
        
        Args:
            patient_id: ID of the patient
            medical_data: Updated medical history data
            
        Returns:
            Updated MedicalHistory record
        """
        # Get existing medical history
        medical_history = self.db.query(MedicalHistory).filter(
            MedicalHistory.patient_id == patient_id
        ).first()
        
        if not medical_history:
            # Create new medical history if not exists
            return await self.create_medical_history(patient_id, medical_data)
        
        # Update medical history fields
        if "has_heart_disease" in medical_data:
            medical_history.has_heart_disease = medical_data["has_heart_disease"]
        if "has_diabetes" in medical_data:
            medical_history.has_diabetes = medical_data["has_diabetes"]
        if "has_hypertension" in medical_data:
            medical_history.has_hypertension = medical_data["has_hypertension"]
        if "has_respiratory_disease" in medical_data:
            medical_history.has_respiratory_disease = medical_data["has_respiratory_disease"]
        if "has_bleeding_disorder" in medical_data:
            medical_history.has_bleeding_disorder = medical_data["has_bleeding_disorder"]
        if "current_smoker" in medical_data:
            medical_history.current_smoker = medical_data["current_smoker"]
        if "pregnant" in medical_data:
            medical_history.pregnant = medical_data["pregnant"]
        if "notes" in medical_data:
            medical_history.notes = medical_data["notes"]
        
        medical_history.updated_at = datetime.now()
        
        # Handle conditions update if provided
        if "conditions" in medical_data and isinstance(medical_data["conditions"], list):
            # Get existing conditions
            existing_conditions = self.db.query(MedicalCondition).filter(
                MedicalCondition.medical_history_id == medical_history.id
            ).all()
            
            # Create a lookup of existing conditions by name
            existing_by_name = {c.name.lower(): c for c in existing_conditions}
            
            # Process each condition in the update
            for condition in medical_data["conditions"]:
                condition_name = condition["name"].lower()
                
                if condition_name in existing_by_name:
                    # Update existing condition
                    existing_condition = existing_by_name[condition_name]
                    
                    if "severity" in condition:
                        existing_condition.severity = condition["severity"]
                    if "is_controlled" in condition:
                        existing_condition.is_controlled = condition["is_controlled"]
                    if "last_episode" in condition:
                        existing_condition.last_episode = condition["last_episode"]
                    if "notes" in condition:
                        existing_condition.notes = condition["notes"]
                    if "dental_considerations" in condition:
                        existing_condition.dental_considerations = condition["dental_considerations"]
                else:
                    # Create new condition
                    new_condition = MedicalCondition(
                        id=str(uuid.uuid4()),
                        medical_history_id=medical_history.id,
                        name=condition["name"],
                        icd_code=condition.get("icd_code"),
                        severity=condition.get("severity", "moderate"),
                        is_controlled=condition.get("is_controlled", False),
                        last_episode=condition.get("last_episode"),
                        diagnosis_date=condition.get("diagnosis_date"),
                        notes=condition.get("notes", ""),
                        dental_considerations=condition.get("dental_considerations", [])
                    )
                    self.db.add(new_condition)
        
        # Re-evaluate ASA classification
        asa_class = self._evaluate_asa_classification({"medical_history": medical_data})
        
        # Update ASA classification
        history_status = self.db.query(MedicalHistoryStatus).filter(
            MedicalHistoryStatus.patient_id == patient_id,
            MedicalHistoryStatus.status == "current"
        ).first()
        
        if history_status:
            history_status.asa_classification = asa_class
            history_status.last_reviewed = datetime.now()
        else:
            # Create new status if not exists
            history_status = MedicalHistoryStatus(
                id=str(uuid.uuid4()),
                patient_id=patient_id,
                asa_classification=asa_class,
                last_reviewed=datetime.now(),
                status="current"
            )
            self.db.add(history_status)
        
        # Commit changes
        self.db.commit()
        return medical_history
    
    async def get_patient_medical_profile(self, patient_id: str) -> Dict[str, Any]:
        """
        Get complete medical profile for a patient, including history,
        allergies, medications, and alerts
        
        Args:
            patient_id: ID of the patient
            
        Returns:
            Dictionary with complete medical profile
        """
        # Get medical history
        medical_history = self.db.query(MedicalHistory).filter(
            MedicalHistory.patient_id == patient_id
        ).first()
        
        # Get medical conditions
        conditions = []
        if medical_history:
            conditions = self.db.query(MedicalCondition).filter(
                MedicalCondition.medical_history_id == medical_history.id
            ).all()
        
        # Get allergies
        allergies = self.db.query(Allergy).filter(
            Allergy.patient_id == patient_id
        ).all()
        
        # Get medications
        medications = self.db.query(Medication).filter(
            Medication.patient_id == patient_id
        ).all()
        
        # Get ASA classification
        history_status = self.db.query(MedicalHistoryStatus).filter(
            MedicalHistoryStatus.patient_id == patient_id,
            MedicalHistoryStatus.status == "current"
        ).first()
        
        # Generate alerts
        alerts = await self.generate_medical_alerts(patient_id)
        
        # Compile medical profile
        medical_profile = {
            "patient_id": patient_id,
            "medical_history": medical_history.__dict__ if medical_history else None,
            "conditions": [condition.__dict__ for condition in conditions],
            "allergies": [allergy.__dict__ for allergy in allergies],
            "medications": [medication.__dict__ for medication in medications],
            "asa_classification": history_status.asa_classification.value if history_status else None,
            "last_reviewed": history_status.last_reviewed if history_status else None,
            "alerts": alerts
        }
        
        return medical_profile 