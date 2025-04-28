import redis
import json
from typing import Any, Optional
import logging
from datetime import timedelta

class CacheService:
    def __init__(self):
        self.redis_client = redis.Redis(
            host='localhost',
            port=6379,
            db=0,
            decode_responses=True
        )
        self.cache_ttl = {
            'financial_metrics': timedelta(hours=1),
            'revenue_trend': timedelta(hours=1),
            'aging_report': timedelta(hours=1),
            'payment_distribution': timedelta(hours=1),
            'clinic_performance': timedelta(hours=1),
            'financial_alerts': timedelta(minutes=5)
        }

    def get(self, key: str) -> Optional[Any]:
        """Get cached data by key."""
        try:
            data = self.redis_client.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logging.error(f"Error getting cached data: {e}")
            return None

    def set(self, key: str, value: Any, ttl: Optional[timedelta] = None) -> bool:
        """Set data in cache with optional TTL."""
        try:
            ttl = ttl or self.cache_ttl.get(key)
            serialized = json.dumps(value)
            if ttl:
                self.redis_client.setex(key, ttl, serialized)
            else:
                self.redis_client.set(key, serialized)
            return True
        except Exception as e:
            logging.error(f"Error setting cached data: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete data from cache."""
        try:
            return bool(self.redis_client.delete(key))
        except Exception as e:
            logging.error(f"Error deleting cached data: {e}")
            return False

    def invalidate_financial_data(self) -> None:
        """Invalidate all financial-related cache entries."""
        try:
            keys = [
                'financial_metrics',
                'revenue_trend',
                'aging_report',
                'payment_distribution',
                'clinic_performance',
                'financial_alerts'
            ]
            for key in keys:
                self.delete(key)
        except Exception as e:
            logging.error(f"Error invalidating financial cache: {e}")

# Create a singleton instance
cache_service = CacheService() 