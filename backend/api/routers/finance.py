from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy import func, and_, or_, case
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse
from ..database import get_db
from ..models.finance import (
    FinanceTransaction,
    Vendor,
    VendorCategoryMap,
    FinanceReconciliation,
    TransactionType,
    TransactionStatus,
    ExpenseCategory,
    IncomeCategory,
    Reconciliation,
    ReconciliationTransaction,
    ReconciliationStatus,
    AuditLog,
    BulkOperationStatus
)
from ..schemas.finance import (
    FinanceTransactionCreate,
    FinanceTransactionResponse,
    FinanceTransactionUpdate,
    VendorCreate,
    VendorResponse,
    VendorUpdate,
    VendorCategoryMapCreate,
    VendorCategoryMapResponse,
    FinanceReconciliationCreate,
    FinanceReconciliationResponse,
    FinanceReconciliationUpdate,
    FinancialSummary,
    FinancialForecast,
    FinancialExport,
    TransactionResponse,
    TransactionUpdate,
    ReconciliationResponse,
    ReconciliationCreate,
    ReconciliationUpdate,
    ReconciliationTransactionResponse,
    ReconciliationTransactionCreate,
    ReconciliationTransactionUpdate,
    ReconciliationSummary,
    ReconciliationReport,
    BulkTransactionMatchRequest,
    BulkTransactionMatchResponse,
    BulkOperationResult,
    BulkMatchValidationRules
)
from ..auth import get_current_user, is_admin, get_current_admin_user
import csv
import io
import asyncio
from ratelimit import limits, sleep_and_retry

router = APIRouter(prefix="/finance", tags=["finance"])

# Rate limiting configuration
ONE_MINUTE = 60
MAX_REQUESTS = 10

@sleep_and_retry
@limits(calls=MAX_REQUESTS, period=ONE_MINUTE)
def check_rate_limit():
    return True

@router.post("/transactions", response_model=TransactionResponse)
async def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new financial transaction (expense or income).
    """
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")

    db_transaction = FinanceTransaction(
        **transaction.dict(),
        created_by=current_user["id"],
        status=TransactionStatus.PENDING
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.put("/transactions/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: int,
    transaction: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Update a financial transaction.
    """
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")

    db_transaction = db.query(FinanceTransaction).filter(FinanceTransaction.id == transaction_id).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    for key, value in transaction.dict(exclude_unset=True).items():
        setattr(db_transaction, key, value)

    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    status: Optional[TransactionStatus] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get financial transactions with optional filtering.
    """
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")

    query = db.query(FinanceTransaction)
    
    if start_date:
        query = query.filter(FinanceTransaction.date >= start_date)
    if end_date:
        query = query.filter(FinanceTransaction.date <= end_date)
    if status:
        query = query.filter(FinanceTransaction.status == status)
    
    return query.all()

@router.get("/summary", response_model=FinancialSummary)
async def get_financial_summary(
    start_date: datetime = Query(..., description="Start date for summary"),
    end_date: datetime = Query(..., description="End date for summary"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get financial summary including totals and category breakdowns.
    """
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Calculate totals
    totals = db.query(
        func.sum(case([(FinanceTransaction.transaction_type == TransactionType.INCOME, FinanceTransaction.amount)], else_=0)).label('total_income'),
        func.sum(case([(FinanceTransaction.transaction_type == TransactionType.EXPENSE, FinanceTransaction.amount)], else_=0)).label('total_expenses')
    ).filter(
        FinanceTransaction.date >= start_date,
        FinanceTransaction.date <= end_date,
        FinanceTransaction.status == TransactionStatus.APPROVED
    ).first()

    # Calculate income by category
    income_by_category = db.query(
        FinanceTransaction.category,
        func.sum(FinanceTransaction.amount).label('total')
    ).filter(
        FinanceTransaction.transaction_type == TransactionType.INCOME,
        FinanceTransaction.date >= start_date,
        FinanceTransaction.date <= end_date,
        FinanceTransaction.status == TransactionStatus.APPROVED
    ).group_by(FinanceTransaction.category).all()

    # Calculate expenses by category
    expenses_by_category = db.query(
        FinanceTransaction.category,
        func.sum(FinanceTransaction.amount).label('total')
    ).filter(
        FinanceTransaction.transaction_type == TransactionType.EXPENSE,
        FinanceTransaction.date >= start_date,
        FinanceTransaction.date <= end_date,
        FinanceTransaction.status == TransactionStatus.APPROVED
    ).group_by(FinanceTransaction.category).all()

    # Get top vendors
    top_vendors = db.query(
        Vendor.name,
        func.sum(FinanceTransaction.amount).label('total')
    ).join(FinanceTransaction).filter(
        FinanceTransaction.date >= start_date,
        FinanceTransaction.date <= end_date,
        FinanceTransaction.status == TransactionStatus.APPROVED
    ).group_by(Vendor.name).order_by(func.sum(FinanceTransaction.amount).desc()).limit(5).all()

    # Get recent transactions
    recent_transactions = db.query(FinanceTransaction).filter(
        FinanceTransaction.date >= start_date,
        FinanceTransaction.date <= end_date
    ).order_by(FinanceTransaction.date.desc()).limit(10).all()

    return FinancialSummary(
        total_income=totals.total_income or 0,
        total_expenses=totals.total_expenses or 0,
        net_profit=(totals.total_income or 0) - (totals.total_expenses or 0),
        income_by_category={category: total for category, total in income_by_category},
        expenses_by_category={category: total for category, total in expenses_by_category},
        top_vendors=[{"name": name, "total": total} for name, total in top_vendors],
        recent_transactions=recent_transactions
    )

