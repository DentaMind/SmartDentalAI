#!/usr/bin/env python3
"""
Clinical Dental Imaging Analyzer - Enhanced implementation with clinical standards
Supporting FMX, Panoramic, and CBCT imaging with quadrant organization
"""

import os
import sys
import json
import time
import argparse
import requests
import random
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from pathlib import Path
from collections import defaultdict
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("clinical_analyzer.log")
    ]
)
logger = logging.getLogger(__name__)

# Default settings
DEFAULT_API_URL = "http://localhost:8092"
DEFAULT_PATIENT_ID = "CLINICAL_ANALYSIS_PATIENT"
CONFIDENCE_THRESHOLD = 0.65  # Minimum confidence for findings

# Dental constants
TOOTH_QUADRANTS = {
    "UR": list(range(1, 9)),      # Upper Right (1-8)
    "UL": list(range(9, 17)),     # Upper Left (9-16)
    "LL": list(range(17, 25)),    # Lower Left (17-24)
    "LR": list(range(25, 33)),    # Lower Right (25-32)
}

# G.V. Black classification
GV_BLACK_CLASSIFICATION = {
    "Class I": "Pit and fissure caries on occlusal surfaces",
    "Class II": "Proximal surfaces of posterior teeth",
    "Class III": "Proximal surfaces of anterior teeth without incisal angle",
    "Class IV": "Proximal surfaces of anterior teeth with incisal angle",
    "Class V": "Cervical third of facial or lingual surfaces",
    "Class VI": "Incisal edges and cusp tips"
}

def is_port_in_use(port: int) -> bool:
    """Check if a port is in use"""
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def setup_test_directory(base_dir: str = "imaging_test") -> str:
    """Set up a test directory for dental images"""
    os.makedirs(base_dir, exist_ok=True)
    
    # Create subdirectories for different image types
    os.makedirs(os.path.join(base_dir, "fmx"), exist_ok=True)
    os.makedirs(os.path.join(base_dir, "panoramic"), exist_ok=True)
    os.makedirs(os.path.join(base_dir, "cbct"), exist_ok=True)
    
    logger.info(f"Dental imaging test directory created: {os.path.abspath(base_dir)}")
    logger.info(f"Created subdirectories for FMX, Panoramic, and CBCT images")
    
    return os.path.abspath(base_dir)

def find_dental_images(directory: str) -> Dict[str, List[Dict[str, str]]]:
    """Find dental images in the test directory and categorize them by type"""
    images = {
        "fmx": [],
        "panoramic": [],
        "cbct": []
    }
    
    # Process the main directory and all subdirectories
    for root, dirs, files in os.walk(directory):
        for file in files:
            filepath = os.path.join(root, file)
            if not os.path.isfile(filepath):
                continue
                
            # Check if the file is an image
            ext = os.path.splitext(file)[1].lower()
            if ext not in ['.jpg', '.jpeg', '.png', '.dcm']:
                continue
            
            # Determine the type of image
            if 'cbct' in filepath.lower() or ext == '.dcm':
                image_type = 'cbct'
            elif 'pano' in filepath.lower() or 'panoramic' in filepath.lower():
                image_type = 'panoramic'
            else:
                # Default to FMX for all other dental X-rays
                image_type = 'fmx'
                
                # Determine the specific FMX type
                if 'bw' in file.lower():
                    fmx_subtype = 'bitewing'
                elif 'pa' in file.lower():
                    fmx_subtype = 'periapical'
                elif 'ceph' in file.lower():
                    fmx_subtype = 'cephalometric'
                else:
                    fmx_subtype = 'periapical'  # Default to periapical
            
            # Try to extract tooth number if present
            tooth_number = None
            parts = os.path.splitext(file)[0].split('_')
            for part in parts:
                if part.isdigit() and 1 <= int(part) <= 32:
                    tooth_number = part
                    break
            
            # Create the image metadata
            image_data = {
                'filepath': filepath,
                'filename': file,
                'type': image_type,
                'tooth_number': tooth_number
            }
            
            # Add FMX subtype if applicable
            if image_type == 'fmx':
                image_data['fmx_subtype'] = fmx_subtype
            
            # Add to the appropriate category
            images[image_type].append(image_data)
    
    return images

