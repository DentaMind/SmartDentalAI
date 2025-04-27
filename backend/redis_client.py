import os
from typing import Optional
from redis import Redis, ConnectionPool
from contextlib import contextmanager

# Redis connection configuration
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")
REDIS_SSL = os.getenv("REDIS_SSL", "false").lower() == "true"

# Connection pool for Redis
_redis_pool: Optional[ConnectionPool] = None

def init_redis_pool() -> None:
    """Initialize Redis connection pool."""
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = ConnectionPool(
            host=REDIS_HOST,
            port=REDIS_PORT,
            db=REDIS_DB,
            password=REDIS_PASSWORD,
            ssl=REDIS_SSL,
            decode_responses=True,  # Automatically decode responses to strings
            max_connections=10,  # Adjust based on your needs
            socket_timeout=5,  # 5 second timeout
            socket_connect_timeout=5,
            retry_on_timeout=True
        )

def get_redis_client() -> Redis:
    """Get Redis client from pool."""
    if _redis_pool is None:
        init_redis_pool()
    return Redis(connection_pool=_redis_pool)

@contextmanager
def redis_connection():
    """Context manager for Redis connections."""
    client = get_redis_client()
    try:
        yield client
    finally:
        # Connection automatically returns to pool
        pass

# Initialize pool on module import
init_redis_pool() 