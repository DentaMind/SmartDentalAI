"""
WebSocket service for real-time communication in DentaMind

This module provides WebSocket functionality for real-time updates, notifications,
and chat features across the DentaMind platform.
"""

import json
import logging
import asyncio
from typing import Dict, List, Any, Optional, Set, Callable, Tuple
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect, status, Depends
from jose import JWTError, jwt
from enum import Enum

from ..config.settings import settings
from ..database import get_db
from sqlalchemy.orm import Session
from .websocket_connection_pool import connection_pool

# Configure logging
logger = logging.getLogger(__name__)

# Custom exception classes for better error handling
class WebSocketError(Exception):
    """Base exception for WebSocket errors"""
    def __init__(self, message: str, code: int = status.WS_1011_INTERNAL_ERROR):
        self.message = message
        self.code = code
        super().__init__(message)


class AuthenticationError(WebSocketError):
    """Exception raised for authentication failures"""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status.WS_1008_POLICY_VIOLATION)


class RateLimitError(WebSocketError):
    """Exception raised when message rate limits are exceeded"""
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, status.WS_1008_POLICY_VIOLATION)


class MessageTooLargeError(WebSocketError):
    """Exception raised when message size exceeds limit"""
    def __init__(self, message: str = "Message too large"):
        super().__init__(message, status.WS_1009_MESSAGE_TOO_BIG)


class InvalidMessageError(WebSocketError):
    """Exception raised for invalid message format"""
    def __init__(self, message: str = "Invalid message format"):
        super().__init__(message, status.WS_1007_INVALID_DATA)


