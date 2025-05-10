#!/usr/bin/env python3
"""
Clinical Dataset Validation Script

Validates the structure and content of the clinical dataset used by DentaMind.
"""

import os
import json
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional, Set, Tuple
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Constants
SUPPORTED_INSTITUTES = ["BU", "HMS", "UCSF", "Mayo"]
SUPPORTED_IMAGE_TYPES = ["xray", "panoramic", "cbct", "photo", "scan"]
REQUIRED_METADATA_FIELDS = ["patient_id", "demographics", "imaging"]
REQUIRED_DEMOGRAPHICS_FIELDS = ["age", "sex"]
SUPPORTED_IMAGE_EXTENSIONS = {
    "xray": [".dcm", ".png", ".jpg", ".jpeg"],
    "panoramic": [".dcm", ".png", ".jpg", ".jpeg"],
    "cbct": [".dcm"],
    "photo": [".jpg", ".jpeg", ".png"],
    "scan": [".stl", ".ply", ".obj"]
}

def is_valid_date_dir(name: str) -> bool:
    """Check if directory name is a valid date format (YYYY-MM-DD) or 'test'"""
    if name == "test":
        return True
    if len(name) != 10:
        return False
    try:
        year, month, day = name.split("-")
        if not (len(year) == 4 and len(month) == 2 and len(day) == 2):
            return False
        if not (year.isdigit() and month.isdigit() and day.isdigit()):
            return False
        # Basic validation (not checking if date is valid)
        if not (1900 <= int(year) <= 2100 and 1 <= int(month) <= 12 and 1 <= int(day) <= 31):
            return False
        return True
    except ValueError:
        return False

def validate_metadata_file(file_path: Path) -> Tuple[bool, List[str]]:
    """Validate metadata.json file content"""
    errors = []
    
    try:
        with open(file_path, 'r') as f:
            metadata = json.load(f)
    except Exception as e:
        errors.append(f"Failed to parse JSON: {str(e)}")
        return False, errors
    
    # Check required fields
    for field in REQUIRED_METADATA_FIELDS:
        if field not in metadata:
            errors.append(f"Missing required field: {field}")
    
    # Check demographics fields if present
    if "demographics" in metadata:
        for field in REQUIRED_DEMOGRAPHICS_FIELDS:
            if field not in metadata["demographics"]:
                errors.append(f"Missing required demographics field: {field}")
    
    # Check imaging data if present
    if "imaging" in metadata:
        for img_type, img_list in metadata["imaging"].items():
            if img_type not in SUPPORTED_IMAGE_TYPES:
                errors.append(f"Unsupported image type: {img_type}")
            
            for img_data in img_list:
                if "filename" not in img_data:
                    errors.append(f"Missing filename in {img_type} entry")
                elif not any(img_data["filename"].endswith(ext) for ext in SUPPORTED_IMAGE_EXTENSIONS.get(img_type, [])):
                    errors.append(f"Invalid file extension for {img_data['filename']}")
                
                # Check if the referenced file exists
                img_file = file_path.parent / img_data["filename"]
                if not img_file.exists():
                    errors.append(f"Referenced file does not exist: {img_data['filename']}")
    
    return len(errors) == 0, errors

