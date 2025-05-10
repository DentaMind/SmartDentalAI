from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/perio", tags=["perio"])

# Pydantic models for request/response validation
class ToothMeasurement(BaseModel):
    tooth_number: str
    pocket_depths: Dict[str, int]  # e.g. {"MB": 3, "B": 2, "DB": 3, "ML": 4, "L": 3, "DL": 5}
    recession: Optional[Dict[str, int]] = None
    mobility: Optional[int] = None
    furcation: Optional[Dict[str, int]] = None
    bleeding: Optional[List[str]] = None
    suppuration: Optional[List[str]] = None
    plaque: Optional[List[str]] = None

class PerioChartCreate(BaseModel):
    patient_id: str
    exam_date: datetime
    teeth: List[ToothMeasurement]
    notes: Optional[str] = None

class PerioChartResponse(BaseModel):
    id: str
    patient_id: str
    exam_date: datetime
    teeth: List[ToothMeasurement]
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

# Sample data for testing
SAMPLE_PERIO_CHART = {
    "id": "pc-001",
    "patient_id": "patient-123",
    "exam_date": "2023-05-15T09:30:00",
    "teeth": [
        {
            "tooth_number": "16",
            "pocket_depths": {"MB": 3, "B": 2, "DB": 3, "ML": 4, "L": 3, "DL": 4},
            "recession": {"MB": 0, "B": 0, "DB": 0, "ML": 1, "L": 1, "DL": 1},
            "mobility": 0,
            "bleeding": ["ML", "DL"],
            "plaque": ["MB", "ML"]
        },
        {
            "tooth_number": "17",
            "pocket_depths": {"MB": 4, "B": 3, "DB": 4, "ML": 5, "L": 4, "DL": 5},
            "recession": {"MB": 1, "B": 1, "DB": 1, "ML": 2, "L": 2, "DL": 2},
            "mobility": 1,
            "furcation": {"B": 1},
            "bleeding": ["MB", "ML", "DL"],
            "suppuration": ["DL"]
        }
    ],
    "notes": "Initial periodontal examination",
    "created_at": "2023-05-15T09:30:00",
    "updated_at": None
}

@router.get("/test")
async def test_connection():
    """Simple test endpoint to verify the perio router is working"""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "status": "perio module healthy",
        "sample_data": {
            "tooth_number": "3",
            "pocket_depths": {"MB": 3, "DB": 4, "ML": 2}
        }
    }

@router.get("/sample")
async def get_sample_chart():
    """Return a sample perio chart for testing purposes"""
    return SAMPLE_PERIO_CHART

@router.post("/charts", response_model=PerioChartResponse)
async def create_perio_chart(chart: PerioChartCreate):
    """Create a new periodontal chart"""
    # In a real implementation, this would save to a database
    # For now, return sample data with the provided patient ID
    chart_id = f"pc-{uuid.uuid4().hex[:8]}"
    now = datetime.now()
    
    return {
        "id": chart_id,
        "patient_id": chart.patient_id,
        "exam_date": chart.exam_date,
        "teeth": chart.teeth,
        "notes": chart.notes,
        "created_at": now,
        "updated_at": None
    }

@router.get("/charts/{chart_id}", response_model=PerioChartResponse)
async def get_perio_chart(chart_id: str):
    """Get a specific perio chart by ID"""
    # For testing, return sample data if the ID is "pc-001"
    if chart_id == "pc-001":
        return SAMPLE_PERIO_CHART
    else:
        raise HTTPException(status_code=404, detail="Chart not found")

@router.get("/patients/{patient_id}/charts", response_model=List[PerioChartResponse])
async def get_patient_charts(patient_id: str):
    """Get all perio charts for a patient"""
    # In a real implementation, this would query the database
    # For now, return sample data with the provided patient ID
    
    # Create a sample chart based on the sample but with the requested patient ID
    sample_chart = dict(SAMPLE_PERIO_CHART)
    sample_chart["patient_id"] = patient_id
    
    # Create a second sample chart for illustration
    second_chart = dict(sample_chart)
    second_chart["id"] = "pc-002"
    second_chart["exam_date"] = "2023-08-20T10:15:00"
    second_chart["notes"] = "Follow-up examination"
    second_chart["created_at"] = "2023-08-20T10:15:00"
    
    return [sample_chart, second_chart]

@router.post("/analysis/{chart_id}")
async def analyze_perio_chart(chart_id: str):
    """Analyze a perio chart and provide insights/recommendations"""
    # In a real implementation, this would analyze the chart data
    # For now, return sample analysis
    return {
        "chart_id": chart_id,
        "analysis_date": datetime.now().isoformat(),
        "findings": {
            "overall_health": "moderate_periodontitis",
            "pocket_depths": {
                "healthy": 40,  # percentage of sites
                "gingivitis": 30,
                "mild_periodontitis": 20,
                "moderate_periodontitis": 7,
                "severe_periodontitis": 3
            },
            "bleeding_index": 28,  # percentage of sites
            "plaque_index": 35,  # percentage of sites
            "high_risk_areas": [
                {"region": "upper_right_molars", "concern": "pocket_depth"},
                {"region": "lower_left_anterior", "concern": "recession"}
            ]
        },
        "recommendations": [
            "Scaling and root planing for upper right quadrant",
            "Improve oral hygiene in lower left anterior region",
            "Follow-up evaluation in 3 months"
        ]
    }

@router.get("/trends/{patient_id}")
async def get_perio_trends(patient_id: str):
    """Get periodontal health trends for a patient over time"""
    # In a real implementation, this would analyze multiple charts
    # For now, return sample trend data
    return {
        "patient_id": patient_id,
        "time_points": ["2022-05-15", "2022-11-20", "2023-05-15"],
        "metrics": {
            "average_pocket_depth": [3.2, 2.8, 2.5],
            "bleeding_sites_percentage": [35, 25, 18],
            "teeth_with_mobility": [4, 3, 2]
        },
        "interpretation": "Gradual improvement in periodontal health over time",
        "risk_level": "moderate",
        "next_assessment_due": "2023-11-15"
    } 