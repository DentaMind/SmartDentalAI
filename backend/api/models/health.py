from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from enum import Enum

class ImmunizationType(str, Enum):
    HEPATITIS_B = "hepatitis_b"
    INFLUENZA = "influenza"
    TETANUS = "tetanus"
    MMR = "mmr"
    VARICELLA = "varicella"
    COVID_19 = "covid_19"
    OTHER = "other"

class BloodWorkType(str, Enum):
    CBC = "cbc"  # Complete Blood Count
    HBA1C = "hba1c"  # Glycated Hemoglobin
    VITAMIN_D = "vitamin_d"
    CRP = "crp"  # C-Reactive Protein
    GLUCOSE = "glucose"
    LIPID_PANEL = "lipid_panel"
    OTHER = "other"

class Immunization(BaseModel):
    id: str
    patient_id: str
    type: ImmunizationType
    date_administered: datetime
    next_due_date: Optional[datetime]
    lot_number: Optional[str]
    administered_by: str  # Staff member ID
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

class BloodWorkResult(BaseModel):
    id: str
    patient_id: str
    type: BloodWorkType
    date_taken: datetime
    value: float
    unit: str
    reference_range: str
    notes: Optional[str]
    uploaded_by: str  # Staff member ID
    created_at: datetime
    updated_at: datetime

class PatientHealthSummary(BaseModel):
    patient_id: str
    immunizations: List[Immunization]
    blood_work: List[BloodWorkResult]
    last_updated: datetime

    @property
    def immunization_status(self) -> dict:
        """Get immunization status for each type"""
        status = {}
        for imm_type in ImmunizationType:
            latest = max(
                (imm for imm in self.immunizations if imm.type == imm_type),
                key=lambda x: x.date_administered,
                default=None
            )
            status[imm_type] = {
                "last_administered": latest.date_administered if latest else None,
                "next_due": latest.next_due_date if latest else None,
                "is_current": latest and (
                    not latest.next_due_date or 
                    latest.next_due_date > datetime.utcnow()
                ) if latest else False
            }
        return status

    @property
    def blood_work_trends(self) -> dict:
        """Get trends for each blood work type"""
        trends = {}
        for bw_type in BloodWorkType:
            results = sorted(
                (bw for bw in self.blood_work if bw.type == bw_type),
                key=lambda x: x.date_taken
            )
            if results:
                trends[bw_type] = {
                    "latest_value": results[-1].value,
                    "latest_date": results[-1].date_taken,
                    "previous_value": results[-2].value if len(results) > 1 else None,
                    "trend": "increasing" if len(results) > 1 and results[-1].value > results[-2].value else "decreasing" if len(results) > 1 else "stable"
                }
        return trends

    def get_health_alerts(self) -> List[str]:
        """Get health-related alerts based on immunizations and blood work"""
        alerts = []
        
        # Check immunization status
        for imm_type, status in self.immunization_status.items():
            if not status["is_current"]:
                alerts.append(f"Immunization {imm_type.value} is due or overdue")
        
        # Check blood work values
        for bw_type, trend in self.blood_work_trends.items():
            if trend["latest_value"]:
                # Add logic to check against reference ranges
                # This is a placeholder - actual ranges would be defined
                if bw_type == BloodWorkType.HBA1C and trend["latest_value"] > 6.5:
                    alerts.append(f"Elevated HbA1c level detected")
                elif bw_type == BloodWorkType.VITAMIN_D and trend["latest_value"] < 30:
                    alerts.append(f"Low Vitamin D level detected")
        
        return alerts 