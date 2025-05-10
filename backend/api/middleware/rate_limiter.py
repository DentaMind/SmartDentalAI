from fastapi import Request, HTTPException
from fastapi.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
import redis
import os
from typing import Callable
import time

class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, redis_client: redis.Redis = None):
        super().__init__(app)
        self.redis_client = redis_client or redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            db=0
        )
        self.rate_limit = int(os.getenv("RATE_LIMIT_REQUESTS", 100))
        self.rate_limit_period = int(os.getenv("RATE_LIMIT_PERIOD", 60))

    async def dispatch(self, request: Request, call_next: Callable):
        # Skip rate limiting for health checks
        if request.url.path == "/health":
            return await call_next(request)

        # Get client IP
        client_ip = request.client.host
        if not client_ip:
            client_ip = request.headers.get("X-Forwarded-For", "unknown")

        # Create rate limit key
        key = f"rate_limit:{client_ip}:{int(time.time() // self.rate_limit_period)}"

        # Check rate limit
        current = self.redis_client.incr(key)
        if current == 1:
            self.redis_client.expire(key, self.rate_limit_period)

        if current > self.rate_limit:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests",
                    "retry_after": self.rate_limit_period
                },
                headers={
                    "Retry-After": str(self.rate_limit_period),
                    "X-RateLimit-Limit": str(self.rate_limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time() // self.rate_limit_period) * self.rate_limit_period + self.rate_limit_period)
                }
            )

        # Add rate limit headers
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.rate_limit)
        response.headers["X-RateLimit-Remaining"] = str(self.rate_limit - current)
        response.headers["X-RateLimit-Reset"] = str(int(time.time() // self.rate_limit_period) * self.rate_limit_period + self.rate_limit_period)

        return response 