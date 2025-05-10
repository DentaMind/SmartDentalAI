from typing import Dict, Any, List
from datetime import datetime, timedelta
import psutil
import json
import os
from collections import defaultdict

def get_system_metrics() -> Dict[str, Any]:
    """Get current system metrics"""
    return {
        "cpu_percent": psutil.cpu_percent(),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_usage": psutil.disk_usage('/').percent,
        "network": {
            "bytes_sent": psutil.net_io_counters().bytes_sent,
            "bytes_recv": psutil.net_io_counters().bytes_recv
        }
    }

def get_event_stats(hours: int = 24) -> Dict[str, Any]:
    """Get event statistics for the specified time period"""
    try:
        with open("event_log.json", "r") as f:
            events = json.load(f)
    except FileNotFoundError:
        return {"total": 0, "by_type": {}, "by_severity": {}}

    cutoff = datetime.now() - timedelta(hours=hours)
    recent_events = [
        event for event in events
        if datetime.fromisoformat(event["timestamp"]) > cutoff
    ]

    stats = {
        "total": len(recent_events),
        "by_type": defaultdict(int),
        "by_severity": defaultdict(int)
    }

    for event in recent_events:
        stats["by_type"][event["type"]] += 1
        stats["by_severity"][event["severity"]] += 1

    return stats

def log_event(event_type: str, severity: str, details: Dict[str, Any]):
    """Log a new event"""
    try:
        with open("event_log.json", "r") as f:
            events = json.load(f)
    except FileNotFoundError:
        events = []

    events.append({
        "timestamp": datetime.now().isoformat(),
        "type": event_type,
        "severity": severity,
        "details": details
    })

    # Keep only last 30 days of events
    cutoff = datetime.now() - timedelta(days=30)
    events = [
        event for event in events
        if datetime.fromisoformat(event["timestamp"]) > cutoff
    ]

    with open("event_log.json", "w") as f:
        json.dump(events, f)

def get_performance_metrics() -> Dict[str, Any]:
    """Get detailed performance metrics"""
    process = psutil.Process(os.getpid())
    return {
        "memory": {
            "rss": process.memory_info().rss / 1024 / 1024,  # MB
            "vms": process.memory_info().vms / 1024 / 1024,  # MB
            "percent": process.memory_percent()
        },
        "cpu": {
            "user": process.cpu_times().user,
            "system": process.cpu_times().system,
            "percent": process.cpu_percent()
        },
        "io": {
            "read_bytes": process.io_counters().read_bytes,
            "write_bytes": process.io_counters().write_bytes
        },
        "threads": process.num_threads(),
        "connections": len(process.connections())
    } 