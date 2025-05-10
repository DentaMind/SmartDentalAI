#!/usr/bin/env python3
"""
Enhanced FMX Analyzer - Test tool for analyzing Full Mouth X-ray series with DentaMind API.
This version provides more detailed diagnostics and automatically submits findings.
"""

import os
import sys
import json
import time
import argparse
import requests
import random
from typing import Dict, List, Any, Optional
from datetime import datetime
from pathlib import Path
from tabulate import tabulate

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
        # Try different health endpoints
        for endpoint in ['/api/health', '/health', '/']:
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            if response.status_code == 200:
                return True
        return False
    except Exception as e:
        print(f"Error connecting to API: {e}")
        return False

def analyze_image(
    filepath: str, 
    image_type: str,
    patient_id: str,
    tooth_number: Optional[str],
    base_url: str
) -> Dict[str, Any]:
    """Upload and analyze an image using the diagnosis endpoint"""
    
    print(f"\n📷 Processing: {os.path.basename(filepath)}")
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
                diagnosis_id = result.get('diagnosis', {}).get('id', 'unknown')
                print(f"✅ Success! Diagnosis ID: {diagnosis_id}")
                
                # Get summary and findings
                diagnosis = result.get('diagnosis', {})
                summary = diagnosis.get('summary', '')
                findings = diagnosis.get('findings', {})
                
                if summary:
                    print(f"📝 Summary: {summary}")
                
                # Print findings details
                if findings:
                    print_findings(findings)
                else:
                    print("ℹ️ No specific findings detected")
                
                return result
            else:
                print(f"❌ Error: {response.status_code}, {response.text}")
                return {'status': 'error', 'error': response.text}
                
        except Exception as e:
            print(f"❌ Error during analysis: {e}")
            return {'status': 'error', 'error': str(e)}

