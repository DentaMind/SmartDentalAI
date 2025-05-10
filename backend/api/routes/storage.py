from fastapi import APIRouter
from typing import Dict, Any
import os
import shutil

router = APIRouter()

def get_storage_stats() -> Dict[str, Any]:
    """Get storage statistics."""
    # Get disk usage
    total, used, free = shutil.disk_usage("/")
    
    # Calculate usage percentages
    total_gb = total / (2**30)
    used_gb = used / (2**30)
    free_gb = free / (2**30)
    used_percent = (used / total) * 100
    
    # Get file counts in data directory
    data_dir = "data"
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
    
    total_files = sum([len(files) for _, _, files in os.walk(data_dir)])
    
    return {
        "total_space_gb": round(total_gb, 2),
        "used_space_gb": round(used_gb, 2),
        "free_space_gb": round(free_gb, 2),
        "used_percent": round(used_percent, 2),
        "total_files": total_files
    }

@router.get("/storage/stats")
async def get_stats():
    """Endpoint to get storage statistics."""
    return get_storage_stats() 