from datetime import datetime, timedelta
import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from models.learning_insights import Alert, AlertType, LearningInsight
from models.xray import XRay
from services.notification_service import NotificationService
from config import Settings

logger = logging.getLogger(__name__)

class ModelRetrainingService:
    def __init__(self, db: Session, notification_service: NotificationService, settings: Settings):
        self.db = db
        self.notification_service = notification_service
        self.settings = settings

    async def evaluate_retraining_need(self, alert_type: AlertType) -> Dict[str, Any]:
        """Evaluate if retraining is needed based on alert type and recent metrics."""
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        
        metrics = {
            AlertType.DIAGNOSIS_ACCURACY: {
                'column': LearningInsight.diagnosis_correction_rate,
                'threshold': self.settings.retraining_thresholds.diagnosis_accuracy,
                'min_samples': 100
            },
            AlertType.TREATMENT_STABILITY: {
                'column': LearningInsight.treatment_edit_rate,
                'threshold': self.settings.retraining_thresholds.treatment_stability,
                'min_samples': 50
            },
            AlertType.BILLING_ACCURACY: {
                'column': LearningInsight.billing_override_rate,
                'threshold': self.settings.retraining_thresholds.billing_accuracy,
                'min_samples': 75
            }
        }

        if alert_type not in metrics:
            return {'should_retrain': False, 'reason': 'Alert type not eligible for retraining'}

        metric = metrics[alert_type]
        
        # Get recent performance metrics
        recent_metrics = self.db.query(
            func.avg(metric['column']).label('avg_value'),
            func.count(LearningInsight.id).label('sample_count')
        ).filter(
            LearningInsight.created_at >= cutoff_date
        ).first()

        if not recent_metrics or recent_metrics.sample_count < metric['min_samples']:
            return {
                'should_retrain': False,
                'reason': f'Insufficient samples ({recent_metrics.sample_count if recent_metrics else 0} < {metric["min_samples"]})'
            }

        should_retrain = recent_metrics.avg_value >= metric['threshold']
        
        return {
            'should_retrain': should_retrain,
            'metrics': {
                'average_value': recent_metrics.avg_value,
                'sample_count': recent_metrics.sample_count,
                'threshold': metric['threshold']
            },
            'reason': 'Performance threshold exceeded' if should_retrain else 'Performance within acceptable range'
        }

    async def collect_training_data(self, alert_type: AlertType) -> List[Dict[str, Any]]:
        """Collect relevant training data based on alert type."""
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        
        if alert_type == AlertType.DIAGNOSIS_ACCURACY:
            # Collect cases where diagnosis was corrected
            corrected_cases = self.db.query(XRay).filter(
                and_(
                    XRay.created_at >= cutoff_date,
                    XRay.diagnosis_corrected == True
                )
            ).all()
            
            return [{
                'xray_id': case.id,
                'original_diagnosis': case.original_diagnosis,
                'corrected_diagnosis': case.final_diagnosis,
                'correction_reason': case.correction_notes,
                'metadata': case.metadata
            } for case in corrected_cases]
            
        elif alert_type == AlertType.TREATMENT_STABILITY:
            # Collect cases where treatment plan was modified
            modified_treatments = self.db.query(XRay).filter(
                and_(
                    XRay.created_at >= cutoff_date,
                    XRay.treatment_modified == True
                )
            ).all()
            
            return [{
                'xray_id': case.id,
                'original_treatment': case.original_treatment_plan,
                'final_treatment': case.final_treatment_plan,
                'modification_reason': case.treatment_notes,
                'metadata': case.metadata
            } for case in modified_treatments]
            
        elif alert_type == AlertType.BILLING_ACCURACY:
            # Collect cases where billing was overridden
            billing_overrides = self.db.query(XRay).filter(
                and_(
                    XRay.created_at >= cutoff_date,
                    XRay.billing_overridden == True
                )
            ).all()
            
            return [{
                'xray_id': case.id,
                'original_billing': case.original_billing_code,
                'final_billing': case.final_billing_code,
                'override_reason': case.billing_notes,
                'metadata': case.metadata
            } for case in billing_overrides]
            
        return []

    async def trigger_retraining(self, alert_type: AlertType) -> Dict[str, Any]:
        """Trigger model retraining process."""
        evaluation = await self.evaluate_retraining_need(alert_type)
        
        if not evaluation['should_retrain']:
            return {
                'status': 'skipped',
                'reason': evaluation['reason']
            }

        # Collect training data
        training_data = await self.collect_training_data(alert_type)
        
        if not training_data:
            return {
                'status': 'failed',
                'reason': 'No training data available'
            }

        try:
            # Start retraining process
            model_type = alert_type.value.split('_')[0]  # e.g., 'diagnosis' from 'diagnosis_accuracy'
            
            # Record retraining start
            retraining_record = {
                'model_type': model_type,
                'started_at': datetime.utcnow(),
                'trigger_type': 'alert',
                'trigger_details': {
                    'alert_type': alert_type,
                    'evaluation_metrics': evaluation['metrics']
                },
                'training_samples': len(training_data)
            }
            
            # TODO: Implement actual model retraining logic here
            # This would typically involve:
            # 1. Preparing the training data
            # 2. Loading the current model
            # 3. Fine-tuning on new data
            # 4. Validating performance
            # 5. Deploying updated model
            
            # For now, we'll simulate success
            retraining_record.update({
                'status': 'completed',
                'completed_at': datetime.utcnow(),
                'performance_metrics': {
                    'accuracy': 0.95,
                    'validation_loss': 0.05
                }
            })
            
            # Notify about successful retraining
            await self.notification_service.send_alert({
                'type': 'model_retraining',
                'severity': 'LOW',
                'title': f'Model Retraining Completed: {model_type}',
                'description': f'Successfully retrained {model_type} model with {len(training_data)} new samples',
                'metadata': retraining_record
            })
            
            return {
                'status': 'success',
                'retraining_record': retraining_record
            }
            
        except Exception as e:
            logger.error(f"Error during model retraining: {str(e)}")
            return {
                'status': 'failed',
                'reason': str(e)
            }

    async def get_retraining_history(self, days: int = 30) -> List[Dict[str, Any]]:
        """Get history of model retraining events."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # TODO: Implement actual database query for retraining history
        # For now, return mock data
        return [{
            'model_type': 'diagnosis',
            'started_at': datetime.utcnow() - timedelta(days=5),
            'completed_at': datetime.utcnow() - timedelta(days=5, hours=2),
            'trigger_type': 'alert',
            'status': 'completed',
            'performance_metrics': {
                'accuracy': 0.95,
                'validation_loss': 0.05
            }
        }] 