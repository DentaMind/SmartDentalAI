from fastapi import APIRouter, HTTPException, WebSocket, Depends
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from decimal import Decimal
from ..services.financial_service import financial_service, FinancialMetrics, RevenueDataPoint, AgingReportEntry
from ..auth.auth import get_current_user
from ..models.user import UserRole

router = APIRouter()

class FinancialMetricsResponse(BaseModel):
    total_revenue: Decimal
    total_outstanding: Decimal
    collection_rate: Decimal
    average_payment_time: int
    insurance_claims_pending: int
    insurance_claims_paid: int

    class Config:
        orm_mode = True

class RevenueDataPointResponse(BaseModel):
    date: str
    revenue: Decimal

    class Config:
        orm_mode = True

class AgingReportEntryResponse(BaseModel):
    period: str
    amount: Decimal

    class Config:
        orm_mode = True

class PaymentMethodDistributionResponse(BaseModel):
    insurance: Decimal
    cash: Decimal
    credit_card: Decimal
    check: Decimal

    class Config:
        orm_mode = True

class FinancialReportResponse(BaseModel):
    summary: Dict[str, Any]
    revenue_trend: List[RevenueDataPoint]
    aging_report: List[AgingReportEntry]
    payment_distribution: Dict[str, Decimal]
    transactions: List[Dict[str, Any]]

    class Config:
        orm_mode = True

class ClinicPerformanceResponse(BaseModel):
    clinic_id: str
    name: str
    revenue: Decimal
    collection_rate: Decimal
    patient_count: int
    average_ticket: Decimal

    class Config:
        orm_mode = True

class FinancialAlertResponse(BaseModel):
    type: str
    severity: str
    message: str
    details: Dict[str, Any]

    class Config:
        orm_mode = True

@router.get("/metrics", response_model=FinancialMetricsResponse)
async def get_financial_metrics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get financial metrics for the specified date range."""
    try:
        metrics = financial_service.calculate_metrics(start_date, end_date)
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/revenue-trend", response_model=List[RevenueDataPointResponse])
async def get_revenue_trend(
    start_date: str,
    end_date: str
):
    """Get revenue trend data for the specified date range."""
    try:
        trend_data = financial_service.get_revenue_trend(start_date, end_date)
        return trend_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/aging-report", response_model=List[AgingReportEntryResponse])
async def get_aging_report():
    """Get aging report for outstanding balances."""
    try:
        aging_report = financial_service.get_aging_report()
        return aging_report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/payment-method-distribution", response_model=PaymentMethodDistributionResponse)
async def get_payment_method_distribution():
    """Get distribution of payment methods."""
    try:
        distribution = financial_service.get_payment_method_distribution()
        return PaymentMethodDistributionResponse(
            insurance=distribution['Insurance'],
            cash=distribution['Cash'],
            credit_card=distribution['Credit Card'],
            check=distribution['Check']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/generate", response_model=FinancialReportResponse)
async def generate_financial_report(
    start_date: str,
    end_date: str,
    report_type: str = 'detailed'
):
    """Generate a comprehensive financial report."""
    try:
        report = financial_service.generate_financial_report(start_date, end_date, report_type)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/export")
async def export_financial_report(
    start_date: str,
    end_date: str,
    filename: str = "financial_report.csv"
):
    """Export financial report to CSV format."""
    try:
        report = financial_service.generate_financial_report(start_date, end_date)
        filepath = financial_service.export_report_to_csv(report, filename)
        return {"filepath": filepath}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/clinic-performance", response_model=List[ClinicPerformanceResponse])
async def get_clinic_performance(
    start_date: str,
    end_date: str
):
    """Get performance metrics for each clinic."""
    try:
        performance = financial_service.get_clinic_performance(start_date, end_date)
        return performance
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts", response_model=List[FinancialAlertResponse])
async def get_financial_alerts():
    """Get financial alerts and notifications."""
    try:
        alerts = financial_service.get_financial_alerts()
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/ws/alerts/{clinic_id}")
async def websocket_endpoint(websocket: WebSocket, clinic_id: str, current_user: UserRole = Depends(get_current_user)):
    """WebSocket endpoint for real-time financial alerts."""
    if current_user.role not in ['admin', 'financial_manager']:
        await websocket.close(code=1008)  # Policy Violation
        return
    
    await financial_service.subscribe_to_alerts(websocket, clinic_id)

@router.post("/cache/invalidate")
async def invalidate_cache(current_user: UserRole = Depends(get_current_user)):
    """Invalidate financial data cache."""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    financial_service.invalidate_cache()
    return {"message": "Cache invalidated successfully"} 