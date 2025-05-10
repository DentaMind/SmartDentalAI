from datetime import datetime, timedelta
from typing import Dict, List, Optional
import asyncio
import logging
from app.models.retraining import (
    RetrainingMetrics,
    RetrainingStatus,
    RetrainingHistoryEvent,
    RetrainingConfig,
    ModelPerformance
)
from app.db.mongodb import get_database
from app.core.config import settings
from app.ml.training import ModelTrainer
from app.services.data import DataService

logger = logging.getLogger(__name__)

class RetrainingService:
    def __init__(self):
        self.db = get_database()
        self.data_service = DataService()
        self.model_trainer = ModelTrainer()
        
    async def get_status(self) -> RetrainingStatus:
        """Get current retraining status for all models."""
        metrics = {}
        collection = self.db.retraining_metrics
        
        for model_type in ["diagnosis", "treatment", "billing"]:
            metric = await collection.find_one({"model_type": model_type})
            if metric:
                metrics[model_type] = RetrainingMetrics(
                    last_retrained=metric["last_retrained"],
                    status=metric["status"],
                    performance=ModelPerformance(**metric["performance"]),
                    retraining_count_30d=metric["retraining_count_30d"]
                )
        
        return RetrainingStatus(metrics=metrics)

    async def update_thresholds(self, thresholds: Dict) -> None:
        """Update retraining thresholds in configuration."""
        collection = self.db.config
        await collection.update_one(
            {"type": "retraining"},
            {"$set": thresholds},
            upsert=True
        )

    async def get_config(self) -> RetrainingConfig:
        """Get current retraining configuration."""
        collection = self.db.config
        config = await collection.find_one({"type": "retraining"})
        if not config:
            config = RetrainingConfig().dict()
            await collection.insert_one({"type": "retraining", **config})
        return RetrainingConfig(**config)

    async def trigger_retraining(
        self,
        model_type: str,
        reason: str,
        force: bool = False,
        triggered_by: str = "system"
    ) -> None:
        """Trigger retraining for a specific model."""
        try:
            # Create history event
            event = RetrainingHistoryEvent(
                model_type=model_type,
                status="pending",
                started_at=datetime.utcnow(),
                triggered_by=triggered_by,
                reason=reason,
                force=force
            )
            
            # Update metrics status
            await self._update_metrics_status(model_type, "pending")
            
            # Save initial history event
            await self._save_history_event(event)
            
            # Get training data
            data = await self.data_service.get_training_data(model_type)
            
            # Get configuration
            config = await self.get_config()
            
            # Train model
            performance = await self.model_trainer.train(
                model_type=model_type,
                data=data,
                config=config
            )
            
            # Update history event
            event.status = "completed"
            event.completed_at = datetime.utcnow()
            event.performance_metrics = performance
            await self._update_history_event(event)
            
            # Update metrics
            await self._update_metrics(model_type, performance)
            
        except Exception as e:
            logger.error(f"Retraining failed for {model_type}: {str(e)}")
            # Update history event with failure
            event.status = "failed"
            event.completed_at = datetime.utcnow()
            await self._update_history_event(event)
            
            # Update metrics status
            await self._update_metrics_status(model_type, "failed")
            raise

    async def get_history(
        self,
        days: int = 30,
        model_type: Optional[str] = None
    ) -> List[RetrainingHistoryEvent]:
        """Get retraining history for the specified period and model type."""
        collection = self.db.retraining_history
        query = {
            "started_at": {
                "$gte": datetime.utcnow() - timedelta(days=days)
            }
        }
        
        if model_type:
            query["model_type"] = model_type
            
        cursor = collection.find(query).sort("started_at", -1)
        history = await cursor.to_list(length=None)
        return [RetrainingHistoryEvent(**event) for event in history]

    async def _update_metrics_status(self, model_type: str, status: str) -> None:
        """Update the status in retraining metrics."""
        collection = self.db.retraining_metrics
        await collection.update_one(
            {"model_type": model_type},
            {"$set": {"status": status}},
            upsert=True
        )

    async def _update_metrics(self, model_type: str, performance: ModelPerformance) -> None:
        """Update retraining metrics after successful retraining."""
        collection = self.db.retraining_metrics
        
        # Get current retraining count
        metric = await collection.find_one({"model_type": model_type})
        current_count = metric.get("retraining_count_30d", 0) if metric else 0
        
        # Update metrics
        await collection.update_one(
            {"model_type": model_type},
            {
                "$set": {
                    "last_retrained": datetime.utcnow(),
                    "status": "completed",
                    "performance": performance.dict(),
                    "retraining_count_30d": current_count + 1
                }
            },
            upsert=True
        )

    async def _save_history_event(self, event: RetrainingHistoryEvent) -> None:
        """Save a new retraining history event."""
        collection = self.db.retraining_history
        await collection.insert_one(event.dict())

    async def _update_history_event(self, event: RetrainingHistoryEvent) -> None:
        """Update an existing retraining history event."""
        collection = self.db.retraining_history
        await collection.update_one(
            {
                "model_type": event.model_type,
                "started_at": event.started_at
            },
            {"$set": event.dict()}
        ) 