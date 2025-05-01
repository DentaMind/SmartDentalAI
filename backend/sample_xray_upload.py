#!/usr/bin/env python3
"""
Test script for uploading and analyzing a dental X-ray image with the DentaMind API.
"""

import requests
import json
import sys
import os
import glob
from pprint import pprint
from datetime import datetime

# Base URL of the API
BASE_URL = "http://localhost:8090"  # Change to match your server port

def find_sample_images():
    """Find sample X-ray images to use for testing"""
    # Check common locations for sample images
    search_paths = [
        "attached_assets/sample-xrays/*.jpg",
        "attached_assets/sample-xrays/*.png",
        "../attached_assets/sample-xrays/*.jpg", 
        "../attached_assets/sample-xrays/*.png",
        "../public/sample-xrays/*.jpg",
        "../public/sample-xrays/*.png",
        "attached_assets/xrays/sample/*.jpg",
        "attached_assets/xrays/sample/*.png"
    ]
    
    for path in search_paths:
        images = glob.glob(path)
        if images:
            return images
    
    return []

def upload_and_analyze(image_path, patient_id="TEST123", image_type="panoramic"):
    """Upload an X-ray image and analyze it"""
    print(f"Uploading image: {image_path}")
    print(f"Patient ID: {patient_id}")
    print(f"Image Type: {image_type}")
    
    url = f"{BASE_URL}/api/diagnose/analyze"
    
    # Prepare files and form data
    files = {
        'image': (os.path.basename(image_path), open(image_path, 'rb'), 'image/jpeg')
    }
    
    data = {
        'patient_id': patient_id,
        'xray_type': image_type,
        'notes': 'Test upload from sample script'
    }
    
    try:
        # Make the request
        print(f"Sending request to {url}...")
        response = requests.post(url, files=files, data=data)
        
        # Check response
        if response.status_code == 200:
            print("✅ Success! Image uploaded and analyzed.")
            print("\nAnalysis Results:")
            result = response.json()
            
            # Print diagnosis summary
            if 'diagnosis' in result:
                diagnosis = result['diagnosis']
                print(f"\nDiagnosis ID: {diagnosis.get('id')}")
                print(f"Date: {diagnosis.get('date')}")
                print(f"Summary: {diagnosis.get('summary')}")
                
                # Print findings
                findings = diagnosis.get('findings', {})
                print("\nFindings:")
                for category, items in findings.items():
                    print(f"\n{category.capitalize()}:")
                    for item in items:
                        print(f"  - {json.dumps(item)}")
            
            # Print model info            
            print(f"\nModel: {result.get('model_info', {}).get('version', 'unknown')}")
            
            return True
        else:
            print(f"❌ Failed! Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        # Close the file
        files['image'][1].close()

def main():
    """Main function"""
    print("=== DentaMind X-ray Upload Test ===")
    print(f"Time: {datetime.now().isoformat()}")
    
    # Look for sample images
    sample_images = find_sample_images()
    
    if not sample_images:
        print("No sample X-ray images found. Please add some sample images to one of the following locations:")
        print("  - attached_assets/sample-xrays/")
        print("  - public/sample-xrays/")
        print("  - attached_assets/xrays/sample/")
        sys.exit(1)
        
    print(f"Found {len(sample_images)} sample images.")
    
    # Use the first image
    image_path = sample_images[0]
    
    # Upload and analyze
    success = upload_and_analyze(image_path)
    
    if success:
        print("\nTest completed successfully!")
    else:
        print("\nTest failed. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main() 