class ConnectionManager:
    """
    WebSocket connection manager for handling client connections.
    
    This class manages WebSocket connections, including authentication,
    message broadcasting, and connection tracking.
    """
    
    def __init__(self):
        """Initialize the connection manager"""
        # Active connections by user_id and connection_id
        self.active_connections: Dict[str, Dict[str, str]] = {}
        # Connection to user mapping
        self.connection_to_user: Dict[str, str] = {}
        # Room memberships
        self.rooms: Dict[str, Set[str]] = {}
        # Event listeners
        self.event_listeners: Dict[str, List[Callable]] = {}
        # Message rate limiting
        self.message_counts: Dict[str, List[float]] = {}
        # Maximum message size (100KB)
        self.max_message_size = 100 * 1024
        # Maximum messages per minute per user
        self.max_messages_per_minute = 60
        
        logger.info("WebSocket connection manager initialized")
    
    async def connect(self, websocket: WebSocket, user_id: str) -> str:
        """
        Accept a WebSocket connection and register it with a user ID
        
        Args:
            websocket: The WebSocket connection
            user_id: The ID of the authenticated user
            
        Returns:
            connection_id: A unique ID for this connection
        """
        await websocket.accept()
        
        # Generate a unique connection ID
        connection_id = f"{user_id}_{datetime.now().timestamp()}"
        
        # Add to connection pool
        success = await connection_pool.add_connection(connection_id, websocket)
        if not success:
            logger.error(f"Failed to add connection {connection_id} to pool")
            await websocket.close(code=status.WS_1013_TRY_AGAIN_LATER, reason="Server connection pool is full")
            return ""
        
        # Initialize user's connections dictionary if not exists
        if user_id not in self.active_connections:
            self.active_connections[user_id] = {}
        
        # Store the connection
        self.active_connections[user_id][connection_id] = connection_id
        self.connection_to_user[connection_id] = user_id
        
        # Initialize rate limiting
        self.message_counts[connection_id] = []
        
        logger.info(f"New WebSocket connection: user_id={user_id}, connection_id={connection_id}")
        
        # Notify about the new connection
        await self.broadcast_to_admin({
            "type": "connection_update",
            "event": "connected",
            "user_id": user_id,
            "connection_id": connection_id,
            "timestamp": datetime.now().isoformat()
        })
        
        return connection_id
    
    async def disconnect(self, connection_id: str):
        """
        Handle a WebSocket disconnection
        
        Args:
            connection_id: The unique connection ID to disconnect
        """
        if connection_id in self.connection_to_user:
            user_id = self.connection_to_user[connection_id]
            
            # Remove from active connections
            if user_id in self.active_connections:
                if connection_id in self.active_connections[user_id]:
                    del self.active_connections[user_id][connection_id]
                
                # Remove user entry if no more connections
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
            
            # Remove from connection to user mapping
            del self.connection_to_user[connection_id]
            
            # Remove from connection pool
            await connection_pool.remove_connection(connection_id)
            
            # Remove from rooms
            for room_id, members in list(self.rooms.items()):
                if connection_id in members:
                    members.remove(connection_id)
                
                # Remove room if empty
                if not members:
                    del self.rooms[room_id]
            
            # Remove rate limiting data
            if connection_id in self.message_counts:
                del self.message_counts[connection_id]
            
            logger.info(f"WebSocket disconnected: user_id={user_id}, connection_id={connection_id}")
            
            # Notify about the disconnection
            try:
                await self.broadcast_to_admin({
                    "type": "connection_update",
                    "event": "disconnected",
                    "user_id": user_id,
                    "connection_id": connection_id,
                    "timestamp": datetime.now().isoformat()
                })
            except Exception as e:
                logger.error(f"Error broadcasting disconnect event: {str(e)}")
    
    def check_rate_limit(self, connection_id: str) -> bool:
        """
        Check if a connection has exceeded its message rate limit
        
        Args:
            connection_id: The connection ID to check
            
        Returns:
            bool: True if within rate limit, False if exceeded
            
        Raises:
            RateLimitError: If rate limit is exceeded
        """
        now = datetime.now().timestamp()
        
        # Initialize if needed
        if connection_id not in self.message_counts:
            self.message_counts[connection_id] = []
        
        # Remove messages older than 1 minute
        self.message_counts[connection_id] = [
            timestamp for timestamp in self.message_counts[connection_id]
            if now - timestamp < 60
        ]
        
        # Check if rate limit exceeded
        if len(self.message_counts[connection_id]) >= self.max_messages_per_minute:
            logger.warning(f"Rate limit exceeded for connection {connection_id}")
            raise RateLimitError(f"Message rate limit of {self.max_messages_per_minute} per minute exceeded")
        
        # Record this message
        self.message_counts[connection_id].append(now)
        return True
    
    def validate_message_size(self, message: str) -> bool:
        """
        Validate that a message isn't too large
        
        Args:
            message: The message to validate
            
        Returns:
            bool: True if valid size
            
        Raises:
            MessageTooLargeError: If message exceeds size limit
        """
        if len(message.encode('utf-8')) > self.max_message_size:
            logger.warning(f"Message too large: {len(message.encode('utf-8'))} bytes")
            raise MessageTooLargeError(f"Message exceeds maximum size of {self.max_message_size} bytes")
        
        return True
    
    async def validate_json_message(self, message: str) -> Dict[str, Any]:
        """
        Validate JSON message format
        
        Args:
            message: The message string to validate and parse
            
        Returns:
            Dict: The parsed JSON message
            
        Raises:
            InvalidMessageError: If message is not valid JSON
        """
        try:
            parsed = json.loads(message)
            if not isinstance(parsed, dict):
                raise InvalidMessageError("Message must be a JSON object")
            return parsed
        except json.JSONDecodeError:
            logger.warning(f"Invalid JSON message received")
            raise InvalidMessageError("Invalid JSON format")
        
    async def send_personal_message(self, message: Dict[str, Any], user_id: str) -> int:
        """
        Send a message to all connections of a specific user
        
        Args:
            message: The message to send
            user_id: The user ID to send the message to
            
        Returns:
            int: Number of connections the message was sent to
        """
        if user_id not in self.active_connections:
            return 0
            
        connection_ids = list(self.active_connections[user_id].keys())
        success_count, _ = await connection_pool.send_to_connections(connection_ids, message)
        return success_count
    
    async def broadcast(self, message: Dict[str, Any]) -> Tuple[int, int]:
        """
        Broadcast a message to all connected clients
        
        Args:
            message: The message to broadcast
            
        Returns:
            Tuple[int, int]: Count of (successful deliveries, failed deliveries)
        """
        # Use connection pool to broadcast to all connections
        exclude_set = set()
        await connection_pool.broadcast(message, exclude_set)
        
        # Return an estimate based on active connections
        total_connections = self.get_total_connections_count()
        return (total_connections, 0)  # We don't know exact failures here
    
    async def broadcast_to_room(self, room_id: str, message: Dict[str, Any]) -> Tuple[int, int]:
        """
        Broadcast a message to all clients in a room
        
        Args:
            room_id: The ID of the room to broadcast to
            message: The message to broadcast
            
        Returns:
            Tuple[int, int]: Count of (successful deliveries, failed deliveries)
        """
        if room_id not in self.rooms:
            logger.warning(f"Attempted to broadcast to non-existent room: {room_id}")
            return (0, 0)
        
        # Get all connection IDs in the room
        connection_ids = list(self.rooms[room_id])
        
        # Send to all connections in the room
        success_count, fail_count = await connection_pool.send_to_connections(connection_ids, message)
        
        logger.info(f"Message broadcasted to room {room_id} with {success_count} successes and {fail_count} failures")
        return (success_count, fail_count)
    
    async def broadcast_to_admin(self, message: Dict[str, Any]) -> Tuple[int, int]:
        """
        Broadcast a message to all admin users
        
        Args:
            message: The message to broadcast
            
        Returns:
            Tuple[int, int]: Count of (successful deliveries, failed deliveries)
        """
        # In a real implementation, you would look up users with admin role
        # For now, we're using a simple approach for demonstration
        admin_room = "admin_room"
        return await self.broadcast_to_room(admin_room, message)
    
    def join_room(self, connection_id: str, room_id: str) -> bool:
        """
        Add a connection to a room
        
        Args:
            connection_id: The connection ID to add
            room_id: The room ID to join
            
        Returns:
            bool: True if successful, False otherwise
        """
        if connection_id not in self.connection_to_user:
            logger.warning(f"Attempted to add non-existent connection {connection_id} to room {room_id}")
            return False
        
        # Initialize room if it doesn't exist
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        
        # Add connection to room
        self.rooms[room_id].add(connection_id)
        
        logger.info(f"Connection {connection_id} joined room {room_id}")
        return True
    
    def leave_room(self, connection_id: str, room_id: str) -> bool:
        """
        Remove a connection from a room
        
        Args:
            connection_id: The connection ID to remove
            room_id: The room ID to leave
            
        Returns:
            bool: True if successful, False otherwise
        """
        if room_id not in self.rooms:
            logger.warning(f"Attempted to leave non-existent room: {room_id}")
            return False
        
        if connection_id in self.rooms[room_id]:
            self.rooms[room_id].remove(connection_id)
            logger.info(f"Connection {connection_id} left room {room_id}")
            
            # Remove room if empty
            if not self.rooms[room_id]:
                del self.rooms[room_id]
                logger.info(f"Room {room_id} removed (empty)")
            
            return True
        
        return False
    
    def register_event_listener(self, event_type: str, callback: Callable):
        """
        Register a callback for a specific event type
        
        Args:
            event_type: The event type to listen for
            callback: The callback function to execute when the event is fired
        """
        if event_type not in self.event_listeners:
            self.event_listeners[event_type] = []
        
        self.event_listeners[event_type].append(callback)
        logger.info(f"Event listener registered for event type: {event_type}")
    
    async def trigger_event(self, event_type: str, data: Dict[str, Any]):
        """
        Trigger callbacks for a specific event type
        
        Args:
            event_type: The event type to trigger
            data: The event data
        """
        if event_type in self.event_listeners:
            for callback in self.event_listeners[event_type]:
                try:
                    await callback(data)
                except Exception as e:
                    logger.error(f"Error in event listener callback for event {event_type}: {str(e)}")
        
        logger.debug(f"Event triggered: {event_type}")
    
    def get_user_connections_count(self, user_id: str) -> int:
        """
        Get the number of active connections for a user
        
        Args:
            user_id: The user ID to check
            
        Returns:
            int: The number of active connections
        """
        if user_id in self.active_connections:
            return len(self.active_connections[user_id])
        return 0
    
    def get_room_members_count(self, room_id: str) -> int:
        """
        Get the number of connections in a room
        
        Args:
            room_id: The room ID to check
            
        Returns:
            int: The number of connections in the room
        """
        if room_id in self.rooms:
            return len(self.rooms[room_id])
        return 0
    
    def get_total_connections_count(self) -> int:
        """
        Get the total number of active connections
        
        Returns:
            int: The total number of active connections
        """
        return sum(len(connections) for connections in self.active_connections.values())
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get connection statistics
        
        Returns:
            Dict: Connection statistics
        """
        rooms_data = {}
        for room_id, members in self.rooms.items():
            # Get member user IDs
            member_users = set()
            for conn_id in members:
                if conn_id in self.connection_to_user:
                    member_users.add(self.connection_to_user[conn_id])
            
            rooms_data[room_id] = {
                "connections": len(members),
                "unique_users": len(member_users)
            }
        
        # Get pool stats
        pool_stats = connection_pool.get_stats()
        
        return {
            "total_connections": self.get_total_connections_count(),
            "unique_users": len(self.active_connections),
            "rooms": rooms_data,
            "timestamp": datetime.now().isoformat(),
            "pool": pool_stats
        }


# Create a singleton instance
connection_manager = ConnectionManager()


async def authenticate_websocket(
    websocket: WebSocket,
    db: Session = Depends(get_db)
) -> Optional[str]:
    """
    Authenticate a WebSocket connection using JWT token
    
    Args:
        websocket: The WebSocket connection
        db: Database session
        
    Returns:
        str: The authenticated user ID if successful, None otherwise
    """
    try:
        # Get token from WebSocket query parameters or cookies
        token = websocket.query_params.get("token")
        if not token:
            # Try to get from cookie
            cookies = websocket.cookies
            token = cookies.get("access_token")
        
        if not token:
            logger.warning("WebSocket connection attempt without token")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing authentication token")
            return None
        
        # Verify token
        try:
            payload = jwt.decode(
                token, 
                settings.SECRET_KEY.get_secret_value(), 
                algorithms=[settings.PASSWORD_HASH_ALGORITHM]
            )
        except JWTError as e:
            logger.warning(f"JWT validation error: {str(e)}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Authentication failed")
            return None
        
        # Extract user_id from token
        user_id = payload.get("sub")
        if not user_id:
            logger.warning("Token missing subject claim")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
            return None
        
        # In a real implementation, you might want to validate that the user still exists
        # and has proper permissions
        
        return user_id
        
    except Exception as e:
        logger.error(f"Error during WebSocket authentication: {str(e)}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR, reason="Internal server error")
        return None


async def handle_websocket_connection(
    websocket: WebSocket,
    db: Session = Depends(get_db)
):
    """
    Handle a WebSocket connection lifecycle
    
    Args:
        websocket: The WebSocket connection
        db: Database session
    """
    # Authenticate the connection
    user_id = await authenticate_websocket(websocket, db)
    if not user_id:
        return
    
    # Accept the connection and get connection ID
    connection_id = await connection_manager.connect(websocket, user_id)
    if not connection_id:
        return
    
    try:
        # Handle messages from the client
        while True:
            # Wait for a message from the client
            data = await websocket.receive_text()
            
            try:
                # Check message size
                connection_manager.validate_message_size(data)
                
                # Check rate limiting
                connection_manager.check_rate_limit(connection_id)
                
                # Try to parse as JSON
                try:
                    message = json.loads(data)
                    
                    # Validate message is a dictionary
                    if not isinstance(message, dict):
                        await websocket.send_json({
                            "type": "error",
                            "error": "Invalid message format. Expected JSON object.",
                            "timestamp": datetime.now().isoformat()
                        })
                        continue
                    
                    # Handle different message types
                    if "type" in message:
                        if message["type"] == "join_room" and "room_id" in message:
                            connection_manager.join_room(connection_id, message["room_id"])
                            await websocket.send_json({
                                "type": "room_joined",
                                "room_id": message["room_id"],
                                "timestamp": datetime.now().isoformat()
                            })
                        
                        elif message["type"] == "leave_room" and "room_id" in message:
                            connection_manager.leave_room(connection_id, message["room_id"])
                            await websocket.send_json({
                                "type": "room_left",
                                "room_id": message["room_id"],
                                "timestamp": datetime.now().isoformat()
                            })
                        
                        elif message["type"] == "chat_message" and "room_id" in message and "content" in message:
                            # Broadcast chat message to the room
                            await connection_manager.broadcast_to_room(message["room_id"], {
                                "type": "chat_message",
                                "room_id": message["room_id"],
                                "user_id": user_id,
                                "content": message["content"],
                                "timestamp": datetime.now().isoformat()
                            })
                        
                        # Trigger any registered event listeners
                        await connection_manager.trigger_event(message["type"], message)
                    
                    else:
                        logger.warning(f"Received message without type from user_id={user_id}, connection_id={connection_id}")
                        await websocket.send_json({
                            "type": "error",
                            "error": "Message must contain a 'type' field",
                            "timestamp": datetime.now().isoformat()
                        })
                
                except json.JSONDecodeError:
                    logger.warning(f"Received non-JSON message from user_id={user_id}, connection_id={connection_id}")
                    await websocket.send_json({
                        "type": "error",
                        "error": "Invalid message format. JSON expected.",
                        "timestamp": datetime.now().isoformat()
                    })
                
            except RateLimitError as e:
                logger.warning(f"Rate limit exceeded for user_id={user_id}, connection_id={connection_id}")
                await websocket.send_json({
                    "type": "error",
                    "error": str(e),
                    "code": "RATE_LIMIT_EXCEEDED",
                    "timestamp": datetime.now().isoformat()
                })
            
            except MessageTooLargeError as e:
                logger.warning(f"Message too large from user_id={user_id}, connection_id={connection_id}")
                await websocket.send_json({
                    "type": "error",
                    "error": str(e),
                    "code": "MESSAGE_TOO_LARGE",
                    "timestamp": datetime.now().isoformat()
                })
            
            except InvalidMessageError as e:
                logger.warning(f"Invalid message from user_id={user_id}, connection_id={connection_id}")
                await websocket.send_json({
                    "type": "error",
                    "error": str(e),
                    "code": "INVALID_MESSAGE",
                    "timestamp": datetime.now().isoformat()
                })
                
            except Exception as e:
                logger.error(f"Error processing message from user_id={user_id}, connection_id={connection_id}: {str(e)}")
                await websocket.send_json({
                    "type": "error",
                    "error": "An error occurred processing your message",
                    "timestamp": datetime.now().isoformat()
                })
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user_id={user_id}, connection_id={connection_id}")
    except Exception as e:
        logger.error(f"WebSocket error for user_id={user_id}, connection_id={connection_id}: {str(e)}")
    finally:
        # Ensure connection is properly removed on any exit
        await connection_manager.disconnect(connection_id)


# Event notification functions
async def notify_appointment_created(appointment_data: Dict[str, Any]):
    """
    Notify relevant users about a new appointment
    
    Args:
        appointment_data: The appointment data
    """
    # Get relevant user IDs (provider, patient, admin)
    provider_id = appointment_data.get("providerId")
    patient_id = appointment_data.get("patientId")
    
    # Notify provider
    if provider_id:
        await connection_manager.send_personal_message({
            "type": "appointment_created",
            "appointment": appointment_data,
            "timestamp": datetime.now().isoformat()
        }, provider_id)
    
    # Notify patient
    if patient_id:
        await connection_manager.send_personal_message({
            "type": "appointment_created",
            "appointment": appointment_data,
            "timestamp": datetime.now().isoformat()
        }, patient_id)
    
    # Notify scheduling room about the update
    await connection_manager.broadcast_to_room("scheduling", {
        "type": "appointment_created",
        "appointment": appointment_data,
        "timestamp": datetime.now().isoformat()
    })


async def notify_appointment_updated(appointment_data: Dict[str, Any]):
    """
    Notify relevant users about an updated appointment
    
    Args:
        appointment_data: The updated appointment data
    """
    # Get relevant user IDs (provider, patient, admin)
    provider_id = appointment_data.get("providerId")
    patient_id = appointment_data.get("patientId")
    
    # Notify provider
    if provider_id:
        await connection_manager.send_personal_message({
            "type": "appointment_updated",
            "appointment": appointment_data,
            "timestamp": datetime.now().isoformat()
        }, provider_id)
    
    # Notify patient
    if patient_id:
        await connection_manager.send_personal_message({
            "type": "appointment_updated",
            "appointment": appointment_data,
            "timestamp": datetime.now().isoformat()
        }, patient_id)
    
    # Notify scheduling room about the update
    await connection_manager.broadcast_to_room("scheduling", {
        "type": "appointment_updated",
        "appointment": appointment_data,
        "timestamp": datetime.now().isoformat()
    })


async def notify_patient_arrived(patient_data: Dict[str, Any]):
    """
    Notify relevant staff that a patient has arrived
    
    Args:
        patient_data: The patient data
    """
    # Notify all reception staff
    await connection_manager.broadcast_to_room("reception", {
        "type": "patient_arrived",
        "patient": patient_data,
        "timestamp": datetime.now().isoformat()
    })
    
    # Notify the provider assigned to this patient
    provider_id = patient_data.get("assignedProvider")
    if provider_id:
        await connection_manager.send_personal_message({
            "type": "patient_arrived",
            "patient": patient_data,
            "timestamp": datetime.now().isoformat()
        }, provider_id)


# Register event listeners during module initialization
connection_manager.register_event_listener("appointment_created", notify_appointment_created)
connection_manager.register_event_listener("appointment_updated", notify_appointment_updated)
connection_manager.register_event_listener("patient_arrived", notify_patient_arrived) 