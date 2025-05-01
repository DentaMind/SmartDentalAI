#!/usr/bin/env python3
"""
Test script for uploading a CBCT image to the DentaMind API
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
DEFAULT_TEST_IMAGE = os.path.join(os.path.dirname(__file__), "attached_assets", "sample-xrays", "sample_cbct.jpg")
DEFAULT_PATIENT_ID = "TEST123"

def upload_cbct_image(api_url, image_path, patient_id, region=None, notes=None):
    """Upload a CBCT image to the DentaMind API for analysis"""
    
    if not os.path.exists(image_path):
        logger.error(f"Image file not found: {image_path}")
        return None
    
    # Prepare the API endpoint URL
    url = f"{api_url}/api/image/cbct/upload"
    
    # Prepare form data
    data = {
        "patient_id": patient_id
    }
    
    if region:
        data["region"] = region
    
    if notes:
        data["notes"] = notes
    
    # Determine content type based on file extension
    is_dicom = image_path.lower().endswith('.dcm')
    content_type = "application/dicom" if is_dicom else "image/jpeg"
    
    # Prepare file
    files = {
        "file": (os.path.basename(image_path), open(image_path, "rb"), content_type)
    }
    
    logger.info(f"Uploading CBCT image to {url}")
    logger.info(f"Patient ID: {patient_id}")
    if region:
        logger.info(f"Region: {region}")
    
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
    
    print("\n=== CBCT Analysis Results ===")
    print(f"Image ID: {results.get('image_id', 'Unknown')}")
    print(f"Patient ID: {results.get('patient_id', 'Unknown')}")
    print(f"Upload Time: {results.get('upload_time', 'Unknown')}")
    print(f"Region: {results.get('region', 'Full')}")
    
    # Display findings
    findings = results.get("analysis", {}).get("findings", {})
    if findings:
        print("\nFindings:")
        
        # Display bone measurements
        bone_measurements = findings.get("bone_measurements", {})
        if bone_measurements:
            print("\n📏 Bone Measurements:")
            print(f"  Width: {bone_measurements.get('width_mm', 0)} mm")
            print(f"  Height: {bone_measurements.get('height_mm', 0)} mm")
            print(f"  Depth: {bone_measurements.get('depth_mm', 0)} mm")
            print(f"  Volume: {bone_measurements.get('volume_mm3', 0)} mm³")
            print(f"  Density: {bone_measurements.get('density_hu', 0)} HU")
            print(f"  Bone Quality: {bone_measurements.get('bone_quality', 'Unknown')}")
            print(f"  Cortical Thickness: {bone_measurements.get('cortical_thickness_mm', 0)} mm")
        
        # Display anatomical proximity
        proximity = findings.get("anatomical_proximity", {})
        if proximity:
            structures = proximity.get("structures", [])
            if structures:
                print("\n⚠️ Anatomical Proximity:")
                for i, structure in enumerate(structures, 1):
                    print(f"  {i}. {structure.get('name', 'Unknown')}: "
                          f"{structure.get('distance_mm', 0)} mm {structure.get('direction', '')}")
        
        # Display implant planning
        implant_planning = findings.get("implant_planning", {})
        if implant_planning:
            print("\n🦿 Implant Planning:")
            print(f"  Suitable for Implant: {'Yes' if implant_planning.get('suitable_for_implant', False) else 'No'}")
            print(f"  Augmentation Required: {'Yes' if implant_planning.get('augmentation_required', False) else 'No'}")
            
            dimensions = implant_planning.get("recommended_implant_dimensions", {})
            if dimensions:
                print(f"  Recommended Implant Dimensions: {dimensions.get('length_mm', 0)} mm × "
                      f"{dimensions.get('diameter_mm', 0)} mm")
            
            print(f"  Surgical Approach: {implant_planning.get('surgical_approach', 'Unknown')}")
            
            notes = implant_planning.get("notes", [])
            if notes:
                print("  Notes:")
                for note in notes:
                    print(f"    - {note}")
    
    # Display summary
    summary = results.get("summary", {})
    if summary:
        print("\n📊 Summary:")
        print(f"  Bone Quality: {summary.get('bone_quality', 'Unknown')}")
        print(f"  Implant Suitability: {summary.get('implant_suitability', 'Unknown')}")
        
        significant_findings = summary.get("significant_findings", [])
        if significant_findings:
            print("\n⚠️ Significant Findings:")
            for i, finding in enumerate(significant_findings, 1):
                print(f"  {i}. {finding}")
        
        recommended_treatment = summary.get("recommended_treatment")
        if recommended_treatment:
            print(f"\n🩺 Recommended Treatment: {recommended_treatment}")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Test CBCT image upload to DentaMind API")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="Base URL for the API")
    parser.add_argument("--image", default=DEFAULT_TEST_IMAGE, help="Path to the test image file")
    parser.add_argument("--patient-id", default=DEFAULT_PATIENT_ID, help="Patient ID")
    parser.add_argument("--region", help="Region of interest (e.g., 'mandible_posterior', 'maxilla_anterior')")
    parser.add_argument("--notes", help="Additional notes (optional)")
    
    args = parser.parse_args()
    
    # Upload the image
    results = upload_cbct_image(
        api_url=args.api_url,
        image_path=args.image,
        patient_id=args.patient_id,
        region=args.region,
        notes=args.notes
    )
    
    # Display the results
    if results:
        display_analysis_results(results)
        
        # Save results to a file
        output_file = f"cbct_analysis_{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"Results saved to {output_file}")

if __name__ == "__main__":
    main() 