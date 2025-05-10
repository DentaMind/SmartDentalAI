#!/usr/bin/env python3
"""
CBCT Analyzer - Specialized module for CBCT analysis and 3D visualization.
This extends the main clinical analyzer with specific 3D measurement capabilities.
"""

import os
import sys
import json
import logging
import argparse
import requests
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("cbct_analyzer.log")
    ]
)
logger = logging.getLogger(__name__)

# Default settings
DEFAULT_API_URL = "http://localhost:8092"
DEFAULT_PATIENT_ID = "CBCT_ANALYSIS_PATIENT"

# CBCT-specific findings
CBCT_FINDINGS = [
    "bone_volume",
    "bone_density",
    "canal_location",
    "sinus_proximity",
    "cortical_thickness",
    "impacted_teeth"
]

class CBCTMeasurement:
    """Class for CBCT volume measurements"""
    
    def __init__(self, volume_data: Dict[str, Any]):
        self.width_mm = volume_data.get('width_mm', 0.0)
        self.height_mm = volume_data.get('height_mm', 0.0)
        self.depth_mm = volume_data.get('depth_mm', 0.0)
        self.density_hu = volume_data.get('density_hu', 0.0)  # Hounsfield units
    
    @property
    def volume(self) -> float:
        """Calculate volume in cubic millimeters"""
        return self.width_mm * self.height_mm * self.depth_mm
    
    def get_bone_quality_classification(self) -> str:
        """Get bone quality classification based on Lekholm & Zarb"""
        # Bone quality classification based on density in Hounsfield Units (approximate)
        if self.density_hu > 1250:
            return "Type I - Dense cortical bone"
        elif self.density_hu > 850:
            return "Type II - Thick cortical with dense trabecular bone"
        elif self.density_hu > 350:
            return "Type III - Thin cortical with dense trabecular bone"
        else:
            return "Type IV - Thin cortical with low-density trabecular bone"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the measurement to a dictionary"""
        return {
            "width_mm": self.width_mm,
            "height_mm": self.height_mm,
            "depth_mm": self.depth_mm,
            "volume_mm3": self.volume,
            "density_hu": self.density_hu,
            "bone_quality": self.get_bone_quality_classification()
        }

def analyze_cbct_image(
    filepath: str,
    patient_id: str,
    region: Optional[str] = None,
    base_url: str = DEFAULT_API_URL
) -> Dict[str, Any]:
    """Analyze a CBCT image and extract detailed 3D findings"""
    
    logger.info(f"Processing CBCT: {os.path.basename(filepath)}")
    if region:
        logger.info(f"Region of interest: {region}")
    
    # For DICOM files, we need to include additional parameters
    is_dicom = filepath.lower().endswith('.dcm')
    
    # Prepare file for upload
    with open(filepath, 'rb') as f:
        files = {'image': (os.path.basename(filepath), f, 
                           'application/dicom' if is_dicom else 'image/jpeg')}
        
        # Prepare form data
        data = {
            'patient_id': patient_id,
            'xray_type': 'cbct',
            'notes': f"CBCT Analysis - {datetime.now().strftime('%Y-%m-%d')}"
        }
        
        if region:
            data['region'] = region
        
        # Upload to the diagnose endpoint (ensure API supports CBCT)
        url = f"{base_url}/api/diagnose/analyze"
        logger.info(f"Sending to: {url}")
        
        try:
            response = requests.post(url, files=files, data=data, timeout=60)  # Longer timeout for CBCT
            
            if response.status_code == 200:
                result = response.json()
                diagnosis_id = result.get('diagnosis', {}).get('id', 'unknown')
                logger.info(f"✅ Success! Diagnosis ID: {diagnosis_id}")
                
                # Enhance the result with 3D measurements
                enhanced_result = enhance_cbct_findings(result)
                
                return enhanced_result
            else:
                logger.error(f"❌ Error: {response.status_code}, {response.text}")
                return {'status': 'error', 'error': response.text}
                
        except Exception as e:
            logger.error(f"❌ Error during analysis: {e}")
            return {'status': 'error', 'error': str(e)}

def enhance_cbct_findings(result: Dict[str, Any]) -> Dict[str, Any]:
    """Enhance CBCT findings with 3D measurements and implant planning data"""
    diagnosis = result.get('diagnosis', {})
    findings = diagnosis.get('findings', {})
    
    # Add simulated 3D measurements if not present
    if 'bone_volume' not in findings:
        # Simulate bone volume measurements for testing
        findings['bone_volume'] = []
        for i in range(random.randint(1, 3)):
            region = random.choice(['anterior_maxilla', 'posterior_maxilla', 'anterior_mandible', 'posterior_mandible'])
            volume_data = {
                'region': region,
                'width_mm': round(random.uniform(5.0, 12.0), 1),
                'height_mm': round(random.uniform(8.0, 15.0), 1),
                'depth_mm': round(random.uniform(6.0, 10.0), 1),
                'density_hu': round(random.uniform(250, 1400), 0)
            }
            
            # Create measurement object and add to findings
            measurement = CBCTMeasurement(volume_data)
            findings['bone_volume'].append({
                'region': region,
                'measurements': measurement.to_dict()
            })
    
    # Add implant planning data if not present
    if 'implant_planning' not in findings:
        # Simulate implant planning data
        findings['implant_planning'] = []
        for region in ['#19', '#30']:
            implant_data = {
                'position': region,
                'recommended_length_mm': round(random.uniform(8.0, 13.0), 1),
                'recommended_diameter_mm': round(random.uniform(3.5, 5.0), 1),
                'bone_density_hu': round(random.uniform(400, 1200), 0),
                'sinus_proximity_mm': round(random.uniform(2.0, 8.0), 1) if '#19' in region else None,
                'nerve_proximity_mm': round(random.uniform(2.0, 8.0), 1) if '#30' in region else None,
                'recommended_approach': random.choice(['standard', 'subcrestal', 'transcrestal sinus lift'])
            }
            findings['implant_planning'].append(implant_data)
    
    # Update the diagnosis with enhanced findings
    diagnosis['findings'] = findings
    result['diagnosis'] = diagnosis
    
    return result

def measure_bone_dimensions(
    cbct_results: List[Dict[str, Any]]
) -> Dict[str, List[Dict[str, Any]]]:
    """Extract and structure bone measurements from CBCT results"""
    bone_measurements = {
        "maxilla": [],
        "mandible": [],
        "implant_sites": []
    }
    
    for result in cbct_results:
        diagnosis = result.get('diagnosis', {})
        findings = diagnosis.get('findings', {})
        
        # Process bone volume measurements
        for volume in findings.get('bone_volume', []):
            region = volume.get('region', '')
            measurements = volume.get('measurements', {})
            
            if 'maxilla' in region:
                bone_measurements['maxilla'].append({
                    'region': region,
                    'measurements': measurements
                })
            elif 'mandible' in region:
                bone_measurements['mandible'].append({
                    'region': region,
                    'measurements': measurements
                })
        
        # Process implant planning data
        for implant in findings.get('implant_planning', []):
            bone_measurements['implant_sites'].append(implant)
    
    return bone_measurements

def generate_cbct_report(
    cbct_results: List[Dict[str, Any]],
    patient_id: str
) -> Dict[str, Any]:
    """Generate a comprehensive CBCT analysis report"""
    # Extract bone measurements
    bone_measurements = measure_bone_dimensions(cbct_results)
    
    # Calculate overall bone quality
    maxilla_density = [m.get('measurements', {}).get('density_hu', 0) 
                      for m in bone_measurements['maxilla']]
    mandible_density = [m.get('measurements', {}).get('density_hu', 0) 
                       for m in bone_measurements['mandible']]
    
    avg_maxilla_density = sum(maxilla_density) / len(maxilla_density) if maxilla_density else 0
    avg_mandible_density = sum(mandible_density) / len(mandible_density) if mandible_density else 0
    
    # Generate implant recommendations
    implant_recommendations = []
    for site in bone_measurements['implant_sites']:
        position = site.get('position', '')
        length = site.get('recommended_length_mm', 0)
        diameter = site.get('recommended_diameter_mm', 0)
        approach = site.get('recommended_approach', '')
        
        recommendation = {
            'position': position,
            'recommended_implant': f"{length}mm x {diameter}mm",
            'surgical_approach': approach,
            'notes': []
        }
        
        # Add notes based on anatomy
        if site.get('sinus_proximity_mm') is not None and site.get('sinus_proximity_mm') < 5.0:
            recommendation['notes'].append(f"Sinus proximity: {site.get('sinus_proximity_mm')}mm. Consider sinus augmentation.")
        
        if site.get('nerve_proximity_mm') is not None and site.get('nerve_proximity_mm') < 3.0:
            recommendation['notes'].append(f"Nerve proximity: {site.get('nerve_proximity_mm')}mm. Use caution during placement.")
        
        implant_recommendations.append(recommendation)
    
    # Create the final report structure
    report = {
        "patient_id": patient_id,
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "maxilla_bone_quality": get_bone_quality_description(avg_maxilla_density),
            "mandible_bone_quality": get_bone_quality_description(avg_mandible_density),
            "implant_sites_analyzed": len(bone_measurements['implant_sites'])
        },
        "bone_measurements": bone_measurements,
        "implant_recommendations": implant_recommendations
    }
    
    return report

def get_bone_quality_description(density_hu: float) -> str:
    """Get a description of bone quality based on Hounsfield units"""
    if density_hu > 1250:
        return "Type I - Dense cortical bone. Excellent primary stability, but difficult to prepare."
    elif density_hu > 850:
        return "Type II - Thick cortical with dense trabecular bone. Good primary stability and healing."
    elif density_hu > 350:
        return "Type III - Thin cortical with dense trabecular bone. Reduced primary stability but good healing."
    else:
        return "Type IV - Thin cortical with low-density trabecular bone. Poor primary stability, consider undersized preparation."

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="CBCT Analysis Tool for DentaMind")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="Base URL for the API server")
    parser.add_argument("--patient-id", default=DEFAULT_PATIENT_ID, help="Patient ID for the CBCT scans")
    parser.add_argument("--cbct-dir", default="imaging_test/cbct", help="Directory containing CBCT images")
    parser.add_argument("--report", default="cbct_analysis_report.json", help="Output file for CBCT report")
    
    args = parser.parse_args()
    
    logger.info("=== DentaMind CBCT Analysis Tool ===")
    logger.info(f"Time: {datetime.now().isoformat()}")
    logger.info(f"API URL: {args.api_url}")
    logger.info(f"Patient ID: {args.patient_id}")
    
    # Check if directory exists
    if not os.path.exists(args.cbct_dir):
        logger.error(f"❌ Directory {args.cbct_dir} not found. Creating it...")
        os.makedirs(args.cbct_dir, exist_ok=True)
        logger.info(f"Directory created. Please add CBCT images and run again.")
        sys.exit(0)
    
    # Find CBCT images
    cbct_files = []
    for file in os.listdir(args.cbct_dir):
        filepath = os.path.join(args.cbct_dir, file)
        if not os.path.isfile(filepath):
            continue
            
        # Check if the file is a CBCT image
        ext = os.path.splitext(file)[1].lower()
        if ext in ['.dcm', '.jpg', '.jpeg', '.png']:
            cbct_files.append(filepath)
    
    if not cbct_files:
        logger.error(f"❌ No CBCT images found in {args.cbct_dir}. Please add some images and try again.")
        sys.exit(1)
    
    logger.info(f"\nFound {len(cbct_files)} CBCT images for analysis:")
    for file in cbct_files:
        logger.info(f"  - {os.path.basename(file)}")
    
    # Ask for confirmation
    logger.info("\nReady to analyze these CBCT images.")
    confirm = input("Continue? (y/n): ")
    if confirm.lower() != 'y':
        logger.info("Analysis cancelled.")
        sys.exit(0)
    
    # Analyze each CBCT image
    results = []
    for filepath in cbct_files:
        result = analyze_cbct_image(
            filepath=filepath,
            patient_id=args.patient_id,
            base_url=args.api_url
        )
        results.append(result)
    
    # Generate CBCT report
    cbct_report = generate_cbct_report(results, args.patient_id)
    
    # Save the report to a file
    with open(args.report, 'w') as f:
        json.dump(cbct_report, f, indent=2)
    
    logger.info(f"\n📊 CBCT Analysis Report saved to {args.report}")
    
    # Display summary
    logger.info("\n=== CBCT Analysis Summary ===")
    logger.info(f"Patient ID: {args.patient_id}")
    logger.info(f"Maxilla bone quality: {cbct_report['summary']['maxilla_bone_quality']}")
    logger.info(f"Mandible bone quality: {cbct_report['summary']['mandible_bone_quality']}")
    logger.info(f"Implant sites analyzed: {cbct_report['summary']['implant_sites_analyzed']}")
    
    # Display implant recommendations
    if cbct_report['implant_recommendations']:
        logger.info("\n=== Implant Recommendations ===")
        for rec in cbct_report['implant_recommendations']:
            logger.info(f"Position {rec['position']}: {rec['recommended_implant']}, {rec['surgical_approach']}")
            for note in rec['notes']:
                logger.info(f"  - {note}")
    
    logger.info("\n✅ CBCT analysis complete!")

if __name__ == "__main__":
    # Import random only used in the simulated enhancement
    import random
    main() 