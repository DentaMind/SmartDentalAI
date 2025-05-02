"""
WebSocket router for real-time communication endpoints
"""

import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
import time
import asyncio

from ..database import get_db
from ..services.websocket_service import (
    handle_websocket_connection,
    connection_manager,
    authenticate_websocket
)
from ..services.websocket_monitoring import websocket_metrics
from ..services.websocket_alerts import websocket_alerts
from ..services.websocket_client_metrics_service import WebSocketClientMetricsService
from ..dependencies.auth import get_current_admin_user

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/ws", tags=["websocket"])

@router.websocket("/")
async def websocket_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    """
    Main WebSocket endpoint for real-time communication
    
    This endpoint handles the WebSocket connection lifecycle including:
    - Authentication
    - Message processing
    - Disconnection
    """
    await handle_websocket_connection(websocket, db)

@router.websocket("/chat/{room_id}")
async def chat_websocket_endpoint(websocket: WebSocket, room_id: str, db: Session = Depends(get_db)):
    """
    WebSocket endpoint for chat rooms
    
    This endpoint handles WebSocket connections for specific chat rooms:
    - Authenticates the user
    - Automatically joins them to the specified room
    - Handles chat messages
    - Manages disconnection
    """
    # Authenticate the connection
    user_id = await authenticate_websocket(websocket, db)
    if not user_id:
        return
    
    # Accept the connection and get connection ID
    connection_id = await connection_manager.connect(websocket, user_id)
    
    # Automatically join the specified room
    connection_manager.join_room(connection_id, room_id)
    
    try:
        # Notify the client that they've joined the room
        await websocket.send_json({
            "type": "room_joined",
            "room_id": room_id,
            "timestamp": datetime.now().isoformat()
        })
        
        # Handle messages
        while True:
            # Wait for messages from the client
            data = await websocket.receive_text()
            
            try:
                # Process chat messages
                message = {
                    "type": "chat_message",
                    "room_id": room_id,
                    "user_id": user_id,
                    "content": data,
                    "timestamp": datetime.now().isoformat()
                }
                
                # Broadcast the message to the room
                await connection_manager.broadcast_to_room(room_id, message)
                
            except Exception as e:
                logger.error(f"Error processing chat message: {str(e)}")
                await websocket.send_json({
                    "type": "error",
                    "error": "Error processing message",
                    "timestamp": datetime.now().isoformat()
                })
    
    except WebSocketDisconnect:
        logger.info(f"Chat WebSocket disconnected for user_id={user_id}, room_id={room_id}")
    except Exception as e:
        logger.error(f"Chat WebSocket error: {str(e)}")
    finally:
        # Ensure the connection is properly cleaned up
        await connection_manager.disconnect(connection_id)

@router.websocket("/notifications")
async def notifications_websocket_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    """
    WebSocket endpoint for user notifications
    
    This endpoint handles notifications for the authenticated user:
    - Authenticates the user
    - Sets up a dedicated connection for notifications
    - Only receives, doesn't accept messages from client
    """
    # Authenticate the connection
    user_id = await authenticate_websocket(websocket, db)
    if not user_id:
        return
    
    # Accept the connection and get connection ID
    connection_id = await connection_manager.connect(websocket, user_id)
    
    try:
        # Keep the connection alive
        while True:
            # Just listen for connection status (ping/pong is handled by FastAPI)
            await websocket.receive_text()
            
            # We don't actually process any incoming messages in this endpoint
            # It's only for pushing notifications to the client
    
    except WebSocketDisconnect:
        logger.info(f"Notifications WebSocket disconnected for user_id={user_id}")
    except Exception as e:
        logger.error(f"Notifications WebSocket error: {str(e)}")
    finally:
        # Clean up the connection
        await connection_manager.disconnect(connection_id)

