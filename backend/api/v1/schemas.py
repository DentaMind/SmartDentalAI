from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from database import get_db
from models.schema_registry import SchemaVersion
from schemas.schema import SchemaVersionResponse, SchemaStats
from auth.dependencies import is_founder

router = APIRouter(prefix="/api/v1/schemas", tags=["schemas"])

@router.get("/event-types", response_model=List[str])
async def get_event_types(
    db: Session = Depends(get_db),
    _: dict = Depends(is_founder)  # Founder-only endpoint
):
    """Get all unique event types in the system."""
    event_types = (
        db.query(SchemaVersion.event_type)
        .distinct()
        .order_by(SchemaVersion.event_type)
        .all()
    )
    return [et[0] for et in event_types]

@router.get("/versions/{event_type}", response_model=List[SchemaVersionResponse])
async def get_schema_versions(
    event_type: str,
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    _: dict = Depends(is_founder)  # Founder-only endpoint
):
    """Get all schema versions for an event type."""
    query = db.query(SchemaVersion).filter(SchemaVersion.event_type == event_type)
    
    if not include_inactive:
        query = query.filter(SchemaVersion.is_active == True)
    
    versions = query.order_by(SchemaVersion.version.desc()).all()
    if not versions:
        raise HTTPException(status_code=404, detail=f"No schemas found for event type: {event_type}")
    
    return versions

@router.get("/stats", response_model=SchemaStats)
async def get_schema_statistics(
    db: Session = Depends(get_db),
    _: dict = Depends(is_founder)  # Founder-only endpoint
):
    """Get statistics about schema versions and evolution."""
    # Get total schemas and versions
    total_event_types = db.query(SchemaVersion.event_type).distinct().count()
    total_versions = db.query(SchemaVersion).count()
    
    # Get event types with multiple versions (evolved schemas)
    evolved_types = (
        db.query(SchemaVersion.event_type)
        .group_by(SchemaVersion.event_type)
        .having(db.func.count(SchemaVersion.id) > 1)
        .count()
    )
    
    # Get recent schema changes
    day_ago = datetime.utcnow() - timedelta(days=1)
    recent_changes = (
        db.query(SchemaVersion)
        .filter(SchemaVersion.created_at >= day_ago)
        .count()
    )
    
    return SchemaStats(
        total_event_types=total_event_types,
        total_schema_versions=total_versions,
        evolved_schemas=evolved_types,
        recent_changes_24h=recent_changes
    )

@router.post("/versions/{event_type}/{version}/deactivate")
async def deactivate_schema_version(
    event_type: str,
    version: int,
    db: Session = Depends(get_db),
    _: dict = Depends(is_founder)  # Founder-only endpoint
):
    """Deactivate a specific schema version."""
    schema = (
        db.query(SchemaVersion)
        .filter(
            SchemaVersion.event_type == event_type,
            SchemaVersion.version == version
        )
        .first()
    )
    
    if not schema:
        raise HTTPException(
            status_code=404,
            detail=f"Schema version {version} not found for event type: {event_type}"
        )
    
    # Ensure at least one active version remains
    active_versions = (
        db.query(SchemaVersion)
        .filter(
            SchemaVersion.event_type == event_type,
            SchemaVersion.is_active == True
        )
        .count()
    )
    
    if active_versions <= 1 and schema.is_active:
        raise HTTPException(
            status_code=400,
            detail="Cannot deactivate the only active schema version"
        )
    
    schema.is_active = False
    db.add(schema)
    db.commit()
    
    return {"message": "Schema version deactivated successfully"}

@router.post("/versions/{event_type}/{version}/activate")
async def activate_schema_version(
    event_type: str,
    version: int,
    db: Session = Depends(get_db),
    _: dict = Depends(is_founder)  # Founder-only endpoint
):
    """Activate a specific schema version."""
    schema = (
        db.query(SchemaVersion)
        .filter(
            SchemaVersion.event_type == event_type,
            SchemaVersion.version == version
        )
        .first()
    )
    
    if not schema:
        raise HTTPException(
            status_code=404,
            detail=f"Schema version {version} not found for event type: {event_type}"
        )
    
    schema.is_active = True
    db.add(schema)
    db.commit()
    
    return {"message": "Schema version activated successfully"} 