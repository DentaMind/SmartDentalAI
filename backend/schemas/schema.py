from typing import Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel

class SchemaVersionResponse(BaseModel):
    """Response model for a schema version."""
    id: int
    event_type: str
    version: int
    schema: Dict
    schema_hash: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class SchemaStats(BaseModel):
    """Statistics about schema versions and evolution."""
    total_event_types: int
    total_schema_versions: int
    evolved_schemas: int
    recent_changes_24h: int 