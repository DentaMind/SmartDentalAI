from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from ..models.medical_history import (
    MedicalHistory,
    RiskAssessment,
    ASAClassification,
    Medication,
    BloodworkValue,
    MedicalCondition,
    MedicalHistoryRequest
)
import logging

logger = logging.getLogger(__name__)

class RiskAssessmentService:
    def __init__(self):
        self.epinephrine_limits = {
            ASAClassification.ASA_I: 0.2,  # mg
            ASAClassification.ASA_II: 0.1,
            ASAClassification.ASA_III: 0.04,
            ASAClassification.ASA_IV: 0.02,
            ASAClassification.ASA_V: 0.0
        }
        
        self.bloodwork_reference_ranges = {
            "INR": (0.8, 1.2),
            "aPTT": (25, 35),
            "Platelets": (150000, 450000),
            "WBC": (4000, 11000),
            "Hemoglobin": (12, 16),
            "Hematocrit": (36, 46),
            "Glucose": (70, 140),
            "Creatinine": (0.6, 1.2)
        }

        self.severity_scores = {
            "mild": 1,
            "moderate": 2,
            "severe": 3
        }

    def evaluate_medical_history(self, medical_history: MedicalHistoryRequest) -> RiskAssessment:
        try:
            # Calculate risk score based on conditions
            risk_factors = []
            recommendations = []
            medication_interactions = []
            bloodwork_concerns = []

            # Evaluate conditions
            if medical_history.conditions:
                for condition in medical_history.conditions:
                    severity_score = self.severity_scores.get(condition.severity.lower(), 0)
                    if severity_score >= 2:
                        risk_factors.append(f"High severity {condition.name}")
                        recommendations.append(f"Consult with primary physician about {condition.name}")
                    elif severity_score == 1:
                        risk_factors.append(f"Mild {condition.name}")
                        recommendations.append(f"Monitor {condition.name}")

            # Evaluate medications
            medication_interactions = self.check_medications(medical_history)
            if medication_interactions:
                risk_factors.extend(medication_interactions)
                recommendations.extend([f"Review {interaction}" for interaction in medication_interactions])

            # Evaluate bloodwork
            if medical_history.bloodwork:
                bloodwork_concerns = self._evaluate_bloodwork(medical_history.bloodwork)
                if bloodwork_concerns:
                    risk_factors.extend(bloodwork_concerns)
                    recommendations.extend([f"Address {concern}" for concern in bloodwork_concerns])

            # Check dental history
            if medical_history.dental_history:
                last_cleaning = medical_history.dental_history.last_cleaning
                if last_cleaning:
                    if datetime.now() - last_cleaning > timedelta(days=365):
                        risk_factors.append("Overdue for cleaning")
                        recommendations.append("Schedule professional cleaning")

            # Determine ASA classification
            asa_class = self.get_asa_classification(medical_history)

            # Determine epinephrine risk
            epinephrine_risk = "green"
            if not self.check_epinephrine_safety(medical_history):
                epinephrine_risk = "red"
            elif asa_class in [ASAClassification.ASA_III, ASAClassification.ASA_IV]:
                epinephrine_risk = "yellow"

            # Check if medical clearance is required
            requires_medical_clearance = (
                asa_class in [ASAClassification.ASA_III, ASAClassification.ASA_IV] or
                len(bloodwork_concerns) > 0 or
                len(medication_interactions) > 0
            )

            # Generate treatment modifications
            treatment_modifications = []
            if requires_medical_clearance:
                treatment_modifications.append("Obtain medical clearance before treatment")
            if epinephrine_risk == "red":
                treatment_modifications.append("Avoid epinephrine")
            elif epinephrine_risk == "yellow":
                treatment_modifications.append("Use reduced epinephrine dose")

            return RiskAssessment(
                patient_id=medical_history.patient_id,
                asa_classification=asa_class,
                risk_factors=risk_factors,
                medication_interactions=medication_interactions,
                bloodwork_concerns=bloodwork_concerns,
                epinephrine_risk=epinephrine_risk,
                max_epinephrine_dose=self.epinephrine_limits.get(asa_class, 0.0),
                requires_medical_clearance=requires_medical_clearance,
                treatment_modifications=treatment_modifications,
                recommendations=recommendations,
                timestamp=datetime.now()
            )
        except Exception as e:
            logger.error(f"Error evaluating medical history: {str(e)}")
            raise

    def check_epinephrine_safety(self, history: MedicalHistoryRequest) -> Dict[str, Any]:
        contraindications = [
            "heart disease",
            "hypertension",
            "hyperthyroidism",
            "beta blockers"
        ]
        
        concerns = []
        for condition in history.conditions:
            for c in contraindications:
                if c.lower() in condition.name.lower():
                    concerns.append(f"Contraindicated due to {condition.name}")
        
        for med in history.medications:
            if "beta blocker" in med.drug_class.lower():
                concerns.append("Contraindicated due to beta blocker medication")
        
        is_safe = len(concerns) == 0
        asa_class = self.get_asa_classification(history)
        max_dose = self.epinephrine_limits.get(asa_class, 0.0)
        
        return {
            "is_safe": is_safe,
            "concerns": concerns,
            "max_dose": max_dose,
            "risk_level": "red" if not is_safe else "yellow" if asa_class in [ASAClassification.ASA_III, ASAClassification.ASA_IV] else "green",
            "recommendations": ["Avoid epinephrine due to medical conditions or medications"] if not is_safe else []
        }

    def get_asa_classification(self, history: MedicalHistoryRequest) -> ASAClassification:
        try:
            if not history.conditions and not history.medications:
                return ASAClassification.ASA_I
            
            # Convert severity strings to numeric scores
            max_severity = 0
            uncontrolled_conditions = False
            multiple_conditions = len(history.conditions) > 1
            has_anticoagulants = any("anticoagulant" in med.drug_class.lower() for med in history.medications)
            has_immunosuppressants = any("immunosuppressant" in med.drug_class.lower() for med in history.medications)
            
            for condition in history.conditions:
                severity_score = self.severity_scores.get(condition.severity.lower(), 0)
                max_severity = max(max_severity, severity_score)
                if not condition.is_controlled:
                    uncontrolled_conditions = True
            
            # Check bloodwork abnormalities
            has_abnormal_bloodwork = any(test.is_abnormal for test in history.bloodwork) if history.bloodwork else False
            
            # Determine ASA classification
            if max_severity >= 3 and uncontrolled_conditions:
                return ASAClassification.ASA_IV
            elif max_severity >= 3 or (max_severity >= 2 and (uncontrolled_conditions or multiple_conditions)):
                return ASAClassification.ASA_III
            elif max_severity >= 2 or has_anticoagulants or has_immunosuppressants or has_abnormal_bloodwork:
                return ASAClassification.ASA_II
            elif max_severity >= 1:
                return ASAClassification.ASA_II
            
            return ASAClassification.ASA_I
        except Exception as e:
            logger.error(f"Error determining ASA classification: {str(e)}")
            raise

    def get_asa_reasoning(self, history: MedicalHistoryRequest, classification: ASAClassification) -> str:
        if classification == ASAClassification.ASA_I:
            return "Healthy patient with no systemic diseases"
        elif classification == ASAClassification.ASA_II:
            conditions = [c.name for c in history.conditions if c.severity.lower() == "mild"]
            return f"Mild systemic disease(s): {', '.join(conditions)}"
        elif classification == ASAClassification.ASA_III:
            conditions = [c.name for c in history.conditions if c.severity.lower() == "severe"]
            return f"Severe systemic disease(s): {', '.join(conditions)}"
        elif classification == ASAClassification.ASA_IV:
            conditions = [c.name for c in history.conditions if c.severity.lower() == "severe" and not c.is_controlled]
            return f"Severe uncontrolled systemic disease(s): {', '.join(conditions)}"
        return "Unable to determine ASA classification reasoning"

    def check_medications(self, history: MedicalHistoryRequest) -> List[str]:
        concerns = []
        for med in history.medications:
            if "anticoagulant" in med.drug_class.lower():
                concerns.append("Patient on anticoagulation therapy - bleeding risk")
            if "immunosuppressant" in med.drug_class.lower():
                concerns.append("Patient on immunosuppressants - antibiotic prophylaxis required")
            if "bisphosphonate" in med.drug_class.lower():
                concerns.append("Patient on bisphosphonates - risk of osteonecrosis")
        return concerns

    def _evaluate_bloodwork(self, bloodwork: List[BloodworkValue]) -> List[str]:
        try:
            concerns = []
            for test in bloodwork:
                if test.is_abnormal:
                    concerns.append(f"Abnormal {test.test_name}: {test.value} {test.unit}")
            return concerns
        except Exception as e:
            logger.error(f"Error analyzing bloodwork: {str(e)}")
            raise

    def _calculate_risk_level(self, history: MedicalHistoryRequest) -> str:
        try:
            max_severity = max([c.severity for c in history.conditions], default=0)
            if max_severity >= 8:
                return "red"
            elif max_severity >= 5:
                return "yellow"
            return "green"
        except Exception as e:
            logger.error(f"Error calculating risk level: {str(e)}")
            raise

    def _generate_recommendations(self, history: MedicalHistoryRequest) -> List[str]:
        try:
            recommendations = []
            
            # Check conditions
            for condition in history.conditions:
                if condition.severity >= 7:
                    recommendations.append(f"Medical clearance required for {condition.name}")
                elif condition.severity >= 4:
                    recommendations.append(f"Monitor {condition.name} during treatment")

            # Check medications
            for med in history.medications:
                if "anticoagulant" in med.name.lower():
                    recommendations.append("Consider INR testing before invasive procedures")
                if "immunosuppressant" in med.name.lower():
                    recommendations.append("Antibiotic prophylaxis required")
                if "bisphosphonate" in med.name.lower():
                    recommendations.append("Careful extraction protocol required")

            return recommendations
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            raise

    def _analyze_bloodwork(self, bloodwork: List[BloodworkValue]) -> List[str]:
        try:
            concerns = []
            for test in bloodwork:
                if test.value < test.reference_range[0]:
                    concerns.append(f"Low {test.test_name}: {test.value} {test.unit} (ref: {test.reference_range[0]}-{test.reference_range[1]})")
                elif test.value > test.reference_range[1]:
                    concerns.append(f"High {test.test_name}: {test.value} {test.unit} (ref: {test.reference_range[0]}-{test.reference_range[1]})")
            return concerns
        except Exception as e:
            logger.error(f"Error analyzing bloodwork: {str(e)}")
            raise

    def _determine_asa_classification(self, history: MedicalHistoryRequest) -> ASAClassification:
        """Determine ASA classification based on medical conditions and severity"""
        if not history.conditions:
            return ASAClassification.ASA_I
            
        severe_conditions = sum(1 for c in history.conditions if c.severity == "severe")
        moderate_conditions = sum(1 for c in history.conditions if c.severity == "moderate")
        
        if severe_conditions > 0:
            return ASAClassification.ASA_III
        elif moderate_conditions > 0:
            return ASAClassification.ASA_II
        else:
            return ASAClassification.ASA_I

    def _evaluate_medications(self, medications: List[Medication]) -> List[str]:
        """Evaluate medications for dental treatment considerations"""
        interactions = []
        
        for med in medications:
            if not med.is_active:
                continue
                
            # Check for anticoagulants
            if med.drug_class.lower() in ["anticoagulant", "antiplatelet"]:
                interactions.append(f"Anticoagulant therapy: {med.name}")
                
            # Check for immunosuppressants
            if med.drug_class.lower() in ["immunosuppressant", "corticosteroid"]:
                interactions.append(f"Immunosuppression: {med.name}")
                
            # Add any specific dental considerations
            interactions.extend(med.dental_considerations)
            
        return interactions

    def _evaluate_bloodwork(self, bloodwork: List[BloodworkValue]) -> List[str]:
        """Evaluate bloodwork results for abnormalities"""
        concerns = []
        
        for test in bloodwork:
            if test.is_abnormal:
                concerns.append(f"Abnormal {test.test_name}: {test.value} {test.unit}")
                
            # Check against reference ranges
            if test.test_name in self.bloodwork_reference_ranges:
                min_val, max_val = self.bloodwork_reference_ranges[test.test_name]
                if test.value < min_val or test.value > max_val:
                    concerns.append(
                        f"{test.test_name} outside reference range: "
                        f"{test.value} {test.unit} (range: {min_val}-{max_val})"
                    )
                    
        return concerns

    def _determine_epinephrine_risk(
        self,
        asa_class: ASAClassification,
        medications: List[Medication],
        conditions: List[MedicalCondition]
    ) -> str:
        """Determine epinephrine risk level (green, yellow, red)"""
        # Check for contraindicated conditions
        contraindicated_conditions = [
            "uncontrolled hypertension",
            "unstable angina",
            "recent myocardial infarction",
            "uncontrolled arrhythmia"
        ]
        
        for condition in conditions:
            if condition.name.lower() in contraindicated_conditions and not condition.is_controlled:
                return "red"
                
        # Check for beta blockers
        for med in medications:
            if med.drug_class.lower() == "beta blocker" and med.is_active:
                return "yellow"
                
        # Check ASA class
        if asa_class in [ASAClassification.ASA_III, ASAClassification.ASA_IV]:
            return "yellow"
            
        return "green"

    def _requires_medical_clearance(
        self,
        asa_class: ASAClassification,
        conditions: List[MedicalCondition],
        bloodwork_concerns: List[str],
        med_interactions: List[str]
    ) -> bool:
        """Determine if medical clearance is required"""
        # ASA III or higher always requires clearance
        if asa_class in [ASAClassification.ASA_III, ASAClassification.ASA_IV]:
            return True
            
        # Uncontrolled conditions require clearance
        for condition in conditions:
            if not condition.is_controlled and condition.severity in ["moderate", "severe"]:
                return True
                
        # Significant bloodwork abnormalities require clearance
        if bloodwork_concerns:
            return True
            
        # Certain medication interactions require clearance
        critical_meds = ["anticoagulant", "immunosuppressant", "corticosteroid"]
        for interaction in med_interactions:
            if any(med in interaction.lower() for med in critical_meds):
                return True
                
        return False

    def _generate_treatment_modifications(
        self,
        asa_class: ASAClassification,
        conditions: List[MedicalCondition],
        med_interactions: List[str],
        bloodwork_concerns: List[str]
    ) -> List[str]:
        """Generate treatment modifications based on risk factors"""
        modifications = []
        
        # ASA class modifications
        if asa_class in [ASAClassification.ASA_III, ASAClassification.ASA_IV]:
            modifications.append("Consider shorter appointments")
            modifications.append("Monitor vital signs throughout procedure")
            
        # Condition-specific modifications
        for condition in conditions:
            if condition.dental_considerations:
                modifications.extend(condition.dental_considerations)
                
        # Medication-specific modifications
        for interaction in med_interactions:
            if "anticoagulant" in interaction.lower():
                modifications.append("Consider INR check before invasive procedures")
            if "immunosuppressant" in interaction.lower():
                modifications.append("Consider antibiotic prophylaxis")
                
        # Bloodwork modifications
        if any("INR" in concern for concern in bloodwork_concerns):
            modifications.append("Verify INR before invasive procedures")
        if any("Platelets" in concern for concern in bloodwork_concerns):
            modifications.append("Consider platelet count before invasive procedures")
            
        return modifications

    def _get_severity_score(self, severity: str) -> int:
        """Convert severity string to numeric score"""
        severity_map = {
            "mild": 1,
            "moderate": 2,
            "severe": 3,
            "life_threatening": 4
        }
        return severity_map.get(severity.lower(), 0)

    def _get_asa_classification(self, risk_score: int) -> ASAClassification:
        """Map risk score to ASA classification"""
        if risk_score <= 0:
            return ASAClassification.ASA_I
        elif risk_score <= 2:
            return ASAClassification.ASA_II
        elif risk_score <= 4:
            return ASAClassification.ASA_III
        elif risk_score <= 6:
            return ASAClassification.ASA_IV
        else:
            return ASAClassification.ASA_V 