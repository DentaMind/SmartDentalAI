import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

from backend.api.utils.anomaly_detection import AnomalyDetector

# Mock AsyncSession for testing
class MockAsyncSession:
    def __init__(self, execute_results=None):
        self.execute_results = execute_results or []
        self.execute_call_count = 0
        
    async def execute(self, query, params=None):
        # Return the next mocked result in sequence
        if self.execute_call_count < len(self.execute_results):
            result = self.execute_results[self.execute_call_count]
            self.execute_call_count += 1
            return result
        return []
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc, tb):
        pass

# Test data
MOCK_FAILED_LOGINS = [
    ("192.168.1.1", 12, datetime(2023, 1, 1, 10, 0), datetime(2023, 1, 1, 10, 15)),
    ("10.0.0.1", 5, datetime(2023, 1, 1, 11, 0), datetime(2023, 1, 1, 11, 30))
]

MOCK_USER_FAILED_LOGINS = [
    ("user123", 8, datetime(2023, 1, 1, 10, 0), datetime(2023, 1, 1, 10, 10))
]

MOCK_PATIENT_ACCESS = [
    # user_id, role, patient_count
    ("dentist1", "dentist", 35),
    ("hygienist1", "hygienist", 15)
]

MOCK_ROLE_BASELINES = [
    ("dentist", 10.5, 5.2),
    ("hygienist", 8.3, 3.1),
    ("admin", 15.2, 8.4)
]

MOCK_UNUSUAL_HOURS = [
    # user_id, role, count, patients, first, last
    ("dentist1", "dentist", 5, ["patient1", "patient2", "patient3"], 
     datetime(2023, 1, 1, 23, 30), datetime(2023, 1, 1, 23, 45))
]

@pytest.fixture
def anomaly_detector():
    """Create an AnomalyDetector instance for testing"""
    detector = AnomalyDetector()
    return detector

@pytest.mark.asyncio
async def test_detect_failed_login_anomalies(anomaly_detector):
    """Test detection of failed login anomalies"""
    # Mock session that returns our test data for failed logins
    mock_session = MockAsyncSession([
        MOCK_FAILED_LOGINS,  # For IP-based login failures
        MOCK_USER_FAILED_LOGINS  # For user-based login failures
    ])
    
    # Patch AsyncSession to return our mock
    with patch('backend.api.utils.anomaly_detection.AsyncSession', return_value=mock_session):
        # Run the detection
        results = await anomaly_detector.detect_failed_login_anomalies(timedelta(days=1))
        
        # Assert we got the expected number of anomalies
        assert len(results) == 3
        
        # Check the first result (IP-based)
        assert results[0]['type'] == 'multiple_failed_logins'
        assert results[0]['ip_address'] == '192.168.1.1'
        assert results[0]['count'] == 12
        assert results[0]['severity'] == 'high'  # High because count > 10
        
        # Check the second result (IP-based)
        assert results[1]['type'] == 'multiple_failed_logins'
        assert results[1]['ip_address'] == '10.0.0.1'
        assert results[1]['count'] == 5
        assert results[1]['severity'] == 'medium'  # Medium because count <= 10
        
        # Check the third result (user-based)
        assert results[2]['type'] == 'user_multiple_failed_logins'
        assert results[2]['user_id'] == 'user123'
        assert results[2]['count'] == 8
        assert results[2]['severity'] == 'medium'  # Medium because count <= 10

@pytest.mark.asyncio
async def test_detect_excessive_patient_access(anomaly_detector):
    """Test detection of excessive patient access anomalies"""
    # Mock session that returns our test data
    mock_session = MockAsyncSession([
        MOCK_ROLE_BASELINES,  # For role baselines
        MOCK_PATIENT_ACCESS   # For current patient access
    ])
    
    # Patch AsyncSession to return our mock
    with patch('backend.api.utils.anomaly_detection.AsyncSession', return_value=mock_session):
        # Run the detection
        results = await anomaly_detector.detect_excessive_patient_access(timedelta(days=1))
        
        # We expect one anomaly (dentist1 with 35 patients is above threshold)
        assert len(results) == 1
        
        # Check the anomaly details
        anomaly = results[0]
        assert anomaly['type'] == 'excessive_patient_access'
        assert anomaly['user_id'] == 'dentist1'
        assert anomaly['user_role'] == 'dentist'
        assert anomaly['count'] == 35
        assert anomaly['average_for_role'] == 10.5  # From mock data
        assert 'standard_deviations' in anomaly
        assert anomaly['severity'] == 'medium'  # Based on the z-score logic

