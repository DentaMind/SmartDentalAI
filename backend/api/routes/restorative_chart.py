from fastapi import APIRouter, Depends, HTTPException, Path, Query, Body
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from ..models.restorative_chart import ToothRestorationHistory, ToothChart
from ..schemas.restorative_chart import (
    RestorationCreate,
    RestorationUpdate,
    RestorationResponse,
    ToothChartCreate,
    ToothChartUpdate,
    ToothChartResponse,
    CompleteDentalChart,
    RestorationHistoryResponse
)
from ..dependencies.database import get_db

router = APIRouter(prefix="/restorative", tags=["restorative"])

@router.get("/chart/{patient_id}", response_model=CompleteDentalChart)
async def get_patient_dental_chart(
    patient_id: str = Path(..., description="Patient ID to retrieve dental chart for"),
    db: Session = Depends(get_db)
):
    """
    Get the complete dental chart for a patient, including all teeth and their current restorations.
    """
    # Check if patient exists
    # In a real implementation, we'd query the patient table 

    # Get all teeth for this patient
    teeth_records = db.query(ToothChart).filter(ToothChart.patient_id == patient_id).all()
    
    if not teeth_records:
        # Initialize a default chart for a new patient
        teeth_dict = initialize_dental_chart(patient_id, db)
        return {"patient_id": patient_id, "teeth": teeth_dict}
    
    # Convert to response model
    teeth_dict = {tooth.tooth_number: tooth for tooth in teeth_records}
    
    return {"patient_id": patient_id, "teeth": teeth_dict}

@router.post("/chart/tooth", response_model=ToothChartResponse)
async def update_tooth_status(
    tooth_data: ToothChartCreate,
    db: Session = Depends(get_db)
):
    """
    Create or update a tooth's status in the dental chart.
    """
    # Check if the tooth already exists for this patient
    existing_tooth = db.query(ToothChart).filter(
        ToothChart.patient_id == tooth_data.patient_id,
        ToothChart.tooth_number == tooth_data.tooth_number
    ).first()
    
    if existing_tooth:
        # Update existing tooth
        for key, value in tooth_data.dict(exclude_unset=True, exclude={"patient_id", "tooth_number"}).items():
            if value is not None:
                setattr(existing_tooth, key, value)
        
        db.commit()
        db.refresh(existing_tooth)
        return existing_tooth
    else:
        # Create new tooth record
        new_tooth = ToothChart(**tooth_data.dict())
        db.add(new_tooth)
        db.commit()
        db.refresh(new_tooth)
        return new_tooth

@router.patch("/chart/tooth/{patient_id}/{tooth_number}", response_model=ToothChartResponse)
async def patch_tooth_status(
    patient_id: str,
    tooth_number: str,
    update_data: ToothChartUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a specific tooth's status with partial data.
    """
    # Check if the tooth exists
    tooth = db.query(ToothChart).filter(
        ToothChart.patient_id == patient_id,
        ToothChart.tooth_number == tooth_number
    ).first()
    
    if not tooth:
        raise HTTPException(status_code=404, detail=f"Tooth {tooth_number} not found for patient {patient_id}")
    
    # Update tooth with non-None values
    for key, value in update_data.dict(exclude_unset=True).items():
        if value is not None:
            setattr(tooth, key, value)
    
    db.commit()
    db.refresh(tooth)
    return tooth

@router.post("/restoration", response_model=RestorationResponse)
async def add_restoration(
    restoration_data: RestorationCreate,
    db: Session = Depends(get_db)
):
    """
    Add a new restoration to a tooth and update restoration history.
    """
    # First, check if there's an existing current restoration for this tooth
    existing_restoration = db.query(ToothRestorationHistory).filter(
        ToothRestorationHistory.patient_id == restoration_data.patient_id,
        ToothRestorationHistory.tooth_number == restoration_data.tooth_number,
        ToothRestorationHistory.is_current == True
    ).first()
    
    # Create the new restoration
    new_restoration = ToothRestorationHistory(**restoration_data.dict())
    
    # If there's an existing restoration, mark it as replaced
    if existing_restoration:
        existing_restoration.is_current = False
        existing_restoration.replaced_by_id = new_restoration.id
    
    # Save the new restoration
    db.add(new_restoration)
    db.commit()
    db.refresh(new_restoration)
    
    # Update the tooth chart to reflect the new restoration
    tooth_chart = db.query(ToothChart).filter(
        ToothChart.patient_id == restoration_data.patient_id,
        ToothChart.tooth_number == restoration_data.tooth_number
    ).first()
    
    if tooth_chart:
        tooth_chart.current_restoration_id = new_restoration.id
        db.commit()
    else:
        # Create a new tooth chart entry if it doesn't exist
        new_tooth = ToothChart(
            patient_id=restoration_data.patient_id,
            tooth_number=restoration_data.tooth_number,
            current_restoration_id=new_restoration.id
        )
        db.add(new_tooth)
        db.commit()
    
    return new_restoration

@router.get("/history/{patient_id}/{tooth_number}", response_model=RestorationHistoryResponse)
async def get_tooth_restoration_history(
    patient_id: str,
    tooth_number: str,
    db: Session = Depends(get_db)
):
    """
    Get the complete restoration history for a specific tooth.
    """
    # Get all restorations for this tooth, ordered by procedure date
    restorations = db.query(ToothRestorationHistory).filter(
        ToothRestorationHistory.patient_id == patient_id,
        ToothRestorationHistory.tooth_number == tooth_number
    ).order_by(ToothRestorationHistory.procedure_date.desc()).all()
    
    if not restorations:
        raise HTTPException(status_code=404, detail=f"No restoration history found for tooth {tooth_number}")
    
    return {"tooth_number": tooth_number, "history": restorations}

def initialize_dental_chart(patient_id: str, db: Session) -> Dict[str, ToothChartResponse]:
    """
    Initialize a blank dental chart with all teeth marked as present.
    This is a helper function for new patients.
    """
    # Standard adult dentition - 32 teeth
    teeth_numbers = [str(i) for i in range(1, 33)]
    teeth_dict = {}
    
    for tooth_number in teeth_numbers:
        new_tooth = ToothChart(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            tooth_number=tooth_number
        )
        db.add(new_tooth)
        teeth_dict[tooth_number] = new_tooth
    
    db.commit()
    
    # Update the in-memory objects with database-generated values
    for tooth in teeth_dict.values():
        db.refresh(tooth)
    
    return teeth_dict 