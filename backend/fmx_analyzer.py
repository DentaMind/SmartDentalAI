#!/usr/bin/env python3
"""
FMX Analyzer - Test tool for analyzing Full Mouth X-ray series with DentaMind API.
This script works with the debug server running on port 8092.
"""

import os
import sys
import json
import time
import argparse
import requests
from typing import Dict, List, Any, Optional
from datetime import datetime
from pathlib import Path

# Default settings
DEFAULT_API_URL = "http://localhost:8092"
DEFAULT_PATIENT_ID = "TEST_FMX_PATIENT"

def setup_test_directory(base_dir: str = "fmx_test") -> str:
    """Set up a test directory for FMX images"""
    # Create the test directory if it doesn't exist
    os.makedirs(base_dir, exist_ok=True)
    
    print(f"FMX test directory created: {os.path.abspath(base_dir)}")
    print("Please place your FMX images in this directory.")
    print("Recommended naming format: 'BW_1.jpg', 'PA_3.jpg', 'PANO.jpg', etc.")
    
    return os.path.abspath(base_dir)

def find_images(directory: str) -> List[Dict[str, str]]:
    """Find images in the test directory and categorize them"""
    images = []
    
    for file in os.listdir(directory):
        filepath = os.path.join(directory, file)
        if not os.path.isfile(filepath):
            continue
            
        # Check if the file is an image
        ext = os.path.splitext(file)[1].lower()
        if ext not in ['.jpg', '.jpeg', '.png']:
            continue
        
        # Determine the type of image from filename
        if 'bw' in file.lower():
            image_type = 'bitewing'
        elif 'pa' in file.lower():
            image_type = 'periapical'
        elif 'pano' in file.lower() or 'panoramic' in file.lower():
            image_type = 'panoramic'
        elif 'ceph' in file.lower():
            image_type = 'cephalometric'
        else:
            image_type = 'periapical'  # Default to periapical
        
        # Try to extract tooth number if present
        tooth_number = None
        parts = os.path.splitext(file)[0].split('_')
        for part in parts:
            if part.isdigit() and 1 <= int(part) <= 32:
                tooth_number = part
                break
        
        images.append({
            'filepath': filepath,
            'filename': file,
            'type': image_type,
            'tooth_number': tooth_number
        })
    
    return images

def test_api_connection(base_url: str) -> bool:
    """Test connection to the API"""
    try:
        response = requests.get(f"{base_url}/api/health", timeout=5)
        if response.status_code == 200:
            return True
        return False
    except Exception as e:
        print(f"Error connecting to API: {e}")
        return False

