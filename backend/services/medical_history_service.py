from typing import List, Optional, Dict
from datetime import datetime
from backend.models.medical_history import (
    MedicalHistoryRequest,
    RiskAssessment,
    ASAClassification,
    MedicalCondition,
    Medication,
    TestResult
)

class MedicalHistoryService:
    @staticmethod
    def evaluate_medical_history(request: MedicalHistoryRequest) -> RiskAssessment:
        """
        Evaluate medical history and generate risk assessment
        """
        asa_class = MedicalHistoryService._determine_asa_classification(
            request.conditions,
            request.medications,
            request.bloodwork
        )
        
        risk_factors = MedicalHistoryService._identify_risk_factors(
            request.conditions,
            request.medications,
            request.bloodwork
        )
        
        medication_interactions = MedicalHistoryService._check_medication_interactions(
            request.medications
        )
        
        bloodwork_concerns = MedicalHistoryService._analyze_bloodwork(
            request.bloodwork
        )
        
        epinephrine_risk, max_epi_dose = MedicalHistoryService._assess_epinephrine_risk(
            request.conditions,
            request.medications
        )
        
        requires_clearance = MedicalHistoryService._check_medical_clearance_requirement(
            asa_class,
            request.conditions,
            request.medications,
            bloodwork_concerns
        )
        
        treatment_mods = MedicalHistoryService._determine_treatment_modifications(
            request.conditions,
            request.medications,
            bloodwork_concerns
        )
        
        recommendations = MedicalHistoryService._generate_recommendations(
            asa_class,
            risk_factors,
            medication_interactions,
            bloodwork_concerns,
            epinephrine_risk
        )

        # Calculate risk level
        risk_level = "high"
        if asa_class in [ASAClassification.ASA_III, ASAClassification.ASA_IV]:
            risk_level = "high"
        elif asa_class == ASAClassification.ASA_II:
            risk_level = "medium"
        else:
            risk_level = "low"

        # Generate reasoning
        reasoning = []
        if risk_factors:
            reasoning.append(f"Risk factors: {', '.join(risk_factors)}")
        if medication_interactions:
            reasoning.append(f"Medication interactions: {', '.join(medication_interactions)}")
        if bloodwork_concerns:
            reasoning.append(f"Bloodwork concerns: {', '.join(bloodwork_concerns)}")

        # Collect concerns
        concerns = []
        if epinephrine_risk == "red":
            concerns.append("epinephrine_warning")
        if any("bleeding" in r.lower() for r in risk_factors):
            concerns.append("bleeding_risk")
        if any("infection" in r.lower() for r in risk_factors):
            concerns.append("infection_risk")
        if bloodwork_concerns:
            concerns.append("lab_concerns")

        return RiskAssessment(
            patient_id=request.patient_id,
            risk_level=risk_level,
            asa_classification=asa_class,
            risk_factors=risk_factors,
            medication_interactions=medication_interactions,
            bloodwork_concerns=bloodwork_concerns,
            epinephrine_risk=epinephrine_risk,
            max_epinephrine_dose=max_epi_dose,
            requires_medical_clearance=requires_clearance,
            treatment_modifications=treatment_mods,
            recommendations=recommendations,
            reasoning="\n".join(reasoning) if reasoning else None,
            concerns=concerns
        )

    @staticmethod
    def _determine_asa_classification(
        conditions: List[MedicalCondition],
        medications: List[Medication],
        bloodwork: List[TestResult]
    ) -> ASAClassification:
        """
        Determine ASA classification based on medical conditions, medications, and bloodwork
        """
        # Start with ASA I (healthy patient) as default
        asa_class = ASAClassification.ASA_I
        
        # Check for severe conditions
        severe_conditions = [c for c in conditions if c.severity == "severe"]
        if severe_conditions:
            if any(not c.is_controlled for c in severe_conditions):
                return ASAClassification.ASA_IV
            return ASAClassification.ASA_III
        
        # Check for multiple conditions
        if len(conditions) >= 3:
            return ASAClassification.ASA_III
            
        # Check for multiple moderate/severe conditions
        moderate_severe_conditions = [c for c in conditions if c.severity in ["moderate", "severe"]]
        if len(moderate_severe_conditions) >= 2:
            return ASAClassification.ASA_III
        
        # Check for moderate conditions
        moderate_conditions = [c for c in conditions if c.severity == "moderate"]
        if moderate_conditions:
            if any(not c.is_controlled for c in moderate_conditions):
                return ASAClassification.ASA_III
            return ASAClassification.ASA_II
            
        # Check medications
        high_risk_drug_classes = {
            "anticoagulant",
            "immunosuppressant",
            "chemotherapy",
            "antipsychotic",
            "antiarrhythmic"
        }
        
        if any(m.drug_class.lower() in high_risk_drug_classes for m in medications):
            return ASAClassification.ASA_III
            
        # Check bloodwork abnormalities
        significant_abnormalities = [
            b for b in bloodwork 
            if b.is_abnormal and b.clinical_significance == "severe"
        ]
        
        if significant_abnormalities:
            return ASAClassification.ASA_III
            
        # If patient has any mild conditions or non-high-risk medications
        if conditions or medications:
            asa_class = ASAClassification.ASA_II
            
        return asa_class

    @staticmethod
    def _identify_risk_factors(
        conditions: List[MedicalCondition],
        medications: List[Medication],
        bloodwork: List[TestResult]
    ) -> List[str]:
        """
        Identify risk factors based on medical conditions, medications, and bloodwork
        """
        risk_factors = []
        
        # Check conditions
        for condition in conditions:
            if not condition.is_controlled:
                risk_factors.append(f"Uncontrolled {condition.name}")
            elif condition.severity == "severe":
                risk_factors.append(f"Severe {condition.name}")
                
        # Check medications
        high_risk_meds = {
            "anticoagulant": "Bleeding risk",
            "immunosuppressant": "Infection risk",
            "chemotherapy": "Immunocompromised",
            "antipsychotic": "Drug interaction risk",
            "antiarrhythmic": "Cardiac risk"
        }
        
        for med in medications:
            if med.drug_class.lower() in high_risk_meds:
                risk_factors.append(high_risk_meds[med.drug_class.lower()])
                
        # Check bloodwork
        for test in bloodwork:
            if test.is_abnormal and test.clinical_significance:
                risk_factors.append(f"Abnormal {test.test_name}: {test.clinical_significance}")
                
        return list(set(risk_factors))  # Remove duplicates

    @staticmethod
    def _check_medication_interactions(medications: List[Medication]) -> List[str]:
        """
        Check for potential medication interactions
        """
        interactions = []
        
        # Define high-risk medication combinations
        high_risk_combinations = [
            ("anticoagulant", "nsaid"),
            ("anticoagulant", "antiplatelet"),
            ("nsaid", "corticosteroid"),
            ("bisphosphonate", "antiresorptive")
        ]
        
        med_classes = [m.drug_class.lower() for m in medications]
        
        for combo in high_risk_combinations:
            if combo[0] in med_classes and combo[1] in med_classes:
                interactions.append(f"Potential interaction between {combo[0]} and {combo[1]}")
                
        return interactions

    @staticmethod
    def _analyze_bloodwork(bloodwork: List[TestResult]) -> List[str]:
        """
        Analyze bloodwork results for concerns
        """
        concerns = []
        
        for test in bloodwork:
            if test.is_abnormal:
                if test.clinical_significance == "severe":
                    concerns.append(f"Critical {test.test_name} abnormality")
                elif test.clinical_significance == "moderate":
                    concerns.append(f"Significant {test.test_name} abnormality")
                else:
                    concerns.append(f"Mild {test.test_name} abnormality")
                    
        return concerns

    @staticmethod
    def _assess_epinephrine_risk(
        conditions: List[MedicalCondition],
        medications: List[Medication]
    ) -> tuple[str, Optional[float]]:
        """
        Assess epinephrine risk and determine maximum dose
        """
        # Default values
        risk_level = "green"
        max_dose = 0.04  # mg per carpule
        
        # Conditions that affect epinephrine use
        high_risk_conditions = {
            "hypertension",
            "heart disease",
            "hyperthyroidism",
            "pheochromocytoma"
        }
        
        # Medications that affect epinephrine use
        high_risk_medications = {
            "beta blocker",
            "alpha blocker",
            "antiarrhythmic",
            "tricyclic antidepressant"
        }
        
        # Check conditions
        for condition in conditions:
            if condition.name.lower() in high_risk_conditions:
                if condition.severity == "severe":
                    return "red", 0.0
                elif condition.severity == "moderate":
                    risk_level = "yellow"
                    max_dose = 0.02
                    
        # Check medications
        for med in medications:
            if med.drug_class.lower() in high_risk_medications:
                if risk_level != "red":
                    risk_level = "yellow"
                    max_dose = 0.02
                    
        return risk_level, max_dose

    @staticmethod
    def _check_medical_clearance_requirement(
        asa_class: ASAClassification,
        conditions: List[MedicalCondition],
        medications: List[Medication],
        bloodwork_concerns: List[str]
    ) -> bool:
        """
        Determine if medical clearance is required
        """
        if asa_class in [ASAClassification.ASA_III, ASAClassification.ASA_IV]:
            return True
            
        # Check for uncontrolled conditions
        if any(not c.is_controlled for c in conditions):
            return True
            
        # Check for high-risk medications
        high_risk_meds = {"anticoagulant", "immunosuppressant", "chemotherapy"}
        if any(m.drug_class.lower() in high_risk_meds for m in medications):
            return True
            
        # Check for critical bloodwork abnormalities
        if any("Critical" in concern for concern in bloodwork_concerns):
            return True
            
        return False

    @staticmethod
    def _determine_treatment_modifications(
        conditions: List[MedicalCondition],
        medications: List[Medication],
        bloodwork_concerns: List[str]
    ) -> List[str]:
        """
        Determine necessary treatment modifications
        """
        modifications = []
        
        # Check conditions requiring modifications
        for condition in conditions:
            if condition.dental_considerations:
                modifications.extend(condition.dental_considerations)
                
        # Check medications requiring modifications
        for med in medications:
            if med.dental_considerations:
                modifications.extend(med.dental_considerations)
                
        # Add modifications based on bloodwork
        if bloodwork_concerns:
            modifications.append("Monitor vital signs during treatment")
            if any("Critical" in concern for concern in bloodwork_concerns):
                modifications.append("Consider hospital-based treatment")
                
        return list(set(modifications))  # Remove duplicates

    @staticmethod
    def _generate_recommendations(
        asa_class: ASAClassification,
        risk_factors: List[str],
        medication_interactions: List[str],
        bloodwork_concerns: List[str],
        epinephrine_risk: str
    ) -> List[str]:
        """
        Generate treatment recommendations
        """
        recommendations = []
        
        # ASA class specific recommendations
        if asa_class in [ASAClassification.ASA_III, ASAClassification.ASA_IV]:
            recommendations.extend([
                "Obtain medical clearance before treatment",
                "Consider hospital-based treatment",
                "Monitor vital signs throughout procedure"
            ])
            
        # Risk factor recommendations
        if "Bleeding risk" in risk_factors:
            recommendations.extend([
                "Obtain recent INR/PT results",
                "Have hemostatic agents available",
                "Consider suturing all surgical sites"
            ])
            
        if "Infection risk" in risk_factors:
            recommendations.extend([
                "Prophylactic antibiotics may be required",
                "Use strict aseptic technique",
                "Monitor for post-operative infection"
            ])
            
        # Medication interaction recommendations
        if medication_interactions:
            recommendations.append("Review medication timing with patient's physician")
            
        # Epinephrine recommendations
        if epinephrine_risk == "red":
            recommendations.append("Avoid epinephrine use")
        elif epinephrine_risk == "yellow":
            recommendations.append("Use reduced epinephrine concentration")
            
        return recommendations 