def print_findings(findings: Dict[str, Any]):
    """Print detailed findings in a readable format"""
    if not findings:
        return
    
    # Check for caries
    if 'caries' in findings and findings['caries']:
        caries_data = []
        for caries in findings['caries']:
            caries_data.append([
                caries.get('tooth', 'N/A'),
                caries.get('surface', 'N/A'),
                caries.get('severity', 'N/A'),
                f"{caries.get('confidence', 0) * 100:.1f}%"
            ])
        
        print("\n🦷 CARIES DETECTED:")
        print(tabulate(
            caries_data,
            headers=['Tooth', 'Surface', 'Severity', 'Confidence'],
            tablefmt='grid'
        ))
    
    # Check for periapical lesions
    if 'periapical_lesions' in findings and findings['periapical_lesions']:
        lesion_data = []
        for lesion in findings['periapical_lesions']:
            lesion_data.append([
                lesion.get('tooth', 'N/A'),
                f"{lesion.get('size_mm', 0):.1f} mm",
                f"{lesion.get('confidence', 0) * 100:.1f}%"
            ])
        
        print("\n🔴 PERIAPICAL LESIONS DETECTED:")
        print(tabulate(
            lesion_data,
            headers=['Tooth', 'Size', 'Confidence'],
            tablefmt='grid'
        ))
    
    # Check for restorations
    if 'restorations' in findings and findings['restorations']:
        resto_data = []
        for resto in findings['restorations']:
            resto_data.append([
                resto.get('tooth', 'N/A'),
                resto.get('surfaces', 'N/A'),
                resto.get('type', 'N/A'),
                resto.get('condition', 'N/A')
            ])
        
        print("\n🔧 RESTORATIONS DETECTED:")
        print(tabulate(
            resto_data,
            headers=['Tooth', 'Surfaces', 'Type', 'Condition'],
            tablefmt='grid'
        ))
    
    # Check for impacted teeth
    if 'impacted_teeth' in findings and findings['impacted_teeth']:
        impacted_data = []
        for impacted in findings['impacted_teeth']:
            impacted_data.append([
                impacted.get('tooth', 'N/A'),
                impacted.get('angulation', 'N/A'),
                impacted.get('impaction_level', 'N/A')
            ])
        
        print("\n⚠️ IMPACTED TEETH DETECTED:")
        print(tabulate(
            impacted_data,
            headers=['Tooth', 'Angulation', 'Impaction Level'],
            tablefmt='grid'
        ))

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
    
    # Extract and combine all findings
    all_findings = {
        'caries': [],
        'periapical_lesions': [],
        'restorations': [],
        'impacted_teeth': []
    }
    
    for result in results:
        diagnosis = result.get('diagnosis', {})
        findings = diagnosis.get('findings', {})
        
        for category in all_findings.keys():
            if category in findings:
                all_findings[category].extend(findings[category])
    
    # Generate a comprehensive summary table
    print("\n=== 📋 COMPREHENSIVE ANALYSIS SUMMARY ===")
    
    # Teeth with issues
    affected_teeth = set()
    for category, items in all_findings.items():
        for item in items:
            if 'tooth' in item:
                affected_teeth.add(item['tooth'])
    
    # Count findings by category
    findings_counts = {category: len(items) for category, items in all_findings.items()}
    findings_counts['total_affected_teeth'] = len(affected_teeth)
    
    # Print summary table
    summary_data = [[k, v] for k, v in findings_counts.items()]
    print(tabulate(summary_data, headers=['Category', 'Count'], tablefmt='grid'))
    
    # Print affected teeth list
    if affected_teeth:
        print(f"\nAffected teeth (total of {len(affected_teeth)}):")
        # Sort teeth numerically
        sorted_teeth = sorted(affected_teeth, key=lambda x: int(x) if x.isdigit() else 0)
        print(", ".join(sorted_teeth))
    
    # Generate specific findings tables
    if all_findings['caries']:
        print("\n🦷 ALL CARIES:")
        caries_by_tooth = {}
        for caries in all_findings['caries']:
            tooth = caries.get('tooth', 'unknown')
            if tooth not in caries_by_tooth:
                caries_by_tooth[tooth] = []
            caries_by_tooth[tooth].append(caries)
        
        caries_summary = []
        for tooth, caries_list in caries_by_tooth.items():
            surfaces = set(c.get('surface', '') for c in caries_list)
            severities = set(c.get('severity', '') for c in caries_list)
            caries_summary.append([
                tooth,
                ', '.join(surfaces),
                ', '.join(severities)
            ])
        
        print(tabulate(
            caries_summary,
            headers=['Tooth', 'Surfaces', 'Severities'],
            tablefmt='grid'
        ))
    
    if all_findings['periapical_lesions']:
        print("\n🔴 ALL PERIAPICAL LESIONS:")
        lesion_data = []
        for lesion in all_findings['periapical_lesions']:
            lesion_data.append([
                lesion.get('tooth', 'N/A'),
                f"{lesion.get('size_mm', 0):.1f} mm"
            ])
        
        print(tabulate(
            lesion_data,
            headers=['Tooth', 'Size'],
            tablefmt='grid'
        ))
    
    if all_findings['restorations']:
        print("\n🔧 ALL RESTORATIONS:")
        resto_data = []
        for resto in all_findings['restorations']:
            resto_data.append([
                resto.get('tooth', 'N/A'),
                resto.get('surfaces', 'N/A'),
                resto.get('type', 'N/A'),
                resto.get('condition', 'N/A')
            ])
        
        print(tabulate(
            resto_data,
            headers=['Tooth', 'Surfaces', 'Type', 'Condition'],
            tablefmt='grid'
        ))
    
    return report