def upload_and_analyze_image(
    filepath: str, 
    image_type: str,
    patient_id: str,
    tooth_number: Optional[str],
    base_url: str
) -> Dict[str, Any]:
    """Upload an image and analyze it using the appropriate endpoint"""
    
    print(f"\nProcessing: {os.path.basename(filepath)}")
    print(f"Type: {image_type}, Tooth: {tooth_number or 'Not specified'}")
    
    # Prepare file for upload
    with open(filepath, 'rb') as f:
        files = {'image': (os.path.basename(filepath), f, 'image/jpeg')}
        
        # Prepare form data
        data = {
            'patient_id': patient_id,
            'xray_type': image_type,
            'notes': f"FMX Analysis - {datetime.now().strftime('%Y-%m-%d')}"
        }
        
        if tooth_number:
            data['tooth_number'] = tooth_number
        
        # Upload to the diagnose endpoint
        url = f"{base_url}/api/diagnose/analyze"
        print(f"Sending to: {url}")
        
        try:
            response = requests.post(url, files=files, data=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Success! Diagnosis ID: {result.get('diagnosis', {}).get('id', 'unknown')}")
                
                # Get summary if available
                summary = result.get('diagnosis', {}).get('summary', '')
                if summary:
                    print(f"Summary: {summary}")
                
                return result
            else:
                print(f"❌ Error: {response.status_code}, {response.text}")
                return {'status': 'error', 'error': response.text}
                
        except Exception as e:
            print(f"❌ Error during analysis: {e}")
            return {'status': 'error', 'error': str(e)}

def create_report(results: List[Dict[str, Any]], output_file: str = "fmx_analysis_report.json"):
    """Create a consolidated report from all image analyses"""
    report = {
        'timestamp': datetime.now().isoformat(),
        'total_images': len(results),
        'results': results
    }
    
    # Save to file
    with open(output_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📊 Analysis Report saved to {output_file}")
    
    # Generate a summary
    all_findings = {}
    
    for result in results:
        diagnosis = result.get('diagnosis', {})
        findings = diagnosis.get('findings', {})
        
        for category, items in findings.items():
            if category not in all_findings:
                all_findings[category] = []
            all_findings[category].extend(items)
    
    print("\n=== Analysis Summary ===")
    for category, items in all_findings.items():
        print(f"\n{category.upper()}: {len(items)} findings")
        if category == 'caries':
            by_severity = {'mild': 0, 'moderate': 0, 'severe': 0}
            teeth_with_caries = set()
            
            for item in items:
                severity = item.get('severity', 'unknown')
                tooth = item.get('tooth', 'unknown')
                by_severity[severity] = by_severity.get(severity, 0) + 1
                teeth_with_caries.add(tooth)
            
            print(f"  Total affected teeth: {len(teeth_with_caries)}")
            print(f"  Severity breakdown: {by_severity}")
            
        elif category == 'periapical_lesions':
            teeth_with_lesions = set(item.get('tooth', 'unknown') for item in items)
            print(f"  Affected teeth: {', '.join(teeth_with_lesions)}")
            
        elif category == 'impacted_teeth':
            impacted = set(item.get('tooth', 'unknown') for item in items)
            print(f"  Impacted teeth: {', '.join(impacted)}")
            
        elif category == 'restorations':
            restored_teeth = set(item.get('tooth', 'unknown') for item in items)
            print(f"  Restored teeth: {', '.join(restored_teeth)}")
    
    return report

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="FMX Analysis Tool for DentaMind")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="Base URL for the API server")
    parser.add_argument("--patient-id", default=DEFAULT_PATIENT_ID, help="Patient ID for the FMX series")
    parser.add_argument("--test-dir", default="fmx_test", help="Directory containing test images")
    parser.add_argument("--report", default="fmx_analysis_report.json", help="Output file for analysis report")
    
    args = parser.parse_args()
    
    print("=== DentaMind FMX Analysis Tool ===")
    print(f"Time: {datetime.now().isoformat()}")
    print(f"API URL: {args.api_url}")
    print(f"Patient ID: {args.patient_id}")
    
    # Test API connection
    print("\nTesting connection to API server...")
    if not test_api_connection(args.api_url):
        print("❌ Failed to connect to API server. Please check if the server is running.")
        sys.exit(1)
    
    print("✅ Connection to API server successful!")
    
    # Set up test directory
    test_dir = args.test_dir
    if not os.path.exists(test_dir):
        test_dir = setup_test_directory(test_dir)
        print(f"\nPlease add images to {test_dir} and run this script again.")
        sys.exit(0)
    
    # Find images
    images = find_images(test_dir)
    if not images:
        print(f"\n❌ No images found in {test_dir}. Please add some images and try again.")
        sys.exit(1)
    
    print(f"\nFound {len(images)} images for analysis:")
    for img in images:
        print(f"  - {img['filename']} ({img['type']}){', Tooth: ' + img['tooth_number'] if img['tooth_number'] else ''}")
    
    # Ask for confirmation
    print("\nReady to analyze these images.")
    confirm = input("Continue? (y/n): ")
    if confirm.lower() != 'y':
        print("Analysis cancelled.")
        sys.exit(0)
    
    # Process each image
    results = []
    for img in images:
        result = upload_and_analyze_image(
            filepath=img['filepath'],
            image_type=img['type'],
            patient_id=args.patient_id,
            tooth_number=img['tooth_number'],
            base_url=args.api_url
        )
        
        results.append(result)
        time.sleep(1)  # Small delay to avoid overwhelming the server
    
    # Create report
    create_report(results, args.report)
    
    print("\n✅ FMX analysis complete!")

if __name__ == "__main__":
    main() 