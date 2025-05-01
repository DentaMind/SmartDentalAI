# Image API Documentation

## Overview

The Image API module enables uploading, storing, and analyzing dental X-ray images using the Roboflow AI service. It provides endpoints for:

1. Uploading new dental images
2. Analyzing existing images
3. Retrieving image history for patients
4. Getting sample analysis results for testing

## Endpoints

### Test Connection

```
GET /api/image/test
```

Simple endpoint to verify the image service is functioning correctly.

**Response:**
```json
{
  "timestamp": "2025-04-30T12:34:56.789012",
  "status": "image module healthy"
}
```

### Upload Image

```
POST /api/image/upload
```

Uploads a dental X-ray image and processes it through the AI analysis.

**Form Parameters:**
- `file`: The image file (required)
- `patient_id`: ID of the patient (required)
- `image_type`: Type of X-ray (required) - one of: panoramic, bitewing, periapical
- `notes`: Optional notes about the image

**Response:**
```json
{
  "status": "success",
  "image_id": "img_12345678",
  "patient_id": "123456",
  "upload_time": "2025-04-30T12:34:56.789012",
  "file_path": "/path/to/image/file.jpg",
  "image_type": "panoramic",
  "notes": "Patient reported pain in lower right quadrant",
  "analysis": {
    "timestamp": "2025-04-30T12:34:56.789012",
    "model": "dental-xray-detection@5",
    "findings": {
      "caries": [
        {
          "tooth": "18",
          "surface": "O",
          "confidence": 0.89,
          "severity": "moderate",
          "position": {"x": 120, "y": 240, "width": 20, "height": 15}
        }
      ],
      "periapical_lesions": [
        {
          "tooth": "22",
          "confidence": 0.92,
          "diameter_mm": 4.5,
          "position": {"x": 200, "y": 180, "width": 15, "height": 15}
        }
      ]
    },
    "success": true
  }
}
```

### Analyze Existing Image

```
GET /api/image/analyze/{image_id}?patient_id={patient_id}
```

Analyze an image that has already been uploaded.

**Path Parameters:**
- `image_id`: ID of the image to analyze

**Query Parameters:**
- `patient_id`: ID of the patient the image belongs to

**Response:**
```json
{
  "image_id": "img_12345678",
  "patient_id": "123456",
  "analysis_time": "2025-04-30T12:34:56.789012",
  "analysis": {
    "timestamp": "2025-04-30T12:34:56.789012",
    "model": "dental-xray-detection@5",
    "findings": {
      "caries": [
        {
          "tooth": "18",
          "surface": "O",
          "confidence": 0.89,
          "severity": "moderate",
          "position": {"x": 120, "y": 240, "width": 20, "height": 15}
        }
      ]
    },
    "success": true
  }
}
```

### Get Patient Image History

```
GET /api/image/history/{patient_id}
```

Retrieves the image history for a specific patient.

**Path Parameters:**
- `patient_id`: ID of the patient

**Response:**
```json
{
  "patient_id": "123456",
  "images": [
    {
      "image_id": "img_12345678",
      "filename": "img_12345678.jpg",
      "date": "2025-04-30T12:34:56.789012",
      "size_bytes": 1024000
    },
    {
      "image_id": "img_87654321",
      "filename": "img_87654321.jpg",
      "date": "2025-03-15T09:12:34.567890",
      "size_bytes": 850000
    }
  ]
}
```

### Get Sample Analysis

```
GET /api/image/sample
```

Returns a sample image analysis for testing and demonstration purposes.

**Response:**
```json
{
  "image_id": "img-001",
  "patient_id": "SAMPLE_PATIENT",
  "upload_date": "2025-04-30T12:34:56.789012",
  "type": "panoramic",
  "analysis_complete": true,
  "analysis_results": {
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
      ],
      "restorations": [
        {"tooth": "16", "surface": "OD", "type": "amalgam", "confidence": 0.98},
        {"tooth": "36", "surface": "MOD", "type": "composite", "confidence": 0.94}
      ]
    },
    "timestamp": "2025-04-30T12:34:56.789012",
    "success": true
  }
}
```

## Implementation Details

1. Images are stored in the `attached_assets/xrays/{patient_id}/` directory
2. Each image gets a unique ID prefixed with `img_`
3. Analysis is performed using the Roboflow service
4. The system requires a valid Roboflow API key to function properly
5. If no API key is provided, the system will fall back to mock data

## Error Handling

Common errors include:
- 400: Invalid image format or invalid parameters
- 404: Image or patient not found
- 500: Failed to analyze image or server error

## Authentication

All routes require valid authentication in production mode. Ensure you include a valid JWT token in the Authorization header. 