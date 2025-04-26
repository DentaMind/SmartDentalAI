from sqlalchemy import Column, Integer, String, DateTime, JSON, Float
from sqlalchemy.sql import func
from .base import Base

class AuditEventType:
    """Constants for audit event types."""
    # Treatment Plan Events
    TREATMENT_PLAN_CREATED = "treatment_plan_created"
    TREATMENT_PLAN_UPDATED = "treatment_plan_updated"
    TREATMENT_PLAN_DELETED = "treatment_plan_deleted"
    TREATMENT_PLAN_MODIFIED = "treatment_plan_modified"
    CONSENT_SIGNED = "consent_signed"
    
    # Clinical Events
    PROCEDURE_COMPLETED = "procedure_completed"
    PROCEDURE_CANCELLED = "procedure_cancelled"
    PROCEDURE_REJECTED = "procedure_rejected"
    XRAY_UPLOADED = "xray_uploaded"
    DIAGNOSIS_ADDED = "diagnosis_added"
    
    # Financial Events
    PAYMENT_POSTED = "payment_posted"
    PAYMENT_REVERSED = "payment_reversed"
    PAYMENT_RECEIVED = "payment_received"
    LEDGER_ADJUSTMENT = "ledger_adjustment"
    INSURANCE_CLAIM_SUBMITTED = "insurance_claim_submitted"
    INSURANCE_PREAUTH_SENT = "insurance_preauth_sent"
    INSURANCE_PAYMENT_POSTED = "insurance_payment_posted"
    INSURANCE_PREAUTH_SUBMITTED = "insurance_preauth_submitted"
    
    # Patient Record Events
    PATIENT_RECORD_CREATED = "patient_record_created"
    PATIENT_RECORD_UPDATED = "patient_record_updated"
    PATIENT_RECORD_ARCHIVED = "patient_record_archived"
    
    # Communication Events
    PATIENT_COMMUNICATION_SENT = "patient_communication_sent"
    REFERRAL_SENT = "referral_sent"
    PRESCRIPTION_SENT = "prescription_sent"

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True)
    event_type = Column(String(50), nullable=False)
    user_id = Column(Integer, nullable=False)  # ID of the user who performed the action
    patient_id = Column(Integer, nullable=True)  # Optional: patient involved
    resource_type = Column(String(50), nullable=False)  # e.g., "treatment_plan", "procedure"
    resource_id = Column(Integer, nullable=False)  # ID of the resource being audited
    ip_address = Column(String(45), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    metadata = Column(JSON, nullable=True)  # Additional event-specific data

    @classmethod
    def log_consent_signed(cls, db, user_id: int, plan_id: int, patient_id: int,
                          ip_address: str, signed_by: str) -> "AuditEvent":
        """
        Create an audit log entry for a consent signing event.
        
        Args:
            db: Database session
            user_id: ID of the user recording the consent
            plan_id: ID of the treatment plan
            patient_id: ID of the patient
            ip_address: IP address where consent was signed
            signed_by: Name of the person who signed
            
        Returns:
            Created AuditEvent
        """
        event = cls(
            event_type=AuditEventType.CONSENT_SIGNED,
            user_id=user_id,
            patient_id=patient_id,
            resource_type="treatment_plan",
            resource_id=plan_id,
            ip_address=ip_address,
            metadata={
                "signed_by": signed_by,
                "consent_type": "treatment_plan",
            }
        )
        
        db.add(event)
        db.commit()
        
        return event 

    @classmethod
    def log_procedure_completed(cls, db, user_id: int, procedure_id: int, patient_id: int,
                              ip_address: str, procedure_code: str, tooth: str = None,
                              surface: str = None, fee: float = None) -> "AuditEvent":
        """Create an audit log entry for a completed procedure."""
        event = cls(
            event_type=AuditEventType.PROCEDURE_COMPLETED,
            user_id=user_id,
            patient_id=patient_id,
            resource_type="procedure",
            resource_id=procedure_id,
            ip_address=ip_address,
            metadata={
                "procedure_code": procedure_code,
                "tooth_number": tooth,
                "surface": surface,
                "fee": fee,
            }
        )
        db.add(event)
        db.commit()
        return event

    @classmethod
    def log_payment_posted(cls, db, user_id: int, payment_id: int, patient_id: int,
                          ip_address: str, amount: float, payment_method: str,
                          reference_number: str = None) -> "AuditEvent":
        """Create an audit log entry for a posted payment."""
        event = cls(
            event_type=AuditEventType.PAYMENT_POSTED,
            user_id=user_id,
            patient_id=patient_id,
            resource_type="payment",
            resource_id=payment_id,
            ip_address=ip_address,
            metadata={
                "amount": amount,
                "payment_method": payment_method,
                "reference_number": reference_number,
            }
        )
        db.add(event)
        db.commit()
        return event

    @classmethod
    def log_insurance_preauth(cls, db, user_id: int, claim_id: int, patient_id: int,
                            ip_address: str, procedures: list, carrier: str) -> "AuditEvent":
        """Create an audit log entry for an insurance pre-authorization."""
        event = cls(
            event_type=AuditEventType.INSURANCE_PREAUTH_SENT,
            user_id=user_id,
            patient_id=patient_id,
            resource_type="insurance_claim",
            resource_id=claim_id,
            ip_address=ip_address,
            metadata={
                "procedures": procedures,
                "carrier": carrier,
                "claim_type": "preauth",
            }
        )
        db.add(event)
        db.commit()
        return event

    @classmethod
    def log_treatment_plan_modified(cls, db, user_id: int, plan_id: int, patient_id: int,
                                  ip_address: str, changes: dict) -> "AuditEvent":
        """Create an audit log entry for treatment plan modifications."""
        event = cls(
            event_type=AuditEventType.TREATMENT_PLAN_UPDATED,
            user_id=user_id,
            patient_id=patient_id,
            resource_type="treatment_plan",
            resource_id=plan_id,
            ip_address=ip_address,
            metadata={
                "changes": changes,  # Dict of what was changed
                "modification_type": "update",
            }
        )
        db.add(event)
        db.commit()
        return event

    @classmethod
    def log_patient_communication(cls, db, user_id: int, patient_id: int,
                                ip_address: str, comm_type: str,
                                message_id: int) -> "AuditEvent":
        """Create an audit log entry for patient communications."""
        event = cls(
            event_type=AuditEventType.PATIENT_COMMUNICATION_SENT,
            user_id=user_id,
            patient_id=patient_id,
            resource_type="communication",
            resource_id=message_id,
            ip_address=ip_address,
            metadata={
                "communication_type": comm_type,  # email, sms, portal, etc.
            }
        )
        db.add(event)
        db.commit()
        return event 

    @classmethod
    def log_patient_record_update(cls, db, user_id: int, patient_id: int,
                                ip_address: str, changes: dict) -> "AuditEvent":
        """Create an audit log entry for patient record updates."""
        event = cls(
            event_type=AuditEventType.PATIENT_RECORD_UPDATED,
            user_id=user_id,
            patient_id=patient_id,
            resource_type="patient",
            resource_id=patient_id,
            ip_address=ip_address,
            metadata={
                "changes": changes,  # Dict of fields changed
            }
        )
        db.add(event)
        db.commit()
        return event

    @classmethod
    def log_ledger_adjustment(cls, db, user_id: int, patient_id: int,
                            ip_address: str, adjustment_id: int,
                            amount: float, reason: str) -> "AuditEvent":
        """Create an audit log entry for ledger adjustments."""
        event = cls(
            event_type=AuditEventType.LEDGER_ADJUSTMENT,
            user_id=user_id,
            patient_id=patient_id,
            resource_type="ledger_adjustment",
            resource_id=adjustment_id,
            ip_address=ip_address,
            metadata={
                "amount": amount,
                "reason": reason,
            }
        )
        db.add(event)
        db.commit()
        return event

    @classmethod
    def log_procedure_rejected(cls, db, user_id: int, procedure_id: int,
                             patient_id: int, ip_address: str,
                             reason: str) -> "AuditEvent":
        """Create an audit log entry for rejected procedures."""
        event = cls(
            event_type=AuditEventType.PROCEDURE_REJECTED,
            user_id=user_id,
            patient_id=patient_id,
            resource_type="procedure",
            resource_id=procedure_id,
            ip_address=ip_address,
            metadata={
                "reason": reason,
            }
        )
        db.add(event)
        db.commit()
        return event

    @classmethod
    def log_insurance_preauth_submitted(cls, db, user_id: int, claim_id: int,
                                      patient_id: int, ip_address: str,
                                      procedures: list, carrier: str,
                                      submission_method: str) -> "AuditEvent":
        """Create an audit log entry for insurance pre-authorization submission."""
        event = cls(
            event_type=AuditEventType.INSURANCE_PREAUTH_SUBMITTED,
            user_id=user_id,
            patient_id=patient_id,
            resource_type="insurance_claim",
            resource_id=claim_id,
            ip_address=ip_address,
            metadata={
                "procedures": procedures,
                "carrier": carrier,
                "submission_method": submission_method,
            }
        )
        db.add(event)
        db.commit()
        return event 