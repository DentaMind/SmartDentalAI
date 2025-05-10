from datetime import datetime, timedelta
import logging
from typing import Dict, Optional, List, Any
import random
from app.models.retraining import ModelPerformance
from app.db.mongodb import get_database
from app.core.config import settings
from app.models.canary import (
    CanaryDeployment,
    CanaryMetrics,
    CanaryEvaluationResponse
)

logger = logging.getLogger(__name__)

class CanaryDeploymentService:
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.canary_deployments
        
    async def start_canary(
        self,
        model_type: str,
        model_version: str,
        traffic_percentage: Optional[float] = None,
        evaluation_period_hours: Optional[int] = None
    ) -> Dict[str, Any]:
        """Start a new canary deployment."""
        try:
            # Check if there's already an active canary for this model type
            existing = await self.collection.find_one({
                "model_type": model_type,
                "status": "active"
            })
            
            if existing:
                raise ValueError(f"Active canary already exists for {model_type}")
                
            # Create new canary deployment
            canary = {
                "model_type": model_type,
                "model_version": model_version,
                "status": "active",
                "traffic_percentage": traffic_percentage or settings.canary_thresholds.default_traffic_percentage,
                "started_at": datetime.utcnow(),
                "evaluation_period_hours": evaluation_period_hours or settings.canary_thresholds.default_evaluation_hours,
                "metrics": {
                    "requests_served": 0,
                    "accuracy": 0.0,
                    "errors": 0
                },
                "is_promoted": False
            }
            
            await self.collection.insert_one(canary)
            return canary
            
        except Exception as e:
            logger.error(f"Error starting canary deployment: {str(e)}")
            raise

    async def should_use_canary(self, model_type: str) -> Optional[str]:
        """Determine if a request should be served by the canary version."""
        try:
            canary = await self.collection.find_one({
                "model_type": model_type,
                "status": "active"
            })
            
            if not canary:
                return None
                
            # Randomly route traffic based on percentage
            if random.random() * 100 < canary["traffic_percentage"]:
                return canary["model_version"]
                
            return None
            
        except Exception as e:
            logger.error(f"Error checking canary status: {str(e)}")
            return None

    async def update_metrics(
        self,
        model_type: str,
        accuracy: float,
        is_error: bool = False
    ) -> None:
        """Update metrics for an active canary deployment."""
        try:
            update = {
                "$inc": {
                    "metrics.requests_served": 1,
                    "metrics.errors": 1 if is_error else 0
                },
                "$set": {
                    "metrics.accuracy": accuracy
                }
            }
            
            await self.collection.update_one(
                {
                    "model_type": model_type,
                    "status": "active"
                },
                update
            )
            
        except Exception as e:
            logger.error(f"Error updating canary metrics: {str(e)}")

    async def evaluate_canary(self, model_type: str) -> Dict[str, Any]:
        """Evaluate a canary deployment and decide whether to promote or rollback."""
        try:
            canary = await self.collection.find_one({
                "model_type": model_type,
                "status": "active"
            })
            
            if not canary:
                return {
                    "status": "not_found",
                    "metrics": None
                }
                
            metrics = canary["metrics"]
            thresholds = settings.canary_thresholds
            
            # Check if we have enough data
            if metrics["requests_served"] < thresholds.min_requests:
                return {
                    "status": "insufficient_data",
                    "metrics": metrics
                }
                
            # Check if evaluation period has elapsed
            started_at = canary["started_at"]
            evaluation_period = timedelta(hours=canary["evaluation_period_hours"])
            if datetime.utcnow() - started_at < evaluation_period:
                return {
                    "status": "evaluation_ongoing",
                    "metrics": metrics
                }
                
            # Evaluate metrics against thresholds
            should_promote = (
                metrics["accuracy"] >= thresholds.diagnosis_accuracy and
                metrics["errors"] / metrics["requests_served"] <= thresholds.max_error_rate
            )
            
            if should_promote:
                # Promote the canary
                await self.collection.update_one(
                    {"_id": canary["_id"]},
                    {
                        "$set": {
                            "status": "promoted",
                            "is_promoted": True,
                            "promoted_at": datetime.utcnow(),
                            "final_metrics": metrics
                        }
                    }
                )
                return {
                    "status": "promoted",
                    "metrics": metrics
                }
            else:
                # Roll back the canary
                await self.collection.update_one(
                    {"_id": canary["_id"]},
                    {
                        "$set": {
                            "status": "rolled_back",
                            "rolled_back_at": datetime.utcnow(),
                            "final_metrics": metrics
                        }
                    }
                )
                return {
                    "status": "rolled_back",
                    "metrics": metrics
                }
                
        except Exception as e:
            logger.error(f"Error evaluating canary: {str(e)}")
            raise

    async def get_active_canaries(self) -> List[Dict[str, Any]]:
        """Get all currently active canary deployments."""
        try:
            cursor = self.collection.find({"status": "active"})
            return await cursor.to_list(length=None)
        except Exception as e:
            logger.error(f"Error getting active canaries: {str(e)}")
            raise

    async def get_canary_history(
        self,
        model_type: Optional[str] = None,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get history of canary deployments."""
        try:
            cutoff = datetime.utcnow() - timedelta(days=days)
            query = {"started_at": {"$gte": cutoff}}
            
            if model_type:
                query["model_type"] = model_type
                
            cursor = self.collection.find(query).sort("started_at", -1)
            return await cursor.to_list(length=None)
            
        except Exception as e:
            logger.error(f"Error getting canary history: {str(e)}")
            raise 