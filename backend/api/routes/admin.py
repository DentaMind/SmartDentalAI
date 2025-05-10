from fastapi import APIRouter, Depends, HTTPException, status, Query
from alembic.config import Config
from alembic.script import ScriptDirectory
from alembic.runtime.migration import MigrationContext
from sqlalchemy.sql import text
import subprocess
import re
from ..services.db_health_service import db_health_service
from typing import Dict, Optional
import random
from datetime import datetime, timedelta

@router.get("/db-health", response_model=dict)
async def get_db_health(
    db=Depends(get_db),
    force_refresh: bool = False
):
    """Get database health status."""
    return await db_health_service.get_health_status(db, force_refresh)

@router.get("/db-health/detailed", response_model=dict)
async def get_db_health_detailed(
    db=Depends(get_db),
    force_refresh: bool = False,
    current_user=Depends(get_current_user)
):
    """Get detailed database health report. Admin only."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    return await db_health_service.get_detailed_report(db, force_refresh)

@router.get("/db-migration-status", response_model=dict)
async def get_db_migration_status(
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Get current database migration status, including current revision and head revision.
    """
    try:
        # Get current migration from database
        conn = db.connection()
        context = MigrationContext.configure(conn)
        current_rev = context.get_current_revision()
        
        # Get head revision from Alembic
        config = Config("alembic.ini")
        script = ScriptDirectory.from_config(config)
        head_revs = script.get_heads()
        
        # Get available revisions
        alembic_history = subprocess.check_output(
            ["alembic", "history"], 
            universal_newlines=True
        )
        
        # Parse revisions from history
        revisions = []
        for line in alembic_history.splitlines():
            match = re.search(r'([a-z0-9]+) \(([^)]+)\)', line)
            if match:
                rev_id = match.group(1)
                rev_name = match.group(2)
                revisions.append({"id": rev_id, "name": rev_name})
        
        # Return status data
        return {
            "current_revision": current_rev,
            "head_revisions": head_revs,
            "is_up_to_date": current_rev in head_revs,
            "available_revisions": revisions,
            "revision_count": len(revisions),
            "multiple_heads": len(head_revs) > 1
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get migration status: {str(e)}"
        )

@router.post("/db-health/run-checks", response_model=dict)
async def run_db_health_checks(
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Manually trigger database health checks. Admin only."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    return await db_health_service.get_health_status(db, force_refresh=True)

@router.get("/ai-metrics", response_model=Dict[str, Any])
async def get_ai_metrics(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    model_type: Optional[str] = Query(None),
) -> Dict[str, Any]:
    """
    Get AI system performance metrics
    """
    # Generate mock data for demonstration
    daily_inferences = {}
    now = datetime.now()
    for i in range(30):
        date = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_inferences[date] = random.randint(30, 100)
    
    return {
        "totalInferences": 1247,
        "averageLatency": 342.5,
        "successRate": 97.2,
        "averageConfidence": 0.83,
        "modelUsage": {
            "mock": 825,
            "onnx": 312,
            "pytorch": 110
        },
        "feedbackSummary": {
            "accepted": 562,
            "modified": 87,
            "rejected": 25
        },
        "inferencesByType": {
            "panoramic": 425,
            "bitewing": 732,
            "periapical": 90
        },
        "dailyInferences": daily_inferences
    } 