#!/usr/bin/env python3
"""
Test script for uploading an FMX image to the DentaMind API
"""

import os
import sys
import json
import requests
import argparse
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Default API URL and test image
DEFAULT_API_URL = "http://localhost:8000"
DEFAULT_TEST_IMAGE = os.path.join(os.path.dirname(__file__), "attached_assets", "sample-xrays", "sample_molar.jpg")
DEFAULT_PATIENT_ID = "TEST123"

def upload_fmx_image(api_url, image_path, patient_id, tooth_number=None, notes=None):
    """Upload an FMX image to the DentaMind API for analysis"""
    
    if not os.path.exists(image_path):
        logger.error(f"Image file not found: {image_path}")
        return None
    
    # Prepare the API endpoint URL
    url = f"{api_url}/api/image/fmx/upload"
    
    # Prepare form data
    data = {
        "patient_id": patient_id
    }
    
    if tooth_number:
        data["tooth_number"] = tooth_number
    
    if notes:
        data["notes"] = notes
    
    # Prepare file
    files = {
        "file": (os.path.basename(image_path), open(image_path, "rb"), "image/jpeg")
    }
    
    logger.info(f"Uploading FMX image to {url}")
    logger.info(f"Patient ID: {patient_id}")
    if tooth_number:
        logger.info(f"Tooth Number: {tooth_number}")
    
    try:
        # Send the request
        response = requests.post(url, data=data, files=files)
        
        # Close the file
        files["file"][1].close()
        
        # Check if the request was successful
        if response.status_code == 200:
            logger.info("✅ Upload successful!")
            return response.json()
        else:
            logger.error(f"❌ Upload failed with status code {response.status_code}")
            logger.error(f"Response: {response.text}")
            return None
    
    except Exception as e:
        logger.error(f"❌ Error during upload: {e}")
        # Ensure file is closed
        files["file"][1].close()
        return None

def display_analysis_results(results):
    """Display the analysis results in a human-readable format"""
    
    if not results:
        logger.error("No results to display")
        return
    
    print("\n=== FMX Analysis Results ===")
    print(f"Image ID: {results.get('image_id', 'Unknown')}")
    print(f"Patient ID: {results.get('patient_id', 'Unknown')}")
    print(f"Upload Time: {results.get('upload_time', 'Unknown')}")
    
    # Display findings
    findings = results.get("analysis", {}).get("findings", {})
    if findings:
        print("\nFindings:")
        
        # Display caries
        caries = findings.get("caries", [])
        if caries:
            print("\n🦷 Caries:")
            for i, caries_finding in enumerate(caries, 1):
                print(f"  {i}. Tooth {caries_finding.get('tooth', 'Unknown')}, "
                      f"{caries_finding.get('surface', 'Unknown')} surface, "
                      f"Severity: {caries_finding.get('severity', 'Unknown')}, "
                      f"Black Class: {caries_finding.get('black_classification', 'Unknown')}, "
                      f"Confidence: {caries_finding.get('confidence', 0):.2f}")
        
        # Display periapical lesions
        lesions = findings.get("periapical_lesions", [])
        if lesions:
            print("\n🔴 Periapical Lesions:")
            for i, lesion in enumerate(lesions, 1):
                print(f"  {i}. Tooth {lesion.get('tooth', 'Unknown')}, "
                      f"Diameter: {lesion.get('diameter_mm', 0)} mm, "
                      f"Confidence: {lesion.get('confidence', 0):.2f}")
        
        # Display restorations
        restorations = findings.get("restorations", [])
        if restorations:
            print("\n🔧 Restorations:")
            for i, restoration in enumerate(restorations, 1):
                print(f"  {i}. Tooth {restoration.get('tooth', 'Unknown')}, "
                      f"{restoration.get('surface', 'Unknown')} surface, "
                      f"Type: {restoration.get('type', 'Unknown')}, "
                      f"Confidence: {restoration.get('confidence', 0):.2f}")
    
    # Display summary
    summary = results.get("summary", {})
    if summary:
        print("\n📊 Summary:")
        print(f"  Caries Count: {summary.get('caries_count', 0)}")
        print(f"  Periapical Lesions Count: {summary.get('periapical_lesions_count', 0)}")
        print(f"  Restorations Count: {summary.get('restorations_count', 0)}")
        
        significant_findings = summary.get("significant_findings", [])
        if significant_findings:
            print("\n⚠️ Significant Findings:")
            for i, finding in enumerate(significant_findings, 1):
                print(f"  {i}. {finding}")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Test FMX image upload to DentaMind API")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="Base URL for the API")
    parser.add_argument("--image", default=DEFAULT_TEST_IMAGE, help="Path to the test image file")
    parser.add_argument("--patient-id", default=DEFAULT_PATIENT_ID, help="Patient ID")
    parser.add_argument("--tooth", help="Tooth number (optional)")
    parser.add_argument("--notes", help="Additional notes (optional)")
    
    args = parser.parse_args()
    
    # Upload the image
    results = upload_fmx_image(
        api_url=args.api_url,
        image_path=args.image,
        patient_id=args.patient_id,
        tooth_number=args.tooth,
        notes=args.notes
    )
    
    # Display the results
    if results:
        display_analysis_results(results)
        
        # Save results to a file
        output_file = f"fmx_analysis_{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"Results saved to {output_file}")

if __name__ == "__main__":
    main() 