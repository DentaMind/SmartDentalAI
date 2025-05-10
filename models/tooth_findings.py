from typing import Dict, Any, List, Optional

class ToothFinding:
    def __init__(self):
        self.has_findings = False
        self.bone_loss = 0
        self.vertical_defects = False
        self.furcation = False
        self.caries = None
        self.severity = "none"

    def calculate_severity(self) -> str:
        """Calculate overall severity based on findings"""
        if not self.has_findings:
            return "none"
        
        # Start with bone loss severity
        if self.bone_loss > 33:
            return "critical" if self.furcation else "severe"
        elif self.bone_loss > 15:
            return "moderate"
        elif self.bone_loss > 0:
            return "mild"
        
        # Consider caries if no significant bone loss
        if self.caries and "severe" in self.caries.lower():
            return "severe"
        elif self.caries and "moderate" in self.caries.lower():
            return "moderate"
        elif self.caries:
            return "mild"
        
        return "none"

def get_tooth_findings(findings: List[Dict[str, Any]], tooth_number: int) -> ToothFinding:
    """
    Process findings for a specific tooth
    
    Args:
        findings: List of all findings from the diagnosis
        tooth_number: The tooth number to process (1-32)
        
    Returns:
        ToothFinding object with processed data
    """
    tooth = ToothFinding()
    
    for finding in findings:
        # Skip findings without location
        if "location" not in finding:
            continue
            
        # Check if finding is for this tooth
        location = str(finding.get("location", ""))
        if not (location.isdigit() and int(location) == tooth_number):
            continue
            
        tooth.has_findings = True
        
        # Process bone loss
        if finding.get("type") == "bone_loss":
            measurements = finding.get("measurements", {})
            bone_level = measurements.get("bone_level", 0)
            if isinstance(bone_level, str):
                try:
                    bone_level = float(bone_level.replace("mm", ""))
                except ValueError:
                    bone_level = 0
            
            # Convert mm to percentage (assuming 13mm average root length)
            tooth.bone_loss = round((bone_level / 13.0) * 100, 1)
            
            # Check for vertical defects and furcation
            pattern = measurements.get("pattern", "").lower()
            tooth.vertical_defects = "vertical" in pattern
            tooth.furcation = "furcation" in pattern
        
        # Process caries
        elif finding.get("type") == "caries":
            severity = finding.get("severity", "").capitalize()
            location_detail = finding.get("location_detail", "")
            tooth.caries = f"{severity} ({location_detail})" if location_detail else severity
    
    # Calculate overall severity
    tooth.severity = tooth.calculate_severity()
    
    return tooth 