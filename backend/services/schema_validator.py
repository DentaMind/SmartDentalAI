from typing import Dict, List, Optional, Any, Set
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from fastapi import HTTPException
import json
import jsonschema
from jsonschema import Draft7Validator, SchemaError
import hashlib

from models.event import LearningEvent
from models.schema_registry import SchemaVersion
from schemas.event import Event

class SchemaValidationError(Exception):
    def __init__(self, message: str, details: Dict[str, Any]):
        self.message = message
        self.details = details
        super().__init__(message)

class SchemaValidator:
    def __init__(self, db: Session):
        self.db = db
        self._schema_cache = {}  # Cache of active schemas by event type
        self._cache_version = 0  # Version counter for cache invalidation
        
    def _compute_schema_hash(self, schema: Dict) -> str:
        """Compute a deterministic hash of the schema."""
        schema_str = json.dumps(schema, sort_keys=True)
        return hashlib.sha256(schema_str.encode()).hexdigest()
    
    def _get_active_schema(self, event_type: str) -> Optional[Dict]:
        """Get the active schema for an event type from cache or database."""
        cached = self._schema_cache.get(event_type)
        if cached:
            return cached
        
        # Query the latest active schema version
        schema_version = (
            self.db.query(SchemaVersion)
            .filter(
                and_(
                    SchemaVersion.event_type == event_type,
                    SchemaVersion.is_active == True
                )
            )
            .order_by(SchemaVersion.version.desc())
            .first()
        )
        
        if schema_version:
            self._schema_cache[event_type] = schema_version.schema
            return schema_version.schema
        
        return None
    
    def invalidate_cache(self):
        """Clear the schema cache."""
        self._schema_cache.clear()
        self._cache_version += 1
    
    async def register_schema(
        self,
        event_type: str,
        schema: Dict,
        validate_schema: bool = True
    ) -> SchemaVersion:
        """Register a new schema version for an event type."""
        # Validate the schema itself
        if validate_schema:
            try:
                Draft7Validator.check_schema(schema)
            except Exception as e:
                raise SchemaValidationError(f"Invalid JSON Schema: {str(e)}")
        
        # Compute schema hash
        schema_hash = self._compute_schema_hash(schema)
        
        # Check if this exact schema already exists
        existing = (
            self.db.query(SchemaVersion)
            .filter(
                and_(
                    SchemaVersion.event_type == event_type,
                    SchemaVersion.schema_hash == schema_hash
                )
            )
            .first()
        )
        
        if existing:
            if not existing.is_active:
                # Reactivate the existing schema
                existing.is_active = True
                self.db.add(existing)
                self.db.commit()
            return existing
        
        # Get the latest version number
        latest_version = (
            self.db.query(SchemaVersion.version)
            .filter(SchemaVersion.event_type == event_type)
            .order_by(SchemaVersion.version.desc())
            .first()
        )
        
        new_version = (latest_version[0] + 1) if latest_version else 1
        
        # Create new schema version
        schema_version = SchemaVersion(
            event_type=event_type,
            version=new_version,
            schema=schema,
            schema_hash=schema_hash,
            is_active=True
        )
        
        self.db.add(schema_version)
        self.db.commit()
        
        # Invalidate cache
        self.invalidate_cache()
        
        return schema_version
    
    async def validate_event(self, event: Event) -> None:
        """Validate an event against its registered schema."""
        schema = self._get_active_schema(event.type)
        if not schema:
            raise SchemaValidationError(
                f"No active schema found for event type: {event.type}"
            )
        
        try:
            # Validate the event payload against the schema
            jsonschema.validate(instance=event.payload, schema=schema)
        except jsonschema.exceptions.ValidationError as e:
            raise SchemaValidationError(
                message=f"Event payload validation failed: {str(e)}",
                details={"event_type": event.type}
            )
    
    async def get_schema_evolution(self, event_type: str) -> List[Dict]:
        """Get the evolution history of schemas for an event type."""
        versions = (
            self.db.query(SchemaVersion)
            .filter(SchemaVersion.event_type == event_type)
            .order_by(SchemaVersion.version)
            .all()
        )
        
        if not versions:
            raise HTTPException(
                status_code=404,
                detail=f"No schema history found for event type: {event_type}"
            )
        
        return [
            {
                "version": v.version,
                "schema": v.schema,
                "is_active": v.is_active,
                "created_at": v.created_at
            }
            for v in versions
        ] 