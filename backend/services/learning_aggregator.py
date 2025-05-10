from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from collections import defaultdict
import numpy as np
from sqlalchemy import func, and_
from sqlalchemy.orm import Session

from models.learning_event import LearningEvent
from models.learning_insight import LearningInsight
from services.alert_service import AlertService

class LearningAggregator:
    """Service for aggregating learning events into actionable insights."""
    
    def __init__(self, db_session: Session, alert_service: Optional[AlertService] = None):
        self.db = db_session
        self.alert_service = alert_service
        
        # Configure thresholds
        self.thresholds = {
            'diagnosis_correction': {
                'high_correction_rate': 0.15,  # 15% corrections is concerning
                'min_samples': 50  # Need at least 50 diagnoses to flag
            },
            'treatment_plan_edit': {
                'high_edit_rate': 0.20,
                'min_samples': 30
            },
            'billing_override': {
                'high_override_rate': 0.10,
                'min_samples': 20
            }
        }
    
    async def aggregate_daily_insights(self, date: datetime) -> Dict[str, Any]:
        """Aggregate learning events for a specific date."""
        start_time = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_time = start_time + timedelta(days=1)
        
        # Get all events for the day
        events = self.db.query(LearningEvent).filter(
            and_(
                LearningEvent.timestamp >= start_time,
                LearningEvent.timestamp < end_time
            )
        ).all()
        
        insights = {
            'date': date.date().isoformat(),
            'total_events': len(events),
            'metrics': {},
            'patterns': [],
            'alerts': []
        }
        
        # Aggregate diagnosis corrections
        diagnosis_metrics = self._analyze_diagnosis_corrections(events)
        if diagnosis_metrics:
            insights['metrics']['diagnosis'] = diagnosis_metrics
        
        # Aggregate treatment plan edits
        treatment_metrics = self._analyze_treatment_plans(events)
        if treatment_metrics:
            insights['metrics']['treatment'] = treatment_metrics
        
        # Aggregate billing patterns
        billing_metrics = self._analyze_billing_patterns(events)
        if billing_metrics:
            insights['metrics']['billing'] = billing_metrics
        
        # Analyze user experience
        ux_metrics = self._analyze_user_experience(events)
        if ux_metrics:
            insights['metrics']['user_experience'] = ux_metrics
        
        # Detect emerging patterns
        patterns = self._detect_patterns(events)
        if patterns:
            insights['patterns'].extend(patterns)
        
        # Generate alerts
        alerts = self._generate_alerts(insights)
        if alerts:
            insights['alerts'].extend(alerts)
            if self.alert_service:
                for alert in alerts:
                    await self.alert_service.send_alert(alert)
        
        # Store insights
        self._store_insights(insights)
        
        return insights
    
    def _analyze_diagnosis_corrections(self, events: List[LearningEvent]) -> Dict[str, Any]:
        """Analyze diagnosis correction patterns."""
        corrections = [e for e in events if e.event_type == 'diagnosis_correction']
        if not corrections:
            return {}
        
        metrics = {
            'total_corrections': len(corrections),
            'correction_rate': len(corrections) / len(events),
            'common_corrections': defaultdict(int),
            'avg_confidence_before': 0,
            'avg_confidence_after': 0
        }
        
        for event in corrections:
            metrics['common_corrections'][event.metadata['corrected_diagnosis']] += 1
            if 'confidence' in event.metadata:
                metrics['avg_confidence_before'] += event.metadata.get('original_confidence', 0)
                metrics['avg_confidence_after'] += event.metadata.get('corrected_confidence', 0)
        
        if corrections:
            metrics['avg_confidence_before'] /= len(corrections)
            metrics['avg_confidence_after'] /= len(corrections)
        
        metrics['common_corrections'] = dict(sorted(
            metrics['common_corrections'].items(),
            key=lambda x: x[1],
            reverse=True
        )[:5])
        
        return metrics
    
    def _analyze_treatment_plans(self, events: List[LearningEvent]) -> Dict[str, Any]:
        """Analyze treatment plan editing patterns."""
        edits = [e for e in events if e.event_type == 'treatment_plan_edit']
        if not edits:
            return {}
        
        metrics = {
            'total_edits': len(edits),
            'edit_rate': len(edits) / len(events),
            'common_changes': defaultdict(int),
            'avg_time_to_edit': 0
        }
        
        for event in edits:
            if 'changes' in event.metadata:
                for change in event.metadata['changes']:
                    metrics['common_changes'][change['type']] += 1
            if 'time_to_edit' in event.metadata:
                metrics['avg_time_to_edit'] += event.metadata['time_to_edit']
        
        if edits:
            metrics['avg_time_to_edit'] /= len(edits)
        
        metrics['common_changes'] = dict(sorted(
            metrics['common_changes'].items(),
            key=lambda x: x[1],
            reverse=True
        )[:5])
        
        return metrics
    
    def _analyze_billing_patterns(self, events: List[LearningEvent]) -> Dict[str, Any]:
        """Analyze billing and financial patterns."""
        overrides = [e for e in events if e.event_type == 'billing_override']
        if not overrides:
            return {}
        
        metrics = {
            'total_overrides': len(overrides),
            'override_rate': len(overrides) / len(events),
            'common_reasons': defaultdict(int),
            'avg_adjustment': 0,
            'total_adjustment': 0
        }
        
        for event in overrides:
            if 'reason' in event.metadata:
                metrics['common_reasons'][event.metadata['reason']] += 1
            if 'adjustment' in event.metadata:
                metrics['avg_adjustment'] += event.metadata['adjustment']
                metrics['total_adjustment'] += event.metadata['adjustment']
        
        if overrides:
            metrics['avg_adjustment'] /= len(overrides)
        
        metrics['common_reasons'] = dict(sorted(
            metrics['common_reasons'].items(),
            key=lambda x: x[1],
            reverse=True
        )[:5])
        
        return metrics
    
    def _analyze_user_experience(self, events: List[LearningEvent]) -> Dict[str, Any]:
        """Analyze user experience metrics."""
        navigation = [e for e in events if e.event_type == 'navigation']
        timing = [e for e in events if e.event_type == 'timing']
        
        metrics = {
            'avg_page_time': 0,
            'common_paths': defaultdict(int),
            'performance': {}
        }
        
        # Analyze navigation patterns
        for event in navigation:
            if 'from_path' in event.metadata and 'to_path' in event.metadata:
                path = f"{event.metadata['from_path']} -> {event.metadata['to_path']}"
                metrics['common_paths'][path] += 1
        
        # Analyze timing/performance
        for event in timing:
            if 'event_name' in event.metadata and 'duration_ms' in event.metadata:
                event_name = event.metadata['event_name']
                duration = event.metadata['duration_ms']
                if event_name not in metrics['performance']:
                    metrics['performance'][event_name] = []
                metrics['performance'][event_name].append(duration)
        
        # Calculate performance percentiles
        for event_name, durations in metrics['performance'].items():
            metrics['performance'][event_name] = {
                'p50': np.percentile(durations, 50),
                'p95': np.percentile(durations, 95),
                'p99': np.percentile(durations, 99)
            }
        
        metrics['common_paths'] = dict(sorted(
            metrics['common_paths'].items(),
            key=lambda x: x[1],
            reverse=True
        )[:5])
        
        return metrics
    
    def _detect_patterns(self, events: List[LearningEvent]) -> List[Dict[str, Any]]:
        """Detect emerging patterns and anomalies."""
        patterns = []
        
        # Group events by type
        events_by_type = defaultdict(list)
        for event in events:
            events_by_type[event.event_type].append(event)
        
        # Check diagnosis correction patterns
        if 'diagnosis_correction' in events_by_type:
            corrections = events_by_type['diagnosis_correction']
            correction_rate = len(corrections) / len(events)
            
            if (correction_rate > self.thresholds['diagnosis_correction']['high_correction_rate'] 
                and len(events) > self.thresholds['diagnosis_correction']['min_samples']):
                patterns.append({
                    'type': 'high_correction_rate',
                    'severity': 'high',
                    'metric': correction_rate,
                    'description': f'High diagnosis correction rate: {correction_rate:.1%}'
                })
        
        # Check treatment plan edit patterns
        if 'treatment_plan_edit' in events_by_type:
            edits = events_by_type['treatment_plan_edit']
            edit_rate = len(edits) / len(events)
            
            if (edit_rate > self.thresholds['treatment_plan_edit']['high_edit_rate']
                and len(events) > self.thresholds['treatment_plan_edit']['min_samples']):
                patterns.append({
                    'type': 'high_edit_rate',
                    'severity': 'medium',
                    'metric': edit_rate,
                    'description': f'High treatment plan edit rate: {edit_rate:.1%}'
                })
        
        # Check billing override patterns
        if 'billing_override' in events_by_type:
            overrides = events_by_type['billing_override']
            override_rate = len(overrides) / len(events)
            
            if (override_rate > self.thresholds['billing_override']['high_override_rate']
                and len(events) > self.thresholds['billing_override']['min_samples']):
                patterns.append({
                    'type': 'high_override_rate',
                    'severity': 'medium',
                    'metric': override_rate,
                    'description': f'High billing override rate: {override_rate:.1%}'
                })
        
        return patterns
    
    def _generate_alerts(self, insights: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate alerts based on insights."""
        alerts = []
        
        # Check for high-severity patterns
        for pattern in insights.get('patterns', []):
            if pattern['severity'] == 'high':
                alerts.append({
                    'type': 'pattern_alert',
                    'severity': pattern['severity'],
                    'title': f"High-severity pattern detected: {pattern['type']}",
                    'description': pattern['description'],
                    'metric': pattern['metric']
                })
        
        # Check diagnosis metrics
        if 'diagnosis' in insights.get('metrics', {}):
            diag_metrics = insights['metrics']['diagnosis']
            if diag_metrics.get('correction_rate', 0) > self.thresholds['diagnosis_correction']['high_correction_rate']:
                alerts.append({
                    'type': 'metric_alert',
                    'severity': 'high',
                    'title': 'High Diagnosis Correction Rate',
                    'description': f"Correction rate: {diag_metrics['correction_rate']:.1%}",
                    'metric': diag_metrics['correction_rate']
                })
        
        return alerts
    
    def _store_insights(self, insights: Dict[str, Any]) -> None:
        """Store aggregated insights in the database."""
        insight = LearningInsight(
            date=datetime.fromisoformat(insights['date']),
            metrics=insights['metrics'],
            patterns=insights['patterns'],
            alerts=insights['alerts']
        )
        self.db.add(insight)
        self.db.commit() 