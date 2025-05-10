from fastapi import APIRouter, Depends, HTTPException, Body, Query, Path
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

router = APIRouter(
    prefix="/api/prescriptions",
    tags=["prescriptions"],
)

# Mock data for demonstration
MOCK_PRESCRIPTIONS = [
    {
        "id": "rx-123",
        "patient_id": "patient-123",
        "provider_id": "provider-456",
        "patient_name": "John Smith",
        "provider_name": "Dr. Jane Doe",
        "prescription_date": "2023-06-15",
        "status": "pending",
        "items": [
            {
                "id": "item-1",
                "medication_name": "Amoxicillin",
                "dosage": "500mg",
                "form": "Tablet",
                "route": "Oral",
                "frequency": "Every 8 hours",
                "quantity": 21,
                "days_supply": 7,
                "refills": 0,
                "dispense_as_written": False,
                "notes": "Take with food"
            }
        ],
        "treatment_plan_id": "treatment-789",
        "treatment_plan_name": "Dental Caries Treatment",
        "created_at": "2023-06-15T10:00:00",
        "notes": "For dental infection following extraction",
        "has_warnings": True
    },
    {
        "id": "rx-456",
        "patient_id": "patient-123",
        "provider_id": "provider-456",
        "patient_name": "John Smith",
        "provider_name": "Dr. Jane Doe",
        "prescription_date": "2023-05-20",
        "status": "filled",
        "items": [
            {
                "id": "item-2",
                "medication_name": "Ibuprofen",
                "dosage": "800mg",
                "form": "Tablet",
                "route": "Oral",
                "frequency": "Every 6 hours",
                "quantity": 20,
                "days_supply": 5,
                "refills": 0,
                "dispense_as_written": False,
                "notes": "Take with food for pain"
            }
        ],
        "treatment_plan_id": "treatment-789",
        "treatment_plan_name": "Dental Caries Treatment",
        "created_at": "2023-05-20T14:30:00",
        "sent_date": "2023-05-20T15:45:00",
        "filled_date": "2023-05-21T09:15:00",
        "notes": "For pain management following root canal",
        "has_warnings": False
    }
]

@router.get("/")
async def list_prescriptions(
    patient_id: Optional[str] = Query(None, description="Filter prescriptions by patient ID"),
    status: Optional[str] = Query(None, description="Filter prescriptions by status")
):
    """
    List all prescriptions, optionally filtered by patient ID and/or status
    """
    if patient_id is None and status is None:
        return MOCK_PRESCRIPTIONS
    
    filtered_prescriptions = MOCK_PRESCRIPTIONS
    
    if patient_id:
        filtered_prescriptions = [p for p in filtered_prescriptions if p["patient_id"] == patient_id]
    
    if status:
        filtered_prescriptions = [p for p in filtered_prescriptions if p["status"] == status]
    
    return filtered_prescriptions

@router.get("/{prescription_id}")
async def get_prescription(
    prescription_id: str = Path(..., description="The ID of the prescription to get")
):
    """
    Get a prescription by ID
    """
    for prescription in MOCK_PRESCRIPTIONS:
        if prescription["id"] == prescription_id:
            return prescription
    
    raise HTTPException(status_code=404, detail="Prescription not found")

@router.post("/")
async def create_prescription(
    prescription: Dict[str, Any] = Body(..., description="Prescription data")
):
    """
    Create a new prescription
    """
    # Generate a new prescription ID
    prescription_id = f"rx-{str(uuid.uuid4())[:8]}"
    
    # Create a new prescription object
    new_prescription = {
        "id": prescription_id,
        "patient_id": prescription.get("patient_id"),
        "provider_id": prescription.get("provider_id"),
        "patient_name": "Patient Name",  # This would come from database lookup
        "provider_name": "Provider Name",  # This would come from database lookup
        "prescription_date": prescription.get("prescription_date", datetime.now().strftime("%Y-%m-%d")),
        "status": "pending",
        "items": prescription.get("items", []),
        "treatment_plan_id": prescription.get("treatment_plan_id"),
        "treatment_plan_name": "Treatment Plan Name" if prescription.get("treatment_plan_id") else None,
        "created_at": datetime.now().isoformat(),
        "notes": prescription.get("notes"),
        "has_warnings": False  # This would be determined by validation
    }
    
    # In a real implementation, we would save to database here
    
    return new_prescription

