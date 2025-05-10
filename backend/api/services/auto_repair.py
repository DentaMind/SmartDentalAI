import asyncio
from typing import Dict, Any
from datetime import datetime, timedelta
import logging
from ..routes.telemetry import events, learning_metrics

logger = logging.getLogger(__name__)

class AutoRepairService:
    def __init__(self):
        self.repair_history = []
        self.last_check = None
        self.check_interval = 300  # 5 minutes
        self.ingestion_threshold = 10  # Minimum events per hour
        self.error_threshold = 0.1  # 10% error rate threshold

    async def start(self):
        """Start the auto-repair service."""
        while True:
            try:
                await self.check_and_repair()
                await asyncio.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"Error in auto-repair service: {str(e)}")
                await asyncio.sleep(60)  # Wait a minute before retrying

    async def check_and_repair(self):
        """Check system health and perform repairs if needed."""
        now = datetime.utcnow()
        self.last_check = now

        # Check ingestion rate
        ingestion_events = [e for e in events if e.get('type') == 'ingestion']
        recent_events = [
            e for e in ingestion_events 
            if datetime.fromisoformat(e['timestamp']) > now - timedelta(hours=1)
        ]
        
        if len(recent_events) < self.ingestion_threshold:
            await self.repair_ingestion()

        # Check error rate
        error_events = [e for e in events if e.get('status') == 'error']
        error_rate = len(error_events) / len(events) if events else 0
        
        if error_rate > self.error_threshold:
            await self.repair_errors()

        # Check retraining status
        retraining_events = [e for e in events if e.get('type') == 'retraining']
        if retraining_events:
            latest_retraining = max(retraining_events, key=lambda x: x['timestamp'])
            if latest_retraining.get('status') == 'error':
                await self.repair_retraining()

    async def repair_ingestion(self):
        """Repair ingestion issues."""
        repair_action = {
            "type": "ingestion_repair",
            "timestamp": datetime.utcnow().isoformat(),
            "action": "restart_ingestion_workers",
            "status": "success"
        }
        
        try:
            # In production, this would restart the ingestion workers
            logger.info("Restarting ingestion workers...")
            # Add your actual repair logic here
            events.append(repair_action)
            self.repair_history.append(repair_action)
        except Exception as e:
            repair_action["status"] = "error"
            repair_action["error"] = str(e)
            logger.error(f"Failed to repair ingestion: {str(e)}")
            events.append(repair_action)
            self.repair_history.append(repair_action)

    async def repair_errors(self):
        """Repair error-related issues."""
        repair_action = {
            "type": "error_repair",
            "timestamp": datetime.utcnow().isoformat(),
            "action": "clear_error_queue",
            "status": "success"
        }
        
        try:
            # In production, this would clear the error queue and restart affected services
            logger.info("Clearing error queue and restarting services...")
            # Add your actual repair logic here
            events.append(repair_action)
            self.repair_history.append(repair_action)
        except Exception as e:
            repair_action["status"] = "error"
            repair_action["error"] = str(e)
            logger.error(f"Failed to repair errors: {str(e)}")
            events.append(repair_action)
            self.repair_history.append(repair_action)

    async def repair_retraining(self):
        """Repair retraining issues."""
        repair_action = {
            "type": "retraining_repair",
            "timestamp": datetime.utcnow().isoformat(),
            "action": "queue_fallback_retraining",
            "status": "success"
        }
        
        try:
            # In production, this would queue a fallback retraining job
            logger.info("Queueing fallback retraining job...")
            # Add your actual repair logic here
            events.append(repair_action)
            self.repair_history.append(repair_action)
        except Exception as e:
            repair_action["status"] = "error"
            repair_action["error"] = str(e)
            logger.error(f"Failed to repair retraining: {str(e)}")
            events.append(repair_action)
            self.repair_history.append(repair_action)

    def get_repair_history(self) -> Dict[str, Any]:
        """Get repair history and statistics."""
        return {
            "total_repairs": len(self.repair_history),
            "successful_repairs": sum(1 for r in self.repair_history if r["status"] == "success"),
            "failed_repairs": sum(1 for r in self.repair_history if r["status"] == "error"),
            "last_check": self.last_check.isoformat() if self.last_check else None,
            "repair_history": self.repair_history[-10:]  # Last 10 repairs
        }

# Create a singleton instance
auto_repair_service = AutoRepairService() 