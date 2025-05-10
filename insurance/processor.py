"""
Insurance processor module for enhancing findings with CDT codes and cost estimates.
"""

from typing import Dict, Any, List
from .cdt_codes import get_cdt_code_for_finding

class InsuranceProcessor:
    def __init__(self):
        """Initialize insurance processor"""
        pass
        
    def get_tooth_location(self, tooth_number: int) -> str:
        """
        Determine if a tooth is anterior or posterior
        
        Args:
            tooth_number: Tooth number (1-32)
            
        Returns:
            'anterior' or 'posterior'
        """
        # Convert tooth number to universal numbering system
        if tooth_number < 1 or tooth_number > 32:
            return "posterior"  # Default to posterior if invalid
            
        # Anterior teeth: 6-11, 22-27
        anterior_teeth = list(range(6, 12)) + list(range(22, 28))
        return "anterior" if tooth_number in anterior_teeth else "posterior"
    
    def get_quadrant_for_tooth(self, tooth_number: int) -> int:
        """
        Get the quadrant number for a tooth
        
        Args:
            tooth_number: Tooth number (1-32)
            
        Returns:
            Quadrant number (1-4)
        """
        if tooth_number < 1 or tooth_number > 32:
            return 1  # Default to first quadrant if invalid
            
        if tooth_number <= 8:
            return 1  # Upper right
        elif tooth_number <= 16:
            return 2  # Upper left
        elif tooth_number <= 24:
            return 3  # Lower left
        else:
            return 4  # Lower right
    
    def enhance_finding(self, finding: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enhance a finding with insurance information
        
        Args:
            finding: Original finding dictionary
            
        Returns:
            Enhanced finding with insurance information
        """
        # Skip if no finding type
        if "type" not in finding:
            return finding
            
        # Get basic finding info
        finding_type = finding["type"]
        severity = finding.get("severity", "mild")
        location = None
        surfaces = 1
        
        # Process location-specific details
        if "location" in finding:
            tooth_number = int(finding["location"])
            location = self.get_tooth_location(tooth_number)
            
            # Get surface count for caries
            if finding_type == "caries" and "measurements" in finding:
                surfaces = len(finding["measurements"].get("surfaces", "").split(","))
        
        # Get insurance codes and costs
        insurance_info = get_cdt_code_for_finding(
            finding_type=finding_type,
            severity=severity,
            location=location,
            surfaces=surfaces
        )
        
        # Add quadrant information if needed
        if insurance_info.get("quadrant_based") and "location" in finding:
            insurance_info["quadrant"] = self.get_quadrant_for_tooth(
                int(finding["location"])
            )
        
        # Enhance the finding with insurance information
        finding["insurance"] = insurance_info
        
        return finding
    
    def process_findings(self, findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Process a list of findings and add insurance information
        
        Args:
            findings: List of finding dictionaries
            
        Returns:
            Enhanced findings with insurance information
        """
        return [self.enhance_finding(finding) for finding in findings]
    
    def generate_insurance_summary(self, findings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate a summary of insurance information from findings
        
        Args:
            findings: List of enhanced findings
            
        Returns:
            Dictionary with insurance summary information
        """
        enhanced_findings = self.process_findings(findings)
        
        total_cost = 0.0
        total_covered = 0.0
        total_patient = 0.0
        requires_preauth = []
        
        # Group procedures by quadrant for quadrant-based procedures
        quadrant_procedures = {1: [], 2: [], 3: [], 4: []}
        
        for finding in enhanced_findings:
            if "insurance" not in finding:
                continue
                
            insurance = finding["insurance"]
            if not insurance.get("costs"):
                continue
                
            # Track costs
            costs = insurance["costs"]
            total_cost += costs["total"]
            total_covered += costs["covered"]
            total_patient += costs["patient_responsibility"]
            
            # Track pre-auth requirements
            if insurance.get("requires_preauth"):
                requires_preauth.append({
                    "code": insurance["cdt_code"],
                    "description": insurance["description"],
                    "tooth": finding.get("location"),
                    "cost": costs["total"]
                })
            
            # Group by quadrant if quadrant-based
            if insurance.get("quadrant_based") and "quadrant" in insurance:
                quadrant = insurance["quadrant"]
                quadrant_procedures[quadrant].append({
                    "code": insurance["cdt_code"],
                    "description": insurance["description"],
                    "tooth": finding.get("location"),
                    "cost": costs["total"]
                })
        
        return {
            "costs": {
                "total": round(total_cost, 2),
                "insurance_pays": round(total_covered, 2),
                "patient_pays": round(total_patient, 2)
            },
            "requires_preauth": requires_preauth,
            "quadrant_procedures": quadrant_procedures,
            "findings": enhanced_findings
        } 