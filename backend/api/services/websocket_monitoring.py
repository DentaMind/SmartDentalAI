"""
WebSocket Connection Monitoring Service

This module provides monitoring capabilities for WebSocket connections,
including metrics collection, health checks, and diagnostics.
"""

import logging
import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Set
import json

from .websocket_service import connection_manager
from ..config.settings import settings

# Configure logging
logger = logging.getLogger(__name__)

class WebSocketMetrics:
    """
    Class for collecting and reporting WebSocket metrics
    """
    
    def __init__(self):
        """Initialize the metrics collector"""
        self.metrics: Dict[str, Any] = {
            "connections": {
                "total": 0,
                "peak": 0,
                "by_hour": {},
            },
            "messages": {
                "sent": 0,
                "received": 0,
                "errors": 0,
                "by_type": {},
            },
            "rooms": {
                "count": 0,
                "peak": 0,
                "most_active": "",
                "activity": {},
            },
            "users": {
                "count": 0,
                "peak": 0,
                "most_active": "",
                "activity": {},
            },
            "performance": {
                "avg_message_latency_ms": 0,
                "max_message_latency_ms": 0,
                "avg_broadcast_time_ms": 0,
            },
            "errors": {
                "count": 0,
                "by_type": {},
                "recent": [],
            },
            "started_at": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat(),
        }
        
        # Performance tracking
        self.message_latencies: List[float] = []
        self.broadcast_times: List[float] = []
        
        # Active tracking
        self.active_rooms: Dict[str, int] = {}
        self.active_users: Dict[str, int] = {}
        
        # Historical metrics storage - keep hourly snapshots for up to 30 days
        self.historical_metrics: List[Dict[str, Any]] = []
        self.last_snapshot_time = datetime.now()
        
        # Start the metrics snapshot task
        asyncio.create_task(self._metrics_snapshot_task())
        
        logger.info("WebSocket metrics collector initialized")
    
    async def _metrics_snapshot_task(self):
        """Periodic task to take snapshots of current metrics for historical tracking"""
        while True:
            try:
                # Take metrics snapshot every hour
                await asyncio.sleep(3600)  # 1 hour in seconds
                
                # Take a snapshot of current metrics
                self._take_metrics_snapshot()
                
                # Clean up old metrics (keep 30 days of hourly data)
                self._cleanup_old_metrics()
            except Exception as e:
                logger.error(f"Error in metrics snapshot task: {e}")
                # Brief pause before retrying after error
                await asyncio.sleep(60)
    
    def _take_metrics_snapshot(self):
        """Take a snapshot of current metrics and store in historical data"""
        current_time = datetime.now()
        
        # Create snapshot with essential metrics
        snapshot = {
            "timestamp": current_time.isoformat(),
            "connections": {
                "total": connection_manager.get_total_connections_count(),
                "unique_users": len(connection_manager.active_connections),
            },
            "messages": {
                "sent": self.metrics["messages"]["sent"],
                "received": self.metrics["messages"]["received"],
                "errors": self.metrics["messages"]["errors"],
            },
            "performance": {
                "avg_message_latency_ms": self.metrics["performance"]["avg_message_latency_ms"],
                "avg_broadcast_time_ms": self.metrics["performance"]["avg_broadcast_time_ms"], 
            },
            "rooms": {
                "count": len(connection_manager.rooms),
            },
            "errors": {
                "count": self.metrics["errors"]["count"],
            },
            "pool": connection_pool.get_stats(),
        }
        
        # Add to historical metrics
        self.historical_metrics.append(snapshot)
        self.last_snapshot_time = current_time
        
        logger.info(f"WebSocket metrics snapshot taken at {current_time.isoformat()}")
    
    def _cleanup_old_metrics(self):
        """Remove metrics older than 30 days"""
        if not self.historical_metrics:
            return
            
        # Calculate cutoff time (30 days ago)
        cutoff_time = datetime.now() - timedelta(days=30)
        cutoff_str = cutoff_time.isoformat()
        
        # Filter out old metrics
        self.historical_metrics = [
            metric for metric in self.historical_metrics
            if metric["timestamp"] > cutoff_str
        ]
        
        logger.info(f"Cleaned up historical WebSocket metrics older than {cutoff_str}")
    
    def record_connection(self):
        """Record a new connection"""
        self.metrics["connections"]["total"] += 1
        
        # Update peak if necessary
        current = connection_manager.get_total_connections_count()
        if current > self.metrics["connections"]["peak"]:
            self.metrics["connections"]["peak"] = current
        
        # Record by hour
        hour = datetime.now().strftime("%Y-%m-%d %H:00")
        if hour not in self.metrics["connections"]["by_hour"]:
            self.metrics["connections"]["by_hour"][hour] = 0
        self.metrics["connections"]["by_hour"][hour] += 1
        
        # Keep only the last 24 hours
        cutoff = (datetime.now() - timedelta(hours=24)).strftime("%Y-%m-%d %H:00")
        self.metrics["connections"]["by_hour"] = {
            k: v for k, v in self.metrics["connections"]["by_hour"].items()
            if k >= cutoff
        }
        
        # Update users count
        user_count = len(connection_manager.active_connections)
        self.metrics["users"]["count"] = user_count
        if user_count > self.metrics["users"]["peak"]:
            self.metrics["users"]["peak"] = user_count
        
        self._update_timestamp()
    
    def record_disconnection(self):
        """Record a disconnection"""
        # Update current counts
        self.metrics["users"]["count"] = len(connection_manager.active_connections)
        self._update_timestamp()
    
    def record_message_sent(self, message_type: str, latency_ms: Optional[float] = None):
        """
        Record a message sent
        
        Args:
            message_type: The type of message sent
            latency_ms: Message processing latency in milliseconds (if available)
        """
        self.metrics["messages"]["sent"] += 1
        
        # Record by type
        if message_type not in self.metrics["messages"]["by_type"]:
            self.metrics["messages"]["by_type"][message_type] = {
                "sent": 0,
                "received": 0,
                "errors": 0,
            }
        self.metrics["messages"]["by_type"][message_type]["sent"] += 1
        
        # Record latency if provided
        if latency_ms is not None:
            self.message_latencies.append(latency_ms)
            
            # Keep only the last 1000 latencies
            if len(self.message_latencies) > 1000:
                self.message_latencies.pop(0)
            
            # Update average and max
            self.metrics["performance"]["avg_message_latency_ms"] = sum(self.message_latencies) / len(self.message_latencies)
            self.metrics["performance"]["max_message_latency_ms"] = max(self.message_latencies)
        
        self._update_timestamp()
    
    def record_message_received(self, message_type: str):
        """
        Record a message received
        
        Args:
            message_type: The type of message received
        """
        self.metrics["messages"]["received"] += 1
        
        # Record by type
        if message_type not in self.metrics["messages"]["by_type"]:
            self.metrics["messages"]["by_type"][message_type] = {
                "sent": 0,
                "received": 0,
                "errors": 0,
            }
        self.metrics["messages"]["by_type"][message_type]["received"] += 1
        
        self._update_timestamp()
    
    def record_message_error(self, message_type: str, error: str):
        """
        Record a message error
        
        Args:
            message_type: The type of message that had an error
            error: Error description
        """
        self.metrics["messages"]["errors"] += 1
        self.metrics["errors"]["count"] += 1
        
        # Record by type
        if message_type not in self.metrics["messages"]["by_type"]:
            self.metrics["messages"]["by_type"][message_type] = {
                "sent": 0,
                "received": 0,
                "errors": 0,
            }
        self.metrics["messages"]["by_type"][message_type]["errors"] += 1
        
        # Record by error type
        if error not in self.metrics["errors"]["by_type"]:
            self.metrics["errors"]["by_type"][error] = 0
        self.metrics["errors"]["by_type"][error] += 1
        
        # Record recent errors
        self.metrics["errors"]["recent"].append({
            "timestamp": datetime.now().isoformat(),
            "message_type": message_type,
            "error": error,
        })
        
        # Keep only the last 50 errors
        if len(self.metrics["errors"]["recent"]) > 50:
            self.metrics["errors"]["recent"].pop(0)
        
        self._update_timestamp()
    
    def record_room_activity(self, room_id: str):
        """
        Record activity in a room
        
        Args:
            room_id: The ID of the room with activity
        """
        # Update rooms count
        room_count = len(connection_manager.rooms)
        self.metrics["rooms"]["count"] = room_count
        if room_count > self.metrics["rooms"]["peak"]:
            self.metrics["rooms"]["peak"] = room_count
        
        # Record room activity
        if room_id not in self.active_rooms:
            self.active_rooms[room_id] = 0
        self.active_rooms[room_id] += 1
        
        # Update most active room
        most_active = max(self.active_rooms.items(), key=lambda x: x[1], default=(None, 0))
        if most_active[0]:
            self.metrics["rooms"]["most_active"] = most_active[0]
            self.metrics["rooms"]["activity"] = {
                k: v for k, v in sorted(
                    self.active_rooms.items(), 
                    key=lambda x: x[1], 
                    reverse=True
                )[:10]  # Keep only top 10
            }
        
        self._update_timestamp()
    
    def record_user_activity(self, user_id: str):
        """
        Record activity by a user
        
        Args:
            user_id: The ID of the user with activity
        """
        # Record user activity
        if user_id not in self.active_users:
            self.active_users[user_id] = 0
        self.active_users[user_id] += 1
        
        # Update most active user
        most_active = max(self.active_users.items(), key=lambda x: x[1], default=(None, 0))
        if most_active[0]:
            self.metrics["users"]["most_active"] = most_active[0]
            self.metrics["users"]["activity"] = {
                k: v for k, v in sorted(
                    self.active_users.items(), 
                    key=lambda x: x[1], 
                    reverse=True
                )[:10]  # Keep only top 10
            }
        
        self._update_timestamp()
    
    def record_broadcast_time(self, time_ms: float):
        """
        Record the time taken for a broadcast operation
        
        Args:
            time_ms: Time in milliseconds for the broadcast
        """
        self.broadcast_times.append(time_ms)
        
        # Keep only the last 1000 times
        if len(self.broadcast_times) > 1000:
            self.broadcast_times.pop(0)
        
        # Update average
        self.metrics["performance"]["avg_broadcast_time_ms"] = sum(self.broadcast_times) / len(self.broadcast_times)
        
        self._update_timestamp()
    
    def _update_timestamp(self):
        """Update the last updated timestamp"""
        self.metrics["last_updated"] = datetime.now().isoformat()
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        Get current metrics
        
        Returns:
            Dict: Current metrics
        """
        # Always get latest connection count
        self.metrics["connections"]["total"] = connection_manager.get_total_connections_count()
        self.metrics["users"]["count"] = len(connection_manager.active_connections)
        self.metrics["rooms"]["count"] = len(connection_manager.rooms)
        
        return self.metrics
    
    def get_health_status(self) -> Dict[str, Any]:
        """
        Get health status information
        
        Returns:
            Dict: Health status
        """
        total_connections = connection_manager.get_total_connections_count()
        error_rate = 0
        if self.metrics["messages"]["sent"] > 0:
            error_rate = self.metrics["messages"]["errors"] / self.metrics["messages"]["sent"]
        
        avg_latency = self.metrics["performance"]["avg_message_latency_ms"]
        
        # Determine status
        status = "healthy"
        if error_rate > 0.1:  # More than 10% errors
            status = "degraded"
        if error_rate > 0.3:  # More than 30% errors
            status = "unhealthy"
        
        if avg_latency > 500:  # More than 500ms average latency
            status = "degraded"
        if avg_latency > 2000:  # More than 2s average latency
            status = "unhealthy"
        
        return {
            "status": status,
            "active_connections": total_connections,
            "error_rate": error_rate,
            "avg_latency_ms": avg_latency,
            "timestamp": datetime.now().isoformat()
        }

    async def get_historical_metrics(self, days: int = 7) -> List[Dict[str, Any]]:
        """
        Get historical metrics for the specified number of days
        
        Args:
            days: Number of days of data to return (default 7)
            
        Returns:
            List[Dict]: List of metric snapshots
        """
        if not self.historical_metrics:
            # If no historical data, return empty list
            return []
            
        # Calculate cutoff time
        cutoff_time = datetime.now() - timedelta(days=days)
        cutoff_str = cutoff_time.isoformat()
        
        # Filter metrics by timestamp
        filtered_metrics = [
            metric for metric in self.historical_metrics
            if metric["timestamp"] > cutoff_str
        ]
        
        return filtered_metrics

# Create a singleton instance
websocket_metrics = WebSocketMetrics()

# Patch the connection manager methods to collect metrics
original_connect = connection_manager.connect
original_disconnect = connection_manager.disconnect
original_send_personal_message = connection_manager.send_personal_message
original_broadcast = connection_manager.broadcast
original_broadcast_to_room = connection_manager.broadcast_to_room
original_join_room = connection_manager.join_room
original_trigger_event = connection_manager.trigger_event

# Patched methods
async def patched_connect(websocket: WebSocket, user_id: str) -> str:
    """Patched connect method to collect metrics"""
    connection_id = await original_connect(websocket, user_id)
    websocket_metrics.record_connection()
    websocket_metrics.record_user_activity(user_id)
    return connection_id

async def patched_disconnect(connection_id: str):
    """Patched disconnect method to collect metrics"""
    await original_disconnect(connection_id)
    websocket_metrics.record_disconnection()

async def patched_send_personal_message(message: Dict[str, Any], user_id: str) -> int:
    """Patched send_personal_message method to collect metrics"""
    start_time = time.time()
    result = await original_send_personal_message(message, user_id)
    elapsed_ms = (time.time() - start_time) * 1000
    
    message_type = message.get("type", "unknown")
    websocket_metrics.record_message_sent(message_type, elapsed_ms)
    websocket_metrics.record_user_activity(user_id)
    
    return result

async def patched_broadcast(message: Dict[str, Any]) -> tuple:
    """Patched broadcast method to collect metrics"""
    start_time = time.time()
    result = await original_broadcast(message)
    elapsed_ms = (time.time() - start_time) * 1000
    
    message_type = message.get("type", "unknown")
    websocket_metrics.record_message_sent(message_type, elapsed_ms)
    websocket_metrics.record_broadcast_time(elapsed_ms)
    
    return result

async def patched_broadcast_to_room(room_id: str, message: Dict[str, Any]) -> tuple:
    """Patched broadcast_to_room method to collect metrics"""
    start_time = time.time()
    result = await original_broadcast_to_room(room_id, message)
    elapsed_ms = (time.time() - start_time) * 1000
    
    message_type = message.get("type", "unknown")
    websocket_metrics.record_message_sent(message_type, elapsed_ms)
    websocket_metrics.record_room_activity(room_id)
    websocket_metrics.record_broadcast_time(elapsed_ms)
    
    return result

def patched_join_room(connection_id: str, room_id: str) -> bool:
    """Patched join_room method to collect metrics"""
    result = original_join_room(connection_id, room_id)
    if result:
        websocket_metrics.record_room_activity(room_id)
        if connection_id in connection_manager.connection_to_user:
            user_id = connection_manager.connection_to_user[connection_id]
            websocket_metrics.record_user_activity(user_id)
    return result

async def patched_trigger_event(event_type: str, data: Dict[str, Any]):
    """Patched trigger_event method to collect metrics"""
    try:
        await original_trigger_event(event_type, data)
        websocket_metrics.record_message_sent(event_type)
    except Exception as e:
        websocket_metrics.record_message_error(event_type, str(e))
        raise

# Apply the patches
connection_manager.connect = patched_connect
connection_manager.disconnect = patched_disconnect
connection_manager.send_personal_message = patched_send_personal_message
connection_manager.broadcast = patched_broadcast
connection_manager.broadcast_to_room = patched_broadcast_to_room
connection_manager.join_room = patched_join_room
connection_manager.trigger_event = patched_trigger_event

# Export metrics collector
__all__ = ["websocket_metrics"] 