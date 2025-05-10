import logging
import uuid
import json
import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple
from sqlalchemy.orm import Session

from ..models.ai_feedback import (
    AIFeedback, 
    AIModelMetrics, 
    AITrainingJob,
    FeedbackPriority,
    CorrectionType
)
from ..models.image_diagnosis import ImageDiagnosis

logger = logging.getLogger(__name__)

class AITrainingService:
    """Service to handle AI model training based on collected feedback"""
    
    def __init__(self, db: Session):
        self.db = db
        self.metrics_cache = {}  # Cache for model metrics
    
    async def process_training_queue(self) -> Optional[str]:
        """Process queued training jobs"""
        # Get the next queued job
        job = self.db.query(AITrainingJob).filter(
            AITrainingJob.status == "queued"
        ).order_by(AITrainingJob.created_at.asc()).first()
        
        if not job:
            return None
        
        # Update job status to in_progress
        job.status = "in_progress"
        job.started_at = datetime.now()
        self.db.commit()
        
        try:
            # Get feedback data for training
            feedback_data = self._get_feedback_for_training(job.clinic_id)
            
            if not feedback_data or len(feedback_data) < 10:
                job.status = "failed"
                job.error_message = "Insufficient feedback data for training"
                job.completed_at = datetime.now()
                self.db.commit()
                return job.id
            
            # Run the training process
            model_metrics = await self._train_model(
                job.model_version,
                feedback_data,
                job.clinic_id
            )
            
            # Update job with results
            job.status = "completed"
            job.completed_at = datetime.now()
            job.metrics_id = model_metrics.id
            self.db.commit()
            
            return job.id
            
        except Exception as e:
            logger.error(f"Error processing training job {job.id}: {str(e)}")
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.now()
            self.db.commit()
            return job.id
    
    def _get_feedback_for_training(self, clinic_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get feedback data for model training"""
        # Query feedback with a cutoff date (e.g., last 6 months)
        cutoff_date = datetime.now() - timedelta(days=180)
        query = self.db.query(AIFeedback).filter(AIFeedback.created_at >= cutoff_date)
        
        # Filter by clinic if specified
        if clinic_id:
            query = query.filter(AIFeedback.clinic_id == clinic_id)
        
        feedback_records = query.all()
        
        # Transform to dict for easier processing
        feedback_data = []
        for record in feedback_records:
            # Get the related finding
            finding_data = self._get_finding_by_id(record.finding_id)
            if not finding_data:
                continue
                
            feedback_data.append({
                "feedback_id": str(record.id),
                "finding_id": record.finding_id,
                "patient_id": record.patient_id,
                "provider_id": record.provider_id,
                "is_correct": record.is_correct,
                "correction_type": record.correction_type,
                "correction_details": record.correction_details,
                "priority": record.priority,
                "created_at": record.created_at.isoformat(),
                # Add finding details
                "finding": finding_data
            })
        
        return feedback_data
    
    def _get_finding_by_id(self, finding_id: str) -> Optional[Dict[str, Any]]:
        """Get the finding data from diagnosis records"""
        # This is complex because findings are embedded in JSON within diagnosis records
        diagnoses = self.db.query(ImageDiagnosis).all()
        
        for diagnosis in diagnoses:
            findings = diagnosis.findings
            if isinstance(findings, dict) and "findings" in findings:
                for finding in findings["findings"]:
                    if finding.get("id") == finding_id:
                        return {
                            **finding,
                            "diagnosis_id": str(diagnosis.id),
                            "diagnosis_created_at": diagnosis.created_at.isoformat(),
                            "modality": diagnosis.modality,
                            "image_id": diagnosis.image_id
                        }
        
        return None
    
    async def _train_model(
        self, 
        model_version: str, 
        feedback_data: List[Dict[str, Any]], 
        clinic_id: Optional[str] = None
    ) -> AIModelMetrics:
        """Train or retrain AI model based on feedback data"""
        logger.info(f"Training model version {model_version} with {len(feedback_data)} feedback items")
        
        # In a real implementation, this would:
        # 1. Convert feedback to training data
        # 2. Load the current model
        # 3. Perform retraining with feedback as ground truth
        # 4. Evaluate the model
        # 5. Save the new model
        
        # For this implementation, we'll simulate the training process
        training_start = datetime.now()
        
        # Prepare data for analysis
        df = pd.DataFrame(feedback_data)
        
        # Calculate metrics
        total_samples = len(df)
        correct_count = df[df['is_correct'] == True].shape[0]
        incorrect_count = df[df['is_correct'] == False].shape[0]
        
        # In a real model, we would calculate these from actual predictions
        accuracy = correct_count / total_samples if total_samples > 0 else 0
        
        # Extract finding types for confusion matrix
        finding_types = set()
        for item in feedback_data:
            if 'finding' in item and 'type' in item['finding']:
                finding_types.add(item['finding']['type'])
        
        # Create mock confusion matrix
        confusion_matrix = {}
        for finding_type in finding_types:
            type_df = df[df['finding'].apply(lambda x: x.get('type') == finding_type if isinstance(x, dict) else False)]
            type_count = len(type_df)
            correct_type_count = type_df[type_df['is_correct'] == True].shape[0]
            
            # Simulated values - in a real system these would be actual metrics
            confusion_matrix[finding_type] = {
                "true_positive": int(correct_type_count * 0.8),
                "false_positive": int((type_count - correct_type_count) * 0.7),
                "false_negative": int(correct_type_count * 0.2),
                "true_negative": total_samples - type_count - int((type_count - correct_type_count) * 0.3)
            }
        
        # Simulate improvements from feedback
        previous_metrics = self.db.query(AIModelMetrics).filter(
            AIModelMetrics.clinic_id == clinic_id if clinic_id else AIModelMetrics.clinic_id.is_(None)
        ).order_by(AIModelMetrics.last_trained.desc()).first()
        
        previous_accuracy = previous_metrics.accuracy if previous_metrics else 0.75
        
        # Simulate slight improvement
        new_accuracy = min(previous_accuracy + 0.02, 0.98)
        
        # Create metrics record
        new_metrics = AIModelMetrics(
            id=uuid.uuid4(),
            model_version=model_version,
            model_type="diagnosis",  # general diagnosis model
            accuracy=new_accuracy,
            precision=new_accuracy - 0.03,  # Simulated precision
            recall=new_accuracy - 0.01,     # Simulated recall
            f1_score=new_accuracy - 0.02,   # Simulated F1 score
            false_positives=int(incorrect_count * 0.6),
            false_negatives=int(incorrect_count * 0.4),
            confusion_matrix=confusion_matrix,
            total_samples=total_samples,
            training_duration=(datetime.now() - training_start).total_seconds(),
            last_trained=datetime.now(),
            trained_by="system",
            clinic_id=clinic_id
        )
        
        self.db.add(new_metrics)
        self.db.commit()
        self.db.refresh(new_metrics)
        
        logger.info(f"Model training complete. New accuracy: {new_accuracy:.2f}")
        
        return new_metrics
    
    async def get_model_metrics(self, model_version: Optional[str] = None, clinic_id: Optional[str] = None) -> Dict[str, Any]:
        """Get model metrics with caching"""
        cache_key = f"{model_version or 'latest'}:{clinic_id or 'global'}"
        
        # Check cache first
        if cache_key in self.metrics_cache:
            return self.metrics_cache[cache_key]
        
        # Query the database
        query = self.db.query(AIModelMetrics)
        
        if model_version:
            query = query.filter(AIModelMetrics.model_version == model_version)
        
        if clinic_id:
            query = query.filter(AIModelMetrics.clinic_id == clinic_id)
        else:
            query = query.filter(AIModelMetrics.clinic_id.is_(None))
        
        metrics = query.order_by(AIModelMetrics.last_trained.desc()).first()
        
        if not metrics:
            return {
                "model_version": "unknown",
                "accuracy": 0.0,
                "total_samples": 0,
                "last_trained": None
            }
        
        # Convert to dict and cache
        metrics_dict = {
            "id": str(metrics.id),
            "model_version": metrics.model_version,
            "model_type": metrics.model_type,
            "accuracy": metrics.accuracy,
            "precision": metrics.precision,
            "recall": metrics.recall,
            "f1_score": metrics.f1_score,
            "false_positives": metrics.false_positives,
            "false_negatives": metrics.false_negatives,
            "confusion_matrix": metrics.confusion_matrix,
            "total_samples": metrics.total_samples,
            "training_duration": metrics.training_duration,
            "last_trained": metrics.last_trained.isoformat(),
            "trained_by": metrics.trained_by,
            "clinic_id": metrics.clinic_id
        }
        
        self.metrics_cache[cache_key] = metrics_dict
        return metrics_dict
    
    async def should_trigger_training(self, clinic_id: Optional[str] = None) -> bool:
        """Check if we should trigger model training based on feedback volume/quality"""
        # Check volume of new feedback since last training
        last_metrics = self.db.query(AIModelMetrics).filter(
            AIModelMetrics.clinic_id == clinic_id if clinic_id else AIModelMetrics.clinic_id.is_(None)
        ).order_by(AIModelMetrics.last_trained.desc()).first()
        
        if not last_metrics:
            # No previous metrics, check if we have enough feedback to start
            feedback_count = self.db.query(AIFeedback).count()
            return feedback_count >= 50  # Require 50+ feedback items for initial training
        
        # Check new feedback since last training
        new_feedback_query = self.db.query(AIFeedback).filter(
            AIFeedback.created_at > last_metrics.last_trained
        )
        
        if clinic_id:
            new_feedback_query = new_feedback_query.filter(AIFeedback.clinic_id == clinic_id)
        
        new_feedback_count = new_feedback_query.count()
        
        # Check high priority feedback
        high_priority_count = new_feedback_query.filter(
            AIFeedback.priority == FeedbackPriority.HIGH
        ).count()
        
        # Trigger training if:
        # 1. 100+ new feedback items, OR
        # 2. 10+ high priority feedback items, OR
        # 3. Last training was more than 30 days ago and we have at least 20 new items
        days_since_training = (datetime.now() - last_metrics.last_trained).days
        
        return (
            new_feedback_count >= 100 or
            high_priority_count >= 10 or
            (days_since_training > 30 and new_feedback_count >= 20)
        )
    
    def get_feedback_analytics(self, period: str = "month", clinic_id: Optional[str] = None) -> Dict[str, Any]:
        """Get analytics on feedback collection"""
        # Determine date range based on period
        now = datetime.now()
        if period == "week":
            start_date = now - timedelta(days=7)
        elif period == "month":
            start_date = now - timedelta(days=30)
        elif period == "quarter":
            start_date = now - timedelta(days=90)
        else:  # year
            start_date = now - timedelta(days=365)
        
        # Base query for all feedback in the period
        query = self.db.query(AIFeedback).filter(AIFeedback.created_at >= start_date)
        
        # Filter by clinic id
        if clinic_id:
            query = query.filter(AIFeedback.clinic_id == clinic_id)
        
        # Count total feedback
        total_count = query.count()
        
        if total_count == 0:
            return {
                "period": period,
                "start_date": start_date.isoformat(),
                "end_date": now.isoformat(),
                "total_feedback": 0,
                "correct_count": 0,
                "incorrect_count": 0,
                "by_priority": {"low": 0, "medium": 0, "high": 0},
                "by_correction_type": {}
            }
        
        # Count by correctness
        correct_count = query.filter(AIFeedback.is_correct == True).count()
        incorrect_count = query.filter(AIFeedback.is_correct == False).count()
        
        # Count by priority
        by_priority = {}
        for priority in ["low", "medium", "high"]:
            count = query.filter(AIFeedback.priority == priority).count()
            by_priority[priority] = count
        
        # Count by correction type for incorrect feedback
        by_correction_type = {}
        if incorrect_count > 0:
            for correction_type in ["false_positive", "wrong_location", "wrong_classification", "wrong_severity", "other"]:
                count = query.filter(
                    AIFeedback.is_correct == False,
                    AIFeedback.correction_type == correction_type
                ).count()
                by_correction_type[correction_type] = count
        
        # Calculate trend compared to previous period
        previous_start = start_date - (start_date - now)  # Double the period
        previous_query = self.db.query(AIFeedback).filter(
            AIFeedback.created_at >= previous_start,
            AIFeedback.created_at < start_date
        )
        
        if clinic_id:
            previous_query = previous_query.filter(AIFeedback.clinic_id == clinic_id)
        
        previous_count = previous_query.count()
        trend_percentage = ((total_count - previous_count) / previous_count * 100) if previous_count > 0 else 0
        
        return {
            "period": period,
            "start_date": start_date.isoformat(),
            "end_date": now.isoformat(),
            "total_feedback": total_count,
            "correct_count": correct_count,
            "incorrect_count": incorrect_count,
            "by_priority": by_priority,
            "by_correction_type": by_correction_type,
            "trend": {
                "previous_period_count": previous_count,
                "percentage_change": trend_percentage
            }
        }

    async def trigger_model_training(
        self,
        model_name: str,
        model_version: str,
        triggered_by: Optional[str] = None,
        reason: Optional[str] = None,
        parameters: Optional[Dict[str, Any]] = None,
        clinic_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Trigger a new model training job
        
        Args:
            model_name: Name of the model to train
            model_version: Version of the model
            triggered_by: Who triggered the training (user ID or 'system')
            reason: Reason for training
            parameters: Training parameters (hyperparameters, etc.)
            clinic_id: Optional clinic ID for clinic-specific models
            
        Returns:
            Dict with job details
        """
        # Check if there's an active job already
        active_job = self.db.query(AITrainingJob).filter(
            AITrainingJob.model_version == model_version,
            AITrainingJob.status.in_(["queued", "in_progress"])
        ).first()
        
        if active_job:
            return {
                "success": False,
                "message": f"A training job is already {active_job.status} for this model version",
                "job_id": str(active_job.id),
                "status": active_job.status
            }
        
        # Get feedback count to include in the job
        feedback_count = self.db.query(AIFeedback).count()
        
        # Create new training job
        job = AITrainingJob(
            id=uuid.uuid4(),
            model_version=model_version,
            status="queued",
            triggered_by=triggered_by or "api",
            feedback_count=feedback_count,
            parameters=parameters or {"model_name": model_name, "reason": reason},
            clinic_id=clinic_id
        )
        
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        
        # Process the job immediately if possible
        # In a production system, this would be handled by a background worker
        await self.process_training_queue()
        
        return {
            "success": True,
            "message": "Training job created",
            "job_id": str(job.id),
            "status": job.status,
            "feedback_count": feedback_count
        }
        
    async def get_training_status(
        self,
        model_name: str,
        model_version: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get model training status and recommendations
        
        Args:
            model_name: Name of the model
            model_version: Optional specific version to check
            
        Returns:
            Dict with status information and retraining recommendations
        """
        # Get latest metrics for this model
        query = self.db.query(AIModelMetrics)
        
        if model_version:
            query = query.filter(AIModelMetrics.model_version == model_version)
            
        latest_metrics = query.order_by(AIModelMetrics.last_trained.desc()).first()
        
        # Check for active training jobs
        jobs_query = self.db.query(AITrainingJob)
        
        if model_version:
            jobs_query = jobs_query.filter(AITrainingJob.model_version == model_version)
            
        active_jobs = jobs_query.filter(
            AITrainingJob.status.in_(["queued", "in_progress"])
        ).all()
        
        completed_jobs = jobs_query.filter(
            AITrainingJob.status == "completed"
        ).order_by(AITrainingJob.completed_at.desc()).limit(5).all()
        
        # Check if retraining is recommended
        should_retrain = await self.should_trigger_training()
        
        # Get new feedback since last training
        new_feedback_count = 0
        feedback_by_type = {}
        
        if latest_metrics:
            new_feedback = self.db.query(AIFeedback).filter(
                AIFeedback.created_at > latest_metrics.last_trained
            ).all()
            
            new_feedback_count = len(new_feedback)
            
            # Count feedback by correction type
            for feedback in new_feedback:
                if not feedback.is_correct and feedback.correction_type:
                    correction_type = feedback.correction_type.value
                    if correction_type not in feedback_by_type:
                        feedback_by_type[correction_type] = 0
                    feedback_by_type[correction_type] += 1
        
        # Determine reason for recommendation
        reason = None
        if should_retrain:
            if new_feedback_count >= 100:
                reason = f"Sufficient new feedback available ({new_feedback_count} items)"
            elif latest_metrics and (datetime.now() - latest_metrics.last_trained).days > 30:
                reason = f"Model was last trained over 30 days ago"
            else:
                reason = "High priority feedback items require attention"
        
        return {
            "model_name": model_name,
            "model_version": model_version or (latest_metrics.model_version if latest_metrics else "unknown"),
            "last_trained": latest_metrics.last_trained.isoformat() if latest_metrics else None,
            "active_jobs": [
                {
                    "id": str(job.id),
                    "status": job.status,
                    "created_at": job.created_at.isoformat(),
                    "triggered_by": job.triggered_by
                }
                for job in active_jobs
            ],
            "recent_jobs": [
                {
                    "id": str(job.id),
                    "status": job.status,
                    "created_at": job.created_at.isoformat(),
                    "completed_at": job.completed_at.isoformat() if job.completed_at else None,
                    "feedback_count": job.feedback_count
                }
                for job in completed_jobs
            ],
            "metrics": {
                "accuracy": latest_metrics.accuracy if latest_metrics else None,
                "total_samples": latest_metrics.total_samples if latest_metrics else 0
            },
            "new_feedback_count": new_feedback_count,
            "feedback_by_type": feedback_by_type,
            "retraining_recommended": should_retrain,
            "reason": reason
        }


# Initialize as a global service
def get_ai_training_service(db: Session) -> AITrainingService:
    """Get the AI training service instance"""
    return AITrainingService(db) 