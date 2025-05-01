from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
import enum
from pydantic import BaseModel

class TransactionType(enum.Enum):
    EXPENSE = "expense"
    INCOME = "income"

class ExpenseCategory(enum.Enum):
    LAB = "lab"
    SUPPLIES = "supplies"
    SOFTWARE = "software"
    RENT = "rent"
    UTILITIES = "utilities"
    PAYROLL = "payroll"
    INSURANCE = "insurance"
    MARKETING = "marketing"
    MAINTENANCE = "maintenance"
    OTHER = "other"

class IncomeCategory(enum.Enum):
    PATIENT = "patient"
    INSURANCE = "insurance"
    REFUND = "refund"
    ADJUSTMENT = "adjustment"
    OTHER = "other"

class PaymentMethod(enum.Enum):
    CASH = "cash"
    CHECK = "check"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_TRANSFER = "bank_transfer"
    OTHER = "other"

class TransactionStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    RECONCILED = "reconciled"

class ReconciliationStatus(enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class FinanceTransaction(Base):
    __tablename__ = "finance_transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(DateTime, nullable=False)
    description = Column(String, nullable=False)
    category = Column(Enum(ExpenseCategory, IncomeCategory), nullable=False)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING)
    bank_reference = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    insurance_claim_id = Column(Integer, ForeignKey("insurance_claims.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    vendor = relationship("Vendor", back_populates="transactions")
    patient = relationship("Patient", back_populates="transactions")
    insurance_claim = relationship("InsuranceClaim", back_populates="transactions")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_transactions")
    approver = relationship("User", foreign_keys=[approved_by], back_populates="approved_transactions")
    reconciliation = relationship("Reconciliation", back_populates="transactions")

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String)
    phone = Column(String)
    address = Column(String)
    category = Column(Enum(ExpenseCategory), nullable=False)
    is_active = Column(Boolean, default=True)
    metadata = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    transactions = relationship("FinanceTransaction", back_populates="vendor")

class VendorCategoryMap(Base):
    __tablename__ = "vendor_category_maps"

    id = Column(String, primary_key=True, index=True)
    vendor_name = Column(String, nullable=False)
    vendor_email = Column(String)
    category = Column(Enum(ExpenseCategory), nullable=False)
    confidence_score = Column(Float, default=1.0)
    is_auto_mapped = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Reconciliation(Base):
    __tablename__ = "finance_reconciliations"

    id = Column(Integer, primary_key=True, index=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(Enum(ReconciliationStatus), default=ReconciliationStatus.PENDING)
    total_transactions = Column(Integer, default=0)
    matched_transactions = Column(Integer, default=0)
    total_amount = Column(Float, default=0.0)
    matched_amount = Column(Float, default=0.0)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(String, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    creator = relationship("User", foreign_keys=[created_by], back_populates="created_reconciliations")
    approver = relationship("User", foreign_keys=[approved_by], back_populates="approved_reconciliations")
    transactions = relationship("FinanceTransaction", back_populates="reconciliation")

class ReconciliationTransaction(Base):
    __tablename__ = "reconciliation_transactions"

    id = Column(Integer, primary_key=True, index=True)
    reconciliation_id = Column(Integer, ForeignKey("finance_reconciliations.id"), nullable=False)
    transaction_id = Column(Integer, ForeignKey("finance_transactions.id"), nullable=False)
    bank_reference = Column(String, nullable=False)
    is_matched = Column(Boolean, default=False)
    matched_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    reconciliation = relationship("Reconciliation", back_populates="reconciliation_transactions")
    transaction = relationship("FinanceTransaction", back_populates="reconciliation_transactions")

class AuditLog(BaseModel):
    id: int
    action: str
    entity_type: str
    entity_id: int
    user_id: int
    details: Dict[str, Any]
    created_at: datetime

    class Config:
        orm_mode = True

class BulkOperationStatus(str, enum.Enum):
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"

class BulkOperationResult(BaseModel):
    transaction_id: int
    status: BulkOperationStatus
    error: Optional[str] = None 