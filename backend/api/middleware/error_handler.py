from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.base import BaseHTTPMiddleware
from ..utils.logger import error_logger
import traceback
from typing import Callable
import json

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            error_logger.error(
                f"Error processing request: {str(e)}\n"
                f"Path: {request.url.path}\n"
                f"Method: {request.method}\n"
                f"Headers: {dict(request.headers)}\n"
                f"Traceback: {traceback.format_exc()}"
            )

            # Determine status code based on error type
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            if hasattr(e, 'status_code'):
                status_code = e.status_code

            # Create error response
            error_response = {
                "error": str(e),
                "status_code": status_code,
                "path": request.url.path,
                "method": request.method
            }

            # Add additional details for development
            if request.app.debug:
                error_response["traceback"] = traceback.format_exc()

            return JSONResponse(
                status_code=status_code,
                content=error_response
            )

# Custom exception handlers
async def validation_exception_handler(request, exc):
    error_logger.error(f"Validation error: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": str(exc)}
    )

async def authentication_exception_handler(request, exc):
    error_logger.error(f"Authentication error: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": "Authentication failed"}
    )

async def permission_exception_handler(request, exc):
    error_logger.error(f"Permission error: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"detail": "Permission denied"}
    ) 