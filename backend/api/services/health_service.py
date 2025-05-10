from typing import List, Optional, Dict
from datetime import datetime, timedelta
import json
import logging
from ..models.health import (
    Immunization,
    ImmunizationType,
    BloodWorkResult,
    BloodWorkType,
    PatientHealthSummary
)
from ..models.user import UserRole

logger = logging.getLogger(__name__)

class HealthService:
    def __init__(self, storage_file: str = "health_records.json"):
        self.storage_file = storage_file
        self.health_records: Dict[str, PatientHealthSummary] = {}
        self._load_records()

    def _load_records(self):
        """Load health records from storage"""
        try:
            with open(self.storage_file, 'r') as f:
                data = json.load(f)
                self.health_records = {
                    patient_id: PatientHealthSummary(**record)
                    for patient_id, record in data.items()
                }
        except FileNotFoundError:
            logger.info(f"Health records file not found, starting with empty records")
            self.health_records = {}

    def _save_records(self):
        """Save health records to storage"""
        with open(self.storage_file, 'w') as f:
            json.dump(
                {
                    patient_id: record.dict()
                    for patient_id, record in self.health_records.items()
                },
                f,
                default=str
            )

    def get_patient_health_summary(self, patient_id: str) -> Optional[PatientHealthSummary]:
        """Get health summary for a patient"""
        return self.health_records.get(patient_id)

    def add_immunization(
        self,
        patient_id: str,
        immunization_type: ImmunizationType,
        date_administered: datetime,
        next_due_date: Optional[datetime],
        lot_number: Optional[str],
        administered_by: str,
        notes: Optional[str] = None
    ) -> Immunization:
        """Add a new immunization record"""
        immunization = Immunization(
            id=f"imm_{datetime.utcnow().timestamp()}",
            patient_id=patient_id,
            type=immunization_type,
            date_administered=date_administered,
            next_due_date=next_due_date,
            lot_number=lot_number,
            administered_by=administered_by,
            notes=notes,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        if patient_id not in self.health_records:
            self.health_records[patient_id] = PatientHealthSummary(
                patient_id=patient_id,
                immunizations=[],
                blood_work=[],
                last_updated=datetime.utcnow()
            )

        self.health_records[patient_id].immunizations.append(immunization)
        self.health_records[patient_id].last_updated = datetime.utcnow()
        self._save_records()

        return immunization

    def add_blood_work(
        self,
        patient_id: str,
        blood_work_type: BloodWorkType,
        date_taken: datetime,
        value: float,
        unit: str,
        reference_range: str,
        uploaded_by: str,
        notes: Optional[str] = None
    ) -> BloodWorkResult:
        """Add a new blood work result"""
        blood_work = BloodWorkResult(
            id=f"bw_{datetime.utcnow().timestamp()}",
            patient_id=patient_id,
            type=blood_work_type,
            date_taken=date_taken,
            value=value,
            unit=unit,
            reference_range=reference_range,
            uploaded_by=uploaded_by,
            notes=notes,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        if patient_id not in self.health_records:
            self.health_records[patient_id] = PatientHealthSummary(
                patient_id=patient_id,
                immunizations=[],
                blood_work=[],
                last_updated=datetime.utcnow()
            )

        self.health_records[patient_id].blood_work.append(blood_work)
        self.health_records[patient_id].last_updated = datetime.utcnow()
        self._save_records()

        return blood_work

    def get_immunization_history(
        self,
        patient_id: str,
        immunization_type: Optional[ImmunizationType] = None
    ) -> List[Immunization]:
        """Get immunization history for a patient"""
        if patient_id not in self.health_records:
            return []

        immunizations = self.health_records[patient_id].immunizations
        if immunization_type:
            immunizations = [imm for imm in immunizations if imm.type == immunization_type]

        return sorted(immunizations, key=lambda x: x.date_administered, reverse=True)

    def get_blood_work_history(
        self,
        patient_id: str,
        blood_work_type: Optional[BloodWorkType] = None
    ) -> List[BloodWorkResult]:
        """Get blood work history for a patient"""
        if patient_id not in self.health_records:
            return []

        blood_work = self.health_records[patient_id].blood_work
        if blood_work_type:
            blood_work = [bw for bw in blood_work if bw.type == blood_work_type]

        return sorted(blood_work, key=lambda x: x.date_taken, reverse=True)

    def get_health_alerts(self, patient_id: str) -> List[str]:
        """Get health alerts for a patient"""
        if patient_id not in self.health_records:
            return []

        return self.health_records[patient_id].get_health_alerts()

    def get_upcoming_immunizations(self, days_ahead: int = 30) -> Dict[str, List[Immunization]]:
        """Get all immunizations due within the specified number of days"""
        upcoming = {}
        cutoff_date = datetime.utcnow() + timedelta(days=days_ahead)

        for patient_id, summary in self.health_records.items():
            due_immunizations = [
                imm for imm in summary.immunizations
                if imm.next_due_date and imm.next_due_date <= cutoff_date
            ]
            if due_immunizations:
                upcoming[patient_id] = due_immunizations

        return upcoming

# Create a singleton instance
health_service = HealthService() 