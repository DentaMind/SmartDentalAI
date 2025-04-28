from datetime import datetime
from typing import Dict, Any, List, Optional
import logging
from dataclasses import dataclass
from enum import Enum
import asyncio
import json
import os
from ..services.training_orchestrator import ModelVersion, TrainingOrchestrator

class DeploymentStatus(Enum):
    PENDING = "pending"
    CANARY = "canary"
    FULL = "full"
    ROLLED_BACK = "rolled_back"
    FAILED = "failed"

@dataclass
class CanaryConfig:
    traffic_percentage: float
    duration_minutes: int
    success_threshold: float
    metrics_to_monitor: List[str]
    max_error_rate: float
    min_requests: int

@dataclass
class CanaryMetrics:
    request_count: int
    error_count: int
    latency_ms: float
    model_metrics: Dict[str, float]
    timestamp: datetime

class CanaryDeployer:
    def __init__(self, training_orchestrator: TrainingOrchestrator):
        self.training_orchestrator = training_orchestrator
        self.logger = logging.getLogger(__name__)
        self.active_canaries: Dict[str, Dict[str, Any]] = {}
        self.canary_metrics: Dict[str, List[CanaryMetrics]] = {}
        self.default_config = CanaryConfig(
            traffic_percentage=10.0,
            duration_minutes=60,
            success_threshold=0.95,
            metrics_to_monitor=["accuracy", "precision", "recall"],
            max_error_rate=0.05,
            min_requests=100
        )
        self._load_state()
    
    def _load_state(self):
        try:
            if os.path.exists('canary_state.json'):
                with open('canary_state.json', 'r') as f:
                    state = json.load(f)
                    self.active_canaries = state.get('active_canaries', {})
                    self.canary_metrics = {
                        version: [
                            CanaryMetrics(
                                request_count=m['request_count'],
                                error_count=m['error_count'],
                                latency_ms=m['latency_ms'],
                                model_metrics=m['model_metrics'],
                                timestamp=datetime.fromisoformat(m['timestamp'])
                            )
                            for m in metrics
                        ]
                        for version, metrics in state.get('canary_metrics', {}).items()
                    }
        except Exception as e:
            self.logger.error(f"Error loading canary state: {e}")
    
    def _save_state(self):
        try:
            state = {
                'active_canaries': self.active_canaries,
                'canary_metrics': {
                    version: [
                        {
                            'request_count': m.request_count,
                            'error_count': m.error_count,
                            'latency_ms': m.latency_ms,
                            'model_metrics': m.model_metrics,
                            'timestamp': m.timestamp.isoformat()
                        }
                        for m in metrics
                    ]
                    for version, metrics in self.canary_metrics.items()
                }
            }
            with open('canary_state.json', 'w') as f:
                json.dump(state, f)
        except Exception as e:
            self.logger.error(f"Error saving canary state: {e}")
    
    async def start_canary(self, version: str, config: Optional[CanaryConfig] = None) -> bool:
        if version not in self.training_orchestrator.model_versions:
            self.logger.error(f"Version {version} not found")
            return False
        
        if version in self.active_canaries:
            self.logger.error(f"Canary deployment already active for version {version}")
            return False
        
        model_version = self.training_orchestrator.model_versions[version]
        if model_version.deployment_status != DeploymentStatus.PENDING:
            self.logger.error(f"Version {version} is not in PENDING state")
            return False
        
        config = config or self.default_config
        self.active_canaries[version] = {
            'config': config,
            'start_time': datetime.now(),
            'status': DeploymentStatus.CANARY
        }
        self.canary_metrics[version] = []
        model_version.deployment_status = DeploymentStatus.CANARY
        self._save_state()
        
        # Start monitoring
        asyncio.create_task(self._monitor_canary(version))
        return True
    
    async def _monitor_canary(self, version: str):
        config = self.active_canaries[version]['config']
        start_time = self.active_canaries[version]['start_time']
        
        while True:
            # Check if canary duration has expired
            if (datetime.now() - start_time).total_seconds() > config.duration_minutes * 60:
                await self._evaluate_canary(version)
                break
            
            # Collect metrics
            metrics = await self._collect_metrics(version)
            self.canary_metrics[version].append(metrics)
            self._save_state()
            
            # Check for immediate failure conditions
            if self._should_rollback(version):
                await self.rollback_canary(version, "Failed metrics check")
                break
            
            await asyncio.sleep(60)  # Check every minute
    
    async def _collect_metrics(self, version: str) -> CanaryMetrics:
        # TODO: Implement actual metric collection
        # This is a placeholder that simulates metric collection
        return CanaryMetrics(
            request_count=100,
            error_count=2,
            latency_ms=150.0,
            model_metrics={
                "accuracy": 0.95,
                "precision": 0.93,
                "recall": 0.94
            },
            timestamp=datetime.now()
        )
    
    def _should_rollback(self, version: str) -> bool:
        if version not in self.canary_metrics or not self.canary_metrics[version]:
            return False
        
        config = self.active_canaries[version]['config']
        metrics = self.canary_metrics[version][-1]
        
        # Check error rate
        if metrics.request_count >= config.min_requests:
            error_rate = metrics.error_count / metrics.request_count
            if error_rate > config.max_error_rate:
                return True
        
        # Check model metrics
        for metric in config.metrics_to_monitor:
            if metric in metrics.model_metrics:
                if metrics.model_metrics[metric] < config.success_threshold:
                    return True
        
        return False
    
    async def _evaluate_canary(self, version: str):
        if self._should_rollback(version):
            await self.rollback_canary(version, "Failed final evaluation")
        else:
            await self.promote_canary(version)
    
    async def promote_canary(self, version: str) -> bool:
        if version not in self.active_canaries:
            return False
        
        model_version = self.training_orchestrator.model_versions[version]
        model_version.deployment_status = DeploymentStatus.FULL
        del self.active_canaries[version]
        self._save_state()
        
        # TODO: Implement actual promotion logic
        self.logger.info(f"Promoted version {version} to full deployment")
        return True
    
    async def rollback_canary(self, version: str, reason: str) -> bool:
        if version not in self.active_canaries:
            return False
        
        model_version = self.training_orchestrator.model_versions[version]
        model_version.deployment_status = DeploymentStatus.ROLLED_BACK
        del self.active_canaries[version]
        self._save_state()
        
        # TODO: Implement actual rollback logic
        self.logger.info(f"Rolled back version {version}: {reason}")
        return True
    
    def get_canary_status(self, version: str) -> Optional[Dict[str, Any]]:
        if version not in self.active_canaries:
            return None
        
        canary = self.active_canaries[version]
        metrics = self.canary_metrics.get(version, [])
        
        return {
            'version': version,
            'status': canary['status'].value,
            'start_time': canary['start_time'].isoformat(),
            'config': {
                'traffic_percentage': canary['config'].traffic_percentage,
                'duration_minutes': canary['config'].duration_minutes,
                'success_threshold': canary['config'].success_threshold,
                'metrics_to_monitor': canary['config'].metrics_to_monitor,
                'max_error_rate': canary['config'].max_error_rate,
                'min_requests': canary['config'].min_requests
            },
            'latest_metrics': {
                'request_count': metrics[-1].request_count if metrics else 0,
                'error_count': metrics[-1].error_count if metrics else 0,
                'error_rate': metrics[-1].error_count / metrics[-1].request_count if metrics and metrics[-1].request_count > 0 else 0,
                'latency_ms': metrics[-1].latency_ms if metrics else 0,
                'model_metrics': metrics[-1].model_metrics if metrics else {}
            } if metrics else None
        }
    
    def get_all_canary_statuses(self) -> List[Dict[str, Any]]:
        return [
            self.get_canary_status(version)
            for version in self.active_canaries
        ]

# Singleton instance
canary_deployer = CanaryDeployer(TrainingOrchestrator()) 