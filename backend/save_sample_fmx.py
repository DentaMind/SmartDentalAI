#!/usr/bin/env python3
"""
Save sample FMX images to the fmx_test directory.
This script extracts and saves the example FMX images for testing.
"""

import os
import sys
import base64
import requests
from io import BytesIO
from PIL import Image
import numpy as np
from urllib.parse import urlparse

def ensure_directory(directory):
    """Ensure the given directory exists"""
    if not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)
    return directory

def save_sample_images():
    """Save sample FMX images to the fmx_test directory"""
    # Define the FMX test directory
    fmx_dir = ensure_directory('fmx_test')
    
    # Define sample FMX image URLs to download
    sample_urls = [
        # First row (from left to right)
        {"url": "https://i.postimg.cc/Y05nKbRJ/dental-1-4.jpg", "filename": "PA_14.jpg"},
        {"url": "https://i.postimg.cc/vZVp1v15/dental-1-5.jpg", "filename": "PA_15.jpg"},
        {"url": "https://i.postimg.cc/RhHkQwwV/dental-bitewing-1-5.jpg", "filename": "BW_15.jpg"},
        {"url": "https://i.postimg.cc/ZRD9cdvt/dental-bitewing-7-10.jpg", "filename": "BW_7_10.jpg"},
        {"url": "https://i.postimg.cc/rpM7jwhG/dental-implant-13.jpg", "filename": "PA_Implant_13.jpg"},
        
        # Second row
        {"url": "https://i.postimg.cc/j2LByTkP/dental-4-31-30.jpg", "filename": "PA_19_20.jpg"},
        {"url": "https://i.postimg.cc/QMHkYR3y/dental-bitewing-30-31.jpg", "filename": "BW_30_31.jpg"},
        {"url": "https://i.postimg.cc/7YR1C8Tq/dental-7-8-bitewing.jpg", "filename": "BW_7_8.jpg"},
        {"url": "https://i.postimg.cc/hvx9c4Sb/dental-9-10-bitewing.jpg", "filename": "BW_9_10.jpg"},
        {"url": "https://i.postimg.cc/L8cW1yRd/dental-9-10.jpg", "filename": "PA_9_10.jpg"},
        
        # Third row
        {"url": "https://i.postimg.cc/cCFHTjmB/dental-31-30.jpg", "filename": "PA_31_30.jpg"},
        {"url": "https://i.postimg.cc/tgwGGnbS/dental-31-30-bitewing.jpg", "filename": "BW_31_30.jpg"},
        {"url": "https://i.postimg.cc/zvQVf4C9/dental-28-25-scan.jpg", "filename": "SCAN_28_25.jpg"},
        {"url": "https://i.postimg.cc/VkHK8L40/dental-22-24.jpg", "filename": "PA_22_24.jpg"},
        {"url": "https://i.postimg.cc/8P8fFcpj/dental-19-21.jpg", "filename": "PA_19_21.jpg"},
        
        # Fourth row
        {"url": "https://i.postimg.cc/Jnmxf4sB/dental-implant-31.jpg", "filename": "PA_Implant_31.jpg"},
        {"url": "https://i.postimg.cc/RZ9tTCsZ/dental-implant-22-19.jpg", "filename": "PA_Implant_22_19.jpg"},
        {"url": "https://i.postimg.cc/xTQmQX39/dental-implant-root-canal-22.jpg", "filename": "PA_RCT_22.jpg"},
        {"url": "https://i.postimg.cc/Y0pj9G05/dental-19-18.jpg", "filename": "PA_19_18.jpg"},
        {"url": "https://i.postimg.cc/4yMStk1z/dental-19-18-panoramic.jpg", "filename": "PANO.jpg"}
    ]
    
    print(f"Saving sample FMX images to {fmx_dir}...")
    saved_count = 0
    
    for item in sample_urls:
        url = item["url"]
        filename = item["filename"]
        filepath = os.path.join(fmx_dir, filename)
        
        try:
            print(f"Downloading {filename} from {url}...")
            response = requests.get(url, stream=True)
            
            if response.status_code == 200:
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                print(f"✅ Saved {filename}")
                saved_count += 1
            else:
                print(f"❌ Failed to download {filename}: {response.status_code}")
        except Exception as e:
            print(f"❌ Error downloading {filename}: {e}")
    
    print(f"\nSuccessfully saved {saved_count} out of {len(sample_urls)} FMX images.")
    
    if saved_count == 0:
        print("Failed to save any images. Using alternative approach...")
        
        # As a fallback, try to save an empty test image
        try:
            # Create a blank image as a fallback
            blank_img = Image.new('RGB', (800, 600), color='white')
            blank_path = os.path.join(fmx_dir, 'test_blank.jpg')
            blank_img.save(blank_path)
            print(f"Created blank test image at {blank_path}")
        except Exception as e:
            print(f"Error creating blank image: {e}")

def main():
    """Main function"""
    print("=== DentaMind Sample FMX Image Saver ===")
    
    # Save sample images
    save_sample_images()
    
    print(f"\nNext steps:")
    print(f"1. Run the FMX analyzer script: python fmx_analyzer.py")
    print(f"2. Make sure the debug server is running on port 8092 (./start_alt_server.sh)")
    print(f"3. Check the fmx_analysis_report.json for results")

if __name__ == "__main__":
    main() 