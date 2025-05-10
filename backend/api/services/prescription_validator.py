from typing import List, Dict, Any, Optional
from ..schemas.prescription import ValidationWarning

class PrescriptionValidator:
    """
    Service for validating prescriptions for safety issues
    """
    
    def __init__(self):
        """
        Initialize the validator
        """
        # These would typically be loaded from a database
        self.medication_allergies = {
            "patient-123": ["penicillin", "sulfa"]
        }
        
        self.patient_conditions = {
            "patient-123": ["hypertension", "diabetes", "anticoagulant-therapy"]
        }
        
        self.medication_interactions = {
            "Amoxicillin": ["Warfarin", "Allopurinol", "Probenecid"],
            "Ibuprofen": ["Warfarin", "Lithium", "Methotrexate", "ACE inhibitors"],
            "Ciprofloxacin": ["Warfarin", "Theophylline", "Antacids", "Iron supplements"]
        }
        
        self.allergy_groups = {
            "penicillin": ["Amoxicillin", "Ampicillin", "Penicillin V"]
        }
        
        self.current_medications = {
            "patient-123": ["Warfarin", "Metformin", "Lisinopril"]
        }
        
        self.medication_contraindications = {
            "Amoxicillin": ["penicillin-allergy"],
            "Ibuprofen": ["gastric-ulcer", "renal-impairment", "anticoagulant-therapy"],
            "Ciprofloxacin": ["pregnancy", "tendon-disorders"]
        }
        
        self.patient_age_constraints = {
            "patient-123": 45  # Age in years
        }
        
        self.medication_age_restrictions = {
            "Ciprofloxacin": {"min_age": 18}
        }
        
        self.pregnancy_status = {
            "patient-123": False
        }
        
        self.pregnancy_risk_categories = {
            "Amoxicillin": "B",  # Generally safe during pregnancy
            "Ibuprofen": "D",    # Unsafe in 3rd trimester
            "Ciprofloxacin": "C" # Use only if benefits outweigh risks
        }
    
    def validate_prescription(self, prescription: Dict[str, Any]) -> List[ValidationWarning]:
        """
        Validate a prescription for safety issues
        
        Args:
            prescription: The prescription to validate
            
        Returns:
            A list of validation warnings
        """
        warnings = []
        
        patient_id = prescription["patient_id"]
        
        # Check for allergies
        warnings.extend(self._check_allergies(patient_id, prescription["items"]))
        
        # Check for drug interactions
        warnings.extend(self._check_drug_interactions(patient_id, prescription["items"]))
        
        # Check for contraindications
        warnings.extend(self._check_contraindications(patient_id, prescription["items"]))
        
        # Check for age restrictions
        warnings.extend(self._check_age_restrictions(patient_id, prescription["items"]))
        
        # Check for pregnancy risks
        warnings.extend(self._check_pregnancy_risks(patient_id, prescription["items"]))
        
        return warnings
    
    def _check_allergies(self, patient_id: str, items: List[Dict[str, Any]]) -> List[ValidationWarning]:
        """
        Check for allergies to medications
        """
        warnings = []
        
        # Get patient allergies
        patient_allergies = self.medication_allergies.get(patient_id, [])
        
        for item in items:
            medication_name = item["medication_name"]
            
            # Check direct allergies
            if medication_name.lower() in [a.lower() for a in patient_allergies]:
                warnings.append(ValidationWarning(
                    message=f"Patient has a documented allergy to {medication_name}",
                    critical=True
                ))
                continue
            
            # Check allergy groups
            for allergy_group, medications in self.allergy_groups.items():
                if allergy_group in patient_allergies and medication_name in medications:
                    warnings.append(ValidationWarning(
                        message=f"Patient has a documented allergy to {allergy_group}. {medication_name} may cause an allergic reaction.",
                        critical=True
                    ))
        
        return warnings
    
    def _check_drug_interactions(self, patient_id: str, items: List[Dict[str, Any]]) -> List[ValidationWarning]:
        """
        Check for interactions with current medications
        """
        warnings = []
        
        # Get patient current medications
        current_medications = self.current_medications.get(patient_id, [])
        
        # Check interactions between prescribed medications and current medications
        for item in items:
            medication_name = item["medication_name"]
            interacting_medications = self.medication_interactions.get(medication_name, [])
            
            for current_med in current_medications:
                if current_med in interacting_medications:
                    warnings.append(ValidationWarning(
                        message=f"Patient is currently taking {current_med}, which may interact with {medication_name}.",
                        critical=False  # Most interactions require monitoring rather than avoiding completely
                    ))
        
        # Check interactions between prescribed medications
        prescribed_medications = [item["medication_name"] for item in items]
        for i, med1 in enumerate(prescribed_medications):
            for med2 in prescribed_medications[i+1:]:
                if med2 in self.medication_interactions.get(med1, []):
                    warnings.append(ValidationWarning(
                        message=f"{med1} may interact with {med2}, both of which are being prescribed.",
                        critical=False
                    ))
        
        return warnings
    
    def _check_contraindications(self, patient_id: str, items: List[Dict[str, Any]]) -> List[ValidationWarning]:
        """
        Check for contraindications based on patient conditions
        """
        warnings = []
        
        # Get patient conditions
        patient_conditions = self.patient_conditions.get(patient_id, [])
        
        for item in items:
            medication_name = item["medication_name"]
            contraindications = self.medication_contraindications.get(medication_name, [])
            
            for condition in patient_conditions:
                if condition in contraindications:
                    warnings.append(ValidationWarning(
                        message=f"Patient has {condition}, which is a contraindication for {medication_name}.",
                        critical=True
                    ))
        
        return warnings
    
    def _check_age_restrictions(self, patient_id: str, items: List[Dict[str, Any]]) -> List[ValidationWarning]:
        """
        Check for age-related restrictions
        """
        warnings = []
        
        # Get patient age
        patient_age = self.patient_age_constraints.get(patient_id)
        
        if patient_age is None:
            return warnings  # Cannot check without age
        
        for item in items:
            medication_name = item["medication_name"]
            age_restrictions = self.medication_age_restrictions.get(medication_name, {})
            
            min_age = age_restrictions.get("min_age")
            max_age = age_restrictions.get("max_age")
            
            if min_age and patient_age < min_age:
                warnings.append(ValidationWarning(
                    message=f"{medication_name} is not recommended for patients under {min_age} years of age.",
                    critical=True
                ))
            
            if max_age and patient_age > max_age:
                warnings.append(ValidationWarning(
                    message=f"{medication_name} is not recommended for patients over {max_age} years of age.",
                    critical=True
                ))
        
        return warnings
    
    def _check_pregnancy_risks(self, patient_id: str, items: List[Dict[str, Any]]) -> List[ValidationWarning]:
        """
        Check for pregnancy-related risks
        """
        warnings = []
        
        # Get pregnancy status
        is_pregnant = self.pregnancy_status.get(patient_id, False)
        
        if not is_pregnant:
            return warnings  # No need to check if not pregnant
        
        for item in items:
            medication_name = item["medication_name"]
            risk_category = self.pregnancy_risk_categories.get(medication_name)
            
            if not risk_category:
                continue
            
            if risk_category in ["D", "X"]:
                warnings.append(ValidationWarning(
                    message=f"{medication_name} is category {risk_category} and may pose risks during pregnancy.",
                    critical=True
                ))
            elif risk_category == "C":
                warnings.append(ValidationWarning(
                    message=f"{medication_name} is category {risk_category} and should be used with caution during pregnancy.",
                    critical=False
                ))
        
        return warnings 