@router.get("/forecast", response_model=FinancialForecast)
async def get_financial_forecast(
    months: int = Query(3, description="Number of months to forecast"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get financial forecast for the specified number of months.
    """
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get historical data for the last 12 months
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=365)

    historical_data = db.query(
        func.date_trunc('month', FinanceTransaction.date).label('month'),
        func.sum(case([(FinanceTransaction.transaction_type == TransactionType.INCOME, FinanceTransaction.amount)], else_=0)).label('income'),
        func.sum(case([(FinanceTransaction.transaction_type == TransactionType.EXPENSE, FinanceTransaction.amount)], else_=0)).label('expenses')
    ).filter(
        FinanceTransaction.date >= start_date,
        FinanceTransaction.date <= end_date,
        FinanceTransaction.status == TransactionStatus.APPROVED
    ).group_by('month').order_by('month').all()

    # Calculate average monthly growth rates
    if len(historical_data) > 1:
        income_growth = (historical_data[-1].income - historical_data[0].income) / len(historical_data)
        expense_growth = (historical_data[-1].expenses - historical_data[0].expenses) / len(historical_data)
    else:
        income_growth = 0
        expense_growth = 0

    # Project future values
    last_month = historical_data[-1] if historical_data else None
    if last_month:
        projected_income = last_month.income + (income_growth * months)
        projected_expenses = last_month.expenses + (expense_growth * months)
    else:
        projected_income = 0
        projected_expenses = 0

    # Calculate confidence score based on data points
    confidence_score = min(1.0, len(historical_data) / 12)

    return FinancialForecast(
        projected_income=projected_income,
        projected_expenses=projected_expenses,
        projected_profit=projected_income - projected_expenses,
        confidence_score=confidence_score,
        assumptions={
            "historical_months": len(historical_data),
            "income_growth_rate": income_growth,
            "expense_growth_rate": expense_growth
        },
        risk_factors=[
            "Limited historical data" if len(historical_data) < 6 else None,
            "High expense growth" if expense_growth > income_growth else None
        ]
    )

@router.post("/export")
async def export_financial_data(
    export_data: FinancialExport,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Export financial data in the specified format.
    """
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")

    # TODO: Implement export logic based on format and included data
    return {"message": "Export functionality to be implemented"}

@router.post("/reconciliations", response_model=ReconciliationResponse)
async def create_reconciliation(
    reconciliation: ReconciliationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new reconciliation.
    """
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get transactions within date range
    transactions = db.query(FinanceTransaction).filter(
        FinanceTransaction.date >= reconciliation.start_date,
        FinanceTransaction.date <= reconciliation.end_date
    ).all()
    
    db_reconciliation = Reconciliation(
        **reconciliation.dict(),
        created_by=current_user["id"],
        status=ReconciliationStatus.PENDING,
        total_transactions=len(transactions),
        total_amount=sum(t.amount for t in transactions)
    )
    db.add(db_reconciliation)
    db.commit()
    db.refresh(db_reconciliation)
    return db_reconciliation

@router.put("/reconciliations/{reconciliation_id}", response_model=ReconciliationResponse)
async def update_reconciliation(
    reconciliation_id: int,
    reconciliation: ReconciliationUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Update a reconciliation.
    """
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_reconciliation = db.query(Reconciliation).filter(Reconciliation.id == reconciliation_id).first()
    if not db_reconciliation:
        raise HTTPException(status_code=404, detail="Reconciliation not found")
    
    for key, value in reconciliation.dict(exclude_unset=True).items():
        setattr(db_reconciliation, key, value)
    
    db.commit()
    db.refresh(db_reconciliation)
    return db_reconciliation

@router.get("/reconciliations", response_model=List[ReconciliationResponse])
async def get_reconciliations(
    status: Optional[ReconciliationStatus] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get a list of reconciliations.
    """
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = db.query(Reconciliation)
    if status:
        query = query.filter(Reconciliation.status == status)
    
    return query.all()

@router.get("/reconciliations/{reconciliation_id}", response_model=ReconciliationReport)
async def get_reconciliation(
    reconciliation_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get a reconciliation report.
    """
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    reconciliation = db.query(Reconciliation).filter(Reconciliation.id == reconciliation_id).first()
    if not reconciliation:
        raise HTTPException(status_code=404, detail="Reconciliation not found")
    
    transactions = db.query(FinanceTransaction).filter(
        FinanceTransaction.date >= reconciliation.start_date,
        FinanceTransaction.date <= reconciliation.end_date
    ).all()
    
    reconciliation_transactions = db.query(ReconciliationTransaction).filter(
        ReconciliationTransaction.reconciliation_id == reconciliation_id
    ).all()
    
    summary = ReconciliationSummary(
        total_transactions=reconciliation.total_transactions,
        matched_transactions=reconciliation.matched_transactions,
        unmatched_transactions=reconciliation.total_transactions - reconciliation.matched_transactions,
        total_amount=reconciliation.total_amount,
        matched_amount=reconciliation.matched_amount,
        unmatched_amount=reconciliation.total_amount - reconciliation.matched_amount,
        completion_percentage=(reconciliation.matched_transactions / reconciliation.total_transactions * 100)
        if reconciliation.total_transactions > 0 else 0
    )
    
    return ReconciliationReport(
        reconciliation=reconciliation,
        summary=summary,
        transactions=transactions,
        reconciliation_transactions=reconciliation_transactions
    )

@router.post("/reconciliations/{reconciliation_id}/transactions", response_model=ReconciliationTransactionResponse)
async def create_reconciliation_transaction(
    reconciliation_id: int,
    transaction: ReconciliationTransactionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new reconciliation transaction.
    """
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_reconciliation = db.query(Reconciliation).filter(Reconciliation.id == reconciliation_id).first()
    if not db_reconciliation:
        raise HTTPException(status_code=404, detail="Reconciliation not found")
    
    db_transaction = db.query(FinanceTransaction).filter(FinanceTransaction.id == transaction.transaction_id).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db_reconciliation_transaction = ReconciliationTransaction(
        **transaction.dict(),
        is_matched=False
    )
    db.add(db_reconciliation_transaction)
    db.commit()
    db.refresh(db_reconciliation_transaction)
    return db_reconciliation_transaction

@router.put("/reconciliations/{reconciliation_id}/transactions/{transaction_id}", response_model=ReconciliationTransactionResponse)
async def update_reconciliation_transaction(
    reconciliation_id: int,
    transaction_id: int,
    transaction: ReconciliationTransactionUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Update a reconciliation transaction.
    """
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_reconciliation_transaction = db.query(ReconciliationTransaction).filter(
        ReconciliationTransaction.reconciliation_id == reconciliation_id,
        ReconciliationTransaction.id == transaction_id
    ).first()
    if not db_reconciliation_transaction:
        raise HTTPException(status_code=404, detail="Reconciliation transaction not found")
    
    for key, value in transaction.dict(exclude_unset=True).items():
        setattr(db_reconciliation_transaction, key, value)
    
    if transaction.is_matched:
        db_reconciliation_transaction.matched_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_reconciliation_transaction)
    return db_reconciliation_transaction

@router.get("/reconciliations/{reconciliation_id}/export")
async def export_reconciliation(
    reconciliation_id: int,
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Export a reconciliation in the specified format.
    """
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    reconciliation = db.query(Reconciliation).filter(Reconciliation.id == reconciliation_id).first()
    if not reconciliation:
        raise HTTPException(status_code=404, detail="Reconciliation not found")
    
    transactions = db.query(FinanceTransaction).filter(
        FinanceTransaction.date >= reconciliation.start_date,
        FinanceTransaction.date <= reconciliation.end_date
    ).all()
    
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            "Date", "Description", "Amount", "Type", "Category",
            "Payment Method", "Status", "Bank Reference", "Notes"
        ])
        
        # Write data
        for transaction in transactions:
            writer.writerow([
                transaction.date.strftime("%Y-%m-%d"),
                transaction.description,
                transaction.amount,
                transaction.transaction_type,
                transaction.category,
                transaction.payment_method,
                transaction.status,
                transaction.bank_reference or "",
                transaction.notes or ""
            ])
        
        return {
            "content": output.getvalue(),
            "filename": f"reconciliation_{reconciliation_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    
    raise HTTPException(status_code=400, detail="Unsupported export format")

async def process_bulk_match(
    db: Session,
    reconciliation_id: int,
    matches: List[BulkTransactionMatch],
    user_id: int
) -> BulkTransactionMatchResponse:
    try:
        check_rate_limit()  # Apply rate limiting
        
        # Create audit log entry
        audit_log = AuditLog(
            action="bulk_match_transactions",
            entity_type="reconciliation",
            entity_id=reconciliation_id,
            user_id=user_id,
            details={"matches_count": len(matches)},
            created_at=datetime.utcnow()
        )
        db.add(audit_log)
        db.flush()

        # Verify reconciliation exists and is in progress
        reconciliation = db.query(Reconciliation).filter(
            Reconciliation.id == reconciliation_id,
            Reconciliation.status == ReconciliationStatus.IN_PROGRESS
        ).first()
        
        if not reconciliation:
            raise HTTPException(
                status_code=404,
                detail="Reconciliation not found or not in progress"
            )

        # Get all transactions to verify they exist and are unmatched
        transaction_ids = [match.transaction_id for match in matches]
        transactions = db.query(FinanceTransaction).filter(
            FinanceTransaction.id.in_(transaction_ids)
        ).all()
        
        if len(transactions) != len(transaction_ids):
            raise HTTPException(
                status_code=400,
                detail="One or more transactions not found"
            )

        # Verify transactions are not already matched
        existing_matches = db.query(ReconciliationTransaction).filter(
            ReconciliationTransaction.reconciliation_id == reconciliation_id,
            ReconciliationTransaction.transaction_id.in_(transaction_ids)
        ).all()
        
        if existing_matches:
            raise HTTPException(
                status_code=400,
                detail="One or more transactions are already matched"
            )

        # Process matches with detailed results
        results = []
        reconciliation_transactions = []
        failed_transactions = []
        matched_count = 0

        for match in matches:
            try:
                # Validate transaction status
                transaction = next(t for t in transactions if t.id == match.transaction_id)
                if transaction.status not in BulkMatchValidationRules().allowed_transaction_statuses:
                    raise ValueError(f"Transaction {transaction.id} has invalid status: {transaction.status}")

                # Create reconciliation transaction
                reconciliation_transaction = ReconciliationTransaction(
                    reconciliation_id=reconciliation_id,
                    transaction_id=match.transaction_id,
                    bank_reference=match.bank_reference,
                    is_matched=True,
                    matched_at=datetime.utcnow()
                )
                reconciliation_transactions.append(reconciliation_transaction)
                results.append(BulkOperationResult(
                    transaction_id=match.transaction_id,
                    status=BulkOperationStatus.SUCCESS
                ))
                matched_count += 1

            except Exception as e:
                failed_transactions.append(match.transaction_id)
                results.append(BulkOperationResult(
                    transaction_id=match.transaction_id,
                    status=BulkOperationStatus.FAILED,
                    error=str(e)
                ))

        # Bulk insert successful matches
        if reconciliation_transactions:
            db.bulk_save_objects(reconciliation_transactions)
            
            # Update reconciliation stats
            reconciliation.matched_transactions += len(reconciliation_transactions)
            reconciliation.matched_amount += sum(
                t.amount for t in transactions
                if t.transaction_type == TransactionType.INCOME
            ) - sum(
                t.amount for t in transactions
                if t.transaction_type == TransactionType.EXPENSE
            )

        # Update audit log with results
        audit_log.details.update({
            "matched_count": matched_count,
            "failed_count": len(failed_transactions),
            "results": [r.dict() for r in results]
        })
        
        db.commit()

        return BulkTransactionMatchResponse(
            success=matched_count > 0,
            matched_count=matched_count,
            failed_transactions=failed_transactions if failed_transactions else None,
            results=results,
            audit_id=audit_log.id
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to bulk match transactions: {str(e)}"
        )

@router.post(
    "/reconciliations/{reconciliation_id}/transactions/bulk",
    response_model=BulkTransactionMatchResponse,
    dependencies=[Depends(get_current_admin_user)]
)
async def bulk_match_transactions(
    reconciliation_id: int,
    request: BulkTransactionMatchRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Bulk match transactions with rate limiting and async processing.
    """
    # Start async processing
    background_tasks.add_task(
        process_bulk_match,
        db,
        reconciliation_id,
        request.matches,
        current_user.id
    )

    # Return immediate response
    return JSONResponse(
        status_code=202,
        content={
            "message": "Bulk match operation started",
            "transaction_count": len(request.matches)
        }
    ) 