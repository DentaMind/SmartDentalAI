from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from decimal import Decimal
import json
import os
import logging
import csv
from dataclasses import dataclass, asdict
from ..services.balance_service import balance_service
from ..services.payment_service import payment_service
from ..services.cache_service import cache_service
import asyncio
from fastapi import WebSocket
from collections import defaultdict

@dataclass
class FinancialMetrics:
    total_revenue: Decimal
    total_outstanding: Decimal
    collection_rate: Decimal
    average_payment_time: int
    insurance_claims_pending: int
    insurance_claims_paid: int

@dataclass
class RevenueDataPoint:
    date: str
    revenue: Decimal

@dataclass
class AgingReportEntry:
    period: str
    amount: Decimal

class FinancialService:
    def __init__(self):
        self.storage_file = "financial_metrics.json"
        self.load_metrics()
        self.websocket_connections = defaultdict(list)
        self.alert_subscribers = defaultdict(list)
        self._setup_periodic_updates()

    def _setup_periodic_updates(self):
        """Setup periodic updates for real-time data."""
        asyncio.create_task(self._periodic_alert_check())
        asyncio.create_task(self._periodic_metrics_update())

    async def _periodic_alert_check(self):
        """Check for new alerts periodically."""
        while True:
            try:
                alerts = self.get_financial_alerts()
                if alerts:
                    await self._broadcast_alerts(alerts)
                await asyncio.sleep(300)  # Check every 5 minutes
            except Exception as e:
                logging.error(f"Error in periodic alert check: {e}")
                await asyncio.sleep(60)

    async def _periodic_metrics_update(self):
        """Update metrics periodically."""
        while True:
            try:
                self.calculate_metrics()
                await asyncio.sleep(3600)  # Update every hour
            except Exception as e:
                logging.error(f"Error in periodic metrics update: {e}")
                await asyncio.sleep(300)

    async def _broadcast_alerts(self, alerts: List[Dict[str, Any]]):
        """Broadcast alerts to all connected clients."""
        for clinic_id, connections in self.alert_subscribers.items():
            for connection in connections:
                try:
                    await connection.send_json({
                        "type": "alert",
                        "data": alerts
                    })
                except Exception as e:
                    logging.error(f"Error broadcasting alert: {e}")
                    self.alert_subscribers[clinic_id].remove(connection)

    async def subscribe_to_alerts(self, websocket: WebSocket, clinic_id: str):
        """Subscribe a websocket connection to alerts."""
        await websocket.accept()
        self.alert_subscribers[clinic_id].append(websocket)
        try:
            while True:
                await websocket.receive_text()  # Keep connection alive
        except Exception:
            self.alert_subscribers[clinic_id].remove(websocket)

    def load_metrics(self) -> None:
        """Load financial metrics from storage file."""
        try:
            if os.path.exists(self.storage_file):
                with open(self.storage_file, 'r') as f:
                    data = json.load(f)
                    # TODO: Implement loading of historical metrics
        except Exception as e:
            logging.error(f"Error loading financial metrics: {e}")

    def save_metrics(self) -> None:
        """Save financial metrics to storage file."""
        try:
            with open(self.storage_file, 'w') as f:
                json.dump({}, f, indent=2)  # TODO: Implement saving of metrics
        except Exception as e:
            logging.error(f"Error saving financial metrics: {e}")

    def calculate_metrics(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> FinancialMetrics:
        """Calculate financial metrics for the specified date range."""
        cache_key = f"financial_metrics_{start_date}_{end_date}"
        cached_metrics = cache_service.get(cache_key)
        if cached_metrics:
            return FinancialMetrics(**cached_metrics)

        try:
            # Get all payment plans
            payment_plans = payment_service.get_all_payment_plans()
            
            # Calculate total revenue
            total_revenue = Decimal('0')
            total_outstanding = Decimal('0')
            total_payments = 0
            total_payment_days = 0
            
            for plan in payment_plans:
                for payment in plan.payments:
                    if payment.status == 'PAID':
                        total_revenue += payment.amount
                        total_payments += 1
                        payment_date = datetime.fromisoformat(payment.date)
                        plan_date = datetime.fromisoformat(plan.start_date)
                        total_payment_days += (payment_date - plan_date).days
                    elif payment.status == 'PENDING':
                        total_outstanding += payment.amount

            # Calculate collection rate
            total_expected = total_revenue + total_outstanding
            collection_rate = (total_revenue / total_expected * 100) if total_expected > 0 else Decimal('0')

            # Calculate average payment time
            average_payment_time = total_payment_days // total_payments if total_payments > 0 else 0

            # Get insurance claims status
            insurance_claims_pending = 0
            insurance_claims_paid = 0
            for plan in payment_plans:
                if plan.insurance_provider:
                    if plan.status == 'PAID':
                        insurance_claims_paid += 1
                    elif plan.status == 'PENDING':
                        insurance_claims_pending += 1

            metrics = FinancialMetrics(
                total_revenue=total_revenue,
                total_outstanding=total_outstanding,
                collection_rate=collection_rate,
                average_payment_time=average_payment_time,
                insurance_claims_pending=insurance_claims_pending,
                insurance_claims_paid=insurance_claims_paid
            )

            cache_service.set(cache_key, asdict(metrics))
            return metrics
        except Exception as e:
            logging.error(f"Error calculating financial metrics: {e}")
            raise

    def get_revenue_trend(self, start_date: str, end_date: str) -> List[RevenueDataPoint]:
        """Get revenue trend data for the specified date range."""
        cache_key = f"revenue_trend_{start_date}_{end_date}"
        cached_trend = cache_service.get(cache_key)
        if cached_trend:
            return [RevenueDataPoint(**point) for point in cached_trend]

        try:
            payment_plans = payment_service.get_all_payment_plans()
            revenue_by_month: Dict[str, Decimal] = {}

            start = datetime.fromisoformat(start_date)
            end = datetime.fromisoformat(end_date)
            current = start

            while current <= end:
                month_key = current.strftime('%Y-%m')
                revenue_by_month[month_key] = Decimal('0')
                current = current.replace(day=1) + timedelta(days=32)
                current = current.replace(day=1)

            for plan in payment_plans:
                for payment in plan.payments:
                    if payment.status == 'PAID':
                        payment_date = datetime.fromisoformat(payment.date)
                        if start <= payment_date <= end:
                            month_key = payment_date.strftime('%Y-%m')
                            revenue_by_month[month_key] += payment.amount

            trend_data = [
                RevenueDataPoint(date=month, revenue=amount)
                for month, amount in sorted(revenue_by_month.items())
            ]

            cache_service.set(cache_key, [asdict(point) for point in trend_data])
            return trend_data
        except Exception as e:
            logging.error(f"Error getting revenue trend: {e}")
            raise

    def get_aging_report(self) -> List[AgingReportEntry]:
        """Get aging report for outstanding balances."""
        try:
            payment_plans = payment_service.get_all_payment_plans()
            aging_buckets = {
                'Current': Decimal('0'),
                '1-30 Days': Decimal('0'),
                '31-60 Days': Decimal('0'),
                '61-90 Days': Decimal('0'),
                '>90 Days': Decimal('0')
            }

            today = datetime.now()

            for plan in payment_plans:
                if plan.status in ['PENDING', 'PARTIALLY_PAID']:
                    plan_date = datetime.fromisoformat(plan.start_date)
                    days_overdue = (today - plan_date).days

                    if days_overdue <= 0:
                        aging_buckets['Current'] += plan.total_amount - plan.paid_amount
                    elif days_overdue <= 30:
                        aging_buckets['1-30 Days'] += plan.total_amount - plan.paid_amount
                    elif days_overdue <= 60:
                        aging_buckets['31-60 Days'] += plan.total_amount - plan.paid_amount
                    elif days_overdue <= 90:
                        aging_buckets['61-90 Days'] += plan.total_amount - plan.paid_amount
                    else:
                        aging_buckets['>90 Days'] += plan.total_amount - plan.paid_amount

            return [
                AgingReportEntry(period=period, amount=amount)
                for period, amount in aging_buckets.items()
            ]
        except Exception as e:
            logging.error(f"Error getting aging report: {e}")
            raise

    def get_payment_method_distribution(self) -> Dict[str, Decimal]:
        """Get distribution of payment methods."""
        try:
            payment_plans = payment_service.get_all_payment_plans()
            distribution = {
                'Insurance': Decimal('0'),
                'Cash': Decimal('0'),
                'Credit Card': Decimal('0'),
                'Check': Decimal('0')
            }

            for plan in payment_plans:
                for payment in plan.payments:
                    if payment.status == 'PAID':
                        if plan.insurance_provider:
                            distribution['Insurance'] += payment.amount
                        else:
                            distribution[payment.method] += payment.amount

            return distribution
        except Exception as e:
            logging.error(f"Error getting payment method distribution: {e}")
            raise

    def generate_financial_report(self, start_date: str, end_date: str, report_type: str = 'detailed') -> Dict[str, Any]:
        """Generate a comprehensive financial report."""
        try:
            metrics = self.calculate_metrics(start_date, end_date)
            revenue_trend = self.get_revenue_trend(start_date, end_date)
            aging_report = self.get_aging_report()
            payment_distribution = self.get_payment_method_distribution()

            # Get detailed transaction data
            payment_plans = payment_service.get_all_payment_plans()
            transactions = []
            for plan in payment_plans:
                for payment in plan.payments:
                    payment_date = datetime.fromisoformat(payment.date)
                    if start_date <= payment_date.isoformat() <= end_date:
                        transactions.append({
                            'date': payment.date,
                            'patient_id': plan.patient_id,
                            'type': 'payment',
                            'amount': payment.amount,
                            'method': payment.method,
                            'status': payment.status,
                            'reference': plan.id
                        })

            # Get balance entries
            for patient_id in balance_service.balances:
                balance = balance_service.get_balance(patient_id)
                for entry in balance.entries:
                    entry_date = datetime.fromisoformat(entry.date)
                    if start_date <= entry_date.isoformat() <= end_date:
                        transactions.append({
                            'date': entry.date,
                            'patient_id': patient_id,
                            'type': entry.type,
                            'amount': entry.amount,
                            'method': 'balance_entry',
                            'status': entry.status,
                            'reference': entry.reference_id
                        })

            return {
                'summary': {
                    'period': f"{start_date} to {end_date}",
                    'total_revenue': metrics.total_revenue,
                    'total_outstanding': metrics.total_outstanding,
                    'collection_rate': metrics.collection_rate,
                    'insurance_claims': {
                        'pending': metrics.insurance_claims_pending,
                        'paid': metrics.insurance_claims_paid
                    }
                },
                'revenue_trend': revenue_trend,
                'aging_report': aging_report,
                'payment_distribution': payment_distribution,
                'transactions': transactions
            }
        except Exception as e:
            logging.error(f"Error generating financial report: {e}")
            raise

    def export_report_to_csv(self, report_data: Dict[str, Any], filename: str) -> str:
        """Export financial report to CSV format."""
        try:
            os.makedirs('reports', exist_ok=True)
            filepath = os.path.join('reports', filename)

            with open(filepath, 'w', newline='') as f:
                writer = csv.writer(f)

                # Write summary section
                writer.writerow(['Financial Report Summary'])
                writer.writerow(['Period', report_data['summary']['period']])
                writer.writerow(['Total Revenue', f"${report_data['summary']['total_revenue']}"])
                writer.writerow(['Total Outstanding', f"${report_data['summary']['total_outstanding']}"])
                writer.writerow(['Collection Rate', f"{report_data['summary']['collection_rate']}%"])
                writer.writerow([])

                # Write revenue trend
                writer.writerow(['Revenue Trend'])
                writer.writerow(['Date', 'Revenue'])
                for point in report_data['revenue_trend']:
                    writer.writerow([point.date, f"${point.revenue}"])
                writer.writerow([])

                # Write aging report
                writer.writerow(['Aging Report'])
                writer.writerow(['Period', 'Amount'])
                for entry in report_data['aging_report']:
                    writer.writerow([entry.period, f"${entry.amount}"])
                writer.writerow([])

                # Write payment distribution
                writer.writerow(['Payment Method Distribution'])
                writer.writerow(['Method', 'Amount'])
                for method, amount in report_data['payment_distribution'].items():
                    writer.writerow([method, f"${amount}"])
                writer.writerow([])

                # Write detailed transactions
                writer.writerow(['Detailed Transactions'])
                writer.writerow(['Date', 'Patient ID', 'Type', 'Amount', 'Method', 'Status', 'Reference'])
                for transaction in report_data['transactions']:
                    writer.writerow([
                        transaction['date'],
                        transaction['patient_id'],
                        transaction['type'],
                        f"${transaction['amount']}",
                        transaction['method'],
                        transaction['status'],
                        transaction['reference']
                    ])

            return filepath
        except Exception as e:
            logging.error(f"Error exporting report to CSV: {e}")
            raise

    def get_clinic_performance(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Get performance metrics for each clinic."""
        try:
            # TODO: Implement clinic-specific data retrieval
            # This is a placeholder for the actual implementation
            return [
                {
                    'clinic_id': 'clinic1',
                    'name': 'Main Clinic',
                    'revenue': Decimal('75000'),
                    'collection_rate': Decimal('85.5'),
                    'patient_count': 150,
                    'average_ticket': Decimal('500')
                },
                {
                    'clinic_id': 'clinic2',
                    'name': 'Downtown Clinic',
                    'revenue': Decimal('50000'),
                    'collection_rate': Decimal('78.2'),
                    'patient_count': 100,
                    'average_ticket': Decimal('500')
                }
            ]
        except Exception as e:
            logging.error(f"Error getting clinic performance: {e}")
            raise

    def get_financial_alerts(self) -> List[Dict[str, Any]]:
        """Get financial alerts and notifications."""
        cache_key = "financial_alerts"
        cached_alerts = cache_service.get(cache_key)
        if cached_alerts:
            return cached_alerts

        try:
            alerts = []
            
            # Check for overdue payments
            payment_plans = payment_service.get_all_payment_plans()
            for plan in payment_plans:
                if plan.status == 'OVERDUE':
                    alerts.append({
                        'type': 'overdue_payment',
                        'severity': 'high',
                        'message': f"Payment plan {plan.id} is overdue",
                        'details': {
                            'patient_id': plan.patient_id,
                            'amount': plan.total_amount - plan.paid_amount,
                            'days_overdue': (datetime.now() - datetime.fromisoformat(plan.start_date)).days
                        }
                    })

            # Check for low collection rates
            metrics = self.calculate_metrics()
            if metrics.collection_rate < Decimal('70'):
                alerts.append({
                    'type': 'low_collection_rate',
                    'severity': 'medium',
                    'message': f"Collection rate is below 70%: {metrics.collection_rate}%",
                    'details': {
                        'current_rate': metrics.collection_rate,
                        'target_rate': Decimal('70')
                    }
                })

            # Check for aging receivables
            aging_report = self.get_aging_report()
            if aging_report[-1].amount > Decimal('10000'):  # More than $10,000 over 90 days
                alerts.append({
                    'type': 'aging_receivables',
                    'severity': 'high',
                    'message': "Significant amount in aging receivables",
                    'details': {
                        'amount_over_90_days': aging_report[-1].amount
                    }
                })

            cache_service.set(cache_key, alerts)
            return alerts
        except Exception as e:
            logging.error(f"Error getting financial alerts: {e}")
            raise

    def invalidate_cache(self):
        """Invalidate all financial-related cache entries."""
        cache_service.invalidate_financial_data()

# Create a singleton instance
financial_service = FinancialService() 