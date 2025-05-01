from fastapi.openapi.utils import get_openapi
from fastapi import FastAPI
from typing import List, Dict, Any

def custom_openapi(app: FastAPI):
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="SmartDentalAI API",
        version="1.0.0",
        description="""
        SmartDentalAI API Documentation
        
        ## Authentication
        All endpoints require authentication using JWT tokens.
        Include the token in the Authorization header:
        ```
        Authorization: Bearer <token>
        ```
        
        ## Error Handling
        The API uses standard HTTP status codes:
        - 200: Success
        - 400: Bad Request
        - 401: Unauthorized
        - 403: Forbidden
        - 404: Not Found
        - 422: Validation Error
        - 500: Internal Server Error
        
        ## Rate Limiting
        API requests are limited to:
        - 100 requests per minute for standard endpoints
        - 20 requests per minute for authentication endpoints
        - 1000 requests per minute for health checks
        """,
        routes=app.routes,
    )

    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }

    # Add examples for common endpoints
    openapi_schema["components"]["examples"] = {
        "RiskAssessment": {
            "summary": "Example Risk Assessment",
            "value": {
                "risk_level": "MODERATE",
                "risk_factors": ["Hypertension", "Diabetes"],
                "recommendations": [
                    "Monitor blood pressure throughout procedure",
                    "Have emergency medications available"
                ],
                "asa_classification": "ASA III",
                "requires_epinephrine_check": True
            }
        },
        "TreatmentPlan": {
            "summary": "Example Treatment Plan",
            "value": {
                "id": "TP123",
                "patient_id": "P123",
                "doctor_id": "D456",
                "status": "DRAFT",
                "procedures": [
                    {
                        "code": "D2391",
                        "description": "Resin-based composite - one surface, posterior",
                        "tooth_number": "30",
                        "surface": "O",
                        "cost": 150.00,
                        "insurance_coverage": 120.00,
                        "patient_responsibility": 30.00,
                        "insurance_covered": True
                    }
                ],
                "total_cost": 150.00,
                "insurance_coverage": 120.00,
                "patient_responsibility": 30.00,
                "notes": "Patient has history of dental anxiety"
            }
        }
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema 