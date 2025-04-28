from typing import List, Optional
from datetime import datetime
import json
import logging
from dataclasses import dataclass, asdict
from ..models.prescriptions import Prescription, PrescriptionCreate, PrescriptionUpdate, PrescriptionStatus

logger = logging.getLogger(__name__)

class PrescriptionService:
    def __init__(self):
        self.prescriptions_file = "prescriptions.json"
        self.prescriptions = self._load_prescriptions()

    def _load_prescriptions(self) -> List[Prescription]:
        try:
            with open(self.prescriptions_file, 'r') as f:
                data = json.load(f)
                return [Prescription(**prescription) for prescription in data]
        except FileNotFoundError:
            return []
        except Exception as e:
            logger.error(f"Error loading prescriptions: {e}")
            return []

    def _save_prescriptions(self):
        try:
            with open(self.prescriptions_file, 'w') as f:
                json.dump([asdict(prescription) for prescription in self.prescriptions], f)
        except Exception as e:
            logger.error(f"Error saving prescriptions: {e}")

    def create_prescription(self, user_id: str, data: PrescriptionCreate) -> Prescription:
        prescription = Prescription(
            id=f"pres_{datetime.now().timestamp()}",
            patient_id=data.patient_id,
            medication=data.medication,
            dosage=data.dosage,
            frequency=data.frequency,
            duration_days=data.duration_days,
            pharmacy=data.pharmacy,
            notes=data.notes,
            case_id=data.case_id,
            status=PrescriptionStatus.ACTIVE,
            created_at=datetime.now().isoformat(),
            created_by=user_id,
            updated_at=datetime.now().isoformat()
        )
        self.prescriptions.append(prescription)
        self._save_prescriptions()
        return prescription

    def update_prescription(self, prescription_id: str, data: PrescriptionUpdate) -> Optional[Prescription]:
        for prescription in self.prescriptions:
            if prescription.id == prescription_id:
                prescription.status = data.status
                prescription.notes = data.notes or prescription.notes
                prescription.updated_at = datetime.now().isoformat()
                self._save_prescriptions()
                return prescription
        return None

    def get_prescription(self, prescription_id: str) -> Optional[Prescription]:
        for prescription in self.prescriptions:
            if prescription.id == prescription_id:
                return prescription
        return None

    def get_patient_prescriptions(self, patient_id: str) -> List[Prescription]:
        return [p for p in self.prescriptions if p.patient_id == patient_id]

    def get_case_prescriptions(self, case_id: str) -> List[Prescription]:
        return [p for p in self.prescriptions if p.case_id == case_id]

    def get_all_prescriptions(self) -> List[Prescription]:
        return self.prescriptions

# Singleton instance
prescription_service = PrescriptionService() 