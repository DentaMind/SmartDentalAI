from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import json
import logging
from dataclasses import dataclass, asdict
from ..models.prescriptions import Prescription, PrescriptionCreate, PrescriptionUpdate, PrescriptionStatus
from ..models.database import Prescription as PrescriptionDB
from ..utils.logger import access_logger

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

    def create_prescription(
        self,
        db: Session,
        prescription: PrescriptionCreate,
        created_by: str
    ) -> Prescription:
        """Create a new prescription"""
        db_prescription = PrescriptionDB(
            patient_id=prescription.patient_id,
            medications=prescription.medications,
            notes=prescription.notes,
            status=prescription.status,
            created_by=created_by,
            updated_by=created_by,
            expires_at=datetime.utcnow() + timedelta(days=30)  # Default 30-day expiration
        )
        
        db.add(db_prescription)
        db.commit()
        db.refresh(db_prescription)
        
        access_logger.info(f"Created prescription {db_prescription.id} for patient {prescription.patient_id}")
        return Prescription.from_orm(db_prescription)

    def get_prescription(self, db: Session, prescription_id: str) -> Optional[Prescription]:
        """Get a prescription by ID"""
        db_prescription = db.query(PrescriptionDB).filter(PrescriptionDB.id == prescription_id).first()
        if not db_prescription:
            return None
        return Prescription.from_orm(db_prescription)

    def get_patient_prescriptions(
        self,
        db: Session,
        patient_id: str,
        status: Optional[PrescriptionStatus] = None
    ) -> List[Prescription]:
        """Get all prescriptions for a patient"""
        query = db.query(PrescriptionDB).filter(PrescriptionDB.patient_id == patient_id)
        if status:
            query = query.filter(PrescriptionDB.status == status)
        db_prescriptions = query.all()
        return [Prescription.from_orm(p) for p in db_prescriptions]

    def get_doctor_prescriptions(
        self,
        db: Session,
        doctor_id: str,
        status: Optional[PrescriptionStatus] = None
    ) -> List[Prescription]:
        """Get all prescriptions written by a doctor"""
        query = db.query(PrescriptionDB).filter(PrescriptionDB.created_by == doctor_id)
        if status:
            query = query.filter(PrescriptionDB.status == status)
        db_prescriptions = query.all()
        return [Prescription.from_orm(p) for p in db_prescriptions]

    def update_prescription(
        self,
        db: Session,
        prescription_id: str,
        prescription: PrescriptionUpdate,
        updated_by: str
    ) -> Prescription:
        """Update a prescription"""
        db_prescription = db.query(PrescriptionDB).filter(PrescriptionDB.id == prescription_id).first()
        if not db_prescription:
            raise ValueError("Prescription not found")

        if prescription.medications is not None:
            db_prescription.medications = prescription.medications
        if prescription.notes is not None:
            db_prescription.notes = prescription.notes
        if prescription.status is not None:
            db_prescription.status = prescription.status

        db_prescription.updated_by = updated_by
        db_prescription.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(db_prescription)
        
        access_logger.info(f"Updated prescription {prescription_id}")
        return Prescription.from_orm(db_prescription)

    def fill_prescription(
        self,
        db: Session,
        prescription_id: str,
        filled_by: str
    ) -> Prescription:
        """Mark a prescription as filled"""
        db_prescription = db.query(PrescriptionDB).filter(PrescriptionDB.id == prescription_id).first()
        if not db_prescription:
            raise ValueError("Prescription not found")

        if db_prescription.status != PrescriptionStatus.ACTIVE:
            raise ValueError("Only active prescriptions can be filled")

        db_prescription.status = PrescriptionStatus.FILLED
        db_prescription.filled_by = filled_by
        db_prescription.filled_at = datetime.utcnow()
        db_prescription.updated_by = filled_by
        db_prescription.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(db_prescription)
        
        access_logger.info(f"Filled prescription {prescription_id}")
        return Prescription.from_orm(db_prescription)

    def check_expired_prescriptions(self, db: Session) -> List[Prescription]:
        """Check for and update expired prescriptions"""
        expired = db.query(PrescriptionDB).filter(
            PrescriptionDB.status == PrescriptionStatus.ACTIVE,
            PrescriptionDB.expires_at < datetime.utcnow()
        ).all()

        for prescription in expired:
            prescription.status = PrescriptionStatus.EXPIRED
            prescription.updated_at = datetime.utcnow()
            prescription.updated_by = "system"

        db.commit()
        return [Prescription.from_orm(p) for p in expired]

# Singleton instance
prescription_service = PrescriptionService() 