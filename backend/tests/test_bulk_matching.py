import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from main import app
from config import get_db
from models.finance import (
    FinanceTransaction, Reconciliation, ReconciliationTransaction,
    TransactionType, TransactionStatus, ReconciliationStatus
)

client = TestClient(app)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = Session(bind=engine)
    yield session
    session.rollback()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def test_user(db_session):
    # Create a test user
    from ..models.user import User
    user = User(
        email="test@example.com",
        hashed_password="hashed_password",
        is_admin=True
    )
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture
def test_transactions(db_session, test_user):
    # Create test transactions
    transactions = []
    for i in range(5):
        transaction = FinanceTransaction(
            transaction_type=TransactionType.EXPENSE,
            amount=100.0 + i,
            date=datetime.utcnow(),
            description=f"Test Transaction {i}",
            category="SUPPLIES",
            payment_method="CREDIT_CARD",
            status=TransactionStatus.PENDING,
            created_by=test_user.id
        )
        db_session.add(transaction)
        transactions.append(transaction)
    db_session.commit()
    return transactions

@pytest.fixture
def test_reconciliation(db_session, test_user, test_transactions):
    # Create a test reconciliation
    reconciliation = Reconciliation(
        start_date=datetime.utcnow() - timedelta(days=7),
        end_date=datetime.utcnow(),
        status=ReconciliationStatus.IN_PROGRESS,
        total_transactions=len(test_transactions),
        total_amount=sum(t.amount for t in test_transactions),
        created_by=test_user.id
    )
    db_session.add(reconciliation)
    db_session.commit()
    return reconciliation

def test_bulk_match_transactions(db_session, test_user, test_transactions, test_reconciliation):
    # Test successful bulk matching
    response = client.post(
        f"/finance/reconciliations/{test_reconciliation.id}/transactions/bulk",
        json={
            "matches": [
                {"transaction_id": t.id, "bank_reference": f"REF-{t.id}"}
                for t in test_transactions[:3]
            ]
        },
        headers={"Authorization": f"Bearer {test_user.id}"}
    )
    assert response.status_code == 202
    data = response.json()
    assert "message" in data
    assert data["transaction_count"] == 3

    # Verify the matches were created
    matches = db_session.query(ReconciliationTransaction).filter(
        ReconciliationTransaction.reconciliation_id == test_reconciliation.id
    ).all()
    assert len(matches) == 3

def test_bulk_match_validation(db_session, test_user, test_transactions, test_reconciliation):
    # Test validation with invalid bank reference
    response = client.post(
        f"/finance/reconciliations/{test_reconciliation.id}/transactions/bulk",
        json={
            "matches": [
                {"transaction_id": test_transactions[0].id, "bank_reference": ""}
            ]
        },
        headers={"Authorization": f"Bearer {test_user.id}"}
    )
    assert response.status_code == 422

def test_bulk_match_rate_limiting(db_session, test_user, test_transactions, test_reconciliation):
    # Test rate limiting
    for _ in range(12):  # Try to exceed the rate limit
        response = client.post(
            f"/finance/reconciliations/{test_reconciliation.id}/transactions/bulk",
            json={
                "matches": [
                    {"transaction_id": t.id, "bank_reference": f"REF-{t.id}"}
                    for t in test_transactions[:1]
                ]
            },
            headers={"Authorization": f"Bearer {test_user.id}"}
        )
    assert response.status_code == 429  # Too Many Requests

def test_bulk_match_audit_logging(db_session, test_user, test_transactions, test_reconciliation):
    # Test audit logging
    response = client.post(
        f"/finance/reconciliations/{test_reconciliation.id}/transactions/bulk",
        json={
            "matches": [
                {"transaction_id": t.id, "bank_reference": f"REF-{t.id}"}
                for t in test_transactions[:2]
            ]
        },
        headers={"Authorization": f"Bearer {test_user.id}"}
    )
    assert response.status_code == 202

    # Verify audit log was created
    from ..models.finance import AuditLog
    audit_logs = db_session.query(AuditLog).filter(
        AuditLog.entity_id == test_reconciliation.id
    ).all()
    assert len(audit_logs) > 0
    assert audit_logs[0].action == "bulk_match_transactions" 