def generate_treatment_plan(findings: Dict[str, List[Dict[str, Any]]], patient_id: str, base_url: str):
    """Generate a treatment plan based on findings and submit it to the treatment API"""
    treatment_data = {
        "patient_id": patient_id,
        "procedures": []
    }
    
    procedure_id = 1
    
    # Add procedures for caries
    if 'caries' in findings and findings['caries']:
        for caries in findings['caries']:
            tooth = caries.get('tooth')
            surface = caries.get('surface', '')
            severity = caries.get('severity', 'moderate')
            
            if not tooth:
                continue
            
            # Determine procedure based on severity
            if severity == 'mild':
                procedure = {
                    "id": f"proc-{procedure_id}",
                    "code": "D1352",
                    "description": f"Preventive resin restoration on tooth #{tooth}",
                    "tooth_numbers": [tooth],
                    "surfaces": [surface],
                    "priority": "MEDIUM",
                    "estimated_cost": 120.00,
                    "notes": f"Preventive treatment for mild caries on {surface} surface"
                }
            elif severity == 'moderate':
                procedure = {
                    "id": f"proc-{procedure_id}",
                    "code": "D2392" if 'M' in surface else "D2391",
                    "description": f"Composite restoration on tooth #{tooth}",
                    "tooth_numbers": [tooth],
                    "surfaces": [surface],
                    "priority": "HIGH",
                    "estimated_cost": 230.00,
                    "notes": f"Composite filling for moderate caries on {surface} surface"
                }
            else:  # severe
                procedure = {
                    "id": f"proc-{procedure_id}",
                    "code": "D2790",
                    "description": f"Crown on tooth #{tooth}",
                    "tooth_numbers": [tooth],
                    "surfaces": ["FULL"],
                    "priority": "HIGH",
                    "estimated_cost": 1200.00,
                    "notes": f"Crown indicated due to severe caries destruction"
                }
            
            treatment_data["procedures"].append(procedure)
            procedure_id += 1
    
    # Add procedures for periapical lesions
    if 'periapical_lesions' in findings and findings['periapical_lesions']:
        for lesion in findings['periapical_lesions']:
            tooth = lesion.get('tooth')
            if not tooth:
                continue
            
            procedure = {
                "id": f"proc-{procedure_id}",
                "code": "D3310" if int(tooth) < 17 else "D3320",
                "description": f"Root canal therapy on tooth #{tooth}",
                "tooth_numbers": [tooth],
                "priority": "HIGH",
                "estimated_cost": 1000.00,
                "notes": f"RCT indicated due to periapical lesion"
            }
            
            treatment_data["procedures"].append(procedure)
            procedure_id += 1
    
    # Submit the treatment plan if there are procedures
    if treatment_data["procedures"]:
        print("\n🏥 GENERATING TREATMENT PLAN...")
        try:
            url = f"{base_url}/api/treatment/plan"
            # For demo purposes, we'll just print the treatment plan
            print("Treatment Plan:")
            print(json.dumps(treatment_data, indent=2))
            
            # Commented out actual API call since we don't have this endpoint yet
            # response = requests.post(url, json=treatment_data, timeout=30)
            # if response.status_code == 200:
            #     print(f"✅ Treatment plan successfully submitted!")
            # else:
            #     print(f"❌ Error submitting treatment plan: {response.status_code}, {response.text}")
        except Exception as e:
            print(f"❌ Error generating treatment plan: {e}")
    
    return treatment_data

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Enhanced FMX Analysis Tool for DentaMind")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="Base URL for the API server")
    parser.add_argument("--patient-id", default=DEFAULT_PATIENT_ID, help="Patient ID for the FMX series")
    parser.add_argument("--test-dir", default="fmx_test", help="Directory containing test images")
    parser.add_argument("--report", default="fmx_analysis_report.json", help="Output file for analysis report")
    parser.add_argument("--generate-treatment", action="store_true", help="Generate a treatment plan after analysis")
    
    args = parser.parse_args()
    
    print("=== 🔍 DentaMind Enhanced FMX Analysis Tool ===")
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
        result = analyze_image(
            filepath=img['filepath'],
            image_type=img['type'],
            patient_id=args.patient_id,
            tooth_number=img['tooth_number'],
            base_url=args.api_url
        )
        
        results.append(result)
        time.sleep(1)  # Small delay to avoid overwhelming the server
    
    # Create report
    report = create_report(results, args.report)
    
    # Generate treatment plan if requested
    if args.generate_treatment:
        # Extract all findings from results
        all_findings = {}
        for result in results:
            diagnosis = result.get('diagnosis', {})
            findings = diagnosis.get('findings', {})
            
            for category, items in findings.items():
                if category not in all_findings:
                    all_findings[category] = []
                all_findings[category].extend(items)
        
        generate_treatment_plan(all_findings, args.patient_id, args.api_url)
    
    print("\n✅ FMX analysis complete!")

if __name__ == "__main__":
    main() 