from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .base import Base

class PaymentMethod(enum.Enum):
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    CHECK = "check"
    INSURANCE = "insurance"
    OTHER = "other"

class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(Integer, primary_key=True)
    treatment_plan_id = Column(Integer, ForeignKey("treatment_plans.id"), nullable=False)
    procedure_id = Column(Integer, ForeignKey("treatment_plan_procedures.id"), nullable=False)
    amount = Column(Float, nullable=False)
    entry_type = Column(String(10), nullable=False)  # charge, payment, adjustment
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    payments = relationship("Payment", back_populates="ledger_entry")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True)
    ledger_entry_id = Column(Integer, ForeignKey("ledger_entries.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    reference_number = Column(String(50))  # For checks, credit card transactions, etc.
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    ledger_entry = relationship("LedgerEntry", back_populates="payments") 