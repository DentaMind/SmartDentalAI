from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime, timedelta
import psutil
import platform
import os
from collections import defaultdict
import json
import numpy as np
from scipy import stats

router = APIRouter()

# In-memory storage for learning metrics (replace with database in production)
learning_metrics = []
dataset_metrics = []
retraining_history = []

def get_learning_metrics() -> Dict[str, Any]:
    """Get learning metrics from the last 24 hours."""
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
            "timestamp": now.isoformat()
        }
    
    # Calculate averages
    accuracy = sum(m["accuracy"] for m in recent_metrics) / len(recent_metrics)
    precision = sum(m["precision"] for m in recent_metrics) / len(recent_metrics)
    recall = sum(m["recall"] for m in recent_metrics) / len(recent_metrics)
    f1_score = sum(m["f1_score"] for m in recent_metrics) / len(recent_metrics)
    
    # Get latest training info
    latest_metric = max(recent_metrics, key=lambda m: m["timestamp"])
    
    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1_score,
        "training_samples": latest_metric["training_samples"],
        "last_training_time": latest_metric["timestamp"],
        "timestamp": now.isoformat()
    }

def get_learning_trends() -> Dict[str, Any]:
    """Get learning trends and dataset growth metrics."""
    now = datetime.utcnow()
    one_week_ago = now - timedelta(days=7)
    
    # Filter metrics from the last week
    recent_metrics = [
        m for m in learning_metrics
        if datetime.fromisoformat(m["timestamp"]) > one_week_ago
    ]
    
    # Calculate trends
    accuracy_trend = [m["accuracy"] for m in recent_metrics]
    precision_trend = [m["precision"] for m in recent_metrics]
    recall_trend = [m["recall"] for m in recent_metrics]
    f1_trend = [m["f1_score"] for m in recent_metrics]
    
    # Calculate dataset growth
    dataset_growth = [
        {
            "timestamp": m["timestamp"],
            "total_samples": m["training_samples"],
            "new_samples": m.get("new_samples", 0),
            "data_quality": m.get("data_quality", 0.95)
        }
        for m in dataset_metrics
        if datetime.fromisoformat(m["timestamp"]) > one_week_ago
    ]
    
    # Get retraining history
    recent_retraining = [
        {
            "timestamp": r["timestamp"],
            "status": r["status"],
            "accuracy": r["accuracy"],
            "duration": r.get("duration", 0),
            "trigger": r.get("trigger", "scheduled")
        }
        for r in retraining_history
        if datetime.fromisoformat(r["timestamp"]) > one_week_ago
    ]
    
    # Calculate ingestion health
    ingestion_events = [e for e in events if e.get('type') == 'ingestion']
    ingestion_health = {
        "total_ingested": len(ingestion_events),
        "success_rate": sum(1 for e in ingestion_events if e.get('status') == 'success') / len(ingestion_events) if ingestion_events else 0,
        "avg_processing_time": sum(e.get('processing_time', 0) for e in ingestion_events) / len(ingestion_events) if ingestion_events else 0,
        "anomalies": [
            e for e in ingestion_events
            if e.get('status') == 'error' or e.get('processing_time', 0) > 5.0
        ]
    }
    
    return {
        "timestamp": now.isoformat(),
        "trends": {
            "accuracy": accuracy_trend,
            "precision": precision_trend,
            "recall": recall_trend,
            "f1_score": f1_trend
        },
        "dataset_growth": dataset_growth,
        "retraining_history": recent_retraining,
        "ingestion_health": ingestion_health
    }

@router.get("/learning/metrics")
async def get_metrics():
    """Endpoint to get learning metrics."""
    return get_learning_metrics()

@router.get("/trends")
async def get_learning_trends_endpoint():
    """Endpoint to get learning trends and dataset growth metrics."""
    return get_learning_trends()

@router.get("/dataset")
async def get_dataset_metrics_endpoint():
    """Endpoint to get dataset metrics."""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "metrics": dataset_metrics[-100:]  # Last 100 dataset metrics
    }

