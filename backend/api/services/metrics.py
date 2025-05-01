from typing import List, Dict, Any
from datetime import datetime, timedelta
import psutil
import json
import os

def get_system_metrics() -> Dict[str, Any]:
    """Get current system metrics"""
    return {
        "cpu_percent": psutil.cpu_percent(),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_usage": psutil.disk_usage('/').percent
    }

def get_metric_history(metric_name: str, days: int = 7) -> List[Dict[str, Any]]:
    """Get historical metrics for the specified metric name"""
    try:
        with open(f"metrics_{metric_name}.json", "r") as f:
            history = json.load(f)
            cutoff = datetime.now() - timedelta(days=days)
            return [
                entry for entry in history 
                if datetime.fromisoformat(entry["timestamp"]) > cutoff
            ]
    except FileNotFoundError:
        return []

def save_metric(metric_name: str, value: Any):
    """Save a metric value with timestamp"""
    try:
        with open(f"metrics_{metric_name}.json", "r") as f:
            history = json.load(f)
    except FileNotFoundError:
        history = []
    
    history.append({
        "timestamp": datetime.now().isoformat(),
        "value": value
    })
    
    # Keep only last 30 days of data
    cutoff = datetime.now() - timedelta(days=30)
    history = [
        entry for entry in history 
        if datetime.fromisoformat(entry["timestamp"]) > cutoff
    ]
    
    with open(f"metrics_{metric_name}.json", "w") as f:
        json.dump(history, f)

def get_performance_metrics() -> Dict[str, Any]:
    """Get application performance metrics"""
    process = psutil.Process(os.getpid())
    return {
        "memory_usage": process.memory_info().rss / 1024 / 1024,  # MB
        "cpu_usage": process.cpu_percent(),
        "threads": process.num_threads(),
        "open_files": len(process.open_files()),
        "connections": len(process.connections())
    } 