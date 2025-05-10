from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime, timedelta
import psutil
import platform
import os
from collections import defaultdict
import json

router = APIRouter()

# In-memory storage for events (replace with database in production)
events = []
event_types = defaultdict(int)
learning_metrics = []

def get_system_metrics() -> Dict[str, Any]:
    """Get comprehensive system health metrics."""
    # CPU metrics
    cpu_percent = psutil.cpu_percent(interval=1)
    cpu_count = psutil.cpu_count()
    cpu_freq = psutil.cpu_freq()
    
    # Memory metrics
    memory = psutil.virtual_memory()
    memory_percent = memory.percent
    memory_used = memory.used / (1024 * 1024 * 1024)  # Convert to GB
    memory_total = memory.total / (1024 * 1024 * 1024)  # Convert to GB
    
    # Disk metrics
    disk = psutil.disk_usage('/')
    disk_percent = disk.percent
    disk_used = disk.used / (1024 * 1024 * 1024)  # Convert to GB
    disk_total = disk.total / (1024 * 1024 * 1024)  # Convert to GB
    
    # Network metrics
    net_io = psutil.net_io_counters()
    
    # System info
    system_info = {
        "os": platform.system(),
        "os_version": platform.version(),
        "python_version": platform.python_version(),
        "hostname": platform.node(),
        "uptime": datetime.now() - datetime.fromtimestamp(psutil.boot_time())
    }
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "cpu": {
            "usage_percent": cpu_percent,
            "core_count": cpu_count,
            "frequency_mhz": cpu_freq.current if cpu_freq else None
        },
        "memory": {
            "usage_percent": memory_percent,
            "used_gb": round(memory_used, 2),
            "total_gb": round(memory_total, 2)
        },
        "disk": {
            "usage_percent": disk_percent,
            "used_gb": round(disk_used, 2),
            "total_gb": round(disk_total, 2)
        },
        "network": {
            "bytes_sent": net_io.bytes_sent,
            "bytes_recv": net_io.bytes_recv,
            "packets_sent": net_io.packets_sent,
            "packets_recv": net_io.packets_recv
        },
        "system": system_info
    }

def get_event_stats() -> Dict[str, Any]:
    """Get event statistics and metrics."""
    now = datetime.utcnow()
    one_hour_ago = now - timedelta(hours=1)
    
    # Filter events from last hour
    recent_events = [e for e in events if e['timestamp'] >= one_hour_ago]
    
    # Calculate error rate
    total_events = len(events)
    error_events = sum(1 for e in events if e.get('status') == 'error')
    error_rate = (error_events / total_events * 100) if total_events > 0 else 0
    
    # Calculate average processing time
    processing_times = [e.get('processing_time', 0) for e in events]
    avg_processing_time = sum(processing_times) / len(processing_times) if processing_times else 0
    
    return {
        "total_events": total_events,
        "events_last_hour": len(recent_events),
        "error_rate": error_rate,
        "avg_processing_time": avg_processing_time,
        "event_types": dict(event_types),
        "recent_errors": [
            e for e in recent_events 
            if e.get('status') == 'error'
        ][-5:]  # Last 5 errors
    }

def get_storage_stats() -> Dict[str, Any]:
    """Get storage statistics and metrics."""
    # Get disk usage
    total, used, free = psutil.disk_usage("/")
    
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
    
    # Get backup status
    backup_dir = "backups"
    if os.path.exists(backup_dir):
        backup_files = [f for f in os.listdir(backup_dir) if f.endswith('.backup')]
        last_backup = max(backup_files, key=lambda x: os.path.getctime(os.path.join(backup_dir, x))) if backup_files else None
    else:
        last_backup = None
    
    return {
        "total_space_gb": round(total_gb, 2),
        "used_space_gb": round(used_gb, 2),
        "free_space_gb": round(free_gb, 2),
        "used_percent": round(used_percent, 2),
        "total_files": total_files,
        "backup_status": {
            "last_backup": last_backup,
            "backup_count": len(backup_files) if 'backup_files' in locals() else 0
        }
    }

def get_learning_metrics() -> Dict[str, Any]:
    """Get learning metrics and statistics."""
    now = datetime.utcnow()
    one_day_ago = now - timedelta(days=1)
    
    # Filter metrics from the last day
    recent_metrics = [
        m for m in learning_metrics
        if datetime.fromisoformat(m["timestamp"]) > one_day_ago
    ]
    
    if not recent_metrics:
        return {
            "accuracy": 0.0,
            "precision": 0.0,
            "recall": 0.0,
            "f1_score": 0.0,
            "training_samples": 0,
            "last_training_time": None,
            "ingestion_rate": 0,
            "error_rate": 0,
            "retraining_cycles": [],
            "timestamp": now.isoformat()
        }
    
    # Calculate averages
    accuracy = sum(m["accuracy"] for m in recent_metrics) / len(recent_metrics)
    precision = sum(m["precision"] for m in recent_metrics) / len(recent_metrics)
    recall = sum(m["recall"] for m in recent_metrics) / len(recent_metrics)
    f1_score = sum(m["f1_score"] for m in recent_metrics) / len(recent_metrics)
    
    # Get latest training info
    latest_metric = max(recent_metrics, key=lambda m: m["timestamp"])
    
    # Calculate ingestion rate
    ingestion_events = [e for e in events if e.get('type') == 'ingestion']
    ingestion_rate = len(ingestion_events) / 3600  # Events per hour
    
    # Calculate error rate
    error_events = [e for e in events if e.get('status') == 'error']
    error_rate = len(error_events) / len(events) * 100 if events else 0
    
    # Get retraining cycles
    retraining_cycles = [
        e for e in events 
        if e.get('type') == 'retraining'
    ]
    
    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1_score,
        "training_samples": latest_metric["training_samples"],
        "last_training_time": latest_metric["timestamp"],
        "ingestion_rate": ingestion_rate,
        "error_rate": error_rate,
        "retraining_cycles": retraining_cycles,
        "timestamp": now.isoformat()
    }

@router.get("/system")
async def get_system_metrics_endpoint():
    """Endpoint to get system health metrics."""
    return get_system_metrics()

@router.get("/events")
async def get_event_stats_endpoint():
    """Endpoint to get event statistics."""
    return get_event_stats()

@router.get("/storage")
async def get_storage_stats_endpoint():
    """Endpoint to get storage statistics."""
    return get_storage_stats()

@router.get("/learning")
async def get_learning_metrics_endpoint():
    """Endpoint to get learning metrics."""
    return get_learning_metrics()

@router.get("/all")
async def get_all_telemetry():
    """Endpoint to get all telemetry data in one call."""
    return {
        "system": get_system_metrics(),
        "events": get_event_stats(),
        "storage": get_storage_stats(),
        "learning": get_learning_metrics(),
        "timestamp": datetime.utcnow().isoformat()
    } 