from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy import Column, Integer, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class LearningInsight(Base):
    """Model for storing aggregated learning insights."""
    __tablename__ = 'learning_insights'
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, nullable=False, unique=True)
    metrics = Column(JSON, nullable=False)
    patterns = Column(JSON, nullable=False)
    alerts = Column(JSON, nullable=False)
    
    # Indexes for time-based queries
    __table_args__ = (
        {'postgresql_partition_by': 'RANGE (date)'}  # Partition by date for better query performance
    )
    
    def __repr__(self):
        return f"<LearningInsight(id={self.id}, date={self.date})>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert insight to dictionary format."""
        return {
            'id': self.id,
            'date': self.date.date().isoformat(),
            'metrics': self.metrics,
            'patterns': self.patterns,
            'alerts': self.alerts
        }
    
    @property
    def has_alerts(self) -> bool:
        """Check if insight has any alerts."""
        return len(self.alerts) > 0
    
    @property
    def alert_severity(self) -> str:
        """Get highest alert severity."""
        if not self.alerts:
            return 'none'
        
        severities = [alert['severity'] for alert in self.alerts]
        if 'high' in severities:
            return 'high'
        elif 'medium' in severities:
            return 'medium'
        else:
            return 'low'
    
    @property
    def summary(self) -> str:
        """Get human-readable summary of insights."""
        parts = []
        
        # Add alert summary
        if self.alerts:
            alert_count = len(self.alerts)
            high_severity = sum(1 for a in self.alerts if a['severity'] == 'high')
            parts.append(f"{alert_count} alerts ({high_severity} high severity)")
        
        # Add pattern summary
        if self.patterns:
            pattern_count = len(self.patterns)
            parts.append(f"{pattern_count} patterns detected")
        
        # Add key metrics
        metrics = self.metrics
        if 'diagnosis' in metrics:
            correction_rate = metrics['diagnosis'].get('correction_rate')
            if correction_rate is not None:
                parts.append(f"Diagnosis correction rate: {correction_rate:.1%}")
        
        if 'treatment' in metrics:
            edit_rate = metrics['treatment'].get('edit_rate')
            if edit_rate is not None:
                parts.append(f"Treatment edit rate: {edit_rate:.1%}")
        
        if 'billing' in metrics:
            override_rate = metrics['billing'].get('override_rate')
            if override_rate is not None:
                parts.append(f"Billing override rate: {override_rate:.1%}")
        
        return ' | '.join(parts) 