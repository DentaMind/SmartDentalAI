import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from api.main import app

client = TestClient(app)

def test_get_available_metrics():
    response = client.get("/api/metrics")
    assert response.status_code == 200
    metrics = response.json()
    assert isinstance(metrics, list)
    assert "accuracy" in metrics
    assert "precision" in metrics
    assert "recall" in metrics

def test_get_metric_details():
    metric_name = "accuracy"
    start_date = (datetime.now() - timedelta(days=7)).isoformat()
    end_date = datetime.now().isoformat()
    
    response = client.get(
        f"/api/metrics/{metric_name}",
        params={"start_date": start_date, "end_date": end_date}
    )
    assert response.status_code == 200
    
    data = response.json()
    assert "name" in data
    assert "description" in data
    assert "unit" in data
    assert "data" in data
    assert "statistics" in data
    assert "significantChanges" in data
    
    # Check statistics
    stats = data["statistics"]
    assert "mean" in stats
    assert "median" in stats
    assert "stdDev" in stats
    assert "min" in stats
    assert "max" in stats
    
    # Check data points
    assert len(data["data"]) > 0
    data_point = data["data"][0]
    assert "timestamp" in data_point
    assert "value" in data_point

def test_get_metric_details_invalid_metric():
    response = client.get("/api/metrics/invalid_metric")
    assert response.status_code == 404

def test_get_metric_correlations():
    metric_name = "accuracy"
    response = client.get(f"/api/metrics/{metric_name}/correlations")
    assert response.status_code == 200
    
    correlations = response.json()
    assert isinstance(correlations, list)
    assert len(correlations) > 0
    
    correlation = correlations[0]
    assert "metric" in correlation
    assert "correlation" in correlation
    assert isinstance(correlation["correlation"], float)
    assert -1 <= correlation["correlation"] <= 1

def test_get_metric_correlations_invalid_metric():
    response = client.get("/api/metrics/invalid_metric/correlations")
    assert response.status_code == 404 