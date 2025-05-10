import unittest
from models.staging import ClinicalStaging, PerioStageAAP, PerioClassicType, PerioClassicSeverity, CariesRisk, UrgencyLevel

class TestClinicalStaging(unittest.TestCase):
    def setUp(self):
        self.staging = ClinicalStaging()

    def test_aap_staging_thresholds(self):
        """Test AAP 2018 staging thresholds for bone loss"""
        # Stage I: ≤15% bone loss
        findings_stage1 = [{"type": "bone_loss", "measurements": {"bone_level": "2"}}]
        result = self.staging.calculate_periodontal_stage_aap(findings_stage1)
        self.assertEqual(result["stage"], PerioStageAAP.STAGE_I.value)
        
        # Stage II: 15-33% bone loss
        findings_stage2 = [{"type": "bone_loss", "measurements": {"bone_level": "4"}}]
        result = self.staging.calculate_periodontal_stage_aap(findings_stage2)
        self.assertEqual(result["stage"], PerioStageAAP.STAGE_II.value)
        
        # Stage III: >33% without tooth loss/furcation
        findings_stage3 = [{"type": "bone_loss", "measurements": {"bone_level": "6"}}]
        result = self.staging.calculate_periodontal_stage_aap(findings_stage3)
        self.assertEqual(result["stage"], PerioStageAAP.STAGE_III.value)
        
        # Stage IV: >33% with tooth loss or furcation
        findings_stage4 = [
            {"type": "bone_loss", "measurements": {"bone_level": "6"}},
            {"type": "missing_tooth", "cause": "periodontitis"}
        ]
        result = self.staging.calculate_periodontal_stage_aap(findings_stage4)
        self.assertEqual(result["stage"], PerioStageAAP.STAGE_IV.value)

    def test_classic_classification(self):
        """Test pre-2017 classification system"""
        # Chronic mild localized
        findings_mild = [{"type": "bone_loss", "measurements": {"bone_level": "2"}}]
        result = self.staging.calculate_periodontal_stage_classic(findings_mild)
        self.assertEqual(result["type"], PerioClassicType.CHRONIC.value)
        self.assertEqual(result["severity"], PerioClassicSeverity.MILD.value)
        self.assertEqual(result["extent"], PerioClassicType.LOCALIZED.value)
        
        # Aggressive moderate generalized
        findings_aggressive = [
            {"type": "bone_loss", "measurements": {"bone_level": "4", "progression_rate": "rapid"}},
            {"type": "bone_loss", "measurements": {"bone_level": "4"}, "location": "16"},
            {"type": "bone_loss", "measurements": {"bone_level": "4"}, "location": "26"},
            {"type": "bone_loss", "measurements": {"bone_level": "4"}, "location": "36"},
            {"type": "bone_loss", "measurements": {"bone_level": "4"}, "location": "46"},
            {"patient_age": 30}
        ]
        result = self.staging.calculate_periodontal_stage_classic(findings_aggressive)
        self.assertEqual(result["type"], PerioClassicType.AGGRESSIVE.value)
        self.assertEqual(result["severity"], PerioClassicSeverity.MODERATE.value)
        self.assertEqual(result["extent"], PerioClassicType.GENERALIZED.value)

    def test_caries_risk_assessment(self):
        """Test caries risk level determination"""
        # Low risk
        findings_low = [{"type": "caries", "severity": "mild"}]
        result = self.staging.calculate_caries_risk(findings_low)
        self.assertEqual(result["risk_level"], CariesRisk.LOW.value)
        
        # Moderate risk
        findings_moderate = [
            {"type": "caries", "severity": "mild"},
            {"type": "caries", "severity": "mild", "recurrent": True}
        ]
        result = self.staging.calculate_caries_risk(findings_moderate)
        self.assertEqual(result["risk_level"], CariesRisk.MODERATE.value)
        
        # High risk
        findings_high = [
            {"type": "caries", "severity": "severe"},
            {"type": "caries", "location": "near pulp"}
        ]
        result = self.staging.calculate_caries_risk(findings_high)
        self.assertEqual(result["risk_level"], CariesRisk.HIGH.value)

    def test_urgency_determination(self):
        """Test urgency level determination based on combined findings"""
        # Routine follow-up
        perio_aap_mild = {"stage": PerioStageAAP.STAGE_I.value}
        perio_classic_mild = {"severity": PerioClassicSeverity.MILD.value}
        caries_low = {"risk_level": CariesRisk.LOW.value, "near_pulp": 0}
        
        urgency = self.staging.determine_urgency(perio_aap_mild, perio_classic_mild, caries_low)
        self.assertEqual(urgency, UrgencyLevel.ROUTINE)
        
        # Immediate attention
        perio_aap_severe = {"stage": PerioStageAAP.STAGE_IV.value}
        perio_classic_severe = {"severity": PerioClassicSeverity.SEVERE.value}
        caries_severe = {"risk_level": CariesRisk.HIGH.value, "near_pulp": 1}
        
        urgency = self.staging.determine_urgency(perio_aap_severe, perio_classic_severe, caries_severe)
        self.assertEqual(urgency, UrgencyLevel.URGENT)

    def test_edge_cases(self):
        """Test edge cases and fallback behavior"""
        # Empty findings
        empty_findings = []
        result = self.staging.generate_overall_assessment({"findings": empty_findings})
        self.assertIn("periodontal_status_aap", result)
        self.assertIn("periodontal_status_classic", result)
        
        # Invalid bone loss values
        invalid_findings = [{"type": "bone_loss", "measurements": {"bone_level": "invalid"}}]
        result = self.staging.calculate_periodontal_stage_aap(invalid_findings)
        self.assertEqual(result["bone_loss_percentage"], 0)
        
        # Missing measurements
        incomplete_findings = [{"type": "bone_loss"}]
        result = self.staging.calculate_periodontal_stage_aap(incomplete_findings)
        self.assertEqual(result["stage"], PerioStageAAP.STAGE_I.value)

if __name__ == '__main__':
    unittest.main() 