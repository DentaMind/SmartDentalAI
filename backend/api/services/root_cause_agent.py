from typing import Dict, List, Optional
import asyncio
import logging
from datetime import datetime, timedelta
import openai
from .metrics import get_metric_history
from .telemetry import get_system_metrics, get_event_stats
from ..config import OPENAI_API_KEY

logger = logging.getLogger(__name__)

class RootCauseAgent:
    def __init__(self):
        self.is_running: bool = False
        self.analysis_history: List[Dict] = []
        self.check_interval: int = 600  # 10 minutes
        self.openai_client = openai.Client(api_key=OPENAI_API_KEY)

    async def start(self):
        """Start the root cause analysis agent."""
        self.is_running = True
        logger.info("Starting Root Cause Analysis agent...")
        while self.is_running:
            try:
                await self.analyze_anomalies()
            except Exception as e:
                logger.error(f"Error in Root Cause Analysis agent: {e}")
            await asyncio.sleep(self.check_interval)

    async def stop(self):
        """Stop the root cause analysis agent."""
        self.is_running = False
        logger.info("Stopping Root Cause Analysis agent...")

    async def analyze_anomalies(self):
        """Analyze recent anomalies and generate root cause analysis."""
        # Gather data from multiple sources
        metrics_data = await self._gather_metrics_data()
        system_metrics = await get_system_metrics()
        event_stats = await get_event_stats()

        # Find anomalies
        anomalies = self._detect_anomaly_clusters(metrics_data)
        if not anomalies:
            return

        # Generate analysis for each anomaly cluster
        for anomaly_cluster in anomalies:
            analysis = await self._generate_root_cause_analysis(
                anomaly_cluster,
                metrics_data,
                system_metrics,
                event_stats
            )
            
            if analysis:
                self.analysis_history.append(analysis)
                await self._notify_if_critical(analysis)

    async def _gather_metrics_data(self) -> Dict[str, List[Dict]]:
        """Gather recent metrics data for analysis."""
        metrics = ['accuracy', 'precision', 'recall', 'f1_score']
        data = {}
        
        for metric in metrics:
            history = await get_metric_history(metric, days=1)
            data[metric] = history

        return data

    def _detect_anomaly_clusters(self, metrics_data: Dict[str, List[Dict]]) -> List[Dict]:
        """Detect clusters of related anomalies across metrics."""
        anomaly_clusters = []
        processed_anomalies = set()

        for metric, data in metrics_data.items():
            for i, point in enumerate(data):
                if self._is_anomaly(point, data) and point['timestamp'] not in processed_anomalies:
                    # Find related anomalies in other metrics
                    cluster = {
                        'timestamp': point['timestamp'],
                        'primary_metric': metric,
                        'primary_value': point['value'],
                        'related_anomalies': self._find_related_anomalies(
                            point['timestamp'],
                            metric,
                            metrics_data
                        )
                    }
                    anomaly_clusters.append(cluster)
                    processed_anomalies.add(point['timestamp'])

        return anomaly_clusters

    def _is_anomaly(self, point: Dict, history: List[Dict]) -> bool:
        """Determine if a data point is anomalous."""
        if len(history) < 10:
            return False

        values = [p['value'] for p in history]
        mean = sum(values) / len(values)
        std = (sum((x - mean) ** 2 for x in values) / len(values)) ** 0.5
        z_score = abs(point['value'] - mean) / std

        return z_score > 3  # Consider points beyond 3 standard deviations as anomalies

    def _find_related_anomalies(
        self,
        timestamp: str,
        primary_metric: str,
        metrics_data: Dict[str, List[Dict]]
    ) -> List[Dict]:
        """Find anomalies in other metrics that occurred close to the given timestamp."""
        related = []
        target_time = datetime.fromisoformat(timestamp)
        window = timedelta(minutes=30)

        for metric, data in metrics_data.items():
            if metric == primary_metric:
                continue

            for point in data:
                point_time = datetime.fromisoformat(point['timestamp'])
                if abs(point_time - target_time) <= window and self._is_anomaly(point, data):
                    related.append({
                        'metric': metric,
                        'timestamp': point['timestamp'],
                        'value': point['value']
                    })

        return related

    async def _generate_root_cause_analysis(
        self,
        anomaly_cluster: Dict,
        metrics_data: Dict[str, List[Dict]],
        system_metrics: Dict,
        event_stats: Dict
    ) -> Optional[Dict]:
        """Generate a detailed root cause analysis using GPT."""
        try:
            # Prepare context for GPT
            context = self._prepare_analysis_context(
                anomaly_cluster,
                metrics_data,
                system_metrics,
                event_stats
            )

            # Generate analysis using GPT
            analysis = await self._query_gpt(context)

            return {
                'timestamp': datetime.now().isoformat(),
                'anomaly_cluster': anomaly_cluster,
                'analysis': analysis,
                'system_state': {
                    'metrics': metrics_data,
                    'system': system_metrics,
                    'events': event_stats
                }
            }
        except Exception as e:
            logger.error(f"Failed to generate root cause analysis: {e}")
            return None

    def _prepare_analysis_context(
        self,
        anomaly_cluster: Dict,
        metrics_data: Dict[str, List[Dict]],
        system_metrics: Dict,
        event_stats: Dict
    ) -> str:
        """Prepare context for GPT analysis."""
        context = [
            "Analyze the following anomaly and determine its root cause:",
            f"\nPrimary Anomaly:",
            f"- Metric: {anomaly_cluster['primary_metric']}",
            f"- Value: {anomaly_cluster['primary_value']:.3f}",
            f"- Timestamp: {anomaly_cluster['timestamp']}",
            
            "\nRelated Anomalies:",
            *[f"- {a['metric']}: {a['value']:.3f} at {a['timestamp']}"
              for a in anomaly_cluster['related_anomalies']],
            
            "\nSystem State:",
            f"- CPU Usage: {system_metrics['cpu']['usage_percent']}%",
            f"- Memory Usage: {system_metrics['memory']['usage_percent']}%",
            f"- Event Error Rate: {event_stats['error_rate']}%",
            
            "\nRecent Events:",
            f"- Total Events: {event_stats['total_events']}",
            f"- Events Last Hour: {event_stats['events_last_hour']}",
            f"- Recent Errors: {len(event_stats['recent_errors'])}"
        ]

        return "\n".join(context)

    async def _query_gpt(self, context: str) -> Dict:
        """Query GPT for root cause analysis."""
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": """You are an AI operations analyst specializing in 
                    identifying root causes of anomalies in AI systems. Analyze the provided metrics 
                    and system state to determine the most likely cause of the anomaly. Focus on:
                    1. Primary cause identification
                    2. Contributing factors
                    3. Potential remediation steps
                    4. Confidence level in the analysis"""},
                    {"role": "user", "content": context}
                ],
                temperature=0.7,
                max_tokens=1000
            )

            return {
                'explanation': response.choices[0].message.content,
                'confidence': self._extract_confidence(response.choices[0].message.content)
            }
        except Exception as e:
            logger.error(f"Failed to query GPT: {e}")
            return {
                'explanation': "Failed to generate analysis",
                'confidence': 0.0
            }

    def _extract_confidence(self, analysis: str) -> float:
        """Extract confidence level from GPT analysis."""
        try:
            if 'confidence' in analysis.lower():
                # Extract percentage if present
                import re
                matches = re.findall(r'confidence[:\s]+(\d+(?:\.\d+)?)', analysis.lower())
                if matches:
                    return float(matches[0]) / 100
            return 0.7  # Default confidence
        except Exception:
            return 0.5

    async def _notify_if_critical(self, analysis: Dict):
        """Notify stakeholders if the analysis indicates a critical issue."""
        if 'critical' in analysis['analysis']['explanation'].lower() or \
           'urgent' in analysis['analysis']['explanation'].lower():
            # TODO: Implement notification system
            logger.warning("Critical issue detected in root cause analysis")

    async def get_analysis_history(self, days: int = 7) -> List[Dict]:
        """Get analysis history for the specified number of days."""
        cutoff = datetime.now() - timedelta(days=days)
        return [
            analysis for analysis in self.analysis_history
            if datetime.fromisoformat(analysis['timestamp']) > cutoff
        ]

# Create singleton instance
root_cause_agent = RootCauseAgent() 