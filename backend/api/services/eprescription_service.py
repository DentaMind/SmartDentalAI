import logging
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional, Any, Tuple
import uuid

from sqlalchemy.orm import Session

from ..models.patient import Patient
from ..models.medical_history import MedicalHistory, Medication
from ..models.prescription import Prescription, PrescriptionItem, PrescriptionStatus

logger = logging.getLogger(__name__)

class EPrescriptionService:
    """Service to handle electronic prescriptions"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def create_prescription(
        self, 
        patient_id: str, 
        provider_id: str,
        treatment_plan_id: Optional[str] = None,
        items: List[Dict[str, Any]] = None,
        notes: Optional[str] = None
    ) -> Prescription:
        """
        Create a new prescription with optional items.
        Returns the created prescription.
        """
        # Verify patient exists
        patient = self.db.query(Patient).filter(
            Patient.id == patient_id
        ).first()
        
        if not patient:
            raise ValueError(f"Patient {patient_id} not found")
        
        # Get medical history and current medications for drug interaction check
        medical_history = self.db.query(MedicalHistory).filter(
            MedicalHistory.patient_id == patient_id
        ).first()
        
        current_medications = self.db.query(Medication).filter(
            Medication.patient_id == patient_id
        ).all()
        
        # Create the prescription
        prescription = Prescription(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            provider_id=provider_id,
            treatment_plan_id=treatment_plan_id,
            prescription_date=datetime.now(),
            status=PrescriptionStatus.PENDING,
            notes=notes,
            created_at=datetime.now()
        )
        
        self.db.add(prescription)
        self.db.commit()
        self.db.refresh(prescription)
        
        # Add prescription items
        if items:
            for item_data in items:
                # Check for interactions before adding
                interactions = self._check_medication_interactions(
                    item_data.get("medication_name"),
                    current_medications,
                    medical_history
                )
                
                if interactions:
                    # If interactions found, add them to item notes
                    item_notes = item_data.get("notes", "")
                    interaction_notes = "CAUTION: Potential interactions: " + ", ".join(interactions)
                    if item_notes:
                        item_notes = item_notes + "\n" + interaction_notes
                    else:
                        item_notes = interaction_notes
                    
                    item_data["notes"] = item_notes
                
                # Create the prescription item
                item = PrescriptionItem(
                    id=str(uuid.uuid4()),
                    prescription_id=prescription.id,
                    medication_name=item_data.get("medication_name"),
                    dosage=item_data.get("dosage"),
                    form=item_data.get("form", "tablet"),
                    route=item_data.get("route", "oral"),
                    frequency=item_data.get("frequency"),
                    quantity=item_data.get("quantity"),
                    days_supply=item_data.get("days_supply"),
                    refills=item_data.get("refills", 0),
                    dispense_as_written=item_data.get("dispense_as_written", False),
                    notes=item_data.get("notes"),
                    created_at=datetime.now()
                )
                
                self.db.add(item)
        
        self.db.commit()
        logger.info(f"Created prescription {prescription.id} for patient {patient_id}")
        
        return prescription
    
    async def update_prescription_status(
        self, 
        prescription_id: str, 
        status: str,
        notes: Optional[str] = None
    ) -> Prescription:
        """
        Update the status of a prescription.
        Returns the updated prescription.
        """
        prescription = self.db.query(Prescription).filter(
            Prescription.id == prescription_id
        ).first()
        
        if not prescription:
            raise ValueError(f"Prescription {prescription_id} not found")
        
        prescription.status = status
        
        if notes:
            if prescription.notes:
                prescription.notes += f"\n{notes}"
            else:
                prescription.notes = notes
        
        prescription.updated_at = datetime.now()
        
        if status == PrescriptionStatus.SENT:
            prescription.sent_date = datetime.now()
        elif status == PrescriptionStatus.FILLED:
            prescription.filled_date = datetime.now()
        
        self.db.commit()
        logger.info(f"Updated prescription {prescription_id} status to {status}")
        
        return prescription
    
    async def get_patient_prescriptions(
        self, 
        patient_id: str,
        include_items: bool = True,
        active_only: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Get prescriptions for a patient.
        Returns a list of prescriptions with items if requested.
        """
        query = self.db.query(Prescription).filter(
            Prescription.patient_id == patient_id
        )
        
        if active_only:
            query = query.filter(
                Prescription.status.in_([
                    PrescriptionStatus.PENDING,
                    PrescriptionStatus.APPROVED,
                    PrescriptionStatus.SENT
                ])
            )
        
        prescriptions = query.order_by(Prescription.prescription_date.desc()).all()
        
        result = []
        for prescription in prescriptions:
            prescription_data = {
                "id": prescription.id,
                "patient_id": prescription.patient_id,
                "provider_id": prescription.provider_id,
                "treatment_plan_id": prescription.treatment_plan_id,
                "prescription_date": prescription.prescription_date,
                "status": prescription.status,
                "notes": prescription.notes,
                "sent_date": prescription.sent_date,
                "filled_date": prescription.filled_date,
                "created_at": prescription.created_at,
                "updated_at": prescription.updated_at
            }
            
            if include_items:
                items = self.db.query(PrescriptionItem).filter(
                    PrescriptionItem.prescription_id == prescription.id
                ).all()
                
                prescription_data["items"] = [
                    {
                        "id": item.id,
                        "medication_name": item.medication_name,
                        "dosage": item.dosage,
                        "form": item.form,
                        "route": item.route,
                        "frequency": item.frequency,
                        "quantity": item.quantity,
                        "days_supply": item.days_supply,
                        "refills": item.refills,
                        "dispense_as_written": item.dispense_as_written,
                        "notes": item.notes
                    }
                    for item in items
                ]
            
            result.append(prescription_data)
        
        return result
    
    async def generate_prescriptions_from_treatment_plan(
        self, 
        treatment_plan_id: str,
        provider_id: str
    ) -> List[Prescription]:
        """
        Generate prescriptions based on a treatment plan.
        Returns a list of created prescriptions.
        """
        from ..models.treatment_plan import TreatmentPlan, TreatmentProcedure
        
        # Get the treatment plan
        treatment_plan = self.db.query(TreatmentPlan).filter(
            TreatmentPlan.id == treatment_plan_id
        ).first()
        
        if not treatment_plan:
            raise ValueError(f"Treatment plan {treatment_plan_id} not found")
        
        # Get patient information
        patient_id = treatment_plan.patient_id
        patient = self.db.query(Patient).filter(
            Patient.id == patient_id
        ).first()
        
        if not patient:
            raise ValueError(f"Patient {patient_id} not found")
        
        # Get patient medical history
        medical_history = self.db.query(MedicalHistory).filter(
            MedicalHistory.patient_id == patient_id
        ).first()
        
        # Get treatment procedures
        procedures = self.db.query(TreatmentProcedure).filter(
            TreatmentProcedure.treatment_plan_id == treatment_plan_id
        ).all()
        
        if not procedures:
            logger.info(f"No procedures found in treatment plan {treatment_plan_id}")
            return []
        
        # Determine required medications based on procedures
        required_medications = self._determine_required_medications(
            procedures, 
            medical_history
        )
        
        # Group medications by type/purpose
        medication_groups = self._group_medications_by_purpose(required_medications)
        
        # Create prescriptions for each group
        prescriptions = []
        
        for purpose, medications in medication_groups.items():
            if not medications:
                continue
            
            prescription = await self.create_prescription(
                patient_id=patient_id,
                provider_id=provider_id,
                treatment_plan_id=treatment_plan_id,
                items=medications,
                notes=f"Automatically generated for {purpose} based on treatment plan"
            )
            
            prescriptions.append(prescription)
        
        logger.info(f"Generated {len(prescriptions)} prescriptions for treatment plan {treatment_plan_id}")
        return prescriptions
    
    def _check_medication_interactions(
        self, 
        medication_name: str,
        current_medications: List[Medication],
        medical_history: Optional[MedicalHistory]
    ) -> List[str]:
        """
        Check for potential interactions between a medication and a patient's
        current medications and medical conditions.
        Returns a list of potential interactions.
        """
        interactions = []
        
        # Simplified interaction check - in a real implementation, 
        # this would use a drug interaction API or database
        
        # Common medication classes and interactions
        anticoagulants = ["warfarin", "coumadin", "xarelto", "eliquis", "pradaxa"]
        nsaids = ["ibuprofen", "advil", "motrin", "naproxen", "aleve", "aspirin"]
        antibiotics = ["amoxicillin", "azithromycin", "clindamycin", "penicillin"]
        steroids = ["prednisone", "dexamethasone", "methylprednisolone"]
        opioids = ["hydrocodone", "oxycodone", "codeine", "tramadol"]
        
        # Check against current medications
        med_lower = medication_name.lower()
        
        for current_med in current_medications:
            current_med_lower = current_med.name.lower()
            
            # NSAID and anticoagulant interaction
            if (any(drug in med_lower for drug in nsaids) and 
                any(drug in current_med_lower for drug in anticoagulants)):
                interactions.append("NSAID + Anticoagulant: Increased bleeding risk")
            
            # Opioid interactions
            if (any(drug in med_lower for drug in opioids) and 
                any(drug in current_med_lower for drug in opioids)):
                interactions.append("Multiple opioids: Increased respiratory depression risk")
        
        # Check against medical conditions
        if medical_history:
            conditions = [c.lower() for c in medical_history.conditions]
            allergies = [a.lower() for a in medical_history.allergies]
            
            # Check for allergy to the medication
            for allergy in allergies:
                if allergy in med_lower:
                    interactions.append(f"ALLERGY to {allergy}")
            
            # Check for condition-specific contraindications
            if "liver disease" in " ".join(conditions):
                if any(drug in med_lower for drug in ["acetaminophen", "tylenol"]):
                    interactions.append("Liver disease: Acetaminophen cautioned")
            
            if "kidney disease" in " ".join(conditions):
                if any(drug in med_lower for drug in nsaids):
                    interactions.append("Kidney disease: NSAID cautioned")
            
            if "diabetes" in " ".join(conditions):
                if any(drug in med_lower for drug in steroids):
                    interactions.append("Diabetes: Steroids may increase blood glucose")
        
        return interactions
    
    def _determine_required_medications(
        self, 
        procedures: List[TreatmentProcedure],
        medical_history: Optional[MedicalHistory]
    ) -> List[Dict[str, Any]]:
        """
        Determine required medications based on planned procedures.
        Returns a list of medication details.
        """
        required_medications = []
        
        # Check for procedures that commonly require pain management
        pain_procedures = [
            "extraction", "surgical", "root canal", "implant", "periodontal"
        ]
        
        # Check for procedures that commonly require antibiotics
        infection_risk_procedures = [
            "extraction", "implant", "root canal", "periodontal", "abscess"
        ]
        
        needs_pain_management = False
        needs_antibiotics = False
        
        # Determine medication needs based on procedures
        for procedure in procedures:
            proc_name = procedure.procedure_name.lower()
            
            # Check if procedure requires pain management
            if any(p in proc_name for p in pain_procedures):
                needs_pain_management = True
            
            # Check if procedure has infection risk
            if any(p in proc_name for p in infection_risk_procedures):
                needs_antibiotics = True
        
        # Add pain medications if needed
        if needs_pain_management:
            # Default to NSAIDs unless contraindicated
            if medical_history and "NSAID" in " ".join(medical_history.allergies):
                # Use acetaminophen as alternative
                required_medications.append({
                    "medication_name": "Acetaminophen",
                    "dosage": "500mg",
                    "form": "tablet",
                    "route": "oral",
                    "frequency": "Every 6 hours as needed for pain",
                    "quantity": 20,
                    "days_supply": 5,
                    "refills": 0,
                    "notes": "Take with food. Do not exceed 3000mg in 24 hours."
                })
            else:
                # Use ibuprofen as first choice
                required_medications.append({
                    "medication_name": "Ibuprofen",
                    "dosage": "600mg",
                    "form": "tablet",
                    "route": "oral",
                    "frequency": "Every 6 hours as needed for pain",
                    "quantity": 20,
                    "days_supply": 5,
                    "refills": 0,
                    "notes": "Take with food or milk to reduce stomach upset."
                })
            
            # For more severe pain, consider adding an opioid
            severe_pain_procedures = [
                "surgical extraction", "implant", "wisdom", "molar root canal"
            ]
            
            if any(any(p in proc.procedure_name.lower() for p in severe_pain_procedures) for proc in procedures):
                required_medications.append({
                    "medication_name": "Hydrocodone/Acetaminophen",
                    "dosage": "5/325mg",
                    "form": "tablet",
                    "route": "oral",
                    "frequency": "Every 4-6 hours as needed for severe pain",
                    "quantity": 12,
                    "days_supply": 3,
                    "refills": 0,
                    "notes": "Take only as needed for severe pain not relieved by ibuprofen. May cause drowsiness."
                })
        
        # Add antibiotics if needed
        if needs_antibiotics:
            # Default to amoxicillin unless contraindicated
            if medical_history and "penicillin" in " ".join(medical_history.allergies):
                # Use clindamycin as alternative
                required_medications.append({
                    "medication_name": "Clindamycin",
                    "dosage": "300mg",
                    "form": "capsule",
                    "route": "oral",
                    "frequency": "Every 6 hours",
                    "quantity": 28,
                    "days_supply": 7,
                    "refills": 0,
                    "notes": "Take with a full glass of water. Complete entire prescription."
                })
            else:
                # Use amoxicillin as first choice
                required_medications.append({
                    "medication_name": "Amoxicillin",
                    "dosage": "500mg",
                    "form": "capsule",
                    "route": "oral",
                    "frequency": "Every 8 hours",
                    "quantity": 21,
                    "days_supply": 7,
                    "refills": 0,
                    "notes": "Take until all medication is finished, even if you feel better."
                })
        
        # Add special medications for specific procedures
        for procedure in procedures:
            # For periodontal procedures, consider chlorhexidine rinse
            if "periodontal" in procedure.procedure_name.lower():
                required_medications.append({
                    "medication_name": "Chlorhexidine Gluconate",
                    "dosage": "0.12%",
                    "form": "oral rinse",
                    "route": "oral",
                    "frequency": "Rinse twice daily for 30 seconds",
                    "quantity": 1,
                    "days_supply": 14,
                    "refills": 0,
                    "notes": "Rinse after brushing and flossing. May cause temporary staining."
                })
        
        return required_medications
    
    def _group_medications_by_purpose(
        self, 
        medications: List[Dict[str, Any]]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Group medications by their purpose/type.
        Returns a dictionary of medication groups.
        """
        groups = {
            "pain management": [],
            "infection prevention": [],
            "other": []
        }
        
        # Pain medications
        pain_meds = ["ibuprofen", "acetaminophen", "naproxen", "hydrocodone", "oxycodone", "codeine"]
        
        # Antibiotics
        antibiotics = ["amoxicillin", "clindamycin", "azithromycin", "penicillin", "metronidazole"]
        
        # Group medications
        for medication in medications:
            med_name = medication["medication_name"].lower()
            
            if any(pain in med_name for pain in pain_meds):
                groups["pain management"].append(medication)
            elif any(abx in med_name for abx in antibiotics):
                groups["infection prevention"].append(medication)
            else:
                groups["other"].append(medication)
        
        return groups
    
    async def validate_prescription_safety(
        self,
        prescription_id: str
    ) -> Tuple[bool, List[str]]:
        """
        Perform a comprehensive safety check on a prescription before sending.
        Validates against patient health conditions, age, pregnancy status, and current medications.
        
        Returns a tuple of (is_safe, warnings) where warnings is a list of safety concerns.
        """
        prescription = self.db.query(Prescription).filter(
            Prescription.id == prescription_id
        ).first()
        
        if not prescription:
            raise ValueError(f"Prescription {prescription_id} not found")
        
        # Get prescription items
        items = self.db.query(PrescriptionItem).filter(
            PrescriptionItem.prescription_id == prescription_id
        ).all()
        
        if not items:
            return True, ["Prescription contains no medications"]
        
        # Get patient details
        patient = self.db.query(Patient).filter(
            Patient.id == prescription.patient_id
        ).first()
        
        if not patient:
            return False, ["Patient not found"]
        
        # Get medical history
        medical_history = self.db.query(MedicalHistory).filter(
            MedicalHistory.patient_id == patient.id
        ).first()
        
        # Get current medications
        current_medications = self.db.query(Medication).filter(
            Medication.patient_id == patient.id
        ).all()
        
        warnings = []
        
        # Calculate patient age
        patient_age = None
        if patient.date_of_birth:
            today = date.today()
            patient_age = today.year - patient.date_of_birth.year
            if (today.month, today.day) < (patient.date_of_birth.month, patient.date_of_birth.day):
                patient_age -= 1
        
        # Check each medication in the prescription
        for item in items:
            # Check interactions with other prescribed medications
            for other_item in items:
                if item.id != other_item.id:
                    interaction = self._check_medication_interaction(
                        item.medication_name,
                        other_item.medication_name
                    )
                    if interaction:
                        warnings.append(f"Interaction between {item.medication_name} and {other_item.medication_name}: {interaction}")
            
            # Check against current medications
            for current_med in current_medications:
                interaction = self._check_medication_interaction(
                    item.medication_name,
                    current_med.name
                )
                if interaction:
                    warnings.append(f"Interaction with current medication {current_med.name}: {interaction}")
            
            # Check medical conditions
            if medical_history:
                # Check allergies
                for allergy in medical_history.allergies:
                    if allergy.lower() in item.medication_name.lower():
                        warnings.append(f"CRITICAL: Patient has allergy to {allergy}")
                
                # Check pregnancy
                if medical_history.pregnancy_status:
                    pregnancy_risk = self._check_pregnancy_risk(item.medication_name)
                    if pregnancy_risk:
                        warnings.append(f"Pregnancy Risk: {item.medication_name} - {pregnancy_risk}")
                
                # Check medical conditions
                for condition in medical_history.conditions:
                    condition_risk = self._check_condition_contraindication(
                        condition,
                        item.medication_name
                    )
                    if condition_risk:
                        warnings.append(f"Medical Condition Risk: {condition} - {condition_risk}")
            
            # Check age-specific concerns
            if patient_age is not None:
                age_concern = self._check_age_contraindication(
                    patient_age,
                    item.medication_name
                )
                if age_concern:
                    warnings.append(f"Age-Related Concern: {age_concern}")
        
        # Determine if prescription is safe to send
        critical_warnings = [w for w in warnings if "CRITICAL" in w]
        is_safe = len(critical_warnings) == 0
        
        return is_safe, warnings
    
    async def approve_and_send_prescription(
        self,
        prescription_id: str,
        provider_id: str,
        override_warnings: bool = False
    ) -> Dict[str, Any]:
        """
        Approve and send a prescription after validation.
        Performs safety checks and only sends if prescription is safe or warnings are overridden.
        """
        # Validate prescription safety
        is_safe, warnings = await self.validate_prescription_safety(prescription_id)
        
        # Get prescription
        prescription = self.db.query(Prescription).filter(
            Prescription.id == prescription_id
        ).first()
        
        if not prescription:
            raise ValueError(f"Prescription {prescription_id} not found")
        
        # If not safe and not overriding, return warnings
        if not is_safe and not override_warnings:
            return {
                "status": "warnings",
                "message": "Prescription has critical safety concerns",
                "warnings": warnings,
                "prescription_id": prescription_id
            }
        
        # Update prescription status
        prescription.status = PrescriptionStatus.APPROVED
        prescription.approved_by = provider_id
        prescription.approved_at = datetime.now()
        
        # Add warnings to notes if any exist
        if warnings:
            warning_notes = "Safety Warnings:\n" + "\n".join(warnings)
            if override_warnings:
                warning_notes += "\n\nWARNINGS OVERRIDDEN BY PROVIDER"
            
            if prescription.notes:
                prescription.notes += f"\n\n{warning_notes}"
            else:
                prescription.notes = warning_notes
        
        self.db.commit()
        
        # Send prescription (in real implementation, this would connect to e-prescribing network)
        # For demo purposes, just update status to sent
        prescription.status = PrescriptionStatus.SENT
        prescription.sent_date = datetime.now()
        self.db.commit()
        
        logger.info(f"Prescription {prescription_id} approved and sent by provider {provider_id}")
        
        return {
            "status": "success",
            "message": "Prescription approved and sent",
            "prescription_id": prescription_id,
            "warnings": warnings,
            "warnings_overridden": override_warnings and len(warnings) > 0
        }
    
    def _check_medication_interaction(
        self,
        medication1: str,
        medication2: str
    ) -> Optional[str]:
        """Check for interactions between two medications"""
        med1_lower = medication1.lower()
        med2_lower = medication2.lower()
        
        # Simplified interaction database
        interactions = {
            # NSAIDs and anticoagulants
            ("ibuprofen", "warfarin"): "Increased bleeding risk",
            ("ibuprofen", "xarelto"): "Increased bleeding risk",
            ("ibuprofen", "eliquis"): "Increased bleeding risk",
            ("naproxen", "warfarin"): "Increased bleeding risk",
            ("naproxen", "xarelto"): "Increased bleeding risk",
            ("aspirin", "warfarin"): "Increased bleeding risk",
            
            # Opioid combinations
            ("hydrocodone", "oxycodone"): "CRITICAL: Multiple opioids increase respiratory depression risk",
            ("hydrocodone", "tramadol"): "Multiple opioids increase respiratory depression risk",
            ("oxycodone", "tramadol"): "Multiple opioids increase respiratory depression risk",
            
            # Antibiotic interactions
            ("amoxicillin", "birth control"): "May reduce contraceptive effectiveness",
            ("erythromycin", "simvastatin"): "Increased risk of myopathy and rhabdomyolysis",
            
            # Other common interactions
            ("acetaminophen", "alcohol"): "Increased risk of liver damage",
            ("metronidazole", "alcohol"): "CRITICAL: Can cause severe reaction (disulfiram-like)",
            ("ciprofloxacin", "calcium"): "Reduced antibiotic absorption"
        }
        
        # Check for direct matches
        for (med_a, med_b), warning in interactions.items():
            if (med_a in med1_lower and med_b in med2_lower) or (med_a in med2_lower and med_b in med1_lower):
                return warning
        
        # Check for category-based interactions
        categories = {
            "nsaid": ["ibuprofen", "naproxen", "aspirin", "motrin", "advil", "aleve"],
            "anticoagulant": ["warfarin", "coumadin", "xarelto", "eliquis", "pradaxa"],
            "opioid": ["hydrocodone", "oxycodone", "codeine", "tramadol", "vicodin", "percocet"],
            "benzodiazepine": ["diazepam", "alprazolam", "lorazepam", "xanax", "valium", "ativan"]
        }
        
        # Category interaction rules
        category_interactions = {
            ("nsaid", "anticoagulant"): "Increased bleeding risk",
            ("opioid", "opioid"): "CRITICAL: Multiple opioids increase respiratory depression risk",
            ("opioid", "benzodiazepine"): "CRITICAL: Increased risk of severe sedation and respiratory depression"
        }
        
        # Check if medications fall into interacting categories
        med1_categories = [cat for cat, meds in categories.items() if any(med in med1_lower for med in meds)]
        med2_categories = [cat for cat, meds in categories.items() if any(med in med2_lower for med in meds)]
        
        for cat1 in med1_categories:
            for cat2 in med2_categories:
                if (cat1, cat2) in category_interactions:
                    return category_interactions[(cat1, cat2)]
                elif (cat2, cat1) in category_interactions:
                    return category_interactions[(cat2, cat1)]
        
        return None
    
    def _check_pregnancy_risk(self, medication_name: str) -> Optional[str]:
        """Check for pregnancy-related risks with a medication"""
        med_lower = medication_name.lower()
        
        # FDA pregnancy categories (simplified)
        category_d_meds = [
            "hydrocodone", "oxycodone", "tramadol",  # Opioids
            "diazepam", "alprazolam", "lorazepam",   # Benzodiazepines
            "warfarin", "xarelto", "eliquis",        # Anticoagulants
            "lisinopril", "enalapril",               # ACE inhibitors
            "valproic", "phenytoin",                 # Anticonvulsants
            "tetracycline", "doxycycline",           # Tetracycline antibiotics
            "ciprofloxacin", "levofloxacin"          # Fluoroquinolones
        ]
        
        category_x_meds = [
            "isotretinoin", "accutane",              # Acne treatment
            "methotrexate",                          # Immunosuppressant
            "statins", "atorvastatin", "simvastatin" # Cholesterol medications
        ]
        
        # Check for category X medications (contraindicated in pregnancy)
        if any(med in med_lower for med in category_x_meds):
            return "CRITICAL: Contraindicated in pregnancy (Category X)"
        
        # Check for category D medications (positive evidence of risk)
        if any(med in med_lower for med in category_d_meds):
            return "Positive evidence of risk in pregnancy (Category D)"
        
        # Other medication-specific warnings
        if "ibuprofen" in med_lower or "naproxen" in med_lower:
            return "Avoid in third trimester - risk of premature closure of ductus arteriosus"
        
        return None
    
    def _check_condition_contraindication(
        self,
        condition: str,
        medication_name: str
    ) -> Optional[str]:
        """Check for contraindications between a medical condition and medication"""
        condition_lower = condition.lower()
        med_lower = medication_name.lower()
        
        # Common condition-medication contraindications
        contraindications = {
            # Liver disease
            ("liver disease", "acetaminophen"): "Use with caution - risk of hepatotoxicity",
            ("liver disease", "tylenol"): "Use with caution - risk of hepatotoxicity",
            ("cirrhosis", "acetaminophen"): "Use with caution - risk of hepatotoxicity",
            
            # Kidney disease
            ("kidney disease", "ibuprofen"): "May worsen kidney function",
            ("kidney disease", "naproxen"): "May worsen kidney function",
            ("renal failure", "ibuprofen"): "CRITICAL: Contraindicated in severe renal impairment",
            
            # Ulcers/GI conditions
            ("ulcer", "ibuprofen"): "Increased risk of GI bleeding",
            ("ulcer", "naproxen"): "Increased risk of GI bleeding",
            ("ulcer", "aspirin"): "Increased risk of GI bleeding",
            ("gastritis", "ibuprofen"): "May worsen gastric irritation",
            
            # Cardiovascular
            ("heart failure", "ibuprofen"): "May worsen heart failure through fluid retention",
            ("hypertension", "ibuprofen"): "May increase blood pressure",
            
            # Respiratory
            ("asthma", "ibuprofen"): "Risk of bronchospasm in aspirin-sensitive asthma",
            ("copd", "opioid"): "Risk of respiratory depression",
            
            # Diabetes
            ("diabetes", "prednisone"): "Will increase blood glucose",
            
            # Bleeding disorders
            ("bleeding disorder", "ibuprofen"): "CRITICAL: Increased bleeding risk",
            ("bleeding disorder", "aspirin"): "CRITICAL: Increased bleeding risk",
            
            # Mental health
            ("depression", "opioid"): "May worsen depression",
            
            # Infection specific
            ("viral infection", "aspirin"): "Avoid in children/teens - risk of Reye's syndrome"
        }
        
        # Check direct condition-medication pairs
        for (cond, med), warning in contraindications.items():
            if cond in condition_lower and med in med_lower:
                return warning
        
        # Category-based checks
        if "opioid" in med_lower or any(med in med_lower for med in ["hydrocodone", "oxycodone", "codeine", "tramadol"]):
            if any(cond in condition_lower for cond in ["sleep apnea", "respiratory", "copd"]):
                return "CRITICAL: Risk of respiratory depression"
        
        return None
    
    def _check_age_contraindication(
        self,
        age: int,
        medication_name: str
    ) -> Optional[str]:
        """Check for age-related contraindications with a medication"""
        med_lower = medication_name.lower()
        
        # Pediatric concerns (under 18)
        if age < 18:
            if "aspirin" in med_lower:
                return "CRITICAL: Aspirin not recommended in children/adolescents due to risk of Reye's syndrome"
            
            if any(med in med_lower for med in ["ibuprofen", "acetaminophen"]):
                return f"Use pediatric dosing for patients under 18 (current age: {age})"
            
            if any(med in med_lower for med in ["hydrocodone", "oxycodone", "codeine"]):
                return f"CRITICAL: Opioids generally not recommended for patients under 18 (current age: {age})"
            
            if "tetracycline" in med_lower or "doxycycline" in med_lower:
                return "May cause permanent tooth discoloration in children under 8"
        
        # Geriatric concerns (over 65)
        if age > 65:
            if any(med in med_lower for med in ["hydrocodone", "oxycodone", "codeine", "tramadol"]):
                return f"Use reduced dosing for elderly patients (current age: {age}) - increased risk of side effects"
            
            if any(med in med_lower for med in ["diazepam", "alprazolam", "lorazepam"]):
                return f"Benzodiazepines should be used with caution in elderly (current age: {age}) - increased risk of falls"
            
            if any(med in med_lower for med in ["diphenhydramine", "benadryl"]):
                return "Anticholinergics may cause confusion in elderly patients"
            
            if "nsaid" in med_lower or any(med in med_lower for med in ["ibuprofen", "naproxen", "meloxicam"]):
                return "NSAIDs in elderly patients (>65) have increased risk of GI bleeding and renal effects"
        
        return None


# Function to get a service instance
def get_eprescription_service(db: Session) -> EPrescriptionService:
    """Get an e-prescription service instance"""
    return EPrescriptionService(db) 