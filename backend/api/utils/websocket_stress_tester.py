"""
WebSocket Stress Testing Utility

This module provides tools to stress test the WebSocket server by
simulating a large number of connections and messages.
"""

import asyncio
import json
import logging
import random
import time
import websockets
import argparse
import aiohttp
import sys
from typing import List, Dict, Any, Optional
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("websocket_stress_test.log")
    ]
)
logger = logging.getLogger("websocket_stress_tester")

# Test configuration defaults
DEFAULT_SERVER_URL = "ws://localhost:8000/ws"
DEFAULT_API_URL = "http://localhost:8000/api/ws"
DEFAULT_TEST_DURATION = 60  # seconds
DEFAULT_CONNECTION_COUNT = 100
DEFAULT_MESSAGE_INTERVAL = 0.5  # seconds
DEFAULT_TOKEN = ""  # Add your test auth token here
BATCH_SIZE = 10  # Number of connections to open at once

class WebSocketClient:
    """Simulated WebSocket client for stress testing"""
    
    def __init__(self, url: str, client_id: str, token: Optional[str] = None, message_interval: float = 1.0):
        """
        Initialize a WebSocket client
        
        Args:
            url: WebSocket server URL
            client_id: Unique identifier for this client
            token: Optional authentication token
            message_interval: Interval between messages in seconds
        """
        self.url = url
        self.client_id = client_id
        self.token = token
        self.message_interval = message_interval
        self.connection: Optional[websockets.WebSocketClientProtocol] = None
        self.connected = False
        self.messages_sent = 0
        self.messages_received = 0
        self.connection_attempts = 0
        self.last_latency_ms = 0
        self.total_latency_ms = 0
        self.should_run = True
    
    async def connect(self) -> bool:
        """
        Connect to the WebSocket server
        
        Returns:
            bool: True if connected successfully
        """
        self.connection_attempts += 1
        
        try:
            # Include the token in the URL query string if provided
            connect_url = self.url
            if self.token:
                if "?" in connect_url:
                    connect_url += f"&token={self.token}"
                else:
                    connect_url += f"?token={self.token}"
            
            # Connect to the server
            self.connection = await websockets.connect(connect_url)
            self.connected = True
            logger.debug(f"Client {self.client_id} connected successfully")
            return True
        except Exception as e:
            logger.error(f"Client {self.client_id} connection failed: {str(e)}")
            self.connected = False
            return False
    
    async def send_message(self, message_type: str = "test", data: Optional[Dict] = None) -> bool:
        """
        Send a message to the server
        
        Args:
            message_type: Type of message to send
            data: Optional data to include
            
        Returns:
            bool: True if sent successfully
        """
        if not self.connected or not self.connection:
            return False
        
        try:
            # Construct message
            message = {
                "type": message_type,
                "client_id": self.client_id,
                "timestamp": datetime.now().isoformat(),
                "data": data or {},
                "seq": self.messages_sent,
            }
            
            # Record send time for latency calculation
            send_time = time.time()
            
            # Send the message
            await self.connection.send(json.dumps(message))
            self.messages_sent += 1
            
            # Wait for response
            response = await self.connection.recv()
            receive_time = time.time()
            
            # Calculate latency
            latency_ms = (receive_time - send_time) * 1000
            self.last_latency_ms = latency_ms
            self.total_latency_ms += latency_ms
            self.messages_received += 1
            
            return True
        except Exception as e:
            logger.error(f"Client {self.client_id} failed to send message: {str(e)}")
            self.connected = False
            return False
    
    async def run(self, duration: int = 30):
        """
        Run the client for a specified duration
        
        Args:
            duration: Test duration in seconds
        """
        if not await self.connect():
            return
        
        start_time = time.time()
        end_time = start_time + duration
        
        try:
            while time.time() < end_time and self.should_run:
                # Choose a random message type for realism
                message_type = random.choice(["ping", "chat", "notification", "update", "test"])
                
                # Add some test data
                data = {
                    "content": f"Test message {self.messages_sent} from {self.client_id}",
                    "random_value": random.random(),
                }
                
                # Send message
                success = await self.send_message(message_type, data)
                
                if not success:
                    logger.warning(f"Client {self.client_id} lost connection, attempting to reconnect...")
                    if await self.connect():
                        logger.info(f"Client {self.client_id} reconnected successfully")
                    else:
                        logger.error(f"Client {self.client_id} failed to reconnect")
                        break
                
                # Wait before sending next message
                jitter = random.uniform(-0.1, 0.1) * self.message_interval
                await asyncio.sleep(self.message_interval + jitter)
        except Exception as e:
            logger.error(f"Client {self.client_id} error during test: {str(e)}")
        finally:
            await self.disconnect()
    
    async def disconnect(self):
        """Disconnect from the server"""
        if self.connected and self.connection:
            try:
                await self.connection.close()
                logger.debug(f"Client {self.client_id} disconnected")
            except Exception as e:
                logger.error(f"Client {self.client_id} error during disconnect: {str(e)}")
        
        self.connected = False
        self.connection = None
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get client statistics
        
        Returns:
            Dict: Statistics about this client's performance
        """
        avg_latency = 0
        if self.messages_received > 0:
            avg_latency = self.total_latency_ms / self.messages_received
        
        return {
            "client_id": self.client_id,
            "connected": self.connected,
            "connection_attempts": self.connection_attempts,
            "messages_sent": self.messages_sent,
            "messages_received": self.messages_received,
            "last_latency_ms": self.last_latency_ms,
            "avg_latency_ms": avg_latency,
        }


class StressTester:
    """WebSocket stress testing orchestrator"""
    
    def __init__(
        self,
        server_url: str,
        connection_count: int,
        message_interval: float,
        token: Optional[str] = None,
        api_url: Optional[str] = None
    ):
        """
        Initialize the stress tester
        
        Args:
            server_url: WebSocket server URL
            connection_count: Number of connections to simulate
            message_interval: Interval between messages in seconds
            token: Optional authentication token
            api_url: REST API URL for retrieving server stats (optional)
        """
        self.server_url = server_url
        self.connection_count = connection_count
        self.message_interval = message_interval
        self.token = token
        self.api_url = api_url
        self.clients: List[WebSocketClient] = []
        self.start_time = 0
        self.end_time = 0
        self.server_stats_before: Optional[Dict[str, Any]] = None
        self.server_stats_after: Optional[Dict[str, Any]] = None
    
    async def get_server_stats(self) -> Optional[Dict[str, Any]]:
        """
        Get server statistics via REST API
        
        Returns:
            Dict: Server statistics or None if not available
        """
        if not self.api_url:
            return None
        
        try:
            async with aiohttp.ClientSession() as session:
                headers = {}
                if self.token:
                    headers["Authorization"] = f"Bearer {self.token}"
                
                async with session.get(f"{self.api_url}/stats", headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data["stats"]
        except Exception as e:
            logger.error(f"Error getting server stats: {str(e)}")
        
        return None
    
    async def run_test(self, duration: int = 60):
        """
        Run the stress test
        
        Args:
            duration: Test duration in seconds
        """
        logger.info(f"Starting WebSocket stress test with {self.connection_count} connections")
        logger.info(f"Server URL: {self.server_url}")
        logger.info(f"Message interval: {self.message_interval} seconds")
        logger.info(f"Test duration: {duration} seconds")
        
        # Get initial server stats
        self.server_stats_before = await self.get_server_stats()
        if self.server_stats_before:
            logger.info(f"Initial server stats: {json.dumps(self.server_stats_before, indent=2)}")
        
        # Record start time
        self.start_time = time.time()
        
        # Create clients
        for i in range(self.connection_count):
            client_id = f"stress-test-client-{i+1}"
            client = WebSocketClient(
                url=self.server_url,
                client_id=client_id,
                token=self.token,
                message_interval=self.message_interval
            )
            self.clients.append(client)
        
        # Launch clients in batches to avoid overwhelming the server
        client_tasks = []
        for i in range(0, len(self.clients), BATCH_SIZE):
            batch = self.clients[i:i+BATCH_SIZE]
            
            tasks = [client.run(duration) for client in batch]
            client_tasks.extend(tasks)
            
            logger.info(f"Started batch of {len(batch)} clients ({i+1}-{i+len(batch)})")
            
            # Slight delay between batches
            await asyncio.sleep(0.5)
        
        # Progress indicator
        task_progress = asyncio.create_task(self._show_progress(duration))
        
        # Wait for all clients to complete
        await asyncio.gather(*client_tasks)
        
        # Cancel progress indicator
        task_progress.cancel()
        
        # Record end time
        self.end_time = time.time()
        
        # Get final server stats
        self.server_stats_after = await self.get_server_stats()
        
        # Report results
        await self.report_results()
    
    async def _show_progress(self, duration: int):
        """
        Show progress during the test
        
        Args:
            duration: Test duration in seconds
        """
        start = self.start_time
        try:
            while True:
                elapsed = time.time() - start
                remaining = duration - elapsed
                
                if remaining <= 0:
                    break
                
                # Get current stats
                connected = sum(1 for client in self.clients if client.connected)
                total_sent = sum(client.messages_sent for client in self.clients)
                total_received = sum(client.messages_received for client in self.clients)
                
                print(f"\rProgress: {elapsed:.1f}s/{duration}s | "
                      f"Connected: {connected}/{self.connection_count} | "
                      f"Messages: {total_sent} sent, {total_received} received", end="")
                
                await asyncio.sleep(1.0)
                
        except asyncio.CancelledError:
            print()  # Newline after progress bar
            pass
    
    async def report_results(self):
        """Report test results"""
        print("\n" + "="*80)
        print("WEBSOCKET STRESS TEST RESULTS")
        print("="*80)
        
        # Basic test info
        test_duration = self.end_time - self.start_time
        print(f"Test duration: {test_duration:.2f} seconds")
        print(f"Connections: {self.connection_count}")
        print(f"Message interval: {self.message_interval} seconds")
        
        # Client stats
        connected_clients = sum(1 for client in self.clients if client.connected)
        total_messages_sent = sum(client.messages_sent for client in self.clients)
        total_messages_received = sum(client.messages_received for client in self.clients)
        
        if total_messages_sent > 0:
            message_success_rate = (total_messages_received / total_messages_sent) * 100
        else:
            message_success_rate = 0
        
        if self.connection_count > 0:
            connection_success_rate = (connected_clients / self.connection_count) * 100
        else:
            connection_success_rate = 0
        
        # Calculate average latency
        latencies = [client.get_stats()["avg_latency_ms"] for client in self.clients 
                    if client.messages_received > 0]
        avg_latency = sum(latencies) / len(latencies) if latencies else 0
        
        print("\nCLIENT METRICS:")
        print(f"- Connected clients: {connected_clients}/{self.connection_count} ({connection_success_rate:.1f}%)")
        print(f"- Messages sent: {total_messages_sent}")
        print(f"- Messages received: {total_messages_received}")
        print(f"- Message success rate: {message_success_rate:.1f}%")
        print(f"- Average latency: {avg_latency:.2f} ms")
        
        # Message rate
        messages_per_second = total_messages_sent / test_duration if test_duration > 0 else 0
        print(f"- Messages per second: {messages_per_second:.2f}")
        
        # Server stats comparison
        if self.server_stats_before and self.server_stats_after:
            print("\nSERVER STATS COMPARISON:")
            
            # Function to extract and compare values
            def compare_metric(before, after, metric_path, label):
                # Extract values using the path
                paths = metric_path.split('.')
                before_value = before
                after_value = after
                
                for path in paths:
                    if path in before_value and path in after_value:
                        before_value = before_value[path]
                        after_value = after_value[path]
                    else:
                        return
                
                diff = after_value - before_value
                diff_str = f"+{diff}" if diff >= 0 else f"{diff}"
                print(f"- {label}: {before_value} → {after_value} ({diff_str})")
            
            # Compare key metrics
            try:
                compare_metric(self.server_stats_before, self.server_stats_after, 
                              "total_connections", "Total connections")
                compare_metric(self.server_stats_before, self.server_stats_after, 
                              "worker_count", "Worker count")
                
                # If worker stats are available, show worker utilization
                if "workers" in self.server_stats_after:
                    print("\n  WORKER UTILIZATION:")
                    for i, worker in enumerate(self.server_stats_after["workers"]):
                        util_pct = worker.get("utilization", 0) * 100
                        print(f"  - Worker {worker.get('worker_id', i)}: "
                              f"{worker.get('active_connections', 0)}/{worker.get('capacity', 0)} "
                              f"({util_pct:.1f}%)")
            except Exception as e:
                print(f"Error comparing server stats: {str(e)}")
        
        # Test summary
        print("\nTEST SUMMARY:")
        if message_success_rate >= 98 and connection_success_rate >= 95:
            print("✅ TEST PASSED: System handled the load successfully")
        elif message_success_rate >= 90 and connection_success_rate >= 80:
            print("⚠️ TEST WARNING: System handled the load with some issues")
        else:
            print("❌ TEST FAILED: System struggled to handle the load")
        
        print("="*80)


async def main(args):
    """Main entry point"""
    tester = StressTester(
        server_url=args.server_url,
        connection_count=args.connections,
        message_interval=args.interval,
        token=args.token,
        api_url=args.api_url
    )
    
    try:
        await tester.run_test(duration=args.duration)
    except KeyboardInterrupt:
        logger.info("Test interrupted by user")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='WebSocket Server Stress Testing Tool')
    parser.add_argument('--server-url', type=str, default=DEFAULT_SERVER_URL,
                        help=f'WebSocket server URL (default: {DEFAULT_SERVER_URL})')
    parser.add_argument('--api-url', type=str, default=DEFAULT_API_URL,
                        help=f'REST API URL (default: {DEFAULT_API_URL})')
    parser.add_argument('--connections', type=int, default=DEFAULT_CONNECTION_COUNT,
                        help=f'Number of connections to simulate (default: {DEFAULT_CONNECTION_COUNT})')
    parser.add_argument('--duration', type=int, default=DEFAULT_TEST_DURATION,
                        help=f'Test duration in seconds (default: {DEFAULT_TEST_DURATION})')
    parser.add_argument('--interval', type=float, default=DEFAULT_MESSAGE_INTERVAL,
                        help=f'Interval between messages in seconds (default: {DEFAULT_MESSAGE_INTERVAL})')
    parser.add_argument('--token', type=str, default=DEFAULT_TOKEN,
                        help='Authentication token')
    
    args = parser.parse_args()
    
    try:
        asyncio.run(main(args))
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        logger.error(f"Error running stress test: {str(e)}")
        sys.exit(1) 