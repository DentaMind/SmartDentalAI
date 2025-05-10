# DentaMind Clinical Dataset Structure

This directory contains the clinical datasets used for DentaMind's diagnostic AI, organized by source institution, date, and patient ID.

## Directory Structure

```
data/clinical/
├── BU/                      # Boston University School of Dental Medicine
│   └── YYYY-MM-DD/          # Date folders
│       └── PatientID/       # Patient-specific folders
│           ├── metadata.json
│           ├── xray/
│           ├── panoramic/
│           ├── cbct/
│           ├── photo/
│           └── scan/
├── HMS/                     # Harvard Medical School
├── UCSF/                    # University of California, San Francisco
└── Mayo/                    # Mayo Clinic
```

## Metadata Format

Each patient folder should contain a `metadata.json` file with the following structure:

```json
{
  "patient_id": "P12345",
  "demographics": {
    "age": 45,
    "sex": "F",
    "smoking_status": "former",
    "medical_conditions": ["hypertension", "diabetes"]
  },
  "dental_history": {
    "last_cleaning": "2023-03-15",
    "previous_treatments": ["root canal", "crown"]
  },
  "imaging": {
    "xray": [
      {
        "filename": "xray/FMX_001.dcm",
        "date_taken": "2023-05-20",
        "type": "bitewing",
        "region": "upper_right",
        "tooth_numbers": ["14", "15", "16"],
        "annotations": [
          {
            "type": "caries",
            "location": "distal_14",
            "confidence": 0.92,
            "annotator": "dr_smith",
            "verified": true
          }
        ]
      }
    ],
    "panoramic": [
      {
        "filename": "panoramic/PAN_001.dcm",
        "date_taken": "2023-05-20"
      }
    ]
  }
}
```

## File Formats

- **X-rays and Radiographs**: Primarily DICOM (.dcm) format. When DICOM is unavailable, high-quality PNG or JPEG (16-bit).
- **Intraoral Photos**: High-resolution JPG or PNG files.
- **CBCT Scans**: DICOM series with clear slice information.
- **3D Scans**: STL or PLY format for mesh data.

## Naming Conventions

- All filenames should follow the pattern: `[type]_[sequence]_[tooth_numbers].[extension]`
- Examples:
  - `bitewing_001_18-14.dcm`
  - `periapical_002_22-27.dcm`
  - `intraoral_front_11-21.jpg`

## Image Preprocessing Guidelines

Before adding images to the dataset:

1. **Patient Identifiers**: Remove all visible PHI (Protected Health Information).
2. **Orientation**: Ensure consistent orientation (e.g., all panoramic images in the same direction).
3. **Quality Control**: Images should meet minimum quality standards (no blur, proper exposure).
4. **Bit Depth**: Maintain original bit depth of images, especially for X-rays (typically 12-16 bit).
5. **Compression**: Use lossless compression for radiographic images.

## Usage in DentaMind

This dataset structure is used by the DentaMind platform to:

1. Train and validate AI diagnostic models
2. Maintain a reference collection of verified cases
3. Support integration with clinical workflows

## Adding New Data

When adding new clinical data:

1. Create appropriate date and patient folders
2. Include complete metadata.json file
3. Ensure all PHI is removed from images
4. Verify that all files adhere to the naming conventions
5. Run the validation script: `python scripts/validate_clinical_data.py` 