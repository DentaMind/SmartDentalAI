#!/usr/bin/env python3
"""
Test script for uploading a Panoramic image to the DentaMind API
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
DEFAULT_TEST_IMAGE = os.path.join(os.path.dirname(__file__), "attached_assets", "sample-xrays", "sample_panoramic.jpg")
DEFAULT_PATIENT_ID = "TEST123"

def upload_panoramic_image(api_url, image_path, patient_id, notes=None):
    """Upload a Panoramic image to the DentaMind API for analysis"""
    
    if not os.path.exists(image_path):
        logger.error(f"Image file not found: {image_path}")
        return None
    
    # Prepare the API endpoint URL
    url = f"{api_url}/api/image/pano/upload"
    
    # Prepare form data
    data = {
        "patient_id": patient_id
    }
    
    if notes:
        data["notes"] = notes
    
    # Prepare file
    files = {
        "file": (os.path.basename(image_path), open(image_path, "rb"), "image/jpeg")
    }
    
    logger.info(f"Uploading Panoramic image to {url}")
    logger.info(f"Patient ID: {patient_id}")
    
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
    
    print("\n=== Panoramic Analysis Results ===")
    print(f"Image ID: {results.get('image_id', 'Unknown')}")
    print(f"Patient ID: {results.get('patient_id', 'Unknown')}")
    print(f"Upload Time: {results.get('upload_time', 'Unknown')}")
    
    # Display findings
    findings = results.get("analysis", {}).get("findings", {})
    if findings:
        print("\nFindings:")
        
        # Display TMJ findings
        tmj_findings = findings.get("tmj_findings", {})
        if tmj_findings:
            print("\n🔄 TMJ Analysis:")
            right_joint = tmj_findings.get("right_joint", {})
            left_joint = tmj_findings.get("left_joint", {})
            
            print(f"  Right Joint: {right_joint.get('condition', 'Unknown')}")
            print(f"    Disc Position: {right_joint.get('disc_position', 'Unknown')}")
            print(f"    Wilkes Classification: {right_joint.get('wilkes_classification', 'Unknown')}")
            
            print(f"  Left Joint: {left_joint.get('condition', 'Unknown')}")
            print(f"    Disc Position: {left_joint.get('disc_position', 'Unknown')}")
            print(f"    Wilkes Classification: {left_joint.get('wilkes_classification', 'Unknown')}")
            
            notes = tmj_findings.get("notes", [])
            if notes:
                print("  Notes:")
                for note in notes:
                    print(f"    - {note}")
        
        # Display sinus findings
        sinus_findings = findings.get("sinus_findings", {})
        if sinus_findings:
            print("\n👃 Sinus Analysis:")
            right_sinus = sinus_findings.get("right_maxillary_sinus", {})
            left_sinus = sinus_findings.get("left_maxillary_sinus", {})
            
            print(f"  Right Maxillary Sinus: {right_sinus.get('condition', 'Unknown')}")
            print(f"    Mucosal Thickening: {right_sinus.get('mucosal_thickening', 'Unknown')}")
            print(f"    Fluid Level: {right_sinus.get('fluid_level', 'Unknown')}")
            
            print(f"  Left Maxillary Sinus: {left_sinus.get('condition', 'Unknown')}")
            print(f"    Mucosal Thickening: {left_sinus.get('mucosal_thickening', 'Unknown')}")
            print(f"    Fluid Level: {left_sinus.get('fluid_level', 'Unknown')}")
            
            notes = sinus_findings.get("notes", [])
            if notes:
                print("  Notes:")
                for note in notes:
                    print(f"    - {note}")
        
        # Display orthognathic profile
        profile = findings.get("orthognathic_profile", {})
        if profile:
            print("\n👤 Orthognathic Profile:")
            print(f"  Mandibular Symmetry: {profile.get('mandibular_symmetry', 'Unknown')}")
            print(f"  Skeletal Pattern: {profile.get('skeletal_pattern', 'Unknown')}")
            
            condylar_height = profile.get("condylar_height", {})
            if condylar_height:
                print(f"  Condylar Height (R/L): {condylar_height.get('right', 0)} mm / {condylar_height.get('left', 0)} mm")
                print(f"    Difference: {condylar_height.get('difference_percent', 0)}%")
            
            ramus_height = profile.get("ramus_height", {})
            if ramus_height:
                print(f"  Ramus Height (R/L): {ramus_height.get('right', 0)} mm / {ramus_height.get('left', 0)} mm")
                print(f"    Difference: {ramus_height.get('difference_percent', 0)}%")
            
            gonial_angle = profile.get("gonial_angle", {})
            if gonial_angle:
                print(f"  Gonial Angle (R/L): {gonial_angle.get('right', 0)}° / {gonial_angle.get('left', 0)}°")
                print(f"    Average: {gonial_angle.get('average', 0)}°")
        
        # Display common findings
        caries = findings.get("caries", [])
        if caries:
            print("\n🦷 Caries:")
            for i, caries_finding in enumerate(caries, 1):
                print(f"  {i}. Tooth {caries_finding.get('tooth', 'Unknown')}, "
                      f"{caries_finding.get('surface', 'Unknown')} surface, "
                      f"Severity: {caries_finding.get('severity', 'Unknown')}, "
                      f"Confidence: {caries_finding.get('confidence', 0):.2f}")
        
        # Display impacted teeth
        impacted = findings.get("impacted_teeth", [])
        if impacted:
            print("\n🔍 Impacted Teeth:")
            for i, tooth in enumerate(impacted, 1):
                print(f"  {i}. Tooth {tooth.get('tooth', 'Unknown')}, "
                      f"Angulation: {tooth.get('angulation', 'Unknown')}, "
                      f"Confidence: {tooth.get('confidence', 0):.2f}")
    
    # Display summary
    summary = results.get("summary", {})
    if summary:
        print("\n📊 Summary:")
        print(f"  Caries Count: {summary.get('caries_count', 0)}")
        print(f"  Periapical Lesions Count: {summary.get('periapical_lesions_count', 0)}")
        print(f"  Impacted Teeth Count: {summary.get('impacted_teeth_count', 0)}")
        
        significant_findings = summary.get("significant_findings", [])
        if significant_findings:
            print("\n⚠️ Significant Findings:")
            for i, finding in enumerate(significant_findings, 1):
                print(f"  {i}. {finding}")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Test Panoramic image upload to DentaMind API")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="Base URL for the API")
    parser.add_argument("--image", default=DEFAULT_TEST_IMAGE, help="Path to the test image file")
    parser.add_argument("--patient-id", default=DEFAULT_PATIENT_ID, help="Patient ID")
    parser.add_argument("--notes", help="Additional notes (optional)")
    
    args = parser.parse_args()
    
    # Upload the image
    results = upload_panoramic_image(
        api_url=args.api_url,
        image_path=args.image,
        patient_id=args.patient_id,
        notes=args.notes
    )
    
    # Display the results
    if results:
        display_analysis_results(results)
        
        # Save results to a file
        output_file = f"pano_analysis_{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"Results saved to {output_file}")

if __name__ == "__main__":
    main() 