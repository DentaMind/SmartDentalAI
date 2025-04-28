from typing import Dict, List, Optional, Tuple
import numpy as np
from datetime import datetime, timedelta
import asyncio
import logging
from .metrics import get_metric_history
from ..models.tuning import TuningParameters, TuningRecommendation
from ..config import METRIC_THRESHOLDS, RETUNING_INTERVALS

logger = logging.getLogger(__name__)

class AutoTuningService:
    def __init__(self):
        self.is_running: bool = False
        self.current_parameters: Dict[str, float] = {}
        self.tuning_history: List[Dict] = []
        self.last_tuning: Optional[datetime] = None
        self.check_interval: int = 300  # 5 minutes

    async def start(self):
        """Start the auto-tuning service."""
        self.is_running = True
        logger.info("Starting AutoTuning service...")
        while self.is_running:
            try:
                await self.check_and_tune()
            except Exception as e:
                logger.error(f"Error in AutoTuning service: {e}")
            await asyncio.sleep(self.check_interval)

    async def stop(self):
        """Stop the auto-tuning service."""
        self.is_running = False
        logger.info("Stopping AutoTuning service...")

    async def check_and_tune(self):
        """Check metrics and perform tuning if necessary."""
        metrics_to_check = ['accuracy', 'precision', 'recall', 'f1_score']
        
        for metric in metrics_to_check:
            history = await get_metric_history(metric, days=7)
            if self._needs_tuning(metric, history):
                recommendation = await self.generate_tuning_recommendation(metric, history)
                if recommendation:
                    await self.apply_tuning(recommendation)

    def _needs_tuning(self, metric: str, history: List[Dict]) -> bool:
        """Determine if a metric needs tuning based on its history."""
        if not history:
            return False

        values = [point['value'] for point in history]
        current_value = values[-1]
        threshold = METRIC_THRESHOLDS.get(metric, 0.8)

        # Check if current value is below threshold
        if current_value < threshold:
            return True

        # Check for significant degradation
        if len(values) >= 3:
            recent_trend = np.polyfit(range(len(values[-3:])), values[-3:], 1)[0]
            if recent_trend < -0.05:  # 5% degradation
                return True

        return False

    async def generate_tuning_recommendation(
        self, 
        metric: str, 
        history: List[Dict]
    ) -> Optional[TuningRecommendation]:
        """Generate tuning recommendations based on metric history."""
        if not history:
            return None

        values = np.array([point['value'] for point in history])
        timestamps = [point['timestamp'] for point in history]

        # Calculate key statistics
        mean_value = np.mean(values)
        std_value = np.std(values)
        trend = np.polyfit(range(len(values)), values, 1)[0]

        # Analyze patterns
        seasonality = self._detect_seasonality(values)
        volatility = std_value / mean_value

        # Generate parameter adjustments
        adjustments = self._calculate_parameter_adjustments(
            metric, mean_value, trend, volatility, seasonality
        )

        return TuningRecommendation(
            metric=metric,
            timestamp=datetime.now().isoformat(),
            current_value=values[-1],
            mean_value=mean_value,
            trend=trend,
            volatility=volatility,
            seasonality=seasonality,
            parameter_adjustments=adjustments,
            confidence_score=self._calculate_confidence(volatility, len(history))
        )

    def _detect_seasonality(self, values: np.ndarray) -> Optional[int]:
        """Detect seasonality in metric values."""
        if len(values) < 24:  # Need enough data points
            return None

        # Calculate autocorrelation
        autocorr = np.correlate(values, values, mode='full')
        autocorr = autocorr[len(autocorr)//2:]

        # Find peaks in autocorrelation
        peaks = []
        for i in range(1, len(autocorr)-1):
            if autocorr[i] > autocorr[i-1] and autocorr[i] > autocorr[i+1]:
                peaks.append((i, autocorr[i]))

        if not peaks:
            return None

        # Return the strongest period
        strongest_peak = max(peaks, key=lambda x: x[1])
        return strongest_peak[0]

    def _calculate_parameter_adjustments(
        self,
        metric: str,
        mean_value: float,
        trend: float,
        volatility: float,
        seasonality: Optional[int]
    ) -> Dict[str, float]:
        """Calculate specific parameter adjustments based on metric analysis."""
        adjustments = {}

        # Base adjustments on metric type
        if metric == 'accuracy':
            adjustments['learning_rate'] = self._adjust_learning_rate(trend, volatility)
            adjustments['batch_size'] = self._adjust_batch_size(volatility)
        elif metric in ['precision', 'recall']:
            adjustments['threshold'] = self._adjust_threshold(mean_value, trend)
            adjustments['class_weight'] = self._adjust_class_weight(mean_value)

        # Adjust for seasonality if detected
        if seasonality:
            adjustments['window_size'] = max(seasonality, 24)  # Minimum 24 hours

        return adjustments

    def _adjust_learning_rate(self, trend: float, volatility: float) -> float:
        """Calculate learning rate adjustment."""
        if trend < -0.05:  # Significant negative trend
            return min(0.001 * (1 + abs(trend)), 0.01)  # Increase learning rate
        elif volatility > 0.1:  # High volatility
            return 0.001 * (1 - volatility)  # Decrease learning rate
        return 0.001  # Default learning rate

    def _adjust_batch_size(self, volatility: float) -> int:
        """Calculate batch size adjustment."""
        if volatility > 0.1:
            return 64  # Smaller batch size for high volatility
        return 128  # Default batch size

    def _adjust_threshold(self, mean_value: float, trend: float) -> float:
        """Calculate classification threshold adjustment."""
        base_threshold = 0.5
        if trend < -0.05:  # Negative trend
            return base_threshold - (abs(trend) * 0.1)  # Lower threshold
        return base_threshold

    def _adjust_class_weight(self, mean_value: float) -> float:
        """Calculate class weight adjustment."""
        if mean_value < 0.8:
            return 1 + (0.8 - mean_value)  # Increase weight for underperforming class
        return 1.0

    def _calculate_confidence(self, volatility: float, history_length: int) -> float:
        """Calculate confidence score for the recommendation."""
        base_confidence = 0.8
        
        # Reduce confidence for high volatility
        volatility_factor = max(0, 1 - volatility)
        
        # Increase confidence with more data points
        history_factor = min(history_length / 100, 1)
        
        return base_confidence * volatility_factor * history_factor

    async def apply_tuning(self, recommendation: TuningRecommendation):
        """Apply tuning recommendations."""
        if recommendation.confidence_score < 0.6:
            logger.warning(f"Low confidence tuning recommendation ({recommendation.confidence_score:.2f}) not applied")
            return

        logger.info(f"Applying tuning recommendation for {recommendation.metric}")
        
        # Record tuning history
        self.tuning_history.append({
            'timestamp': datetime.now().isoformat(),
            'metric': recommendation.metric,
            'adjustments': recommendation.parameter_adjustments,
            'confidence': recommendation.confidence_score
        })
        
        # Update current parameters
        self.current_parameters.update(recommendation.parameter_adjustments)
        self.last_tuning = datetime.now()

        # Trigger model retraining with new parameters
        await self._trigger_retraining(recommendation)

    async def _trigger_retraining(self, recommendation: TuningRecommendation):
        """Trigger model retraining with new parameters."""
        try:
            # TODO: Implement actual retraining logic
            logger.info(f"Triggered retraining with parameters: {recommendation.parameter_adjustments}")
        except Exception as e:
            logger.error(f"Failed to trigger retraining: {e}")

    async def get_tuning_history(self, days: int = 7) -> List[Dict]:
        """Get tuning history for the specified number of days."""
        cutoff = datetime.now() - timedelta(days=days)
        return [
            record for record in self.tuning_history 
            if datetime.fromisoformat(record['timestamp']) > cutoff
        ]

# Create singleton instance
auto_tuning_service = AutoTuningService() 