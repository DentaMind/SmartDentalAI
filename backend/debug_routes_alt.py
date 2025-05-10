#!/usr/bin/env python3
"""
Debug Routes Server for DentaMind Platform (Alternative Implementation)
Provides debug endpoints for all APIs to help with testing and development
Port: 8092
"""

import os
import logging
import uvicorn
import json
import datetime
from typing import Dict, List, Optional, Any, Union
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Setup logging with more detailed output for debugging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="DentaMind Debug API",
    description="Debug API with test routes for DentaMind Platform",
    version="1.0.0"
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add middleware to log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request path: {request.url.path}")
    response = await call_next(request)
    return response

# Basic health check
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "DentaMind Debug API",
        "version": "1.0.0",
        "time": datetime.datetime.utcnow().isoformat()
    }

# Health check endpoints
@app.get("/health")
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "components": {
            "database": "healthy",
            "disk": "healthy",
            "memory": "healthy",
            "cpu": "healthy"
        },
        "version": "1.0.0"
    }

# Knowledge API endpoints
@app.get("/api/knowledge/categories")
async def knowledge_categories():
    """Get knowledge categories"""
    return {
        "categories": [
            "anatomy", "pathology", "treatments", "medications", 
            "procedures", "diagnostics", "materials", "instruments",
            "radiology", "periodontics", "orthodontics", "endodontics",
            "prosthodontics", "oral_surgery", "pediatric_dentistry",
            "implants", "occlusion", "tmj", "cosmetic", "preventive"
        ]
    }

# Diagnose API endpoints
@app.get("/api/diagnose/test")
async def diagnose_test():
    """Test the diagnose module"""
    return {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "status": "diagnose module healthy",
        "sample_output": {
            "caries": [
                {"tooth": "18", "surface": "O", "confidence": 0.89, "severity": "moderate"},
                {"tooth": "46", "surface": "MOD", "confidence": 0.95, "severity": "severe"}
            ],
            "restorations": [
                {"tooth": "36", "surface": "MOD", "material": "amalgam", "condition": "good"},
                {"tooth": "25", "surface": "DO", "material": "composite", "condition": "marginal defect"}
            ]
        }
    }

@app.get("/api/diagnose/sample")
async def diagnose_sample():
    """Get sample diagnose data"""
    return {
        "patient_id": "SAMPLE_PATIENT",
        "image_id": "SAMPLE_XRAY_001",
        "timestamp": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "findings": {
            "caries": [
                {"tooth": "18", "surface": "O", "confidence": 0.89, "severity": "moderate"},
                {"tooth": "46", "surface": "MOD", "confidence": 0.95, "severity": "severe"},
                {"tooth": "34", "surface": "D", "confidence": 0.72, "severity": "incipient"}
            ],
            "restorations": [
                {"tooth": "16", "surface": "MOD", "material": "amalgam", "condition": "good"},
                {"tooth": "25", "surface": "DO", "material": "composite", "condition": "marginal defect"},
                {"tooth": "36", "surface": "MOD", "material": "amalgam", "condition": "good"},
                {"tooth": "47", "surface": "O", "material": "composite", "condition": "good"}
            ],
            "periapical_lesions": [
                {"tooth": "22", "diameter_mm": 3.5, "confidence": 0.85},
                {"tooth": "46", "diameter_mm": 2.1, "confidence": 0.77}
            ],
            "missing_teeth": ["38", "48"],
            "impacted_teeth": ["18", "28"]
        }
    }

@app.get("/api/diagnose/history/{patient_id}")
async def diagnose_history(patient_id: str):
    """Get patient diagnosis history"""
    logger.info(f"Accessing diagnosis history for patient {patient_id}")
    return {
        "patient_id": patient_id,
        "diagnoses": [
            {
                "id": "diag-001",
                "date": "2023-01-15T10:30:00",
                "xray_type": "panoramic",
                "summary": "Moderate caries detected on 18, 46. Periapical lesion on 22."
            },
            {
                "id": "diag-002",
                "date": "2023-06-20T14:45:00",
                "xray_type": "bitewing",
                "summary": "Incipient caries on 34. Restoration on 25 shows marginal defect."
            },
            {
                "id": "diag-003",
                "date": "2023-11-05T09:15:00",
                "xray_type": "fmx",
                "summary": "Severe caries on 46 has progressed. New periapical lesion on 46 detected."
            }
        ]
    }

