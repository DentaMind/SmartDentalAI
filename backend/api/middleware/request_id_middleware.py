"""
Request ID Middleware

Automatically generates and assigns unique request IDs for tracking
related events across the system.
"""

import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware that adds a unique request ID to each request"""
    
    def __init__(self, app: ASGIApp, header_name: str = "X-Request-ID"):
        """
        Initialize middleware
        
        Args:
            app: The ASGI application
            header_name: The name of the header to use for the request ID
        """
        super().__init__(app)
        self.header_name = header_name
    
    async def dispatch(self, request: Request, call_next):
        """
        Process the request, adding a unique request ID
        
        Args:
            request: The incoming request
            call_next: The next middleware or endpoint
            
        Returns:
            The response
        """
        # Check if request already has a request ID header
        request_id = request.headers.get(self.header_name)
        
        # Generate a new ID if none exists
        if not request_id:
            request_id = str(uuid.uuid4())
        
        # Store request ID in request state for use by other components
        request.state.request_id = request_id
        
        # Process the request
        response = await call_next(request)
        
        # Add request ID to response headers
        response.headers[self.header_name] = request_id
        
        return response 