def test_api_connection(base_url: str) -> bool:
    """Test connection to the API"""
    try:
        # Try different health endpoints
        for endpoint in ['/api/health', '/health', '/']:
            try:
                response = requests.get(f"{base_url}{endpoint}", timeout=5)
                if response.status_code == 200:
                    return True
            except:
                continue
        return False
    except Exception as e:
        logger.error(f"Error connecting to API: {e}")
        return False

def analyze_image(
    filepath: str, 
    image_type: str,
    patient_id: str,
    tooth_number: Optional[str],
    base_url: str,
    fmx_subtype: Optional[str] = None
) -> Dict[str, Any]:
    """Upload and analyze an image using the diagnosis endpoint"""
    
    logger.info(f"Processing: {os.path.basename(filepath)}")
    logger.info(f"Type: {image_type}{', Subtype: ' + fmx_subtype if fmx_subtype else ''}, Tooth: {tooth_number or 'Not specified'}")
    
    # Prepare file for upload
    with open(filepath, 'rb') as f:
        files = {'image': (os.path.basename(filepath), f, 'image/jpeg')}
        
        # Prepare form data
        data = {
            'patient_id': patient_id,
            'xray_type': fmx_subtype if fmx_subtype else image_type,
            'notes': f"Clinical Analysis - {datetime.now().strftime('%Y-%m-%d')}"
        }
        
        if tooth_number:
            data['tooth_number'] = tooth_number
        
        # Upload to the diagnose endpoint
        url = f"{base_url}/api/diagnose/analyze"
        logger.info(f"Sending to: {url}")
        
        try:
            response = requests.post(url, files=files, data=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                diagnosis_id = result.get('diagnosis', {}).get('id', 'unknown')
                logger.info(f"✅ Success! Diagnosis ID: {diagnosis_id}")
                
                return result
            else:
                logger.error(f"❌ Error: {response.status_code}, {response.text}")
                return {'status': 'error', 'error': response.text}
                
        except Exception as e:
            logger.error(f"❌ Error during analysis: {e}")
            return {'status': 'error', 'error': str(e)}

def process_all_images(images: Dict[str, List[Dict[str, str]]], patient_id: str, base_url: str) -> Dict[str, Any]:
    """Process all images and collect results by image type"""
    results = {
        "fmx": [],
        "panoramic": [],
        "cbct": []
    }
    
    # Process FMX images
    if images["fmx"]:
        logger.info(f"\n=== Processing {len(images['fmx'])} FMX images ===")
        for img in images["fmx"]:
            result = analyze_image(
                filepath=img['filepath'],
                image_type='fmx',
                patient_id=patient_id,
                tooth_number=img['tooth_number'],
                base_url=base_url,
                fmx_subtype=img.get('fmx_subtype')
            )
            results["fmx"].append(result)
            time.sleep(1)  # Small delay to avoid overwhelming the server
    
    # Process panoramic images
    if images["panoramic"]:
        logger.info(f"\n=== Processing {len(images['panoramic'])} Panoramic images ===")
        for img in images["panoramic"]:
            result = analyze_image(
                filepath=img['filepath'],
                image_type='panoramic',
                patient_id=patient_id,
                tooth_number=None,  # Panoramic images don't have specific tooth numbers
                base_url=base_url
            )
            results["panoramic"].append(result)
            time.sleep(1)
    
    # Process CBCT images
    if images["cbct"]:
        logger.info(f"\n=== Processing {len(images['cbct'])} CBCT images ===")
        for img in images["cbct"]:
            result = analyze_image(
                filepath=img['filepath'],
                image_type='cbct',
                patient_id=patient_id,
                tooth_number=img['tooth_number'],
                base_url=base_url
            )
            results["cbct"].append(result)
            time.sleep(1)
    
    return results

def get_quadrant_for_tooth(tooth_number: int) -> str:
    """Get the quadrant for a tooth number"""
    for quadrant, teeth in TOOTH_QUADRANTS.items():
        if tooth_number in teeth:
            return quadrant
    return "Unknown"

def classify_caries_black(tooth: int, surface: str) -> str:
    """Classify caries according to G.V. Black classification"""
    tooth_str = str(tooth)
    
    # Check if anterior or posterior tooth
    is_anterior = tooth_str in ['6', '7', '8', '9', '10', '11', '22', '23', '24', '25', '26', '27']
    
    if 'O' in surface:
        return "Class I"  # Occlusal pits and fissures
    elif 'M' in surface or 'D' in surface:  # Mesial or Distal
        if is_anterior:
            if 'I' in surface:  # If incisal edge involved
                return "Class IV"
            else:
                return "Class III"
        else:
            return "Class II"  # Proximal surfaces of posterior teeth
    elif 'B' in surface or 'L' in surface:  # Buccal or Lingual
        if surface == 'B' or surface == 'L':  # Only buccal or lingual without other surfaces
            return "Class V"  # Gingival third
    elif 'I' in surface or 'C' in surface:  # Incisal or Cusp tip
        return "Class VI"  # Added by others to Black's classification
    
    # Default
    return "Unclassified"

def calculate_bone_loss_percentage(measurement: Dict[str, Any]) -> float:
    """Calculate bone loss percentage based on measurements"""
    # Clinical crown length (average approximation)
    clinical_crown_length = 9.0  # mm
    
    # Check if we have recession measurements
    if 'recession' in measurement and measurement['recession']:
        recession_values = [v for v in measurement['recession'].values() if v is not None]
        avg_recession = sum(recession_values) / len(recession_values) if recession_values else 0
    else:
        avg_recession = 0
    
    # Calculate clinical attachment loss (CAL) = pocket depth + recession
    pocket_depth_values = [v for v in measurement['pocket_depths'].values() if v is not None]
    avg_pocket_depth = sum(pocket_depth_values) / len(pocket_depth_values) if pocket_depth_values else 0
    
    cal = avg_pocket_depth + avg_recession
    
    # Calculate bone loss percentage
    # Assuming the anatomical crown is approximately 9mm for molars
    bone_loss_percentage = (cal / clinical_crown_length) * 100
    
    return bone_loss_percentage

def organize_findings_by_quadrant(results: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Dict[str, List[Dict[str, Any]]]]:
    """Organize findings by quadrant for clinical assessment"""
    findings_by_quadrant = {
        "UR": {"caries": [], "periapical_lesions": [], "restorations": [], "bone_loss": []},
        "UL": {"caries": [], "periapical_lesions": [], "restorations": [], "bone_loss": []},
        "LL": {"caries": [], "periapical_lesions": [], "restorations": [], "bone_loss": []},
        "LR": {"caries": [], "periapical_lesions": [], "restorations": [], "bone_loss": []}
    }
    
    # Extract all findings from all image types
    all_findings = {}
    
    # Process FMX findings
    for result in results.get("fmx", []):
        diagnosis = result.get('diagnosis', {})
        findings = diagnosis.get('findings', {})
        
        for category in findings:
            if category not in all_findings:
                all_findings[category] = []
            all_findings[category].extend(findings[category])
    
    # Process panoramic findings
    for result in results.get("panoramic", []):
        diagnosis = result.get('diagnosis', {})
        findings = diagnosis.get('findings', {})
        
        for category in findings:
            if category not in all_findings:
                all_findings[category] = []
            all_findings[category].extend(findings[category])
    
    # Process CBCT findings (may have additional data types)
    for result in results.get("cbct", []):
        diagnosis = result.get('diagnosis', {})
        findings = diagnosis.get('findings', {})
        
        for category in findings:
            if category not in all_findings:
                all_findings[category] = []
            all_findings[category].extend(findings[category])
    
    # Organize findings by quadrant
    for category, items in all_findings.items():
        for item in items:
            # Skip items with confidence below threshold
            if 'confidence' in item and item['confidence'] < CONFIDENCE_THRESHOLD:
                continue
                
            # Get tooth number and determine quadrant
            if 'tooth' in item and item['tooth']:
                try:
                    tooth_num = int(item['tooth'])
                    quadrant = get_quadrant_for_tooth(tooth_num)
                    
                    # Add the finding to the appropriate quadrant and category
                    if category == 'caries':
                        # Add G.V. Black classification for caries
                        if 'surface' in item:
                            item['black_classification'] = classify_caries_black(tooth_num, item['surface'])
                        findings_by_quadrant[quadrant]['caries'].append(item)
                    elif category == 'periapical_lesions':
                        findings_by_quadrant[quadrant]['periapical_lesions'].append(item)
                    elif category == 'restorations':
                        findings_by_quadrant[quadrant]['restorations'].append(item)
                    # Add other categories as needed
                except (ValueError, KeyError):
                    # Skip items with invalid tooth numbers
                    continue
    
    return findings_by_quadrant

def generate_clinical_report(
    findings_by_quadrant: Dict[str, Dict[str, List[Dict[str, Any]]]],
    patient_id: str
) -> Dict[str, Any]:
    """Generate a comprehensive clinical report from organized findings"""
    # Count the total findings by category and quadrant
    totals = {
        "caries": sum(len(q["caries"]) for q in findings_by_quadrant.values()),
        "periapical_lesions": sum(len(q["periapical_lesions"]) for q in findings_by_quadrant.values()),
        "restorations": sum(len(q["restorations"]) for q in findings_by_quadrant.values()),
        "bone_loss": sum(len(q["bone_loss"]) for q in findings_by_quadrant.values())
    }
    
    # Identify affected teeth with multiple conditions
    all_affected_teeth = set()
    teeth_with_multiple_issues = set()
    
    # Track which teeth have which conditions
    teeth_conditions = defaultdict(list)
    
    for quadrant, categories in findings_by_quadrant.items():
        for category, items in categories.items():
            for item in items:
                if 'tooth' in item and item['tooth']:
                    tooth = item['tooth']
                    all_affected_teeth.add(tooth)
                    teeth_conditions[tooth].append(category)
    
    # Identify teeth with multiple issues
    for tooth, conditions in teeth_conditions.items():
        if len(conditions) > 1:
            teeth_with_multiple_issues.add(tooth)
    
    # Generate quadrant-specific summaries
    quadrant_summaries = {}
    for quadrant, categories in findings_by_quadrant.items():
        summary = []
        
        # Add caries summary
        if categories["caries"]:
            caries_by_class = defaultdict(list)
            for caries in categories["caries"]:
                if 'black_classification' in caries:
                    caries_by_class[caries['black_classification']].append(caries['tooth'])
            
            for classification, teeth in caries_by_class.items():
                summary.append(f"{classification} caries on teeth {', '.join(teeth)}")
        
        # Add periapical lesion summary
        if categories["periapical_lesions"]:
            teeth_with_lesions = [lesion['tooth'] for lesion in categories["periapical_lesions"]]
            summary.append(f"Periapical lesions on teeth {', '.join(teeth_with_lesions)}")
        
        # Add restoration summary
        if categories["restorations"]:
            restoration_types = defaultdict(list)
            for restoration in categories["restorations"]:
                if 'type' in restoration:
                    restoration_types[restoration['type']].append(restoration['tooth'])
            
            for r_type, teeth in restoration_types.items():
                summary.append(f"{r_type.capitalize()} restorations on teeth {', '.join(teeth)}")
        
        quadrant_summaries[quadrant] = ". ".join(summary) if summary else "No significant findings"
    
    # Create the final report structure
    report = {
        "patient_id": patient_id,
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "total_affected_teeth": len(all_affected_teeth),
            "teeth_with_multiple_issues": list(teeth_with_multiple_issues),
            "findings_by_category": totals
        },
        "quadrant_summaries": quadrant_summaries,
        "details_by_quadrant": findings_by_quadrant
    }
    
    return report

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Clinical Dental Imaging Analyzer")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="Base URL for the API server")
    parser.add_argument("--patient-id", default=DEFAULT_PATIENT_ID, help="Patient ID for the images")
    parser.add_argument("--test-dir", default="imaging_test", help="Directory containing test images")
    parser.add_argument("--report", default="clinical_analysis_report.json", help="Output file for analysis report")
    parser.add_argument("--confidence", type=float, default=CONFIDENCE_THRESHOLD, 
                      help="Confidence threshold for findings (0.0-1.0)")
    
    args = parser.parse_args()
    
    logger.info("=== Clinical Dental Imaging Analyzer ===")
    logger.info(f"Time: {datetime.now().isoformat()}")
    logger.info(f"API URL: {args.api_url}")
    logger.info(f"Patient ID: {args.patient_id}")
    logger.info(f"Confidence threshold: {args.confidence}")
    
    # Update confidence threshold if specified
    global CONFIDENCE_THRESHOLD
    CONFIDENCE_THRESHOLD = args.confidence
    
    # Check if API port is in use before proceeding
    api_port = int(args.api_url.split(":")[-1].split("/")[0])
    if not is_port_in_use(api_port):
        logger.error(f"❌ API server not running on port {api_port}. Please start the server first.")
        sys.exit(1)
    
    # Test API connection
    logger.info("\nTesting connection to API server...")
    if not test_api_connection(args.api_url):
        logger.error("❌ Failed to connect to API server. Please check if the server is running.")
        sys.exit(1)
    
    logger.info("✅ Connection to API server successful!")
    
    # Set up test directory
    test_dir = args.test_dir
    if not os.path.exists(test_dir):
        test_dir = setup_test_directory(test_dir)
        logger.info(f"\nPlease add images to {test_dir} and run this script again.")
        sys.exit(0)
    
    # Find images by type
    images = find_dental_images(test_dir)
    
    # Count the total number of images
    total_images = sum(len(img_list) for img_list in images.values())
    
    if total_images == 0:
        logger.error(f"\n❌ No images found in {test_dir}. Please add some images and try again.")
        sys.exit(1)
    
    logger.info(f"\nFound {total_images} dental images for analysis:")
    for img_type, img_list in images.items():
        if img_list:
            logger.info(f"  - {len(img_list)} {img_type.upper()} images")
            for img in img_list:
                subtype_info = f" ({img.get('fmx_subtype', '')})" if 'fmx_subtype' in img else ""
                tooth_info = f", Tooth: {img['tooth_number']}" if img['tooth_number'] else ""
                logger.info(f"    * {img['filename']}{subtype_info}{tooth_info}")
    
    # Ask for confirmation
    logger.info("\nReady to analyze these images.")
    confirm = input("Continue? (y/n): ")
    if confirm.lower() != 'y':
        logger.info("Analysis cancelled.")
        sys.exit(0)
    
    # Process all images
    results = process_all_images(images, args.patient_id, args.api_url)
    
    # Organize findings by quadrant
    findings_by_quadrant = organize_findings_by_quadrant(results)
    
    # Generate clinical report
    report = generate_clinical_report(findings_by_quadrant, args.patient_id)
    
    # Save report to file
    with open(args.report, 'w') as f:
        json.dump(report, f, indent=2)
    
    logger.info(f"\n📊 Clinical Analysis Report saved to {args.report}")
    
    # Display summary
    logger.info("\n=== Clinical Analysis Summary ===")
    logger.info(f"Patient ID: {args.patient_id}")
    logger.info(f"Total affected teeth: {report['summary']['total_affected_teeth']}")
    logger.info(f"Teeth with multiple issues: {', '.join(report['summary']['teeth_with_multiple_issues'])}")
    
    # Display findings by category
    for category, count in report['summary']['findings_by_category'].items():
        logger.info(f"{category.replace('_', ' ').title()}: {count}")
    
    # Display quadrant summaries
    logger.info("\n=== Quadrant Summaries ===")
    for quadrant, summary in report['quadrant_summaries'].items():
        logger.info(f"{quadrant}: {summary}")
    
    logger.info("\n✅ Clinical dental imaging analysis complete!")

if __name__ == "__main__":
    main() 