@router.get("/retraining")
async def get_retraining_history_endpoint():
    """Endpoint to get retraining history."""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "history": retraining_history[-50:]  # Last 50 retraining events
    }

def detect_anomalies(metrics: List[Dict[str, Any]], window_size: int = 5) -> Dict[str, Any]:
    """Enhanced anomaly detection using multiple statistical methods."""
    if len(metrics) < window_size:
        return {"anomalies": [], "trend_analysis": {}}
    
    # Extract metric values
    accuracy_values = [m["accuracy"] for m in metrics]
    precision_values = [m["precision"] for m in metrics]
    recall_values = [m["recall"] for m in metrics]
    f1_values = [m["f1_score"] for m in metrics]
    
    anomalies = []
    
    # Enhanced anomaly detection using multiple methods
    def find_anomalies(values: List[float], metric_name: str) -> List[Dict[str, Any]]:
        # Z-score method
        z_scores = np.abs(stats.zscore(values))
        
        # Moving average method
        ma = np.convolve(values, np.ones(window_size)/window_size, mode='valid')
        ma_std = np.std(values)
        
        # Seasonal decomposition (if enough data)
        if len(values) >= 24:  # At least 24 data points
            seasonal = stats.seasonal_decompose(values, period=24, model='additive')
            seasonal_resid = np.abs(seasonal.resid)
            seasonal_threshold = np.mean(seasonal_resid) + 2 * np.std(seasonal_resid)
        
        detected_anomalies = []
        for i in range(len(values)):
            anomaly_score = 0
            anomaly_reasons = []
            
            # Z-score check
            if z_scores[i] > 2.0:
                anomaly_score += 1
                anomaly_reasons.append(f"Z-score: {z_scores[i]:.2f}")
            
            # Moving average check
            if i >= window_size:
                ma_diff = abs(values[i] - ma[i-window_size])
                if ma_diff > 2 * ma_std:
                    anomaly_score += 1
                    anomaly_reasons.append(f"MA deviation: {ma_diff:.2f}")
            
            # Seasonal check
            if len(values) >= 24 and i < len(seasonal_resid):
                if seasonal_resid[i] > seasonal_threshold:
                    anomaly_score += 1
                    anomaly_reasons.append(f"Seasonal residual: {seasonal_resid[i]:.2f}")
            
            if anomaly_score >= 2:  # At least two methods detected anomaly
                detected_anomalies.append({
                    "timestamp": metrics[i]["timestamp"],
                    "metric": metric_name,
                    "value": values[i],
                    "z_score": float(z_scores[i]),
                    "ma_deviation": float(ma_diff) if i >= window_size else None,
                    "seasonal_residual": float(seasonal_resid[i]) if len(values) >= 24 and i < len(seasonal_resid) else None,
                    "severity": "high" if anomaly_score == 3 else "medium",
                    "reasons": anomaly_reasons
                })
        
        return detected_anomalies
    
    anomalies.extend(find_anomalies(accuracy_values, "accuracy"))
    anomalies.extend(find_anomalies(precision_values, "precision"))
    anomalies.extend(find_anomalies(recall_values, "recall"))
    anomalies.extend(find_anomalies(f1_values, "f1_score"))
    
    # Enhanced trend analysis
    def analyze_trend(values: List[float]) -> Dict[str, Any]:
        if len(values) < 2:
            return {"slope": 0, "trend": "stable", "confidence": 0}
        
        x = np.arange(len(values))
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, values)
        
        # Calculate confidence based on R-squared and p-value
        confidence = r_value ** 2
        trend_confidence = "high" if confidence > 0.7 else "medium" if confidence > 0.4 else "low"
        
        return {
            "slope": float(slope),
            "trend": "increasing" if slope > 0.01 else "decreasing" if slope < -0.01 else "stable",
            "confidence": trend_confidence,
            "r_squared": float(confidence),
            "p_value": float(p_value)
        }
    
    trend_analysis = {
        "accuracy": analyze_trend(accuracy_values),
        "precision": analyze_trend(precision_values),
        "recall": analyze_trend(recall_values),
        "f1_score": analyze_trend(f1_values)
    }
    
    return {
        "anomalies": sorted(anomalies, key=lambda x: x["z_score"], reverse=True),
        "trend_analysis": trend_analysis
    }

