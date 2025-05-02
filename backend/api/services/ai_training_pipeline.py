from typing import Dict, List, Any, Optional
import os
import uuid
import json
import logging
from datetime import datetime, timedelta
import asyncio
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc

from ..models.diagnostic_feedback import (
    DiagnosticFeedback,
    FeedbackType,
    DiagnosisStatus
)
from ..models.ai_feedback import (
    AITrainingJob,
    AIModelMetrics
)

logger = logging.getLogger(__name__)

class AITrainingPipelineService:
    """
    Service for managing the AI training pipeline based on provider feedback
    
    This service:
    1. Collects approved feedback for training
    2. Manages training job queue
    3. Tracks model versions and performance
    4. Handles validation of new models
    5. Coordinates deployment of improved models
    """
    
    def __init__(self, db: Optional[Session] = None):
        """Initialize the AI training pipeline service"""
        self.db = db
        self.feedback_store_path = os.path.join("data", "feedback")
        self.model_store_path = os.path.join("models", "versions")
        self._ensure_directories()
        
    def _ensure_directories(self):
        """Ensure necessary directories exist"""
        os.makedirs(self.feedback_store_path, exist_ok=True)
        os.makedirs(self.model_store_path, exist_ok=True)
    
    async def get_approved_feedback_for_training(self, limit: int = 1000, days: int = 30) -> List[Dict[str, Any]]:
        """
        Get approved feedback that can be used for model training
        
        Args:
            limit: Maximum number of feedback items to retrieve
            days: Get feedback from the last N days
            
        Returns:
            List of approved feedback items
        """
        if not self.db:
            # Mock data for demonstration
            return self._get_mock_approved_feedback()
            
        # Calculate the date threshold
        date_threshold = datetime.now() - timedelta(days=days)
        
        # Get feedback approved for global learning
        query = self.db.query(DiagnosticFeedback).filter(
            DiagnosticFeedback.global_status == "accepted_for_global",
            DiagnosticFeedback.created_at >= date_threshold,
            DiagnosticFeedback.is_learning_case == True
        ).order_by(DiagnosticFeedback.created_at.desc()).limit(limit)
        
        feedback_items = query.all()
        return [item.__dict__ for item in feedback_items]
    
    def _get_mock_approved_feedback(self) -> List[Dict[str, Any]]:
        """Generate mock data for demo purposes"""
        return [
            {
                "id": str(uuid.uuid4()),
                "finding_id": f"finding-{i}",
                "feedback_type": "correction" if i % 3 == 0 else "general",
                "feedback_text": f"This is feedback item {i}",
                "correction": f"Corrected diagnosis {i}" if i % 3 == 0 else None,
                "original_diagnosis": f"Original diagnosis {i}" if i % 3 == 0 else None,
                "provider_id": f"provider-{i % 5}",
                "provider_name": f"Dr. Provider {i % 5}",
                "provider_role": "dentist",
                "is_learning_case": True,
                "global_status": "accepted_for_global",
                "created_at": (datetime.now() - timedelta(days=i % 30)).isoformat(),
                "practice_id": f"practice-{i % 10}"
            }
            for i in range(1, 101)
        ]
    
    async def create_training_job(
        self, 
        target_model_version: str,
        feedback_ids: List[str] = None,
        parameters: Dict[str, Any] = None,
        triggered_by: str = "system"
    ) -> Dict[str, Any]:
        """
        Create a new training job to improve the AI model
        
        Args:
            target_model_version: The target version for the new model
            feedback_ids: Optional list of specific feedback IDs to use
            parameters: Optional training parameters
            triggered_by: Who/what triggered this training job
            
        Returns:
            The created training job
        """
        if not self.db:
            # Mock implementation
            job_id = str(uuid.uuid4())
            training_job = {
                "id": job_id,
                "model_version": target_model_version,
                "status": "queued",
                "triggered_by": triggered_by,
                "feedback_count": len(feedback_ids) if feedback_ids else 0,
                "parameters": parameters or {},
                "created_at": datetime.now().isoformat()
            }
            
            # Save to a file for demo
            filename = os.path.join(self.feedback_store_path, f"training_job_{job_id}.json")
            with open(filename, 'w') as f:
                json.dump(training_job, f, indent=2)
                
            return training_job
            
        # Create a new training job record
        training_job = AITrainingJob(
            id=uuid.uuid4(),
            model_version=target_model_version,
            status="queued",
            triggered_by=triggered_by,
            feedback_count=len(feedback_ids) if feedback_ids else 0,
            parameters=parameters or {},
            created_at=datetime.now()
        )
        
        # Track specific feedback IDs if provided
        if feedback_ids:
            training_job.feedback_ids = feedback_ids
            
        self.db.add(training_job)
        self.db.commit()
        self.db.refresh(training_job)
        
        # Trigger the async training process
        asyncio.create_task(self._process_training_job(training_job.id))
        
        return training_job.__dict__
    
    async def get_training_jobs(
        self, 
        status: Optional[str] = None, 
        limit: int = 20, 
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get training jobs with optional filtering
        
        Args:
            status: Optional status filter
            limit: Maximum number of jobs to return
            skip: Number of jobs to skip
            
        Returns:
            List of training jobs
        """
        if not self.db:
            # Mock data for demonstration
            statuses = ["queued", "in_progress", "completed", "failed"]
            return [
                {
                    "id": f"job-{i}",
                    "model_version": f"1.{i//10}.{i%10}",
                    "status": status or statuses[i % 4],
                    "triggered_by": "system" if i % 2 == 0 else "Dr. Abdin",
                    "feedback_count": i * 10,
                    "parameters": {"learning_rate": 0.001, "epochs": 10},
                    "created_at": (datetime.now() - timedelta(days=i % 30)).isoformat(),
                    "started_at": (datetime.now() - timedelta(days=i % 30, hours=2)).isoformat() if i % 4 > 0 else None,
                    "completed_at": (datetime.now() - timedelta(days=i % 30, hours=1)).isoformat() if i % 4 == 2 or i % 4 == 3 else None,
                    "error_message": "Training failed due to insufficient data" if i % 4 == 3 else None
                }
                for i in range(skip, skip + limit)
            ]
            
        # Build the query
        query = self.db.query(AITrainingJob)
        
        if status:
            query = query.filter(AITrainingJob.status == status)
            
        # Sort by created date descending
        query = query.order_by(desc(AITrainingJob.created_at))
        
        # Apply pagination
        jobs = query.offset(skip).limit(limit).all()
        
        return [job.__dict__ for job in jobs]
    
    async def get_model_metrics(
        self, 
        model_version: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get metrics for AI models
        
        Args:
            model_version: Optional specific model version
            limit: Maximum number of models to return
            
        Returns:
            List of model metrics
        """
        if not self.db:
            # Mock data for demonstration
            return [
                {
                    "id": f"metrics-{i}",
                    "model_version": model_version or f"1.{i//5}.{i%5}",
                    "accuracy": 0.90 + (i * 0.005),
                    "precision": 0.88 + (i * 0.005),
                    "recall": 0.87 + (i * 0.005),
                    "f1_score": 0.89 + (i * 0.005),
                    "false_positives": 120 - (i * 5),
                    "false_negatives": 130 - (i * 5),
                    "total_samples": 5000 + (i * 200),
                    "training_duration": 3600 + (i * 120),
                    "last_trained": (datetime.now() - timedelta(days=i * 30)).isoformat(),
                    "improvement": f"+{(i * 0.5):.1f}%",
                    "created_at": (datetime.now() - timedelta(days=i * 30)).isoformat()
                }
                for i in range(limit)
            ]
            
        # Build the query
        query = self.db.query(AIModelMetrics)
        
        if model_version:
            query = query.filter(AIModelMetrics.model_version == model_version)
            
        # Sort by last trained date descending
        query = query.order_by(desc(AIModelMetrics.last_trained))
        
        # Apply limit
        metrics = query.limit(limit).all()
        
        return [m.__dict__ for m in metrics]
        
    async def _process_training_job(self, job_id: str) -> None:
        """
        Process a training job asynchronously
        
        Args:
            job_id: The ID of the job to process
        """
        if not self.db:
            logger.info(f"Mock processing of training job {job_id}")
            return
            
        try:
            # Get the job from database
            job = self.db.query(AITrainingJob).filter(AITrainingJob.id == job_id).first()
            
            if not job:
                logger.error(f"Training job {job_id} not found")
                return
                
            # Update status to in_progress
            job.status = "in_progress"
            job.started_at = datetime.now()
            self.db.commit()
            
            # Prepare training data
            feedback_items = []
            if hasattr(job, 'feedback_ids') and job.feedback_ids:
                # Use specific feedback IDs if provided
                for feedback_id in job.feedback_ids:
                    feedback = self.db.query(DiagnosticFeedback).filter(
                        DiagnosticFeedback.id == feedback_id
                    ).first()
                    if feedback:
                        feedback_items.append(feedback)
            else:
                # Otherwise use recently approved feedback
                feedback_items = self.db.query(DiagnosticFeedback).filter(
                    DiagnosticFeedback.global_status == "accepted_for_global",
                    DiagnosticFeedback.is_learning_case == True
                ).order_by(DiagnosticFeedback.created_at.desc()).limit(1000).all()
            
            # In a real implementation, this would:
            # 1. Prepare the training data from feedback
            # 2. Initialize or load the existing model
            # 3. Train the model with the new data
            # 4. Validate the model performance
            # 5. Save the new model version
            
            # Simulate training time
            await asyncio.sleep(5)
            
            # Create metrics for the new model (in real implementation, these would be actual metrics)
            metrics = AIModelMetrics(
                id=uuid.uuid4(),
                model_version=job.model_version,
                accuracy=0.94,
                precision=0.92,
                recall=0.91,
                f1_score=0.93,
                false_positives=85,
                false_negatives=92,
                total_samples=len(feedback_items),
                training_duration=3600,  # 1 hour
                last_trained=datetime.now()
            )
            
            self.db.add(metrics)
            
            # Update job status
            job.status = "completed"
            job.completed_at = datetime.now()
            job.metrics_id = metrics.id
            
            self.db.commit()
            
            logger.info(f"Successfully completed training job {job_id} for model version {job.model_version}")
            
        except Exception as e:
            logger.exception(f"Error processing training job {job_id}: {str(e)}")
            
            if self.db:
                try:
                    # Update job status to failed
                    job = self.db.query(AITrainingJob).filter(AITrainingJob.id == job_id).first()
                    if job:
                        job.status = "failed"
                        job.error_message = str(e)
                        job.completed_at = datetime.now()
                        self.db.commit()
                except Exception as update_error:
                    logger.exception(f"Error updating failed job status: {str(update_error)}")
    
    async def start_scheduled_training(self) -> Optional[Dict[str, Any]]:
        """
        Start a scheduled training job if enough feedback is available
        
        Returns:
            The created training job or None if no training is needed
        """
        if not self.db:
            # Mock implementation
            return await self.create_training_job(
                target_model_version="1.2.0",
                triggered_by="scheduled_task"
            )
            
        # Check if there's already a training job in progress
        active_job = self.db.query(AITrainingJob).filter(
            AITrainingJob.status.in_(["queued", "in_progress"])
        ).first()
        
        if active_job:
            logger.info(f"Training already in progress: {active_job.id}")
            return None
            
        # Check for new feedback since last training
        latest_model = self.db.query(AIModelMetrics).order_by(
            desc(AIModelMetrics.last_trained)
        ).first()
        
        if latest_model:
            # Count new feedback since last training
            new_feedback_count = self.db.query(func.count(DiagnosticFeedback.id)).filter(
                DiagnosticFeedback.global_status == "accepted_for_global",
                DiagnosticFeedback.is_learning_case == True,
                DiagnosticFeedback.created_at > latest_model.last_trained
            ).scalar()
            
            # Only train if we have enough new feedback (arbitrary threshold)
            if new_feedback_count < 50:
                logger.info(f"Not enough new feedback for training: {new_feedback_count}")
                return None
                
            # Increment version number
            version_parts = latest_model.model_version.split('.')
            new_version = f"{version_parts[0]}.{version_parts[1]}.{int(version_parts[2]) + 1}"
        else:
            # No existing model, start with version 1.0.0
            new_version = "1.0.0"
        
        # Create a new training job
        return await self.create_training_job(
            target_model_version=new_version,
            triggered_by="scheduled_task"
        )
    
    async def validate_model(self, model_version: str) -> Dict[str, Any]:
        """
        Validate a model against test data
        
        Args:
            model_version: The model version to validate
            
        Returns:
            Validation metrics
        """
        # In a real implementation, this would:
        # 1. Load the model version
        # 2. Load test data (separate from training data)
        # 3. Run validation
        # 4. Compute and return metrics
        
        # Mock implementation for demonstration
        return {
            "model_version": model_version,
            "accuracy": 0.94,
            "precision": 0.92,
            "recall": 0.91,
            "f1_score": 0.93,
            "confusion_matrix": {
                "true_positive": 450,
                "false_positive": 38,
                "true_negative": 470,
                "false_negative": 42
            },
            "validation_set_size": 1000,
            "validation_date": datetime.now().isoformat()
        }
    
    async def deploy_model(self, model_version: str) -> Dict[str, Any]:
        """
        Deploy a model version to production
        
        Args:
            model_version: The model version to deploy
            
        Returns:
            Deployment status
        """
        # In a real implementation, this would:
        # 1. Validate the model one final time
        # 2. Update configuration to point to the new model
        # 3. Handle any necessary service restarts or deployments
        
        # Mock implementation for demonstration
        deployment = {
            "model_version": model_version,
            "status": "deployed",
            "previous_version": "1.0.0",
            "deployed_at": datetime.now().isoformat(),
            "deployed_by": "system"
        }
        
        # Save deployment status to file
        filename = os.path.join(self.model_store_path, f"deployment_{model_version}.json")
        with open(filename, 'w') as f:
            json.dump(deployment, f, indent=2)
        
        return deployment 