# Perio API endpoints
@app.get("/api/perio/test")
async def perio_test():
    """Test the perio module"""
    return {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "status": "perio module healthy",
        "sample_data": {
            "tooth_number": "3",
            "pocket_depths": {
                "MB": 3,
                "DB": 4,
                "ML": 2
            }
        }
    }

@app.get("/api/perio/sample")
async def perio_sample():
    """Get sample perio data"""
    return {
        "id": "pc-001",
        "patient_id": "patient-123",
        "exam_date": "2023-05-15T09:30:00",
        "teeth": [
            {
                "tooth_number": "16",
                "pocket_depths": {
                    "MB": 3,
                    "B": 2,
                    "DB": 3,
                    "ML": 4,
                    "L": 3,
                    "DL": 4
                },
                "recession": {
                    "MB": 0,
                    "B": 0,
                    "DB": 0,
                    "ML": 1,
                    "L": 1,
                    "DL": 2
                },
                "mobility": 1,
                "furcation": {
                    "B": 2,
                    "ML": 1,
                    "DL": 0
                },
                "bleeding": {
                    "MB": True,
                    "B": False,
                    "DB": True,
                    "ML": True,
                    "L": True,
                    "DL": True
                }
            },
            {
                "tooth_number": "3",
                "pocket_depths": {
                    "MB": 6,
                    "B": 5,
                    "DB": 4,
                    "ML": 5,
                    "L": 3,
                    "DL": 3
                },
                "bleeding": {
                    "MB": True,
                    "B": True,
                    "DB": True,
                    "ML": True,
                    "L": False,
                    "DL": False
                }
            }
        ],
        "notes": "Initial exam. Moderate periodontitis, Class II, Stage 2."
    }

@app.get("/api/perio/patients/{patient_id}/charts")
async def perio_charts(patient_id: str):
    """Get perio charts for a patient"""
    logger.info(f"Accessing perio charts for patient {patient_id}")
    return [
        {
            "id": "pc-001",
            "patient_id": patient_id,
            "exam_date": "2023-05-15T09:30:00",
            "teeth": [
                {
                    "tooth_number": "16",
                    "pocket_depths": {
                        "MB": 3,
                        "B": 2,
                        "DB": 3,
                        "ML": 4,
                        "L": 3,
                        "DL": 4
                    },
                    "recession": {
                        "MB": 0,
                        "B": 0,
                        "DB": 0,
                        "ML": 1,
                        "L": 1,
                        "DL": 2
                    },
                    "mobility": 1,
                    "bleeding": {
                        "MB": True,
                        "B": False,
                        "DB": True,
                        "ML": True,
                        "L": True,
                        "DL": True
                    }
                },
                {
                    "tooth_number": "3",
                    "pocket_depths": {
                        "MB": 6,
                        "B": 5,
                        "DB": 4,
                        "ML": 5,
                        "L": 3,
                        "DL": 3
                    },
                    "bleeding": {
                        "MB": True,
                        "B": True,
                        "DB": True,
                        "ML": True,
                        "L": False,
                        "DL": False
                    }
                }
            ]
        },
        {
            "id": "pc-002",
            "patient_id": patient_id,
            "exam_date": "2023-11-22T11:15:00",
            "teeth": [
                {
                    "tooth_number": "16",
                    "pocket_depths": {
                        "MB": 3,
                        "B": 2,
                        "DB": 2,
                        "ML": 3,
                        "L": 3,
                        "DL": 3
                    },
                    "bleeding": {
                        "MB": False,
                        "B": False,
                        "DB": False,
                        "ML": True,
                        "L": False,
                        "DL": True
                    }
                },
                {
                    "tooth_number": "3",
                    "pocket_depths": {
                        "MB": 4,
                        "B": 3,
                        "DB": 3,
                        "ML": 4,
                        "L": 3,
                        "DL": 3
                    },
                    "bleeding": {
                        "MB": True,
                        "B": False,
                        "DB": False,
                        "ML": True,
                        "L": False,
                        "DL": False
                    }
                }
            ]
        }
    ]

