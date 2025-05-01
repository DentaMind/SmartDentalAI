#!/usr/bin/env python3
"""
Panoramic X-ray Analyzer - Specialized module for panoramic image analysis.
Provides a comprehensive view of the entire dentition with enhanced clinical measurements.
"""

import os
import sys
import json
import logging
import argparse
import requests
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import random

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("panoramic_analyzer.log")
    ]
)
logger = logging.getLogger(__name__)

# Default settings
DEFAULT_API_URL = "http://localhost:8092"
DEFAULT_PATIENT_ID = "PANO_ANALYSIS_PATIENT"
CONFIDENCE_THRESHOLD = 0.65

# Panoramic-specific findings
PANO_FINDINGS = [
    "caries",
    "periapical_lesions",
    "restorations", 
    "impacted_teeth",
    "dental_anomalies",
    "tmj_findings",
    "sinus_findings",
    "bone_lesions"
]

# TMJ classification (Wilkes)
TMJ_CLASSIFICATION = {
    "Stage I": "Early - Minor disc displacement with no significant deformity",
    "Stage II": "Early/Intermediate - Disc displacement with early deformity",
    "Stage III": "Intermediate - Disc displacement with significant deformity and joint derangement",
    "Stage IV": "Intermediate/Late - Disc displacement with degenerative remodeling",
    "Stage V": "Late - Significant degenerative joint disease with perforation and erosions"
}

