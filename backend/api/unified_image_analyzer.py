#!/usr/bin/env python3
"""
Unified Image Analyzer for DentaMind Platform
Integrates functionality from FMX, Panoramic, and CBCT analyzers
"""

import os
import logging
import json
from typing import Dict, List, Optional, Union, Any
from datetime import datetime
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class UnifiedImageAnalyzer:
    """
    Unified interface for all imaging modalities (FMX, Panoramic, CBCT)
    Coordinates analysis across different imaging types and provides
    consistent output structure
    """
    
    def __init__(self, roboflow_service=None):
        """
        Initialize the unified analyzer with optional Roboflow service
        
        Args:
            roboflow_service: Optional Roboflow service for AI analysis
        """
        self.roboflow_service = roboflow_service
        logger.info("Initialized Unified Image Analyzer")
    
    def analyze_image(self, 
                     image_path: str, 
                     image_type: str,
                     patient_id: str,
                     options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Analyze an image using the appropriate analyzer based on image type
        
        Args:
            image_path: Path to the image file
            image_type: Type of image (fmx, panoramic, cbct)
            patient_id: ID of the patient
            options: Additional options for analysis
            
        Returns:
            Dict containing analysis results
        """
        image_type = image_type.lower()
        options = options or {}
        
        if not os.path.exists(image_path):
            logger.error(f"Image file not found: {image_path}")
            return {
                "success": False,
                "error": "Image file not found",
                "path": image_path
            }
        
        logger.info(f"Analyzing {image_type} image for patient {patient_id}")
        
        # Select appropriate analyzer based on image type
        if image_type == 'fmx':
            results = self._analyze_fmx(image_path, patient_id, options)
        elif image_type == 'panoramic':
            results = self._analyze_panoramic(image_path, patient_id, options)
        elif image_type == 'cbct':
            results = self._analyze_cbct(image_path, patient_id, options)
        else:
            logger.warning(f"Unknown image type: {image_type}, falling back to generic analysis")
            results = self._analyze_generic(image_path, patient_id, options)
        
        # Add common metadata
        results.update({
            "patient_id": patient_id,
            "image_type": image_type,
            "analysis_id": f"analysis-{uuid.uuid4().hex[:8]}",
            "timestamp": datetime.utcnow().isoformat(),
        })
        
        return results
    
    def _analyze_fmx(self, image_path: str, patient_id: str, options: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze Full Mouth X-ray (FMX) images
        
        Args:
            image_path: Path to the image file
            patient_id: ID of the patient
            options: Additional options for analysis
            
        Returns:
            Dict containing FMX analysis results
        """
        logger.info(f"Performing FMX analysis on {image_path}")
        
        # Would normally call actual FMX analyzer here
        # For now, generate mock data organized by quadrant
        
        # Mock findings organized by quadrant
        findings = {
            "quadrants": {
                "UR": self._generate_mock_findings("UR", ["1", "2", "3", "4", "5", "6", "7", "8"]),
                "UL": self._generate_mock_findings("UL", ["9", "10", "11", "12", "13", "14", "15", "16"]),
                "LL": self._generate_mock_findings("LL", ["17", "18", "19", "20", "21", "22", "23", "24"]),
                "LR": self._generate_mock_findings("LR", ["25", "26", "27", "28", "29", "30", "31", "32"]),
            },
            "summary": "Full mouth X-ray analysis complete. Multiple findings detected across all quadrants."
        }
        
        return {
            "success": True,
            "findings": findings,
            "clinical_notes": "Patient presents with multiple restorations and several carious lesions requiring attention."
        }
    
    def _analyze_panoramic(self, image_path: str, patient_id: str, options: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze Panoramic X-ray images
        
        Args:
            image_path: Path to the image file
            patient_id: ID of the patient
            options: Additional options for analysis
            
        Returns:
            Dict containing Panoramic analysis results
        """
        logger.info(f"Performing Panoramic analysis on {image_path}")
        
        # Would normally call actual Panoramic analyzer here
        
        # Mock findings for panoramic, including TMJ analysis
        findings = {
            "tmj": {
                "right": {
                    "condyle_position": "normal",
                    "joint_space": "adequate",
                    "wilkes_classification": "I",
                    "findings": "No significant pathology"
                },
                "left": {
                    "condyle_position": "anterior",
                    "joint_space": "reduced",
                    "wilkes_classification": "II",
                    "findings": "Early-stage degenerative changes"
                }
            },
            "teeth": self._generate_mock_panoramic_findings(),
            "summary": "Panoramic analysis shows asymmetric TMJ findings with early-stage changes on the left side. Multiple dental findings noted."
        }
        
        return {
            "success": True,
            "findings": findings,
            "clinical_notes": "Recommend clinical correlation of TMJ findings and attention to dental pathologies noted."
        }
    
    def _analyze_cbct(self, image_path: str, patient_id: str, options: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze Cone Beam CT (CBCT) images
        
        Args:
            image_path: Path to the image file
            patient_id: ID of the patient
            options: Additional options for analysis
            
        Returns:
            Dict containing CBCT analysis results
        """
        logger.info(f"Performing CBCT analysis on {image_path}")
        
        # Would normally call actual CBCT analyzer here
        
        # Get region of interest if specified
        region = options.get("region", "full")
        
        # Mock 3D findings for CBCT
        region_descriptors = {
            "full": "full maxillofacial",
            "maxilla": "maxillary",
            "mandible": "mandibular",
            "tmj": "temporomandibular joint",
            "sinus": "paranasal sinus"
        }
        
        # Format region description
        region_desc = region_descriptors.get(region, region)
        
        findings = {
            "region": region,
            "bone_density": {
                "average_hu": 750,
                "areas_of_concern": [
                    {
                        "location": "posterior left maxilla",
                        "hu_value": 320,
                        "classification": "D4 - poor density"
                    }
                ]
            },
            "sinus_findings": {
                "maxillary_sinus": "mild mucosal thickening",
                "ethmoid_sinus": "clear",
                "sphenoid_sinus": "clear",
                "frontal_sinus": "clear"
            },
            "nerve_canals": {
                "left_iaf": {
                    "visibility": "excellent",
                    "proximity_concern": False
                },
                "right_iaf": {
                    "visibility": "excellent",
                    "proximity_concern": False
                }
            },
            "teeth": self._generate_mock_cbct_findings(),
            "summary": f"CBCT analysis of {region_desc} region complete. Bone density concerns in posterior left maxilla. Multiple dental findings noted."
        }
        
        return {
            "success": True,
            "findings": findings,
            "clinical_notes": "Recommend implant planning with consideration of bone augmentation in posterior left maxilla."
        }
    
    def _analyze_generic(self, image_path: str, patient_id: str, options: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generic fallback analysis for when image type is unknown
        
        Args:
            image_path: Path to the image file
            patient_id: ID of the patient
            options: Additional options for analysis
            
        Returns:
            Dict containing generic analysis results
        """
        logger.info(f"Performing generic analysis on {image_path}")
        
        # If we have a Roboflow service, use it for basic detection
        if self.roboflow_service:
            try:
                ai_results = self.roboflow_service.analyze_image(image_path)
                return {
                    "success": True,
                    "ai_results": ai_results,
                    "findings": {
                        "summary": "Generic image analysis performed with AI detection."
                    }
                }
            except Exception as e:
                logger.error(f"Error during Roboflow analysis: {e}")
        
        # Fallback to very basic mock results
        return {
            "success": True,
            "findings": {
                "summary": "Generic image analysis performed. Please use a specific image type for detailed analysis."
            }
        }
    
    def _generate_mock_findings(self, quadrant: str, teeth: List[str]) -> Dict[str, Any]:
        """Generate mock findings for a dental quadrant"""
        import random
        
        findings = {}
        
        for tooth in teeth:
            # Only generate findings for some teeth
            if random.random() < 0.3:  # 30% chance of a finding for each tooth
                finding_type = random.choice(["caries", "restoration", "periapical"])
                
                if finding_type == "caries":
                    findings[tooth] = {
                        "type": "caries",
                        "surfaces": random.choice(["M", "O", "D", "B", "L", "MO", "DO", "MOD"]),
                        "severity": random.choice(["incipient", "moderate", "severe"]),
                        "black_classification": f"Class {random.choice(['I', 'II', 'III', 'IV', 'V'])}"
                    }
                elif finding_type == "restoration":
                    findings[tooth] = {
                        "type": "restoration",
                        "surfaces": random.choice(["M", "O", "D", "B", "L", "MO", "DO", "MOD"]),
                        "material": random.choice(["amalgam", "composite", "crown", "bridge"]),
                        "condition": random.choice(["good", "marginal defect", "needs replacement"])
                    }
                else:  # periapical
                    findings[tooth] = {
                        "type": "periapical",
                        "diameter_mm": round(random.uniform(1.0, 8.0), 1),
                        "severity": random.choice(["mild", "moderate", "severe"])
                    }
        
        return findings
    
    def _generate_mock_panoramic_findings(self) -> Dict[str, Any]:
        """Generate mock findings for panoramic analysis"""
        return {
            "impacted_teeth": ["18", "38"],
            "missing_teeth": ["1", "16", "17", "32"],
            "supernumerary_teeth": None,
            "caries": [
                {"tooth": "14", "surface": "M", "severity": "moderate"},
                {"tooth": "30", "surface": "O", "severity": "advanced"}
            ],
            "restorations": [
                {"tooth": "3", "surfaces": "MOD", "material": "amalgam", "condition": "good"},
                {"tooth": "19", "surfaces": "O", "material": "composite", "condition": "good"}
            ],
            "periapical_lesions": [
                {"tooth": "9", "diameter_mm": 3.5, "severity": "moderate"}
            ],
        }
    
    def _generate_mock_cbct_findings(self) -> Dict[str, Any]:
        """Generate mock findings for CBCT analysis"""
        return {
            "implant_sites": [
                {
                    "tooth_position": "14",
                    "bone_height_mm": 12.5,
                    "bone_width_mm": 6.2,
                    "bone_density_hu": 750,
                    "nerve_proximity_mm": None,
                    "sinus_proximity_mm": 2.3,
                    "recommendation": "suitable for standard implant"
                },
                {
                    "tooth_position": "30",
                    "bone_height_mm": 11.8,
                    "bone_width_mm": 5.7,
                    "bone_density_hu": 630,
                    "nerve_proximity_mm": 3.5,
                    "sinus_proximity_mm": None,
                    "recommendation": "suitable for standard implant with careful planning"
                }
            ],
            "endodontic_findings": [
                {
                    "tooth": "3",
                    "canal_configuration": "MB1, MB2, DB, P",
                    "periapical_status": "PAI score 3 on MB root",
                    "findings": "MB2 canal present, periapical radiolucency noted"
                }
            ],
            "pathologies": [
                {
                    "location": "right maxillary sinus",
                    "description": "mucosal thickening",
                    "size_mm": 4.5,
                    "recommendation": "monitor, correlate with symptoms"
                }
            ]
        }


# Instantiate as a singleton if needed directly
unified_analyzer = UnifiedImageAnalyzer()

# Test function for direct script execution
def test_analyzer():
    """Test the analyzer with mock data"""
    analyzer = UnifiedImageAnalyzer()
    
    # Mock image paths
    fmx_path = "test_images/fmx_sample.jpg"
    pano_path = "test_images/panoramic_sample.jpg"
    cbct_path = "test_images/cbct_sample.dcm"
    
    # Test all three analyzer types
    results = []
    results.append(analyzer.analyze_image(fmx_path, "fmx", "TEST-123"))
    results.append(analyzer.analyze_image(pano_path, "panoramic", "TEST-123"))
    results.append(analyzer.analyze_image(cbct_path, "cbct", "TEST-123", {"region": "maxilla"}))
    
    # Print results
    for i, result in enumerate(results):
        print(f"\n=== Result {i+1} ===")
        print(json.dumps(result, indent=2))

if __name__ == "__main__":
    test_analyzer() 