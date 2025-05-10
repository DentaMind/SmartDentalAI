from fastapi import APIRouter, Path, Query, HTTPException
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import date, datetime

router = APIRouter(
    prefix="/api/patients",
    tags=["patients"],
    responses={404: {"description": "Not found"}}
)

# Pydantic models for data validation
class PatientBase(BaseModel):
    name: str
    dob: date
    email: Optional[str] = None
    phone: Optional[str] = None
    status: str = "Active"
    
class PatientCreate(PatientBase):
    pass

class PatientUpdate(PatientBase):
    name: Optional[str] = None
    dob: Optional[date] = None
    status: Optional[str] = None

class TreatmentStatus(BaseModel):
    patient_id: str
    status: str
    updated_at: datetime = datetime.now()

class Patient(PatientBase):
    id: str
    lastVisit: Optional[date] = None
    treatmentStatus: str = "Pending"
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()
    
    class Config:
        orm_mode = True

# Mock database for development
MOCK_PATIENTS = [
    {
        "id": "P1001", 
        "name": "John Smith", 
        "dob": date(1985, 5, 12), 
        "lastVisit": date(2023, 4, 15), 
        "status": "Active",
        "treatmentStatus": "In Progress",
        "email": "john.smith@example.com",
        "phone": "(555) 123-4567",
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    },
    {
        "id": "P1002", 
        "name": "Maria Garcia", 
        "dob": date(1990, 8, 23), 
        "lastVisit": date(2023, 3, 30), 
        "status": "Active",
        "treatmentStatus": "Completed",
        "email": "maria.g@example.com",
        "phone": "(555) 987-6543",
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    },
    {
        "id": "P1003", 
        "name": "Robert Chen", 
        "dob": date(1978, 11, 5), 
        "lastVisit": date(2023, 5, 2), 
        "status": "Active",
        "treatmentStatus": "Scheduled",
        "email": "robert.c@example.com",
        "phone": "(555) 456-7890",
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    },
    {
        "id": "P1004", 
        "name": "Sarah Johnson", 
        "dob": date(1995, 2, 18), 
        "lastVisit": date(2023, 4, 22), 
        "status": "Inactive",
        "treatmentStatus": "Pending",
        "email": "sarah.j@example.com",
        "phone": "(555) 234-5678",
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    },
    {
        "id": "P1005", 
        "name": "David Williams", 
        "dob": date(1982, 7, 30), 
        "lastVisit": date(2023, 1, 17), 
        "status": "Active",
        "treatmentStatus": "In Progress",
        "email": "david.w@example.com",
        "phone": "(555) 876-5432",
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
]

@router.get("/", response_model=List[Patient])
async def get_patients(
    status: Optional[str] = Query(None, description="Filter by patient status"),
    search: Optional[str] = Query(None, description="Search in name, email, or phone")
) -> List[Dict[str, Any]]:
    """
    Get all patients with optional filtering
    """
    # Start with all patients
    filtered_patients = MOCK_PATIENTS.copy()
    
    # Apply status filter if provided
    if status:
        filtered_patients = [p for p in filtered_patients if p["status"].lower() == status.lower()]
    
    # Apply search if provided
    if search:
        search_lower = search.lower()
        filtered_patients = [
            p for p in filtered_patients 
            if (search_lower in p["name"].lower() or 
                (p.get("email") and search_lower in p["email"].lower()) or
                (p.get("phone") and search_lower in p["phone"].lower()) or
                search_lower in p["id"].lower())
        ]
    
    return filtered_patients

@router.get("/{patient_id}", response_model=Patient)
async def get_patient(
    patient_id: str = Path(..., description="The ID of the patient to retrieve")
) -> Dict[str, Any]:
    """
    Get a single patient by ID
    """
    for patient in MOCK_PATIENTS:
        if patient["id"] == patient_id:
            return patient
    
    raise HTTPException(status_code=404, detail="Patient not found")

@router.post("/", response_model=Patient)
async def create_patient(patient: PatientCreate) -> Dict[str, Any]:
    """
    Create a new patient
    """
    # In a real implementation, this would create the patient in the database
    # For now, we'll just return a mock response
    new_id = f"P{len(MOCK_PATIENTS) + 1001}"
    
    new_patient = {
        "id": new_id,
        **patient.dict(),
        "lastVisit": None,
        "treatmentStatus": "Pending", 
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    # In a real implementation, we would save to database here
    MOCK_PATIENTS.append(new_patient)
    
    return new_patient

@router.put("/{patient_id}", response_model=Patient)
async def update_patient(
    patient_data: PatientUpdate,
    patient_id: str = Path(..., description="The ID of the patient to update")
) -> Dict[str, Any]:
    """
    Update a patient's information
    """
    for i, patient in enumerate(MOCK_PATIENTS):
        if patient["id"] == patient_id:
            # Update only the fields that are provided
            update_data = {k: v for k, v in patient_data.dict().items() if v is not None}
            MOCK_PATIENTS[i] = {**patient, **update_data, "updated_at": datetime.now()}
            return MOCK_PATIENTS[i]
    
    raise HTTPException(status_code=404, detail="Patient not found")

@router.patch("/{patient_id}/treatment-status", response_model=Patient)
async def update_treatment_status(
    status_data: TreatmentStatus,
    patient_id: str = Path(..., description="The ID of the patient to update")
) -> Dict[str, Any]:
    """
    Update a patient's treatment status
    """
    for i, patient in enumerate(MOCK_PATIENTS):
        if patient["id"] == patient_id:
            MOCK_PATIENTS[i]["treatmentStatus"] = status_data.status
            MOCK_PATIENTS[i]["updated_at"] = datetime.now()
            return MOCK_PATIENTS[i]
    
    raise HTTPException(status_code=404, detail="Patient not found")

@router.delete("/{patient_id}", response_model=Dict[str, str])
async def delete_patient(
    patient_id: str = Path(..., description="The ID of the patient to delete")
) -> Dict[str, str]:
    """
    Delete a patient (mark as inactive)
    """
    for i, patient in enumerate(MOCK_PATIENTS):
        if patient["id"] == patient_id:
            # In a real implementation, we might actually delete or just mark as inactive
            MOCK_PATIENTS[i]["status"] = "Inactive"
            MOCK_PATIENTS[i]["updated_at"] = datetime.now()
            return {"status": "success", "message": f"Patient {patient_id} marked as inactive"}
    
    raise HTTPException(status_code=404, detail="Patient not found") 