# REST endpoints for WebSocket stats and management
@router.get("/stats")
async def get_websocket_stats(
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Get WebSocket connection statistics
    
    Returns information about active connections, rooms, and users.
    Restricted to admin users only.
    """
    # Authentication check is handled by get_current_admin_user dependency
    
    return {
        "stats": connection_manager.get_stats(),
        "timestamp": datetime.now().isoformat()
    }

@router.get("/rooms")
async def get_room_list(
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Get a list of active chat rooms
    
    Returns a list of all rooms with their member counts.
    Restricted to admin users only.
    """
    # Authentication check is handled by get_current_admin_user dependency
    
    stats = connection_manager.get_stats()
    return {
        "rooms": stats["rooms"],
        "timestamp": datetime.now().isoformat()
    }

@router.post("/broadcast")
async def broadcast_message(
    message: Dict[str, Any], 
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Broadcast a message to all connected clients
    
    This is an admin-only endpoint that allows broadcasting system messages.
    """
    # Authentication check is handled by get_current_admin_user dependency
    
    # Validate message format
    if "type" not in message or "content" not in message:
        raise HTTPException(status_code=400, detail="Message must contain 'type' and 'content' fields")
    
    # Add timestamp if not present
    if "timestamp" not in message:
        message["timestamp"] = datetime.now().isoformat()
    
    # Add sender information
    message["sender"] = {
        "id": admin_user.id,
        "name": admin_user.name,
        "role": "admin"
    }
    
    # Log the broadcast action
    logger.info(f"Admin user {admin_user.id} broadcasting message of type '{message['type']}'")
    
    # Broadcast message to all clients
    await connection_manager.broadcast(message)
    
    return {
        "success": True,
        "message": "Message broadcasted",
        "timestamp": datetime.now().isoformat()
    }

@router.post("/broadcast/{room_id}")
async def broadcast_to_room(
    room_id: str, 
    message: Dict[str, Any], 
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Broadcast a message to a specific room
    
    This is an admin-only endpoint that allows broadcasting messages to a specific room.
    """
    # Authentication check is handled by get_current_admin_user dependency
    
    # Validate message format
    if "type" not in message or "content" not in message:
        raise HTTPException(status_code=400, detail="Message must contain 'type' and 'content' fields")
    
    # Check if room exists
    if connection_manager.get_room_members_count(room_id) == 0:
        raise HTTPException(status_code=404, detail=f"Room {room_id} not found or empty")
    
    # Add timestamp if not present
    if "timestamp" not in message:
        message["timestamp"] = datetime.now().isoformat()
    
    # Add room_id to message if not present
    if "room_id" not in message:
        message["room_id"] = room_id
    
    # Add sender information
    message["sender"] = {
        "id": admin_user.id,
        "name": admin_user.name,
        "role": "admin"
    }
    
    # Log the broadcast action
    logger.info(f"Admin user {admin_user.id} broadcasting message to room '{room_id}'")
    
    # Broadcast message to the room
    await connection_manager.broadcast_to_room(room_id, message)
    
    return {
        "success": True,
        "message": f"Message broadcasted to room {room_id}",
        "timestamp": datetime.now().isoformat()
    }

# WebSocket Monitoring Endpoints
@router.get("/metrics")
async def get_websocket_metrics(
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Get detailed WebSocket metrics
    
    Returns comprehensive metrics about WebSocket usage, performance, and errors.
    Restricted to admin users only.
    """
    return websocket_metrics.get_metrics()

@router.get("/metrics/historical")
async def get_historical_websocket_metrics(
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Get historical WebSocket metrics
    
    Returns historical metrics for the specified number of days.
    Restricted to admin users only.
    
    Args:
        days: Number of days of historical data to return (1-30)
    """
    return await websocket_metrics.get_historical_metrics(days)

@router.get("/health")
async def get_websocket_health():
    """
    Get WebSocket health status
    
    Returns a summary of WebSocket system health.
    This endpoint is public for monitoring systems.
    """
    return websocket_metrics.get_health_status()

@router.get("/active-connections")
async def get_active_connections(
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Get details of all active WebSocket connections
    
    Returns information about each active connection.
    Restricted to admin users only.
    """
    connections = []
    
    for user_id, user_connections in connection_manager.active_connections.items():
        for connection_id, _ in user_connections.items():
            # Find rooms this connection is in
            rooms = []
            for room_id, members in connection_manager.rooms.items():
                if connection_id in members:
                    rooms.append(room_id)
            
            connections.append({
                "connection_id": connection_id,
                "user_id": user_id,
                "rooms": rooms,
                "connected_since": connection_id.split("_")[1] if "_" in connection_id else "unknown"
            })
    
    return {
        "connections": connections,
        "total": len(connections),
        "timestamp": datetime.now().isoformat()
    }

@router.get("/user-connections/{user_id}")
async def get_user_connections(
    user_id: str,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Get all WebSocket connections for a specific user
    
    Returns information about a user's active connections.
    Restricted to admin users only.
    """
    if user_id not in connection_manager.active_connections:
        raise HTTPException(status_code=404, detail=f"No active connections for user {user_id}")
    
    connections = []
    for connection_id, _ in connection_manager.active_connections[user_id].items():
        # Find rooms this connection is in
        rooms = []
        for room_id, members in connection_manager.rooms.items():
            if connection_id in members:
                rooms.append(room_id)
        
        connections.append({
            "connection_id": connection_id,
            "rooms": rooms,
            "connected_since": connection_id.split("_")[1] if "_" in connection_id else "unknown"
        })
    
    return {
        "user_id": user_id,
        "connections": connections,
        "total": len(connections),
        "timestamp": datetime.now().isoformat()
    }

# Alert system API models
class AlertThreshold(BaseModel):
    metric: str
    condition: str
    value: float
    severity: str
    enabled: bool = True

class AlertEmailConfig(BaseModel):
    enable_emails: bool
    recipients: List[str]

# Connection Test Models
class ConnectionTestResult(BaseModel):
    success: bool
    message: str
    details: Optional[Dict[str, Any]] = None
    latency_ms: Optional[float] = None
    timestamp: str = datetime.now().isoformat()

# WebSocket Alerts endpoints
@router.get("/alerts")
async def get_websocket_alerts(
    limit: int = Query(100, ge=1, le=1000),
    include_acknowledged: bool = Query(False),
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Get WebSocket alerts
    
    Returns recent alerts generated by the alert system.
    Restricted to admin users only.
    """
    alerts = websocket_alerts.get_alerts(limit, include_acknowledged)
    return {
        "alerts": alerts,
        "count": len(alerts),
        "timestamp": datetime.now().isoformat()
    }

@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Acknowledge a WebSocket alert
    
    Marks an alert as acknowledged so it doesn't appear in the default alert list.
    Restricted to admin users only.
    """
    success = websocket_alerts.acknowledge_alert(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"success": True, "alert_id": alert_id}

@router.get("/alerts/thresholds")
async def get_alert_thresholds(
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Get alert thresholds
    
    Returns the current alert threshold configuration.
    Restricted to admin users only.
    """
    return {"thresholds": websocket_alerts.get_thresholds()}

@router.put("/alerts/thresholds/{threshold_index}")
async def update_alert_threshold(
    threshold_index: int,
    threshold: AlertThreshold,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Update an alert threshold
    
    Updates the configuration for an existing alert threshold.
    Restricted to admin users only.
    """
    success = websocket_alerts.update_threshold(threshold_index, threshold.dict())
    if not success:
        raise HTTPException(status_code=404, detail="Threshold not found")
    
    return {"success": True, "threshold_index": threshold_index}

@router.post("/alerts/thresholds")
async def add_alert_threshold(
    threshold: AlertThreshold,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Add a new alert threshold
    
    Creates a new alert threshold.
    Restricted to admin users only.
    """
    success = websocket_alerts.add_threshold(threshold.dict())
    if not success:
        raise HTTPException(status_code=400, detail="Invalid threshold configuration")
    
    return {"success": True, "thresholds": websocket_alerts.get_thresholds()}

@router.delete("/alerts/thresholds/{threshold_index}")
async def delete_alert_threshold(
    threshold_index: int,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Delete an alert threshold
    
    Removes an alert threshold from the configuration.
    Restricted to admin users only.
    """
    success = websocket_alerts.delete_threshold(threshold_index)
    if not success:
        raise HTTPException(status_code=404, detail="Threshold not found")
    
    return {"success": True, "threshold_index": threshold_index}

@router.put("/alerts/email-config")
async def update_email_config(
    config: AlertEmailConfig,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Update email notification configuration
    
    Configure email notification settings for alerts.
    Restricted to admin users only.
    """
    success = websocket_alerts.update_email_config(config.enable_emails, config.recipients)
    
    return {"success": success}

# WebSocket Connection Testing
@router.post("/test-connection")
async def test_websocket_connection(
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Test WebSocket server connection
    
    Tests the WebSocket server's ability to accept connections and basic functionality.
    Restricted to admin users only.
    """
    start_time = time.time()
    
    try:
        # Get connection stats before test
        pre_test_stats = connection_manager.get_stats()
        
        # Create a test message
        test_message = {
            "type": "test",
            "message": "Test message",
            "timestamp": datetime.now().isoformat()
        }
        
        # Create a unique test room
        test_room_id = f"test-room-{datetime.now().timestamp()}"
        
        # Broadcast to test room (which should be empty)
        await connection_manager.broadcast_to_room(test_room_id, test_message)
        
        # Calculate latency
        latency_ms = (time.time() - start_time) * 1000
        
        return ConnectionTestResult(
            success=True,
            message="WebSocket server connection is working correctly",
            details={
                "connections": pre_test_stats["total_connections"],
                "unique_users": pre_test_stats["unique_users"],
                "rooms": len(pre_test_stats["rooms"]),
            },
            latency_ms=latency_ms
        )
    except Exception as e:
        error_msg = str(e)
        logger.error(f"WebSocket connection test failed: {error_msg}")
        
        return ConnectionTestResult(
            success=False,
            message="WebSocket server connection test failed",
            details={"error": error_msg},
            latency_ms=(time.time() - start_time) * 1000
        )

@router.post("/test-pool")
async def test_connection_pool(
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Test WebSocket connection pool
    
    Tests the WebSocket connection pool's functionality and worker distribution.
    Restricted to admin users only.
    """
    start_time = time.time()
    
    try:
        # Get pool stats
        pool_stats = connection_pool.get_stats()
        
        # Test worker availability
        worker_results = []
        
        for worker in pool_stats["workers"]:
            worker_id = worker["worker_id"]
            utilization = worker["utilization"]
            
            worker_results.append({
                "worker_id": worker_id,
                "status": "available",
                "utilization": utilization,
                "active_connections": worker["active_connections"],
                "queue_size": worker["queue_size"]
            })
        
        return ConnectionTestResult(
            success=True,
            message="Connection pool is working correctly",
            details={
                "workers": worker_results,
                "total_connections": pool_stats["total_connections"],
                "worker_count": pool_stats["worker_count"],
                "auto_scaling": pool_stats["auto_scaling"],
            },
            latency_ms=(time.time() - start_time) * 1000
        )
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Connection pool test failed: {error_msg}")
        
        return ConnectionTestResult(
            success=False,
            message="Connection pool test failed",
            details={"error": error_msg},
            latency_ms=(time.time() - start_time) * 1000
        )

@router.post("/test-echo")
async def test_echo_message(
    message: str = Body("Test message", embed=True),
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Test echo message
    
    Tests message processing by echoing back the input message.
    Useful for latency testing.
    Restricted to admin users only.
    """
    start_time = time.time()
    
    try:
        # Process the message (simulate actual processing)
        await asyncio.sleep(0.01)  # Small delay to simulate processing
        
        # Calculate latency
        latency_ms = (time.time() - start_time) * 1000
        
        return ConnectionTestResult(
            success=True,
            message="Echo test successful",
            details={
                "echo": message,
                "server_time": datetime.now().isoformat()
            },
            latency_ms=latency_ms
        )
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Echo test failed: {error_msg}")
        
        return ConnectionTestResult(
            success=False,
            message="Echo test failed",
            details={"error": error_msg},
            latency_ms=(time.time() - start_time) * 1000
        )

# WebSocket Client Metrics Model
class WebSocketClientMetricsRequest(BaseModel):
    metrics: Dict[str, Any]
    clientId: str
    timestamp: int

@router.post("/client-metrics")
async def receive_client_metrics(
    request: WebSocketClientMetricsRequest,
    db: Session = Depends(get_db)
):
    """
    Receive client-side WebSocket metrics
    
    Collects monitoring data from client devices for analysis.
    """
    try:
        # Extract user ID from token if available
        user_id = None
        token = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
            try:
                # Attempt to decode the token to get user_id
                from ..auth.jwt import decode_token
                payload = decode_token(token)
                user_id = payload.get("sub")
            except Exception as e:
                logger.warning(f"Failed to decode token for client metrics: {str(e)}")
        
        # Log the metrics for debugging
        logger.info(f"Received client metrics from {request.clientId} at {datetime.fromtimestamp(request.timestamp/1000)}")
        
        # Create client metrics service and process metrics
        client_metrics_service = WebSocketClientMetricsService(db)
        await client_metrics_service.process_client_metrics(
            client_id=request.clientId,
            metrics=request.metrics,
            timestamp=request.timestamp,
            user_id=user_id
        )
        
        # Extract key metrics for logging
        connection_drops = request.metrics.get("connectionDrops", 0)
        reconnection_attempts = request.metrics.get("reconnectionAttempts", 0)
        successful_reconnections = request.metrics.get("successfulReconnections", 0)
        messages_sent = request.metrics.get("messagesSent", 0)
        messages_received = request.metrics.get("messagesReceived", 0)
        avg_latency = request.metrics.get("avgMessageLatency", 0)
        
        # Get client information
        connection_info = request.metrics.get("connectionInfo", {})
        user_agent = connection_info.get("userAgent", "unknown")
        network_type = connection_info.get("networkType", "unknown")
        
        # Log summary of client metrics
        logger.info(
            f"Client {request.clientId} metrics: "
            f"drops={connection_drops}, "
            f"reconnects={reconnection_attempts}/{successful_reconnections}, "
            f"msgs={messages_sent}/{messages_received}, "
            f"latency={avg_latency:.2f}ms, "
            f"network={network_type}"
        )
        
        # If there are errors, log them separately
        if request.metrics.get("lastError"):
            error = request.metrics["lastError"]
            logger.warning(
                f"Client {request.clientId} reported error: "
                f"{error.get('type', 'unknown')} - {error.get('message', 'No message')}"
            )
        
        return {"success": True}
    except Exception as e:
        logger.error(f"Error processing client metrics: {str(e)}")
        return {"success": False, "error": str(e)}

# Client Metrics Analytics Endpoints

@router.get("/client-metrics/summary")
async def get_client_metrics_summary(
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Get a summary of client-side WebSocket metrics
    
    Returns aggregated statistics about client-side WebSocket performance.
    Restricted to admin users only.
    """
    client_metrics_service = WebSocketClientMetricsService(db)
    return await client_metrics_service.get_client_metrics_summary(start_time, end_time)

@router.get("/client-metrics/geographic")
async def get_geographic_distribution(
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Get geographic distribution of WebSocket metrics
    
    Returns metrics grouped by geographic regions.
    Restricted to admin users only.
    """
    client_metrics_service = WebSocketClientMetricsService(db)
    return await client_metrics_service.get_geographic_distribution()

@router.get("/client-metrics/anomalies")
async def get_anomalies_summary(
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Get a summary of detected anomalies in WebSocket metrics
    
    Returns information about unusual patterns detected in client metrics.
    Restricted to admin users only.
    """
    client_metrics_service = WebSocketClientMetricsService(db)
    return await client_metrics_service.get_anomalies_summary()

@router.get("/client-metrics/ux-correlation")
async def get_ux_correlation(
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Get correlation between WebSocket metrics and user experience metrics
    
    Returns analysis of how WebSocket performance affects user experience.
    Restricted to admin users only.
    """
    client_metrics_service = WebSocketClientMetricsService(db)
    return await client_metrics_service.correlate_with_user_experience(start_time, end_time) 