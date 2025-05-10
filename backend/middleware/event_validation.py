from typing import Dict, List, Optional, Type
from fastapi import Request, HTTPException
from pydantic import BaseModel, ValidationError
import json

from schemas.event import Event, EventBatch

# Event type to schema mapping
EVENT_SCHEMAS: Dict[str, Type[BaseModel]] = {
    # Clinical events
    "diagnosis.created": None,  # Will be implemented
    "diagnosis.updated": None,
    "treatment.planned": None,
    "treatment.completed": None,
    
    # Patient events
    "patient.created": None,
    "patient.updated": None,
    "patient.archived": None,
    
    # AI events
    "ai.inference.started": None,
    "ai.inference.completed": None,
    "ai.model.loaded": None,
    
    # Insurance events
    "insurance.verified": None,
    "insurance.claim.submitted": None,
    "insurance.preauth.requested": None,
    
    # Consent events
    "consent.signed": None,
    "consent.revoked": None,
    
    # System events
    "system.error": None,
    "system.warning": None,
}

class EventValidationMiddleware:
    """Middleware for validating event payloads against their schemas."""
    
    async def __call__(self, request: Request, call_next):
        if not request.url.path.startswith("/api/v1/events"):
            return await call_next(request)
            
        # Read and validate request body
        try:
            body = await request.body()
            data = json.loads(body)
            
            # Handle batch events
            if request.url.path.endswith("/batch"):
                await self._validate_batch(data)
            # Handle single events
            else:
                await self._validate_event(data)
                
            # Reconstruct request with validated data
            async def receive():
                return {
                    "type": "http.request",
                    "body": json.dumps(data).encode(),
                    "more_body": False
                }
            
            request._receive = receive
            
        except ValidationError as e:
            raise HTTPException(
                status_code=422,
                detail=f"Event validation failed: {str(e)}"
            )
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=400,
                detail="Invalid JSON in request body"
            )
            
        return await call_next(request)
    
    async def _validate_batch(self, data: Dict) -> None:
        """Validate a batch of events."""
        try:
            batch = EventBatch(**data)
            for event in batch.events:
                await self._validate_event_payload(event)
        except ValidationError as e:
            raise HTTPException(
                status_code=422,
                detail=f"Batch validation failed: {str(e)}"
            )
    
    async def _validate_event(self, data: Dict) -> None:
        """Validate a single event."""
        try:
            event = Event(**data)
            await self._validate_event_payload(event)
        except ValidationError as e:
            raise HTTPException(
                status_code=422,
                detail=f"Event validation failed: {str(e)}"
            )
    
    async def _validate_event_payload(self, event: Event) -> None:
        """Validate event payload against its schema."""
        schema = EVENT_SCHEMAS.get(event.type)
        if schema:
            try:
                schema(**event.payload)
            except ValidationError as e:
                raise HTTPException(
                    status_code=422,
                    detail=f"Invalid payload for event type {event.type}: {str(e)}"
                ) 