@pytest.mark.asyncio
async def test_detect_unusual_access_times(anomaly_detector):
    """Test detection of unusual access times"""
    # Mock session that returns our test data
    mock_session = MockAsyncSession([
        MOCK_UNUSUAL_HOURS
    ])
    
    # Patch AsyncSession to return our mock
    with patch('backend.api.utils.anomaly_detection.AsyncSession', return_value=mock_session):
        # Run the detection
        results = await anomaly_detector.detect_unusual_access_times(timedelta(days=1))
        
        # We expect one anomaly
        assert len(results) == 1
        
        # Check the anomaly details
        anomaly = results[0]
        assert anomaly['type'] == 'unusual_hours_access'
        assert anomaly['user_id'] == 'dentist1'
        assert anomaly['user_role'] == 'dentist'
        assert anomaly['count'] == 5
        assert anomaly['unique_patients'] == 3
        assert anomaly['severity'] == 'medium'  # Medium because fewer than 5 patients

@pytest.mark.asyncio
async def test_detect_all_anomalies(anomaly_detector):
    """Test the combined detection of all anomaly types"""
    # We'll patch each individual detection method to return known results
    # This way we can test that detect_all_anomalies properly aggregates results
    
    # Define the mock return values for each detection method
    login_anomalies = [
        {"type": "multiple_failed_logins", "severity": "high", "ip_address": "192.168.1.1"}
    ]
    
    access_anomalies = [
        {"type": "excessive_patient_access", "severity": "medium", "user_id": "dentist1"}
    ]
    
    time_anomalies = [
        {"type": "unusual_hours_access", "severity": "medium", "user_id": "dentist1"}
    ]
    
    behavior_anomalies = [
        {"type": "behavioral_anomaly", "severity": "high", "user_id": "admin1"}
    ]
    
    location_anomalies = [
        {"type": "new_ip_address", "severity": "medium", "user_id": "hygienist1"}
    ]
    
    api_anomalies = [
        {"type": "api_abuse", "severity": "high", "user_id": "unknown", "ip_address": "10.0.0.5"}
    ]
    
    # Patch all the individual detection methods
    with patch.object(anomaly_detector, 'detect_failed_login_anomalies', return_value=login_anomalies), \
         patch.object(anomaly_detector, 'detect_excessive_patient_access', return_value=access_anomalies), \
         patch.object(anomaly_detector, 'detect_unusual_access_times', return_value=time_anomalies), \
         patch.object(anomaly_detector, 'detect_behavioral_anomalies', return_value=behavior_anomalies), \
         patch.object(anomaly_detector, 'detect_unusual_locations', return_value=location_anomalies), \
         patch.object(anomaly_detector, 'detect_api_abuse', return_value=api_anomalies):
        
        # Run the detection
        results = await anomaly_detector.detect_all_anomalies(timedelta(days=1))
        
        # We expect all anomalies to be included
        assert len(results) == 6
        
        # Check that high severity anomalies come first (should be sorted by severity)
        assert results[0]['severity'] == 'high'
        assert results[1]['severity'] == 'high'
        assert results[2]['severity'] == 'high'

        # Verify all anomaly types are present
        anomaly_types = [a['type'] for a in results]
        assert 'multiple_failed_logins' in anomaly_types
        assert 'excessive_patient_access' in anomaly_types
        assert 'unusual_hours_access' in anomaly_types
        assert 'behavioral_anomaly' in anomaly_types
        assert 'new_ip_address' in anomaly_types
        assert 'api_abuse' in anomaly_types

if __name__ == "__main__":
    # Run tests
    pytest.main(["-xvs", __file__]) 