def get_historical_analysis(days: int = 30) -> Dict[str, Any]:
    """Enhanced historical analysis with seasonality detection and pattern analysis."""
    now = datetime.utcnow()
    start_date = now - timedelta(days=days)
    
    # Filter metrics for the specified period
    historical_metrics = [
        m for m in learning_metrics
        if datetime.fromisoformat(m["timestamp"]) > start_date
    ]
    
    if not historical_metrics:
        return {
            "period": f"Last {days} days",
            "analysis": {},
            "anomalies": []
        }
    
    # Calculate daily averages with enhanced metrics
    daily_metrics = defaultdict(list)
    for metric in historical_metrics:
        date = datetime.fromisoformat(metric["timestamp"]).date()
        daily_metrics[date].append(metric)
    
    daily_averages = []
    for date, metrics in daily_metrics.items():
        daily_averages.append({
            "date": date.isoformat(),
            "accuracy": np.mean([m["accuracy"] for m in metrics]),
            "precision": np.mean([m["precision"] for m in metrics]),
            "recall": np.mean([m["recall"] for m in metrics]),
            "f1_score": np.mean([m["f1_score"] for m in metrics]),
            "sample_count": sum(m["training_samples"] for m in metrics),
            "std_dev": {
                "accuracy": np.std([m["accuracy"] for m in metrics]),
                "precision": np.std([m["precision"] for m in metrics]),
                "recall": np.std([m["recall"] for m in metrics]),
                "f1_score": np.std([m["f1_score"] for m in metrics])
            }
        })
    
    # Detect seasonality patterns
    def detect_seasonality(values: List[float], period: int = 7) -> Dict[str, Any]:
        if len(values) < period * 2:
            return {"has_seasonality": False, "strength": 0}
        
        # Calculate autocorrelation
        acf = np.correlate(values, values, mode='full')[len(values)-1:]
        acf = acf / acf[0]  # Normalize
        
        # Check for significant peaks at period intervals
        seasonal_strength = np.mean([acf[i] for i in range(period, len(acf), period)])
        
        return {
            "has_seasonality": seasonal_strength > 0.5,
            "strength": float(seasonal_strength),
            "period": period
        }
    
    # Detect anomalies with enhanced analysis
    anomaly_analysis = detect_anomalies(historical_metrics)
    
    # Add seasonality detection
    seasonality = {
        "accuracy": detect_seasonality([m["accuracy"] for m in historical_metrics]),
        "precision": detect_seasonality([m["precision"] for m in historical_metrics]),
        "recall": detect_seasonality([m["recall"] for m in historical_metrics]),
        "f1_score": detect_seasonality([m["f1_score"] for m in historical_metrics])
    }
    
    return {
        "period": f"Last {days} days",
        "daily_averages": sorted(daily_averages, key=lambda x: x["date"]),
        "anomalies": anomaly_analysis["anomalies"],
        "trend_analysis": anomaly_analysis["trend_analysis"],
        "seasonality": seasonality
    }

@router.get("/anomalies")
async def get_anomalies_endpoint():
    """Endpoint to get detected anomalies in learning metrics."""
    now = datetime.utcnow()
    one_week_ago = now - timedelta(days=7)
    
    recent_metrics = [
        m for m in learning_metrics
        if datetime.fromisoformat(m["timestamp"]) > one_week_ago
    ]
    
    return detect_anomalies(recent_metrics)

@router.get("/historical/{days}")
async def get_historical_analysis_endpoint(days: int = 30):
    """Endpoint to get historical analysis of learning metrics."""
    return get_historical_analysis(days)

@router.get("/export")
async def export_metrics_endpoint():
    """Endpoint to export learning metrics."""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "metrics": learning_metrics,
        "dataset_metrics": dataset_metrics,
        "retraining_history": retraining_history
    } 