# Image API endpoints
@app.get("/api/image/test")
async def image_test():
    """Test the image module"""
    return {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "status": "image module healthy",
        "supported_formats": ["jpg", "png", "dcm"]
    }

@app.get("/api/image/sample")
async def image_sample():
    """Get sample image analysis data"""
    return {
        "image_id": "img-001",
        "patient_id": "patient-123",
        "upload_time": datetime.datetime.utcnow().isoformat(),
        "image_type": "panoramic",
        "resolution": "2400x1200",
        "file_size_kb": 1256,
        "analysis_complete": True,
        "analysis_time_ms": 2340
    }

@app.get("/api/image/history/{patient_id}")
async def image_history(patient_id: str):
    """Get image history for patient"""
    logger.info(f"Accessing image history for patient {patient_id}")
    return [
        {
            "id": "img-001",
            "patient_id": patient_id,
            "upload_date": "2023-01-15T10:30:00",
            "image_type": "panoramic",
            "filename": "pano_20230115.jpg",
            "analyzed": True
        },
        {
            "id": "img-002",
            "patient_id": patient_id,
            "upload_date": "2023-06-20T14:45:00",
            "image_type": "bitewing",
            "filename": "bw_20230620.jpg",
            "analyzed": True
        },
        {
            "id": "img-003",
            "patient_id": patient_id,
            "upload_date": "2023-11-05T09:15:00",
            "image_type": "fmx",
            "filename": "fmx_20231105.jpg",
            "analyzed": True
        },
        {
            "id": "img-004",
            "patient_id": patient_id,
            "upload_date": "2024-02-18T11:20:00",
            "image_type": "cbct",
            "filename": "cbct_20240218.dcm",
            "analyzed": False
        }
    ]

# Risk API endpoints
@app.get("/api/risk/test")
async def risk_test():
    """Test the risk module"""
    return {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "status": "risk module healthy",
        "supported_risk_types": ["caries", "periodontal", "oral_cancer", "general"]
    }

@app.get("/api/risk/sample/{risk_level}")
async def risk_sample(risk_level: str):
    """Get sample risk assessment data"""
    risk_levels = ["low_risk", "moderate_risk", "high_risk"]
    if risk_level not in risk_levels:
        risk_level = "moderate_risk"
    
    logger.info(f"Accessing sample risk data for level: {risk_level}")
    
    if risk_level == "low_risk":
        score = 15
        recommendations = ["Maintain current oral hygiene routine", "Continue regular checkups"]
    elif risk_level == "moderate_risk":
        score = 45
        recommendations = ["Increase brushing to twice daily", "Use fluoride rinse", "Schedule checkup in 4 months"]
    else:  # high_risk
        score = 75
        recommendations = ["Schedule immediate perio treatment", "Use prescription fluoride toothpaste", "Return for evaluation in 2 months"]
    
    return {
        "risk_assessment_id": "risk-001",
        "patient_id": "SAMPLE_PATIENT",
        "assessment_date": datetime.datetime.utcnow().isoformat(),
        "risk_level": risk_level,
        "risk_score": score,
        "factors": {
            "oral_hygiene": risk_level.split("_")[0],
            "diet": risk_level.split("_")[0],
            "fluoride_exposure": "moderate",
            "clinical_findings": risk_level.split("_")[0]
        },
        "recommendations": recommendations
    }

