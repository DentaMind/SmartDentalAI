from typing import Dict, Any, List, Optional
import logging
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PerioStageAAP(Enum):
    STAGE_I = "Stage I"
    STAGE_II = "Stage II"
    STAGE_III = "Stage III"
    STAGE_IV = "Stage IV"

class PerioClassicType(Enum):
    CHRONIC = "Chronic periodontitis"
    AGGRESSIVE = "Aggressive periodontitis"
    LOCALIZED = "Localized"
    GENERALIZED = "Generalized"

class PerioClassicSeverity(Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"

class CariesRisk(Enum):
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"

class UrgencyLevel(Enum):
    ROUTINE = "Routine follow-up"
    MODERATE = "Schedule within 2 weeks"
    URGENT = "Immediate attention required"

class ClinicalStaging:
    def __init__(self):
        """Initialize clinical staging engine"""
        logger.info("Initialized clinical staging engine")

    def calculate_periodontal_stage_aap(self, findings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate periodontal stage based on 2018 AAP/EFP Guidelines
        """
        max_bone_loss = 0
        vertical_defects = False
        furcation_involvement = False
        tooth_loss = False
        affected_teeth = set()

        for finding in findings:
            if finding.get("type") == "bone_loss":
                measurements = finding.get("measurements", {})
                location = finding.get("location", "")
                
                # Track affected teeth
                if location:
                    affected_teeth.add(location)
                
                # Calculate bone loss percentage
                bone_level = measurements.get("bone_level", 0)
                if isinstance(bone_level, str):
                    try:
                        bone_level = float(bone_level.replace("mm", ""))
                    except ValueError:
                        bone_level = 0
                
                # Estimate percentage based on typical root length (13mm average)
                bone_loss_percentage = (bone_level / 13.0) * 100
                max_bone_loss = max(max_bone_loss, bone_loss_percentage)
                
                # Check pattern
                pattern = measurements.get("pattern", "").lower()
                if "vertical" in pattern:
                    vertical_defects = True
                if "furcation" in pattern:
                    furcation_involvement = True

            # Check for tooth loss due to periodontitis
            if finding.get("type") == "missing_tooth" and finding.get("cause") == "periodontitis":
                tooth_loss = True

        # Determine stage based on criteria
        stage = PerioStageAAP.STAGE_I
        if max_bone_loss <= 15:
            stage = PerioStageAAP.STAGE_I
        elif max_bone_loss <= 33:
            stage = PerioStageAAP.STAGE_II
        else:
            # Stage III/IV differentiation
            if tooth_loss or furcation_involvement:
                stage = PerioStageAAP.STAGE_IV
            else:
                stage = PerioStageAAP.STAGE_III

        return {
            "stage": stage.value,
            "bone_loss_percentage": round(max_bone_loss, 1),
            "has_vertical_defects": vertical_defects,
            "has_furcation_involvement": furcation_involvement,
            "has_tooth_loss": tooth_loss,
            "affected_teeth_count": len(affected_teeth)
        }

    def calculate_periodontal_stage_classic(self, findings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate periodontal classification based on pre-2017 system
        """
        max_bone_loss = 0
        affected_teeth = set()
        rapid_progression = False
        age_factor = False

        for finding in findings:
            if finding.get("type") == "bone_loss":
                measurements = finding.get("measurements", {})
                location = finding.get("location", "")
                
                # Track affected teeth
                if location:
                    affected_teeth.add(location)
                
                # Calculate bone loss
                bone_level = measurements.get("bone_level", 0)
                if isinstance(bone_level, str):
                    try:
                        bone_level = float(bone_level.replace("mm", ""))
                    except ValueError:
                        bone_level = 0
                
                bone_loss_percentage = (bone_level / 13.0) * 100
                max_bone_loss = max(max_bone_loss, bone_loss_percentage)
                
                # Check for rapid progression indicators
                if measurements.get("progression_rate", "").lower() == "rapid":
                    rapid_progression = True

            # Age factor (if available)
            patient_age = finding.get("patient_age", 35)
            if patient_age < 35:
                age_factor = True

        # Determine type and severity
        perio_type = PerioClassicType.CHRONIC
        if rapid_progression or age_factor:
            perio_type = PerioClassicType.AGGRESSIVE

        # Determine extent
        extent = PerioClassicType.LOCALIZED
        if len(affected_teeth) > 8:  # More than 30% of sites
            extent = PerioClassicType.GENERALIZED

        # Determine severity
        if max_bone_loss <= 15:
            severity = PerioClassicSeverity.MILD
        elif max_bone_loss <= 33:
            severity = PerioClassicSeverity.MODERATE
        else:
            severity = PerioClassicSeverity.SEVERE

        classification = f"{extent.value} {perio_type.value} – {severity.value}"

        return {
            "classification": classification,
            "type": perio_type.value,
            "extent": extent.value,
            "severity": severity.value,
            "bone_loss_percentage": round(max_bone_loss, 1),
            "affected_teeth_count": len(affected_teeth),
            "rapid_progression": rapid_progression
        }

    def calculate_caries_risk(self, findings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate caries risk level based on number and severity of lesions
        """
        caries_count = 0
        severe_caries = 0
        near_pulp = 0
        recurrent_caries = 0

        for finding in findings:
            if finding.get("type") == "caries":
                caries_count += 1
                severity = finding.get("severity", "").lower()
                
                if severity == "severe":
                    severe_caries += 1
                
                # Check proximity to pulp
                if "pulp" in finding.get("location", "").lower():
                    near_pulp += 1
                
                # Check if recurrent
                if finding.get("recurrent", False):
                    recurrent_caries += 1

        # Determine risk level
        risk_level = CariesRisk.LOW
        if caries_count > 3 or severe_caries > 0 or near_pulp > 0:
            risk_level = CariesRisk.HIGH
        elif caries_count > 1 or recurrent_caries > 0:
            risk_level = CariesRisk.MODERATE

        return {
            "risk_level": risk_level.value,
            "total_lesions": caries_count,
            "severe_lesions": severe_caries,
            "near_pulp": near_pulp,
            "recurrent_lesions": recurrent_caries
        }

    def determine_urgency(self, 
                         perio_assessment_aap: Dict[str, Any],
                         perio_assessment_classic: Dict[str, Any], 
                         caries_assessment: Dict[str, Any]) -> UrgencyLevel:
        """Determine overall urgency level based on all findings"""
        
        # High urgency indicators
        if (perio_assessment_aap["stage"] in [PerioStageAAP.STAGE_III.value, PerioStageAAP.STAGE_IV.value] or
            perio_assessment_classic["severity"] == PerioClassicSeverity.SEVERE.value or
            caries_assessment["near_pulp"] > 0):
            return UrgencyLevel.URGENT
            
        # Moderate urgency indicators
        if (perio_assessment_aap["stage"] == PerioStageAAP.STAGE_II.value or
            perio_assessment_classic["severity"] == PerioClassicSeverity.MODERATE.value or
            caries_assessment["risk_level"] == CariesRisk.HIGH.value):
            return UrgencyLevel.MODERATE
            
        return UrgencyLevel.ROUTINE

    def generate_recommendations(self,
                               perio_assessment_aap: Dict[str, Any],
                               perio_assessment_classic: Dict[str, Any],
                               caries_assessment: Dict[str, Any]) -> List[str]:
        """Generate clinical recommendations based on findings"""
        recommendations = []
        
        # Periodontal recommendations (using AAP staging for decisions)
        if perio_assessment_aap["stage"] in [PerioStageAAP.STAGE_III.value, PerioStageAAP.STAGE_IV.value]:
            recommendations.extend([
                "Immediate periodontal evaluation required",
                "Consider referral to periodontist",
                "Full mouth radiographic series recommended"
            ])
        elif perio_assessment_aap["stage"] == PerioStageAAP.STAGE_II.value:
            recommendations.extend([
                "Schedule comprehensive periodontal examination",
                "Evaluate for scaling and root planing"
            ])
        
        # Additional recommendations based on classic classification
        if "aggressive" in perio_assessment_classic["type"].lower():
            recommendations.extend([
                "Consider genetic testing",
                "Evaluate family history",
                "More frequent maintenance recommended"
            ])
        
        # Caries recommendations
        if caries_assessment["risk_level"] == CariesRisk.HIGH.value:
            recommendations.extend([
                "Immediate restorative intervention needed",
                "Consider caries activity testing",
                "Review oral hygiene and dietary habits"
            ])
        elif caries_assessment["risk_level"] == CariesRisk.MODERATE.value:
            recommendations.extend([
                "Schedule restorative treatment",
                "Consider fluoride treatment"
            ])

        return recommendations

    def generate_overall_assessment(self, diagnosis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate comprehensive clinical assessment including both staging systems
        """
        try:
            findings = diagnosis.get("findings", [])
            
            # Calculate individual assessments
            perio_assessment_aap = self.calculate_periodontal_stage_aap(findings)
            perio_assessment_classic = self.calculate_periodontal_stage_classic(findings)
            caries_assessment = self.calculate_caries_risk(findings)
            
            # Determine urgency
            urgency = self.determine_urgency(
                perio_assessment_aap,
                perio_assessment_classic,
                caries_assessment
            )
            
            # Generate recommendations
            recommendations = self.generate_recommendations(
                perio_assessment_aap,
                perio_assessment_classic,
                caries_assessment
            )
            
            return {
                "periodontal_status_aap": f"{perio_assessment_aap['stage']} periodontitis (AAP 2018)",
                "periodontal_details_aap": {
                    "bone_loss_percentage": perio_assessment_aap["bone_loss_percentage"],
                    "vertical_defects": perio_assessment_aap["has_vertical_defects"],
                    "furcation_involvement": perio_assessment_aap["has_furcation_involvement"],
                    "affected_teeth": perio_assessment_aap["affected_teeth_count"]
                },
                "periodontal_status_classic": perio_assessment_classic["classification"],
                "periodontal_details_classic": {
                    "type": perio_assessment_classic["type"],
                    "extent": perio_assessment_classic["extent"],
                    "severity": perio_assessment_classic["severity"],
                    "rapid_progression": perio_assessment_classic["rapid_progression"]
                },
                "caries_risk": caries_assessment["risk_level"],
                "caries_details": {
                    "total_lesions": caries_assessment["total_lesions"],
                    "severe_lesions": caries_assessment["severe_lesions"],
                    "near_pulp": caries_assessment["near_pulp"]
                },
                "urgency_level": urgency.value,
                "recommendations": recommendations
            }
            
        except Exception as e:
            logger.error(f"Error generating clinical assessment: {str(e)}")
            return {
                "error": f"Failed to generate clinical assessment: {str(e)}",
                "periodontal_status_aap": "Unable to determine",
                "periodontal_status_classic": "Unable to determine",
                "caries_risk": "Unable to determine",
                "urgency_level": UrgencyLevel.ROUTINE.value,
                "recommendations": ["Please review findings manually"]
            } 