@router.post("/{prescription_id}/validate")
async def validate_prescription(
    prescription_id: str = Path(..., description="The ID of the prescription to validate")
):
    """
    Validate a prescription for safety issues
    """
    # Find the prescription
    prescription = None
    for p in MOCK_PRESCRIPTIONS:
        if p["id"] == prescription_id:
            prescription = p
            break
    
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    # Mock validation warnings
    warnings = []
    
    # Mock amoxicillin warning for demonstration
    for item in prescription["items"]:
        if item["medication_name"] == "Amoxicillin":
            warnings.append({
                "message": "Patient has a documented allergy to penicillin. Amoxicillin may cause an allergic reaction.",
                "critical": True
            })
        
        if item["medication_name"] == "Ibuprofen":
            warnings.append({
                "message": "Patient is currently taking Warfarin. Monitor for increased bleeding risk.",
                "critical": False
            })
    
    return {"warnings": warnings}

@router.post("/{prescription_id}/approve")
async def approve_prescription(
    prescription_id: str = Path(..., description="The ID of the prescription to approve"),
    data: Dict[str, Any] = Body(..., description="Approval data")
):
    """
    Approve a prescription and send it to pharmacy
    """
    # Find the prescription
    prescription = None
    for i, p in enumerate(MOCK_PRESCRIPTIONS):
        if p["id"] == prescription_id:
            prescription = p
            prescription_idx = i
            break
    
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    # Check if prescription is in a state that can be approved
    if prescription["status"] not in ["pending", "approved"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Prescription cannot be approved from status '{prescription['status']}'"
        )
    
    # Mock validation to check for warnings
    warnings = []
    for item in prescription["items"]:
        if item["medication_name"] == "Amoxicillin":
            warnings.append({
                "message": "Patient has a documented allergy to penicillin. Amoxicillin may cause an allergic reaction.",
                "critical": True
            })
    
    # If there are critical warnings and override is not set, reject the approval
    if any(w["critical"] for w in warnings) and not data.get("override_warnings", False):
        raise HTTPException(
            status_code=400, 
            detail="Prescription has critical warnings that must be overridden to approve"
        )
    
    # Update the prescription status
    prescription["status"] = "sent"
    prescription["sent_date"] = datetime.now().isoformat()
    
    # In a real implementation, we would save to database here
    
    return {"status": "success", "message": "Prescription approved and sent to pharmacy"}

@router.post("/{prescription_id}/cancel")
async def cancel_prescription(
    prescription_id: str = Path(..., description="The ID of the prescription to cancel")
):
    """
    Cancel a prescription
    """
    # Find the prescription
    prescription = None
    for i, p in enumerate(MOCK_PRESCRIPTIONS):
        if p["id"] == prescription_id:
            prescription = p
            prescription_idx = i
            break
    
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    # Check if prescription is in a state that can be cancelled
    if prescription["status"] not in ["pending", "approved"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Prescription cannot be cancelled from status '{prescription['status']}'"
        )
    
    # Update the prescription status
    prescription["status"] = "cancelled"
    
    # In a real implementation, we would save to database here
    
    return {"status": "success", "message": "Prescription cancelled"}

@router.delete("/{prescription_id}")
async def delete_prescription(
    prescription_id: str = Path(..., description="The ID of the prescription to delete")
):
    """
    Delete a prescription
    """
    # In a real implementation, we would delete from database here
    
    return {"status": "success", "message": "Prescription deleted"} 