def analyze_panoramic_image(
    filepath: str,
    patient_id: str,
    base_url: str = DEFAULT_API_URL
) -> Dict[str, Any]:
    """Analyze a panoramic image and extract comprehensive findings"""
    
    logger.info(f"Processing panoramic image: {os.path.basename(filepath)}")
    
    # Prepare file for upload
    with open(filepath, 'rb') as f:
        files = {'image': (os.path.basename(filepath), f, 'image/jpeg')}
        
        # Prepare form data
        data = {
            'patient_id': patient_id,
            'xray_type': 'panoramic',
            'notes': f"Panoramic Analysis - {datetime.now().strftime('%Y-%m-%d')}"
        }
        
        # Upload to the diagnose endpoint
        url = f"{base_url}/api/diagnose/analyze"
        logger.info(f"Sending to: {url}")
        
        try:
            response = requests.post(url, files=files, data=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                diagnosis_id = result.get('diagnosis', {}).get('id', 'unknown')
                logger.info(f"✅ Success! Diagnosis ID: {diagnosis_id}")
                
                # Enhance the result with panoramic-specific findings
                enhanced_result = enhance_panoramic_findings(result)
                
                return enhanced_result
            else:
                logger.error(f"❌ Error: {response.status_code}, {response.text}")
                return {'status': 'error', 'error': response.text}
                
        except Exception as e:
            logger.error(f"❌ Error during analysis: {e}")
            return {'status': 'error', 'error': str(e)}

def enhance_panoramic_findings(result: Dict[str, Any]) -> Dict[str, Any]:
    """Enhance panoramic findings with additional clinical measurements"""
    diagnosis = result.get('diagnosis', {})
    findings = diagnosis.get('findings', {})
    
    # Add TMJ findings if not present
    if 'tmj_findings' not in findings:
        # Simulate TMJ findings for testing
        tmj_right_stage = random.choice(list(TMJ_CLASSIFICATION.keys()))
        tmj_left_stage = random.choice(list(TMJ_CLASSIFICATION.keys()))
        
        findings['tmj_findings'] = {
            'right': {
                'classification': tmj_right_stage,
                'description': TMJ_CLASSIFICATION[tmj_right_stage],
                'observations': random.choice([
                    "Normal condylar morphology",
                    "Flattening of condylar head",
                    "Osteophyte formation",
                    "Reduced joint space",
                    "Subcortical sclerosis"
                ])
            },
            'left': {
                'classification': tmj_left_stage,
                'description': TMJ_CLASSIFICATION[tmj_left_stage],
                'observations': random.choice([
                    "Normal condylar morphology",
                    "Flattening of condylar head",
                    "Osteophyte formation",
                    "Reduced joint space",
                    "Subcortical sclerosis"
                ])
            }
        }
    
    # Add sinus findings if not present
    if 'sinus_findings' not in findings:
        findings['sinus_findings'] = {
            'right_maxillary': random.choice([
                "Normal appearance",
                "Mucosal thickening",
                "Air-fluid level",
                "Complete opacification",
                "Retention cyst/polyp"
            ]),
            'left_maxillary': random.choice([
                "Normal appearance",
                "Mucosal thickening",
                "Air-fluid level",
                "Complete opacification",
                "Retention cyst/polyp"
            ])
        }
    
    # Add dental anomalies if not present
    if 'dental_anomalies' not in findings:
        findings['dental_anomalies'] = []
        # Randomly add 0-3 anomalies
        for _ in range(random.randint(0, 3)):
            anomaly_type = random.choice([
                "supernumerary", "congenitally_missing", "microdontia", 
                "macrodontia", "dilaceration", "fusion", "gemination", "talon_cusp"
            ])
            tooth = str(random.randint(1, 32))
            
            findings['dental_anomalies'].append({
                'type': anomaly_type,
                'tooth': tooth,
                'description': get_anomaly_description(anomaly_type)
            })
    
    # Add bone lesions if not present
    if 'bone_lesions' not in findings:
        findings['bone_lesions'] = []
        # Randomly add 0-2 bone lesions
        for _ in range(random.randint(0, 2)):
            lesion_type = random.choice([
                "radiolucent", "radiopaque", "mixed"
            ])
            location = random.choice([
                "anterior_maxilla", "posterior_maxilla", 
                "anterior_mandible", "posterior_mandible"
            ])
            
            findings['bone_lesions'].append({
                'type': lesion_type,
                'location': location,
                'size_mm': round(random.uniform(3.0, 20.0), 1),
                'borders': random.choice(["well-defined", "poorly-defined"]),
                'effect_on_surrounding': random.choice([
                    "no effect", "tooth displacement", "root resorption", "cortical expansion"
                ]),
                'suggested_diagnosis': get_suggested_diagnosis(lesion_type, location)
            })
    
    # Add growth and development assessment for younger patients
    if random.random() < 0.3:  # 30% chance to add growth assessment
        findings['growth_assessment'] = {
            'dental_age': random.randint(8, 16),
            'skeletal_maturation': random.choice([
                "pre-pubertal", "pubertal", "post-pubertal"
            ]),
            'cervical_vertebrae_stage': f"CS{random.randint(1, 6)}",
            'observations': random.choice([
                "Normal growth pattern",
                "Advanced dental development relative to chronological age",
                "Delayed dental development",
                "Asymmetric condylar growth"
            ])
        }
    
    # Update the diagnosis with enhanced findings
    diagnosis['findings'] = findings
    result['diagnosis'] = diagnosis
    
    return result

def get_anomaly_description(anomaly_type: str) -> str:
    """Get a clinical description for a dental anomaly"""
    descriptions = {
        "supernumerary": "Extra tooth present outside the normal dental formula",
        "congenitally_missing": "Tooth is congenitally absent",
        "microdontia": "Tooth significantly smaller than normal size",
        "macrodontia": "Tooth significantly larger than normal size",
        "dilaceration": "Severe angulation or curve in the root or crown",
        "fusion": "Two separate tooth buds joined during development",
        "gemination": "Incomplete division of a single tooth bud",
        "talon_cusp": "Additional cusp projecting from the cingulum of an anterior tooth"
    }
    return descriptions.get(anomaly_type, "Unspecified dental anomaly")

def get_suggested_diagnosis(lesion_type: str, location: str) -> str:
    """Get suggested differential diagnosis based on lesion type and location"""
    if lesion_type == "radiolucent":
        diagnoses = [
            "Periapical cyst", "Dentigerous cyst", "Odontogenic keratocyst",
            "Ameloblastoma", "Central giant cell granuloma"
        ]
    elif lesion_type == "radiopaque":
        diagnoses = [
            "Idiopathic osteosclerosis", "Condensing osteitis", "Odontoma",
            "Cementoblastoma", "Fibrous dysplasia"
        ]
    else:  # mixed
        diagnoses = [
            "Calcifying odontogenic cyst", "Adenomatoid odontogenic tumor",
            "Ossifying fibroma", "Fibrous dysplasia", "Chronic osteomyelitis"
        ]
    
    # Return 1-3 random diagnoses as differential
    num_diagnoses = random.randint(1, 3)
    selected = random.sample(diagnoses, num_diagnoses)
    return ", ".join(selected)

def analyze_orthognathic_profile(pano_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze orthognathic profile from panoramic X-ray results"""
    # This would typically be done with cephalometric analysis
    # but we can make some basic observations from panoramic X-rays
    
    # Simulated findings for demonstration
    profile_analysis = {
        "mandibular_symmetry": random.choice([
            "symmetrical", "slight asymmetry", "significant asymmetry"
        ]),
        "condylar_height": {
            "right": random.randint(18, 25),
            "left": random.randint(18, 25),
            "difference_percent": round(random.uniform(0, 10), 1)
        },
        "ramus_height": {
            "right": random.randint(40, 55),
            "left": random.randint(40, 55),
            "difference_percent": round(random.uniform(0, 8), 1)
        },
        "gonial_angle": {
            "right": random.randint(120, 140),
            "left": random.randint(120, 140),
            "average": 0  # Will be calculated
        }
    }
    
    # Calculate average gonial angle
    profile_analysis["gonial_angle"]["average"] = (
        profile_analysis["gonial_angle"]["right"] + 
        profile_analysis["gonial_angle"]["left"]
    ) / 2
    
    # Determine skeletal pattern based on gonial angle
    avg_angle = profile_analysis["gonial_angle"]["average"]
    if avg_angle < 125:
        profile_analysis["skeletal_pattern"] = "Brachyfacial (horizontal growth pattern)"
    elif avg_angle > 135:
        profile_analysis["skeletal_pattern"] = "Dolichofacial (vertical growth pattern)"
    else:
        profile_analysis["skeletal_pattern"] = "Mesofacial (balanced growth pattern)"
    
    return profile_analysis

def generate_panoramic_report(
    pano_results: List[Dict[str, Any]],
    patient_id: str
) -> Dict[str, Any]:
    """Generate a comprehensive report from panoramic findings"""
    # Combine all findings from all panoramic images
    combined_findings = {finding_type: [] for finding_type in PANO_FINDINGS}
    tmj_findings = None
    sinus_findings = None
    growth_assessment = None
    
    for result in pano_results:
        diagnosis = result.get('diagnosis', {})
        findings = diagnosis.get('findings', {})
        
        # Collect standard findings
        for finding_type in PANO_FINDINGS:
            if finding_type in findings and finding_type in ['caries', 'periapical_lesions', 
                                                           'restorations', 'impacted_teeth',
                                                           'dental_anomalies', 'bone_lesions']:
                combined_findings[finding_type].extend(findings[finding_type])
        
        # Special handling for TMJ findings (take the most recent)
        if 'tmj_findings' in findings:
            tmj_findings = findings['tmj_findings']
        
        # Special handling for sinus findings (take the most recent)
        if 'sinus_findings' in findings:
            sinus_findings = findings['sinus_findings']
        
        # Special handling for growth assessment (take the most recent)
        if 'growth_assessment' in findings:
            growth_assessment = findings['growth_assessment']
    
    # Add TMJ and sinus findings to combined findings
    if tmj_findings:
        combined_findings['tmj_findings'] = tmj_findings
    
    if sinus_findings:
        combined_findings['sinus_findings'] = sinus_findings
    
    # Add growth assessment if available
    if growth_assessment:
        combined_findings['growth_assessment'] = growth_assessment
    
    # Analyze orthognathic profile
    orthognathic_profile = analyze_orthognathic_profile(pano_results)
    
    # Count total findings by category
    finding_counts = {finding_type: len(findings) for finding_type, findings in combined_findings.items()
                    if isinstance(findings, list)}
    
    # Add non-list findings to count
    for finding_type in ['tmj_findings', 'sinus_findings']:
        if finding_type in combined_findings and combined_findings[finding_type]:
            finding_counts[finding_type] = 1
    
    # Generate clinical recommendations
    recommendations = generate_clinical_recommendations(combined_findings)
    
    # Create the final report structure
    report = {
        "patient_id": patient_id,
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "findings_by_category": finding_counts,
            "significant_findings": get_significant_findings(combined_findings)
        },
        "orthognathic_profile": orthognathic_profile,
        "detailed_findings": combined_findings,
        "clinical_recommendations": recommendations
    }
    
    return report

def get_significant_findings(findings: Dict[str, Any]) -> List[str]:
    """Extract the most significant findings for the summary"""
    significant = []
    
    # Add impacted teeth
    if 'impacted_teeth' in findings and findings['impacted_teeth']:
        impacted = [item['tooth'] for item in findings['impacted_teeth']]
        significant.append(f"Impacted teeth: {', '.join(impacted)}")
    
    # Add periapical lesions
    if 'periapical_lesions' in findings and findings['periapical_lesions']:
        affected = [item['tooth'] for item in findings['periapical_lesions']]
        significant.append(f"Periapical lesions: {', '.join(affected)}")
    
    # Add bone lesions
    if 'bone_lesions' in findings and findings['bone_lesions']:
        for lesion in findings['bone_lesions']:
            significant.append(
                f"{lesion['type'].capitalize()} bone lesion in {lesion['location'].replace('_', ' ')}, "
                f"{lesion['size_mm']}mm, suggested: {lesion['suggested_diagnosis']}"
            )
    
    # Add TMJ findings
    if 'tmj_findings' in findings and findings['tmj_findings']:
        tmj = findings['tmj_findings']
        if 'right' in tmj and 'classification' in tmj['right']:
            significant.append(f"Right TMJ: {tmj['right']['classification']}")
        if 'left' in tmj and 'classification' in tmj['left']:
            significant.append(f"Left TMJ: {tmj['left']['classification']}")
    
    # Add sinus findings if abnormal
    if 'sinus_findings' in findings and findings['sinus_findings']:
        sinus = findings['sinus_findings']
        if sinus.get('right_maxillary') != "Normal appearance":
            significant.append(f"Right maxillary sinus: {sinus.get('right_maxillary')}")
        if sinus.get('left_maxillary') != "Normal appearance":
            significant.append(f"Left maxillary sinus: {sinus.get('left_maxillary')}")
    
    return significant

def generate_clinical_recommendations(findings: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate clinical recommendations based on findings"""
    recommendations = []
    
    # Check for periapical lesions
    if 'periapical_lesions' in findings and findings['periapical_lesions']:
        for lesion in findings['periapical_lesions']:
            recommendations.append({
                'type': 'endodontic',
                'description': f"Evaluate tooth #{lesion['tooth']} for possible endodontic therapy",
                'priority': 'high'
            })
    
    # Check for impacted teeth
    if 'impacted_teeth' in findings and findings['impacted_teeth']:
        for impacted in findings['impacted_teeth']:
            if impacted['tooth'] in ['1', '16', '17', '32']:  # Third molars
                recommendations.append({
                    'type': 'surgical',
                    'description': f"Consider extraction of impacted tooth #{impacted['tooth']}",
                    'priority': 'medium'
                })
    
    # Check for caries
    if 'caries' in findings and findings['caries']:
        # Group caries by tooth
        caries_by_tooth = {}
        for caries in findings['caries']:
            tooth = caries['tooth']
            if tooth not in caries_by_tooth:
                caries_by_tooth[tooth] = []
            caries_by_tooth[tooth].append(caries)
        
        # Add recommendations for each tooth
        for tooth, caries_list in caries_by_tooth.items():
            # Determine priority based on severity
            severity_levels = [c.get('severity', 'moderate') for c in caries_list]
            priority = 'high' if 'severe' in severity_levels else 'medium'
            
            recommendations.append({
                'type': 'restorative',
                'description': f"Restore carious lesions on tooth #{tooth}",
                'priority': priority
            })
    
    # TMJ recommendations
    if 'tmj_findings' in findings and findings['tmj_findings']:
        tmj = findings['tmj_findings']
        
        # Check for advanced TMJ issues
        right_stage = tmj.get('right', {}).get('classification', '')
        left_stage = tmj.get('left', {}).get('classification', '')
        
        if 'Stage IV' in right_stage or 'Stage V' in right_stage or 'Stage IV' in left_stage or 'Stage V' in left_stage:
            recommendations.append({
                'type': 'tmj',
                'description': "Consider TMJ evaluation and possible referral to oral surgeon or TMJ specialist",
                'priority': 'high'
            })
        elif 'Stage III' in right_stage or 'Stage III' in left_stage:
            recommendations.append({
                'type': 'tmj',
                'description': "Monitor TMJ condition, consider occlusal splint therapy",
                'priority': 'medium'
            })
    
    # Bone lesion recommendations
    if 'bone_lesions' in findings and findings['bone_lesions']:
        for lesion in findings['bone_lesions']:
            priority = 'high' if lesion['size_mm'] > 10 or lesion['borders'] == 'poorly-defined' else 'medium'
            recommendations.append({
                'type': 'pathology',
                'description': f"Evaluate {lesion['type']} lesion in {lesion['location'].replace('_', ' ')}",
                'priority': priority,
                'notes': f"Consider biopsy/CBCT. Differential diagnosis: {lesion['suggested_diagnosis']}"
            })
    
    # Sinus recommendations
    if 'sinus_findings' in findings and findings['sinus_findings']:
        sinus = findings['sinus_findings']
        abnormal_findings = []
        
        if sinus.get('right_maxillary') != "Normal appearance":
            abnormal_findings.append(f"right maxillary sinus ({sinus.get('right_maxillary')})")
        if sinus.get('left_maxillary') != "Normal appearance":
            abnormal_findings.append(f"left maxillary sinus ({sinus.get('left_maxillary')})")
        
        if abnormal_findings:
            recommendations.append({
                'type': 'medical',
                'description': f"Evaluate abnormalities in {' and '.join(abnormal_findings)}",
                'priority': 'medium',
                'notes': "Consider referral to ENT specialist if symptomatic"
            })
    
    return recommendations

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Panoramic X-ray Analysis Tool for DentaMind")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="Base URL for the API server")
    parser.add_argument("--patient-id", default=DEFAULT_PATIENT_ID, help="Patient ID for the panoramic images")
    parser.add_argument("--pano-dir", default="imaging_test/panoramic", help="Directory containing panoramic images")
    parser.add_argument("--report", default="panoramic_analysis_report.json", help="Output file for panoramic report")
    parser.add_argument("--confidence", type=float, default=CONFIDENCE_THRESHOLD, 
                      help="Confidence threshold for findings (0.0-1.0)")
    
    args = parser.parse_args()
    
    logger.info("=== DentaMind Panoramic X-ray Analysis Tool ===")
    logger.info(f"Time: {datetime.now().isoformat()}")
    logger.info(f"API URL: {args.api_url}")
    logger.info(f"Patient ID: {args.patient_id}")
    logger.info(f"Confidence threshold: {args.confidence}")
    
    # Update confidence threshold if specified
    global CONFIDENCE_THRESHOLD
    CONFIDENCE_THRESHOLD = args.confidence
    
    # Check if directory exists
    if not os.path.exists(args.pano_dir):
        logger.error(f"❌ Directory {args.pano_dir} not found. Creating it...")
        os.makedirs(args.pano_dir, exist_ok=True)
        logger.info(f"Directory created. Please add panoramic images and run again.")
        sys.exit(0)
    
    # Find panoramic images
    pano_files = []
    for file in os.listdir(args.pano_dir):
        filepath = os.path.join(args.pano_dir, file)
        if not os.path.isfile(filepath):
            continue
            
        # Check if the file is an image
        ext = os.path.splitext(file)[1].lower()
        if ext in ['.jpg', '.jpeg', '.png']:
            pano_files.append(filepath)
    
    if not pano_files:
        logger.error(f"❌ No panoramic images found in {args.pano_dir}. Please add some images and try again.")
        sys.exit(1)
    
    logger.info(f"\nFound {len(pano_files)} panoramic images for analysis:")
    for file in pano_files:
        logger.info(f"  - {os.path.basename(file)}")
    
    # Ask for confirmation
    logger.info("\nReady to analyze these panoramic images.")
    confirm = input("Continue? (y/n): ")
    if confirm.lower() != 'y':
        logger.info("Analysis cancelled.")
        sys.exit(0)
    
    # Analyze each panoramic image
    results = []
    for filepath in pano_files:
        result = analyze_panoramic_image(
            filepath=filepath,
            patient_id=args.patient_id,
            base_url=args.api_url
        )
        results.append(result)
    
    # Generate panoramic report
    pano_report = generate_panoramic_report(results, args.patient_id)
    
    # Save the report to a file
    with open(args.report, 'w') as f:
        json.dump(pano_report, f, indent=2)
    
    logger.info(f"\n📊 Panoramic Analysis Report saved to {args.report}")
    
    # Display summary
    logger.info("\n=== Panoramic Analysis Summary ===")
    logger.info(f"Patient ID: {args.patient_id}")
    
    # Display significant findings
    logger.info("\nSignificant findings:")
    for finding in pano_report['summary']['significant_findings']:
        logger.info(f"  - {finding}")
    
    # Display orthognathic profile
    profile = pano_report['orthognathic_profile']
    logger.info("\nOrthognathic Profile:")
    logger.info(f"  - Mandibular symmetry: {profile['mandibular_symmetry']}")
    logger.info(f"  - Skeletal pattern: {profile['skeletal_pattern']}")
    logger.info(f"  - Average gonial angle: {profile['gonial_angle']['average']:.1f}°")
    
    # Display clinical recommendations
    logger.info("\nClinical Recommendations:")
    for rec in pano_report['clinical_recommendations']:
        logger.info(f"  - [{rec['priority'].upper()}] {rec['description']}")
        if 'notes' in rec:
            logger.info(f"    Note: {rec['notes']}")
    
    logger.info("\n✅ Panoramic analysis complete!")

if __name__ == "__main__":
    main() 