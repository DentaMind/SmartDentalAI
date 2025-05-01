#!/usr/bin/env python3
"""
Dental Imaging Analyzer - Main entry point for all dental imaging analysis tools.
Provides a unified interface for analyzing FMX, Panoramic, and CBCT dental images.
"""

import os
import sys
import json
import time
import logging
import argparse
import subprocess
from typing import Dict, List, Any, Optional
from datetime import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("dental_imaging.log")
    ]
)
logger = logging.getLogger(__name__)

# Default settings
DEFAULT_API_URL = "http://localhost:8092"
DEFAULT_PATIENT_ID = "COMPREHENSIVE_DENTAL_ANALYSIS"
DEFAULT_BASE_DIR = "imaging_test"

def check_environment():
    """Check that required dependencies and files are available"""
    # Check for required Python files
    required_files = [
        "clinical_analyzer.py",
        "cbct_analyzer.py",
        "panoramic_analyzer.py"
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.isfile(file):
            missing_files.append(file)
    
    if missing_files:
        logger.error(f"Missing required files: {', '.join(missing_files)}")
        return False
    
    # Check for required Python packages
    try:
        import requests
        from tabulate import tabulate
    except ImportError as e:
        logger.error(f"Missing required dependencies: {e}")
        logger.error("Please install required packages using: pip install requests tabulate")
        return False
    
    return True

def test_api_connection(base_url: str) -> bool:
    """Test connection to the API server"""
    try:
        import requests
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

def setup_directory_structure(base_dir: str = DEFAULT_BASE_DIR):
    """Set up directory structure for all dental imaging types"""
    logger.info(f"Setting up directory structure in {base_dir}")
    
    # Create main directory
    os.makedirs(base_dir, exist_ok=True)
    
    # Create subdirectories for different image types
    subdirs = ["fmx", "panoramic", "cbct"]
    for subdir in subdirs:
        os.makedirs(os.path.join(base_dir, subdir), exist_ok=True)
    
    logger.info(f"Created directories for FMX, Panoramic, and CBCT images")
    logger.info(f"Please add dental images to {os.path.abspath(base_dir)} subdirectories")

def run_analysis(
    analysis_type: str,
    api_url: str,
    patient_id: str,
    base_dir: str,
    confidence: float = 0.65,
    generate_treatment: bool = False
):
    """Run the specified analysis type"""
    logger.info(f"Running {analysis_type.upper()} analysis")
    
    # Choose the appropriate analyzer script
    if analysis_type == "clinical":
        script = "clinical_analyzer.py"
        args = [
            "--api-url", api_url,
            "--patient-id", patient_id,
            "--test-dir", base_dir,
            "--confidence", str(confidence)
        ]
        if generate_treatment:
            args.append("--generate-treatment")
    
    elif analysis_type == "cbct":
        script = "cbct_analyzer.py"
        args = [
            "--api-url", api_url,
            "--patient-id", patient_id,
            "--cbct-dir", os.path.join(base_dir, "cbct")
        ]
    
    elif analysis_type == "panoramic":
        script = "panoramic_analyzer.py"
        args = [
            "--api-url", api_url,
            "--patient-id", patient_id,
            "--pano-dir", os.path.join(base_dir, "panoramic"),
            "--confidence", str(confidence)
        ]
    
    else:
        logger.error(f"Unknown analysis type: {analysis_type}")
        return
    
    # Prepare command
    cmd = [sys.executable, script] + args
    logger.info(f"Running command: {' '.join(cmd)}")
    
    # Run the analyzer
    try:
        result = subprocess.run(cmd, check=True, text=True, capture_output=True)
        logger.info(f"Analysis output:")
        for line in result.stdout.splitlines():
            logger.info(f"  {line}")
        
        if result.stderr:
            logger.warning(f"Analysis warnings/errors:")
            for line in result.stderr.splitlines():
                logger.warning(f"  {line}")
    
    except subprocess.CalledProcessError as e:
        logger.error(f"Analysis failed: {e}")
        if e.output:
            logger.error(f"Output: {e.output}")
        if e.stderr:
            logger.error(f"Error: {e.stderr}")
    
    except Exception as e:
        logger.error(f"Error running analysis: {e}")

def merge_reports(patient_id: str):
    """Merge all reports into a comprehensive dental imaging analysis"""
    logger.info("Merging all analysis reports into a comprehensive report")
    
    # List of report files to merge
    report_files = [
        "clinical_analysis_report.json",
        "cbct_analysis_report.json",
        "panoramic_analysis_report.json"
    ]
    
    # Load each available report
    reports = {}
    missing_reports = []
    
    for report_file in report_files:
        if os.path.isfile(report_file):
            try:
                with open(report_file, 'r') as f:
                    reports[report_file] = json.load(f)
                logger.info(f"Loaded {report_file}")
            except Exception as e:
                logger.error(f"Error loading {report_file}: {e}")
        else:
            missing_reports.append(report_file)
            logger.warning(f"Missing report file: {report_file}")
    
    if not reports:
        logger.error("No reports found to merge")
        return
    
    # Create a comprehensive report structure
    comprehensive_report = {
        "patient_id": patient_id,
        "timestamp": datetime.now().isoformat(),
        "reports_included": list(reports.keys()),
        "reports_missing": missing_reports,
        "clinical_findings": {},
        "radiographic_findings": {},
        "recommendations": []
    }
    
    # Extract clinical findings
    clinical_report = reports.get("clinical_analysis_report.json", {})
    if clinical_report:
        # Extract quadrant-based findings
        comprehensive_report["clinical_findings"]["by_quadrant"] = clinical_report.get("details_by_quadrant", {})
        
        # Extract clinical summary
        comprehensive_report["clinical_findings"]["summary"] = clinical_report.get("summary", {})
    
    # Extract CBCT findings
    cbct_report = reports.get("cbct_analysis_report.json", {})
    if cbct_report:
        comprehensive_report["radiographic_findings"]["cbct"] = {
            "bone_measurements": cbct_report.get("bone_measurements", {}),
            "implant_recommendations": cbct_report.get("implant_recommendations", []),
            "summary": cbct_report.get("summary", {})
        }
    
    # Extract panoramic findings
    pano_report = reports.get("panoramic_analysis_report.json", {})
    if pano_report:
        comprehensive_report["radiographic_findings"]["panoramic"] = {
            "significant_findings": pano_report.get("summary", {}).get("significant_findings", []),
            "orthognathic_profile": pano_report.get("orthognathic_profile", {}),
            "detailed_findings": pano_report.get("detailed_findings", {})
        }
        
        # Add panoramic recommendations
        if "clinical_recommendations" in pano_report:
            for rec in pano_report["clinical_recommendations"]:
                if rec not in comprehensive_report["recommendations"]:
                    comprehensive_report["recommendations"].append(rec)
    
    # Save the comprehensive report
    comprehensive_report_file = f"comprehensive_dental_analysis_{patient_id}.json"
    with open(comprehensive_report_file, 'w') as f:
        json.dump(comprehensive_report, f, indent=2)
    
    logger.info(f"Comprehensive dental imaging analysis saved to {comprehensive_report_file}")
    
    # Print summary of findings
    print("\n=== COMPREHENSIVE DENTAL IMAGING ANALYSIS ===")
    print(f"Patient ID: {patient_id}")
    print(f"Analysis date: {datetime.now().strftime('%Y-%m-%d')}")
    print(f"Reports included: {len(comprehensive_report['reports_included'])}")
    print(f"Reports missing: {len(comprehensive_report['reports_missing'])}")
    
    # Print key findings from each analysis
    if "clinical_findings" in comprehensive_report and comprehensive_report["clinical_findings"]:
        summary = comprehensive_report["clinical_findings"].get("summary", {})
        total_affected = summary.get("total_affected_teeth", 0)
        print(f"\nClinical Analysis Summary:")
        print(f"  - Total affected teeth: {total_affected}")
        
        # Print findings by category if available
        if "findings_by_category" in summary:
            for category, count in summary["findings_by_category"].items():
                if count > 0:
                    print(f"  - {category.replace('_', ' ').title()}: {count}")
    
    # Print CBCT findings
    if "radiographic_findings" in comprehensive_report and "cbct" in comprehensive_report["radiographic_findings"]:
        cbct = comprehensive_report["radiographic_findings"]["cbct"]
        print(f"\nCBCT Analysis Summary:")
        if "summary" in cbct:
            for key, value in cbct["summary"].items():
                print(f"  - {key.replace('_', ' ').title()}: {value}")
        
        # Print implant recommendations
        if "implant_recommendations" in cbct and cbct["implant_recommendations"]:
            print(f"\nImplant Recommendations:")
            for rec in cbct["implant_recommendations"]:
                print(f"  - Position {rec['position']}: {rec['recommended_implant']}, {rec['surgical_approach']}")
    
    # Print panoramic findings
    if "radiographic_findings" in comprehensive_report and "panoramic" in comprehensive_report["radiographic_findings"]:
        pano = comprehensive_report["radiographic_findings"]["panoramic"]
        print(f"\nPanoramic Analysis Summary:")
        if "significant_findings" in pano:
            for finding in pano["significant_findings"]:
                print(f"  - {finding}")
        
        if "orthognathic_profile" in pano:
            profile = pano["orthognathic_profile"]
            print(f"\nOrthognathic Profile:")
            print(f"  - Skeletal pattern: {profile.get('skeletal_pattern', 'Not available')}")
            print(f"  - Mandibular symmetry: {profile.get('mandibular_symmetry', 'Not available')}")
    
    # Print recommendations
    if comprehensive_report["recommendations"]:
        print(f"\nClinical Recommendations:")
        for rec in comprehensive_report["recommendations"]:
            priority = rec.get("priority", "medium").upper()
            print(f"  - [{priority}] {rec['description']}")
    
    print("\n✅ Comprehensive dental imaging analysis complete!")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Dental Imaging Analyzer")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="Base URL for the API server")
    parser.add_argument("--patient-id", default=DEFAULT_PATIENT_ID, help="Patient ID for all analyses")
    parser.add_argument("--base-dir", default=DEFAULT_BASE_DIR, help="Base directory for dental images")
    parser.add_argument("--analysis", choices=["all", "clinical", "cbct", "panoramic"], default="all",
                      help="Type of analysis to perform")
    parser.add_argument("--confidence", type=float, default=0.65, help="Confidence threshold for findings (0.0-1.0)")
    parser.add_argument("--generate-treatment", action="store_true", help="Generate treatment plan after analysis")
    parser.add_argument("--setup-only", action="store_true", help="Only set up directories without analysis")
    
    args = parser.parse_args()
    
    logger.info("=== DentaMind Dental Imaging Analyzer ===")
    logger.info(f"Time: {datetime.now().isoformat()}")
    
    # Check environment
    if not check_environment():
        logger.error("Environment check failed. Please fix the issues and try again.")
        sys.exit(1)
    
    # Set up directory structure
    setup_directory_structure(args.base_dir)
    
    if args.setup_only:
        logger.info("Setup complete. Exiting as requested.")
        sys.exit(0)
    
    # Test API connection
    logger.info(f"Testing connection to API server at {args.api_url}")
    if not test_api_connection(args.api_url):
        logger.error("Failed to connect to API server. Please check if the server is running.")
        sys.exit(1)
    
    logger.info("API server connection successful!")
    
    # Run the specified analyses
    if args.analysis == "all" or args.analysis == "clinical":
        run_analysis("clinical", args.api_url, args.patient_id, args.base_dir, 
                    args.confidence, args.generate_treatment)
    
    if args.analysis == "all" or args.analysis == "cbct":
        run_analysis("cbct", args.api_url, args.patient_id, args.base_dir, args.confidence)
    
    if args.analysis == "all" or args.analysis == "panoramic":
        run_analysis("panoramic", args.api_url, args.patient_id, args.base_dir, args.confidence)
    
    # Merge reports
    if args.analysis == "all":
        merge_reports(args.patient_id)
    
    logger.info("All analyses complete!")

if __name__ == "__main__":
    main() 