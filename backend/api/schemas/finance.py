from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum
from pydantic import validator

class TransactionType(str, Enum):
    EXPENSE = "expense"
    INCOME = "income"

class ExpenseCategory(str, Enum):
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

class IncomeCategory(str, Enum):
    PATIENT = "patient"
    INSURANCE = "insurance"
    REFUND = "refund"
    ADJUSTMENT = "adjustment"
    OTHER = "other"

class PaymentMethod(str, Enum):
    CASH = "cash"
    CHECK = "check"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_TRANSFER = "bank_transfer"
    OTHER = "other"

class TransactionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    RECONCILED = "reconciled"

class ReconciliationStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class VendorBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    category: ExpenseCategory
    is_active: bool = True
    metadata: Optional[Dict[str, Any]] = None

class VendorCreate(VendorBase):
    pass

class VendorUpdate(VendorBase):
    pass

class VendorResponse(VendorBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class FinanceTransactionBase(BaseModel):
    transaction_type: TransactionType
    amount: float
    date: datetime
    description: Optional[str] = None
    category: ExpenseCategory | IncomeCategory
    payment_method: Optional[PaymentMethod] = None
    vendor_id: Optional[str] = None
    patient_id: Optional[str] = None
    insurance_claim_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class FinanceTransactionCreate(FinanceTransactionBase):
    pass

class FinanceTransactionUpdate(BaseModel):
    status: Optional[TransactionStatus] = None
    approved_by: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class FinanceTransactionResponse(FinanceTransactionBase):
    id: str
    status: TransactionStatus
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class VendorCategoryMapBase(BaseModel):
    vendor_name: str
    vendor_email: Optional[str] = None
    category: ExpenseCategory
    confidence_score: float = 1.0
    is_auto_mapped: bool = False

class VendorCategoryMapCreate(VendorCategoryMapBase):
    pass

class VendorCategoryMapResponse(VendorCategoryMapBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class FinanceReconciliationBase(BaseModel):
    start_date: datetime
    end_date: datetime
    metadata: Optional[Dict[str, Any]] = None

class FinanceReconciliationCreate(FinanceReconciliationBase):
    pass

class FinanceReconciliationUpdate(BaseModel):
    status: Optional[TransactionStatus] = None
    approved_by: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class FinanceReconciliationResponse(FinanceReconciliationBase):
    id: str
    total_income: float
    total_expenses: float
    net_profit: float
    status: TransactionStatus
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class FinancialSummary(BaseModel):
    total_income: float
    total_expenses: float
    net_profit: float
    income_by_category: Dict[IncomeCategory, float]
    expenses_by_category: Dict[ExpenseCategory, float]
    top_vendors: List[Dict[str, Any]]
    recent_transactions: List[FinanceTransactionResponse]

class FinancialForecast(BaseModel):
    projected_income: float
    projected_expenses: float
    projected_profit: float
    confidence_score: float
    assumptions: Dict[str, Any]
    risk_factors: List[str]

class FinancialExport(BaseModel):
    start_date: datetime
    end_date: datetime
    format: str = "csv"  # csv, json, pdf
    include_transactions: bool = True
    include_reconciliations: bool = True
    include_forecasts: bool = False

class TransactionBase(BaseModel):
    transaction_type: TransactionType
    amount: float
    date: datetime
    description: str
    category: ExpenseCategory | IncomeCategory
    payment_method: PaymentMethod
    bank_reference: Optional[str] = None
    notes: Optional[str] = None
    vendor_id: Optional[int] = None
    patient_id: Optional[int] = None
    insurance_claim_id: Optional[int] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    status: Optional[TransactionStatus] = None
    bank_reference: Optional[str] = None
    notes: Optional[str] = None
    approved_by: Optional[int] = None

class TransactionResponse(TransactionBase):
    id: int
    status: TransactionStatus
    created_by: int
    approved_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class ReconciliationBase(BaseModel):
    start_date: datetime
    end_date: datetime
    notes: Optional[str] = None

class ReconciliationCreate(ReconciliationBase):
    pass

class ReconciliationUpdate(BaseModel):
    status: Optional[ReconciliationStatus] = None
    notes: Optional[str] = None
    approved_by: Optional[int] = None
    completed_at: Optional[datetime] = None

class ReconciliationResponse(ReconciliationBase):
    id: int
    status: ReconciliationStatus
    total_transactions: int
    matched_transactions: int
    total_amount: float
    matched_amount: float
    created_by: int
    approved_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class ReconciliationTransactionBase(BaseModel):
    reconciliation_id: int
    transaction_id: int
    bank_reference: str
    notes: Optional[str] = None

class ReconciliationTransactionCreate(ReconciliationTransactionBase):
    pass

class ReconciliationTransactionUpdate(BaseModel):
    is_matched: Optional[bool] = None
    notes: Optional[str] = None

class ReconciliationTransactionResponse(ReconciliationTransactionBase):
    id: int
    is_matched: bool
    matched_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class ReconciliationSummary(BaseModel):
    total_transactions: int
    matched_transactions: int
    unmatched_transactions: int
    total_amount: float
    matched_amount: float
    unmatched_amount: float
    completion_percentage: float

class ReconciliationReport(BaseModel):
    reconciliation: ReconciliationResponse
    summary: ReconciliationSummary
    transactions: List[TransactionResponse]
    reconciliation_transactions: List[ReconciliationTransactionResponse]

class BulkTransactionMatch(BaseModel):
    transaction_id: int
    bank_reference: str

    @validator('bank_reference')
    def validate_bank_reference(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Bank reference cannot be empty')
        if len(v) > 50:
            raise ValueError('Bank reference cannot exceed 50 characters')
        return v.strip()

class BulkTransactionMatchRequest(BaseModel):
    matches: List[BulkTransactionMatch]

    @validator('matches')
    def validate_matches(cls, v):
        if not v:
            raise ValueError('At least one transaction must be provided')
        if len(v) > 100:
            raise ValueError('Cannot process more than 100 transactions at once')
        return v

class BulkTransactionMatchResponse(BaseModel):
    success: bool
    matched_count: int
    failed_transactions: Optional[List[int]] = None
    error: Optional[str] = None
    results: Optional[List[BulkOperationResult]] = None
    audit_id: Optional[int] = None

class BulkMatchValidationRules(BaseModel):
    max_transactions_per_batch: int = 100
    min_bank_reference_length: int = 1
    max_bank_reference_length: int = 50
    allowed_transaction_statuses: List[TransactionStatus] = [
        TransactionStatus.PENDING,
        TransactionStatus.APPROVED
    ]
    excluded_statuses: List[TransactionStatus] = [
        TransactionStatus.REJECTED,
        TransactionStatus.RECONCILED
    ] 