def validate_directory_structure(base_dir: Path) -> Tuple[int, int, List[str]]:
    """
    Validate the clinical data directory structure.
    
    Args:
        base_dir: Base directory for clinical data
        
    Returns:
        Tuple of (patients_count, errors_count, error_messages)
    """
    if not base_dir.exists() or not base_dir.is_dir():
        return 0, 1, [f"Base directory does not exist: {base_dir}"]
    
    patients_count = 0
    errors = []
    
    # Check institute directories
    institute_dirs = [d for d in base_dir.iterdir() if d.is_dir()]
    for institute_dir in institute_dirs:
        if institute_dir.name not in SUPPORTED_INSTITUTES:
            errors.append(f"Unsupported institute directory: {institute_dir.name}")
            continue
        
        # Check date directories
        date_dirs = [d for d in institute_dir.iterdir() if d.is_dir()]
        if not date_dirs:
            errors.append(f"No date directories found in {institute_dir.name}/")
            continue
        
        for date_dir in date_dirs:
            if not is_valid_date_dir(date_dir.name):
                errors.append(f"Invalid date directory format: {date_dir.name} (should be YYYY-MM-DD)")
                continue
            
            # Check patient directories
            patient_dirs = [d for d in date_dir.iterdir() if d.is_dir()]
            if not patient_dirs:
                errors.append(f"No patient directories found in {institute_dir.name}/{date_dir.name}/")
                continue
            
            for patient_dir in patient_dirs:
                patients_count += 1
                
                # Check for metadata.json
                metadata_file = patient_dir / "metadata.json"
                if not metadata_file.exists():
                    errors.append(f"Missing metadata.json in {institute_dir.name}/{date_dir.name}/{patient_dir.name}/")
                else:
                    is_valid, metadata_errors = validate_metadata_file(metadata_file)
                    if not is_valid:
                        for error in metadata_errors:
                            errors.append(f"Metadata error in {institute_dir.name}/{date_dir.name}/{patient_dir.name}/: {error}")
                
                # Check for image type directories
                for img_type in SUPPORTED_IMAGE_TYPES:
                    img_dir = patient_dir / img_type
                    if not img_dir.exists() or not img_dir.is_dir():
                        errors.append(f"Missing {img_type} directory in {institute_dir.name}/{date_dir.name}/{patient_dir.name}/")
                    else:
                        # Check if image files have valid extensions
                        img_files = [f for f in img_dir.iterdir() if f.is_file()]
                        for img_file in img_files:
                            if not any(img_file.name.endswith(ext) for ext in SUPPORTED_IMAGE_EXTENSIONS.get(img_type, [])):
                                errors.append(f"Invalid file extension for {img_file.name} in {img_type} directory")
    
    return patients_count, len(errors), errors

def create_example_structure(base_dir: Path) -> None:
    """Create an example clinical data structure"""
    logger.info("Creating example clinical data structure...")
    
    example_institute = "BU"
    example_date = "2023-12-01"
    example_patient = "patient0001"
    
    # Create institute directory
    institute_dir = base_dir / example_institute
    institute_dir.mkdir(exist_ok=True)
    
    # Create date directory
    date_dir = institute_dir / example_date
    date_dir.mkdir(exist_ok=True)
    
    # Create patient directory
    patient_dir = date_dir / example_patient
    patient_dir.mkdir(exist_ok=True)
    
    # Create image type directories
    for img_type in SUPPORTED_IMAGE_TYPES:
        img_dir = patient_dir / img_type
        img_dir.mkdir(exist_ok=True)
    
    # Create example metadata.json
    metadata = {
        "patient_id": example_patient,
        "demographics": {
            "age": 45,
            "sex": "F",
            "smoking_status": "non-smoker",
            "medical_conditions": []
        },
        "dental_history": {
            "last_cleaning": "2023-10-15",
            "previous_treatments": []
        },
        "imaging": {
            "xray": [
                {
                    "filename": "xray/example_001.png",
                    "date_taken": "2023-12-01",
                    "type": "bitewing",
                    "region": "upper_right",
                    "tooth_numbers": ["14", "15", "16"],
                    "annotations": []
                }
            ]
        }
    }
    
    with open(patient_dir / "metadata.json", 'w') as f:
        json.dump(metadata, f, indent=2)
    
    # Create example image file
    with open(patient_dir / "xray" / "example_001.png", 'w') as f:
        f.write("This is a placeholder for a real image file.")
    
    logger.info(f"Created example structure at {patient_dir}")

def main():
    parser = argparse.ArgumentParser(description="Validate DentaMind clinical dataset structure")
    parser.add_argument("--dir", type=str, default="./data/clinical", help="Base directory of the clinical dataset")
    parser.add_argument("--create-example", action="store_true", help="Create an example directory structure")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose output")
    
    args = parser.parse_args()
    base_dir = Path(args.dir)
    
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    
    # Create example structure if requested
    if args.create_example:
        create_example_structure(base_dir)
        logger.info("Example structure created. Run the script without --create-example to validate.")
        return
    
    logger.info(f"Validating clinical data structure at {base_dir}")
    patients_count, errors_count, errors = validate_directory_structure(base_dir)
    
    # Print summary
    logger.info(f"Validation complete: {patients_count} patients processed, {errors_count} errors found")
    
    if errors_count > 0:
        logger.error("Validation errors:")
        for i, error in enumerate(errors, 1):
            logger.error(f"{i}. {error}")
        sys.exit(1)
    else:
        logger.info("Directory structure is valid.")
        sys.exit(0)

if __name__ == "__main__":
    main() 