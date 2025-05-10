# Diagnose API Documentation

## Overview

The Diagnose API module provides capabilities for AI-based dental X-ray analysis and diagnosis. It uses the Roboflow service to analyze dental X-rays and identify pathology such as caries, periapical lesions, and impacted teeth. The API also provides endpoints for retrieving patient diagnosis history and sample data for testing.

## Endpoints

### Test Connection

```
GET /api/diagnose/test
```

Simple endpoint to verify the diagnose service is functioning correctly.

**Response:**
```json
{
  "timestamp": "2025-04-30T12:34:56.789012",
  "status": "diagnose module healthy",
  "sample_output": {
    "caries": [
      {"tooth": "18", "surface": "O", "confidence": 0.89, "severity": "moderate"},
      {"tooth": "46", "surface": "MOD", "confidence": 0.95, "severity": "severe"}
    ]
  }
}
```

### Analyze X-ray

```
POST /api/diagnose/analyze
```

Analyze a dental X-ray image and provide AI-based diagnosis.

**Form Parameters:**
- `image`: The X-ray image file (required)
- `patient_id`: ID of the patient (required)
- `xray_type`: Type of X-ray (required) - one of: panoramic, bitewing, periapical, cephalometric, cbct-slice
- `notes`: Optional notes about the image

**Response:**
```json
{
  "status": "success",
  "diagnosis": {
    "id": "diag_12345678",
    "patient_id": "123456",
    "image_id": "img_12345678",
    "date": "2025-04-30T12:34:56.789012",
    "xray_type": "panoramic",
    "findings": {
      "caries": [
        {"tooth": "18", "surface": "O", "confidence": 0.89, "severity": "moderate"},
        {"tooth": "46", "surface": "MOD", "confidence": 0.95, "severity": "severe"}
      ],
      "periapical_lesions": [
        {"tooth": "22", "confidence": 0.92, "diameter_mm": 4.5}
      ],
      "impacted_teeth": [
        {"tooth": "38", "confidence": 0.97, "angulation": "mesioangular"}
      ]
    },
    "summary": "Moderate caries on teeth 18. Severe caries on teeth 46. Periapical lesions detected on teeth 22. Impacted teeth: 38.",
    "notes": "Patient reported pain in lower right quadrant"
  },
  "model_info": {
    "version": "dental-xray-detection@5"
  }
}
```

### Get Patient Diagnosis History

```
GET /api/diagnose/history/{patient_id}
```

Retrieves the diagnosis history for a specific patient.

**Path Parameters:**
- `patient_id`: ID of the patient

**Response:**
```json
{
  "patient_id": "123456",
  "diagnoses": [
    {
      "id": "diag-001",
      "patient_id": "123456",
      "image_id": "img-001",
      "date": "2023-01-15T10:30:00",
      "xray_type": "panoramic",
      "findings": {
        "caries": [
          {"tooth": "18", "surface": "O", "confidence": 0.89, "severity": "moderate"},
          {"tooth": "46", "surface": "MOD", "confidence": 0.95, "severity": "severe"}
        ],
        "periapical_lesions": [
          {"tooth": "22", "confidence": 0.92, "diameter_mm": 4.5}
        ],
        "impacted_teeth": [
          {"tooth": "38", "confidence": 0.97, "angulation": "mesioangular"}
        ]
      },
      "summary": "Moderate caries detected on 18, 46. Periapical lesion on 22."
    },
    {
      "id": "diag-002",
      "patient_id": "123456",
      "image_id": "img-002",
      "date": "2023-06-20T14:45:00",
      "xray_type": "bitewing",
      "findings": {
        "caries": [
          {"tooth": "46", "surface": "MOD", "confidence": 0.92, "severity": "severe"},
          {"tooth": "24", "surface": "D", "confidence": 0.78, "severity": "incipient"}
        ]
      },
      "summary": "Progression of caries on 46. New incipient caries on 24."
    }
  ]
}
```

### Get Sample Diagnosis

```
GET /api/diagnose/sample
```

Returns a sample diagnosis for testing and demonstration purposes.

**Response:**
```json
{
  "patient_id": "SAMPLE_PATIENT",
  "image_id": "SAMPLE_XRAY_001",
  "timestamp": "2025-04-30T12:34:56.789012",
  "findings": {
    "caries": [
      {"tooth": "18", "surface": "O", "confidence": 0.89, "severity": "moderate"},
      {"tooth": "46", "surface": "MOD", "confidence": 0.95, "severity": "severe"}
    ],
    "periapical_lesions": [
      {"tooth": "22", "confidence": 0.92, "diameter_mm": 4.5}
    ],
    "impacted_teeth": [
      {"tooth": "38", "confidence": 0.97, "angulation": "mesioangular"}
    ]
  }
}
```

## Implementation Details

1. The analysis is performed using the Roboflow service with a dental X-ray detection model
2. Images are saved to the `attached_assets/xrays/{patient_id}/` directory
3. Each diagnosis gets a unique ID prefixed with `diag_`
4. The system generates human-readable summaries from the AI findings
5. If the Roboflow API key is missing or analysis fails, the system will fallback to sample data

## Findings Interpretation

The API returns findings in several categories:

### Caries
- **tooth**: FDI tooth numbering system (11-48)
- **surface**: Tooth surface (O = Occlusal, M = Mesial, D = Distal, B = Buccal, L = Lingual, MOD = Mesial-Occlusal-Distal)
- **confidence**: AI confidence score (0-1)
- **severity**: mild, moderate, severe

### Periapical Lesions
- **tooth**: FDI tooth numbering system
- **confidence**: AI confidence score (0-1)
- **diameter_mm**: Estimated diameter in millimeters

### Impacted Teeth
- **tooth**: FDI tooth numbering system
- **confidence**: AI confidence score (0-1)
- **angulation**: mesioangular, distoangular, horizontal, vertical

### Restorations
- **tooth**: FDI tooth numbering system
- **surface**: Tooth surface
- **type**: amalgam, composite, crown, inlay, onlay
- **confidence**: AI confidence score (0-1)

## Error Handling

Common errors include:
- 400: Invalid X-ray type or parameters
- 404: Patient not found
- 500: Failed to analyze image or server error

## Authentication

All routes require valid authentication in production mode. Ensure you include a valid JWT token in the Authorization header. 