"""
WebSocket Connection Pool Service

This module provides connection pooling for WebSocket connections,
improving resource usage and scalability for high-traffic scenarios.
"""

import logging
import asyncio
import time
from typing import Dict, Set, List, Any, Optional, Callable
from fastapi import WebSocket
from datetime import datetime

from ..config.settings import settings

# Configure logging
logger = logging.getLogger(__name__)

class WebSocketWorker:
    """
    Worker for handling a group of WebSocket connections
    
    Each worker manages a fixed number of connections to distribute load
    and improve performance under high concurrency.
    """
    
    def __init__(self, worker_id: str, max_connections: int = 500):
        """
        Initialize a WebSocket worker
        
        Args:
            worker_id: Identifier for this worker
            max_connections: Maximum number of connections this worker should handle
        """
        self.worker_id = worker_id
        self.max_connections = max_connections
        self.connections: Dict[str, WebSocket] = {}
        self.loop = asyncio.get_event_loop()
        self.message_queue: asyncio.Queue = asyncio.Queue()
        self.is_running = False
        self.stats = {
            "messages_processed": 0,
            "broadcast_count": 0,
            "connection_count": 0,
            "max_connections_reached": 0,
            "start_time": datetime.now().isoformat()
        }
        
        logger.info(f"WebSocket worker {worker_id} initialized with capacity for {max_connections} connections")
    
    async def start(self):
        """Start the worker's message processing loop"""
        if self.is_running:
            return
            
        self.is_running = True
        asyncio.create_task(self._process_message_queue())
        logger.info(f"WebSocket worker {self.worker_id} started")
    
    async def stop(self):
        """Stop the worker's message processing loop"""
        self.is_running = False
        logger.info(f"WebSocket worker {self.worker_id} stopped")
    
    async def add_connection(self, connection_id: str, websocket: WebSocket) -> bool:
        """
        Add a WebSocket connection to this worker
        
        Args:
            connection_id: Unique ID for the connection
            websocket: The WebSocket connection object
        
        Returns:
            bool: True if the connection was added, False if the worker is full
        """
        if len(self.connections) >= self.max_connections:
            self.stats["max_connections_reached"] += 1
            return False
        
        self.connections[connection_id] = websocket
        self.stats["connection_count"] = len(self.connections)
        return True
    
    async def remove_connection(self, connection_id: str):
        """
        Remove a WebSocket connection from this worker
        
        Args:
            connection_id: Unique ID for the connection to remove
        """
        if connection_id in self.connections:
            del self.connections[connection_id]
            self.stats["connection_count"] = len(self.connections)
    
    async def broadcast(self, message: Any, exclude: Optional[Set[str]] = None):
        """
        Broadcast a message to all connections in this worker
        
        Args:
            message: The message to broadcast
            exclude: Set of connection IDs to exclude from the broadcast
        """
        await self.message_queue.put({
            "type": "broadcast",
            "message": message,
            "exclude": exclude or set()
        })
        self.stats["broadcast_count"] += 1
    
    async def send_to_connection(self, connection_id: str, message: Any):
        """
        Send a message to a specific connection
        
        Args:
            connection_id: Unique ID for the connection
            message: The message to send
        """
        if connection_id not in self.connections:
            return False
            
        await self.message_queue.put({
            "type": "send",
            "connection_id": connection_id,
            "message": message
        })
        return True
    
    async def _process_message_queue(self):
        """Process messages in the queue and send them to connections"""
        while self.is_running:
            try:
                task = await self.message_queue.get()
                
                if task["type"] == "broadcast":
                    await self._handle_broadcast(task["message"], task["exclude"])
                elif task["type"] == "send":
                    await self._handle_send(task["connection_id"], task["message"])
                
                self.message_queue.task_done()
                self.stats["messages_processed"] += 1
            except Exception as e:
                logger.error(f"Error processing WebSocket message in worker {self.worker_id}: {e}")
    
    async def _handle_broadcast(self, message: Any, exclude: Set[str]):
        """
        Handle a broadcast message task
        
        Args:
            message: The message to broadcast
            exclude: Set of connection IDs to exclude
        """
        disconnected = set()
        
        for connection_id, websocket in self.connections.items():
            if connection_id in exclude:
                continue
                
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to connection {connection_id}: {e}")
                disconnected.add(connection_id)
        
        # Remove disconnected connections
        for connection_id in disconnected:
            await self.remove_connection(connection_id)
    
    async def _handle_send(self, connection_id: str, message: Any):
        """
        Handle a direct send message task
        
        Args:
            connection_id: The connection to send to
            message: The message to send
        """
        if connection_id not in self.connections:
            return
            
        try:
            await self.connections[connection_id].send_json(message)
        except Exception as e:
            logger.error(f"Error sending to connection {connection_id}: {e}")
            await self.remove_connection(connection_id)
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get worker statistics
        
        Returns:
            Dict: Worker stats
        """
        return {
            "worker_id": self.worker_id,
            "active_connections": len(self.connections),
            "capacity": self.max_connections,
            "utilization": len(self.connections) / self.max_connections if self.max_connections > 0 else 0,
            "queue_size": self.message_queue.qsize(),
            **self.stats
        }


class ConnectionPool:
    """
    Pool of WebSocket workers for distributing connection load
    """
    
    def __init__(self, 
                 worker_count: int = 4, 
                 connections_per_worker: int = 500,
                 auto_scale: bool = True,
                 max_workers: int = 16):
        """
        Initialize the connection pool
        
        Args:
            worker_count: Initial number of workers
            connections_per_worker: Maximum connections per worker
            auto_scale: Whether to automatically scale workers
            max_workers: Maximum number of workers if auto-scaling
        """
        self.workers: List[WebSocketWorker] = []
        self.connection_to_worker: Dict[str, str] = {}
        self.connections_per_worker = connections_per_worker
        self.auto_scale = auto_scale
        self.max_workers = max_workers
        
        # Initialize initial workers
        for i in range(worker_count):
            self.add_worker()
        
        logger.info(f"WebSocket connection pool initialized with {worker_count} workers")
    
    def add_worker(self) -> WebSocketWorker:
        """
        Add a new worker to the pool
        
        Returns:
            WebSocketWorker: The new worker
        """
        worker_id = f"worker-{len(self.workers) + 1}"
        worker = WebSocketWorker(worker_id, self.connections_per_worker)
        self.workers.append(worker)
        
        # Start the worker asynchronously
        asyncio.create_task(worker.start())
        
        logger.info(f"Added new WebSocket worker {worker_id} to pool (total: {len(self.workers)})")
        return worker
    
    async def get_worker_for_connection(self, connection_id: str) -> WebSocketWorker:
        """
        Get the least loaded worker or create a new one if needed
        
        Args:
            connection_id: The ID of the connection to place
            
        Returns:
            WebSocketWorker: The selected worker
        """
        # If connection already assigned, return that worker
        if connection_id in self.connection_to_worker:
            worker_id = self.connection_to_worker[connection_id]
            for worker in self.workers:
                if worker.worker_id == worker_id:
                    return worker
        
        # Find the least loaded worker
        least_loaded = None
        min_connections = float('inf')
        
        for worker in self.workers:
            connection_count = len(worker.connections)
            if connection_count < min_connections:
                min_connections = connection_count
                least_loaded = worker
        
        # If all workers are at capacity and auto-scaling is enabled, add a new worker
        if (least_loaded is None or min_connections >= self.connections_per_worker) and self.auto_scale:
            if len(self.workers) < self.max_workers:
                least_loaded = self.add_worker()
            else:
                logger.warning("Maximum worker count reached, can't scale further")
        
        return least_loaded
    
    async def add_connection(self, connection_id: str, websocket: WebSocket) -> bool:
        """
        Add a connection to the pool
        
        Args:
            connection_id: Unique ID for the connection
            websocket: The WebSocket connection
            
        Returns:
            bool: True if the connection was added successfully
        """
        worker = await self.get_worker_for_connection(connection_id)
        if worker is None:
            logger.error(f"Could not find a worker for connection {connection_id}")
            return False
        
        success = await worker.add_connection(connection_id, websocket)
        if success:
            self.connection_to_worker[connection_id] = worker.worker_id
        
        return success
    
    async def remove_connection(self, connection_id: str):
        """
        Remove a connection from the pool
        
        Args:
            connection_id: Unique ID for the connection
        """
        if connection_id in self.connection_to_worker:
            worker_id = self.connection_to_worker[connection_id]
            for worker in self.workers:
                if worker.worker_id == worker_id:
                    await worker.remove_connection(connection_id)
                    break
            
            del self.connection_to_worker[connection_id]
    
    async def broadcast(self, message: Any, exclude: Optional[Set[str]] = None):
        """
        Broadcast a message to all connections in the pool
        
        Args:
            message: The message to broadcast
            exclude: Optional set of connection IDs to exclude
        """
        exclude = exclude or set()
        
        # Distribute the broadcast to all workers
        tasks = []
        for worker in self.workers:
            tasks.append(worker.broadcast(message, exclude))
        
        # Wait for all broadcasts to complete
        if tasks:
            await asyncio.gather(*tasks)
    
    async def send_to_connection(self, connection_id: str, message: Any) -> bool:
        """
        Send a message to a specific connection
        
        Args:
            connection_id: The connection to send to
            message: The message to send
            
        Returns:
            bool: True if the message was sent successfully
        """
        if connection_id not in self.connection_to_worker:
            return False
        
        worker_id = self.connection_to_worker[connection_id]
        for worker in self.workers:
            if worker.worker_id == worker_id:
                return await worker.send_to_connection(connection_id, message)
        
        return False
    
    async def send_to_connections(self, connection_ids: List[str], message: Any) -> (int, int):
        """
        Send a message to multiple connections
        
        Args:
            connection_ids: List of connection IDs to send to
            message: The message to send
            
        Returns:
            tuple: (successful sends, failed sends)
        """
        success_count = 0
        fail_count = 0
        
        # Group connections by worker for efficiency
        worker_connections: Dict[str, List[str]] = {}
        
        for connection_id in connection_ids:
            if connection_id in self.connection_to_worker:
                worker_id = self.connection_to_worker[connection_id]
                if worker_id not in worker_connections:
                    worker_connections[worker_id] = []
                worker_connections[worker_id].append(connection_id)
            else:
                fail_count += 1
        
        # Send to each worker's connections
        for worker_id, conn_ids in worker_connections.items():
            for worker in self.workers:
                if worker.worker_id == worker_id:
                    for conn_id in conn_ids:
                        result = await worker.send_to_connection(conn_id, message)
                        if result:
                            success_count += 1
                        else:
                            fail_count += 1
        
        return success_count, fail_count
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get statistics for the connection pool
        
        Returns:
            Dict: Pool statistics
        """
        total_connections = 0
        total_capacity = 0
        worker_stats = []
        
        for worker in self.workers:
            stats = worker.get_stats()
            total_connections += stats["active_connections"]
            total_capacity += stats["capacity"]
            worker_stats.append(stats)
        
        return {
            "worker_count": len(self.workers),
            "auto_scaling": self.auto_scale,
            "total_connections": total_connections,
            "max_capacity": total_capacity,
            "utilization": total_connections / total_capacity if total_capacity > 0 else 0,
            "workers": worker_stats,
            "timestamp": datetime.now().isoformat()
        }


# Create singleton pool instance
pool_size = getattr(settings, "WEBSOCKET_WORKER_COUNT", 4)
connections_per_worker = getattr(settings, "WEBSOCKET_CONNECTIONS_PER_WORKER", 500)
auto_scale = getattr(settings, "WEBSOCKET_AUTO_SCALING", True)
max_workers = getattr(settings, "WEBSOCKET_MAX_WORKERS", 16)

connection_pool = ConnectionPool(
    worker_count=pool_size,
    connections_per_worker=connections_per_worker,
    auto_scale=auto_scale,
    max_workers=max_workers
)

# Exports
__all__ = ["connection_pool"] 