@app.get("/api/risk/history/{patient_id}")
async def risk_history(patient_id: str):
    """Get risk assessment history for patient"""
    logger.info(f"Accessing risk history for patient {patient_id}")
    return [
        {
            "id": "risk-001",
            "patient_id": patient_id,
            "assessment_date": "2023-01-15T10:30:00",
            "risk_type": "caries",
            "risk_level": "moderate",
            "summary": "Moderate caries risk due to diet and inadequate fluoride exposure."
        },
        {
            "id": "risk-002",
            "patient_id": patient_id,
            "assessment_date": "2023-01-15T10:35:00",
            "risk_type": "periodontal",
            "risk_level": "high",
            "summary": "High periodontal risk due to bleeding on probing and family history."
        },
        {
            "id": "risk-003",
            "patient_id": patient_id,
            "assessment_date": "2023-06-20T14:45:00",
            "risk_type": "caries",
            "risk_level": "low",
            "summary": "Improved diet and oral hygiene has reduced caries risk."
        },
        {
            "id": "risk-004",
            "patient_id": patient_id,
            "assessment_date": "2023-06-20T14:50:00",
            "risk_type": "periodontal",
            "risk_level": "moderate",
            "summary": "Periodontal risk improved after treatment but monitoring required."
        }
    ]

# Patient API endpoints
@app.get("/api/patients/sample")
async def patient_sample():
    """Get sample patients"""
    return [
        {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "555-1234"
        },
        {
            "id": 2,
            "name": "Jane Smith",
            "email": "jane@example.com",
            "phone": "555-5678"
        },
        {
            "id": 3,
            "name": "Bob Johnson",
            "email": "bob@example.com",
            "phone": "555-9012"
        }
    ]

# Treatment API endpoints
@app.get("/api/treatment/treatment-plans/patient/{patient_id}")
async def treatment_plans(patient_id: str):
    """Get treatment plans for a patient"""
    logger.info(f"Accessing treatment plans for patient {patient_id}")
    return {
        "patient_id": patient_id,
        "treatment_plans": [
            {
                "id": "tp-001",
                "name": "Restorative Plan",
                "created_date": "2023-01-18T14:30:00",
                "status": "active",
                "treatments": [
                    {
                        "id": "tx-001",
                        "tooth": "3",
                        "procedure": "Amalgam filling",
                        "surface": "MOD",
                        "status": "completed",
                        "completed_date": "2023-02-05T09:15:00",
                        "fee": 150.00
                    },
                    {
                        "id": "tx-002",
                        "tooth": "14",
                        "procedure": "Composite filling",
                        "surface": "DO",
                        "status": "planned",
                        "fee": 175.00
                    }
                ],
                "total_fee": 325.00
            },
            {
                "id": "tp-002",
                "name": "Preventive Plan",
                "created_date": "2023-01-18T14:45:00",
                "status": "completed",
                "treatments": [
                    {
                        "id": "tx-003",
                        "procedure": "Adult prophylaxis",
                        "status": "completed",
                        "completed_date": "2023-01-25T10:30:00",
                        "fee": 95.00
                    },
                    {
                        "id": "tx-004",
                        "procedure": "Fluoride treatment",
                        "status": "completed",
                        "completed_date": "2023-01-25T10:45:00",
                        "fee": 35.00
                    }
                ],
                "total_fee": 130.00
            }
        ]
    }

# Prescriptions API endpoints
@app.get("/api/prescriptions/patient/{patient_id}")
async def prescriptions(patient_id: str):
    """Get prescriptions for a patient"""
    logger.info(f"Accessing prescriptions for patient {patient_id}")
    return {
        "patient_id": patient_id,
        "prescriptions": [
            {
                "id": "rx-001",
                "medication": "Amoxicillin",
                "dosage": "500mg",
                "frequency": "TID",
                "duration": "7 days",
                "prescribing_doctor": "Dr. Smith",
                "prescription_date": "2023-02-05T11:30:00",
                "reason": "Post-extraction prophylaxis"
            },
            {
                "id": "rx-002",
                "medication": "Ibuprofen",
                "dosage": "600mg",
                "frequency": "QID PRN",
                "duration": "3 days",
                "prescribing_doctor": "Dr. Smith",
                "prescription_date": "2023-02-05T11:30:00",
                "reason": "Post-extraction pain"
            }
        ]
    }

# Run the server
if __name__ == "__main__":
    print("Starting DentaMind Debug API (Alt) server on port 8092...")
    port = int(os.environ.get("PORT", 8092))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info") 