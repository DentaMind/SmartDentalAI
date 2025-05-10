"""
Anomaly Detection Utilities

This module provides advanced anomaly detection for audit logs,
identifying potentially suspicious access patterns that may indicate
security risks in a HIPAA-regulated environment.
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import logging
import json
import statistics
from collections import defaultdict

from sqlalchemy import text
from ..database import AsyncSession

logger = logging.getLogger("api.security")

class AnomalyDetector:
    """
    Detects anomalies in audit logs using various statistical methods
    and pattern recognition techniques.
    """
    
    def __init__(self):
        # Default thresholds for different anomaly types
        self.thresholds = {
            # Number of failed logins within time period to trigger alert
            "failed_logins": 5,
            
            # Number of different patients accessed within time period to trigger alert
            "patient_access_count": 20,
            
            # Minimum standard deviation multiplier to consider a value anomalous
            "std_dev_multiplier": 3.0,
            
            # Unusual hours for accessing PHI (HIPAA audit focus)
            "unusual_hours_start": 22,  # 10pm
            "unusual_hours_end": 6,     # 6am
            
            # Minimum number of access attempts to consider for behavioral analysis
            "min_behavior_samples": 10
        }
        
    async def detect_all_anomalies(self, time_window: timedelta = timedelta(days=1)) -> List[Dict[str, Any]]:
        """
        Run all anomaly detection algorithms and return consolidated results
        
        Args:
            time_window: Time window to analyze (default: 1 day)
            
        Returns:
            List of detected anomalies with details
        """
        anomalies = []
        
        # Run each detection algorithm
        login_anomalies = await self.detect_failed_login_anomalies(time_window)
        access_anomalies = await self.detect_excessive_patient_access(time_window)
        time_anomalies = await self.detect_unusual_access_times(time_window)
        behavior_anomalies = await self.detect_behavioral_anomalies(time_window)
        location_anomalies = await self.detect_unusual_locations(time_window)
        api_anomalies = await self.detect_api_abuse(time_window)
        
        # Consolidate results
        anomalies.extend(login_anomalies)
        anomalies.extend(access_anomalies)
        anomalies.extend(time_anomalies)
        anomalies.extend(behavior_anomalies)
        anomalies.extend(location_anomalies)
        anomalies.extend(api_anomalies)
        
        # Sort by severity (high to low)
        anomalies.sort(key=lambda x: 0 if x.get('severity') == 'high' else 
                                     1 if x.get('severity') == 'medium' else 2)
        
        return anomalies
    
    async def detect_failed_login_anomalies(self, time_window: timedelta) -> List[Dict[str, Any]]:
        """
        Detect multiple failed login attempts from the same IP or for the same user
        
        Args:
            time_window: Time window to analyze
            
        Returns:
            List of detected anomalies with details
        """
        anomalies = []
        async with AsyncSession() as session:
            # Multiple failed logins from same IP
            failed_login_query = """
            SELECT ip_address, COUNT(*) as count, 
                   MIN(timestamp) as first_attempt,
                   MAX(timestamp) as last_attempt
            FROM audit_logs
            WHERE path LIKE '/api/auth/login%'
            AND status_code >= 400
            AND timestamp > NOW() - :time_window
            GROUP BY ip_address
            HAVING COUNT(*) >= :threshold
            """
            
            result = await session.execute(
                text(failed_login_query),
                {"time_window": time_window, "threshold": self.thresholds["failed_logins"]}
            )
            
            for ip, count, first_attempt, last_attempt in result:
                time_span = last_attempt - first_attempt
                minutes = time_span.total_seconds() / 60
                
                # Higher severity if many attempts in short time
                severity = "high" if count > 10 or minutes < 5 else "medium"
                
                anomalies.append({
                    "type": "multiple_failed_logins",
                    "ip_address": ip,
                    "count": count,
                    "first_attempt": first_attempt.isoformat(),
                    "last_attempt": last_attempt.isoformat(),
                    "timespan_minutes": round(minutes, 1),
                    "severity": severity,
                    "description": f"Multiple failed login attempts ({count}) from IP {ip} within {round(minutes, 1)} minutes"
                })
                
            # Failed logins for specific users
            user_failed_login_query = """
            SELECT user_id, COUNT(*) as count, 
                   MIN(timestamp) as first_attempt,
                   MAX(timestamp) as last_attempt
            FROM audit_logs
            WHERE path LIKE '/api/auth/login%'
            AND status_code >= 400
            AND user_id != 'anonymous'
            AND timestamp > NOW() - :time_window
            GROUP BY user_id
            HAVING COUNT(*) >= :threshold
            """
            
            result = await session.execute(
                text(user_failed_login_query),
                {"time_window": time_window, "threshold": self.thresholds["failed_logins"]}
            )
            
            for user_id, count, first_attempt, last_attempt in result:
                time_span = last_attempt - first_attempt
                minutes = time_span.total_seconds() / 60
                
                anomalies.append({
                    "type": "user_multiple_failed_logins",
                    "user_id": user_id,
                    "count": count,
                    "first_attempt": first_attempt.isoformat(),
                    "last_attempt": last_attempt.isoformat(),
                    "timespan_minutes": round(minutes, 1),
                    "severity": "high" if count > 10 else "medium",
                    "description": f"Multiple failed login attempts ({count}) for user {user_id}"
                })
                
        return anomalies
    
    async def detect_excessive_patient_access(self, time_window: timedelta) -> List[Dict[str, Any]]:
        """
        Detect users accessing an unusually high number of distinct patient records
        
        Args:
            time_window: Time window to analyze
            
        Returns:
            List of detected anomalies with details
        """
        anomalies = []
        async with AsyncSession() as session:
            # Base query: normal access patterns by role
            baseline_query = """
            SELECT user_role, AVG(patient_count) as avg_patients, 
                   STDDEV(patient_count) as stddev_patients
            FROM (
                SELECT user_id, user_role, COUNT(DISTINCT patient_id) as patient_count
                FROM audit_logs
                WHERE patient_id IS NOT NULL
                AND timestamp > NOW() - INTERVAL '30 days'
                GROUP BY user_id, user_role
            ) as user_stats
            GROUP BY user_role
            """
            
            baseline_result = await session.execute(text(baseline_query))
            role_baselines = {role: (avg, stddev) for role, avg, stddev in baseline_result if stddev is not None}
            
            # Current window query
            current_query = """
            SELECT user_id, user_role, COUNT(DISTINCT patient_id) as patients_count
            FROM audit_logs
            WHERE patient_id IS NOT NULL
            AND timestamp > NOW() - :time_window
            GROUP BY user_id, user_role
            HAVING COUNT(DISTINCT patient_id) > 5
            """
            
            current_result = await session.execute(
                text(current_query),
                {"time_window": time_window}
            )
            
            for user_id, role, patient_count in current_result:
                # If we have a baseline for this role, use it to determine if this is anomalous
                if role in role_baselines:
                    avg, stddev = role_baselines[role]
                    
                    # Z-score: how many standard deviations from the mean
                    if stddev > 0:
                        z_score = (patient_count - avg) / stddev
                        
                        if z_score > self.thresholds["std_dev_multiplier"]:
                            severity = "high" if z_score > 5 or patient_count > 50 else "medium"
                            
                            anomalies.append({
                                "type": "excessive_patient_access",
                                "user_id": user_id,
                                "user_role": role,
                                "count": patient_count,
                                "average_for_role": round(avg, 1),
                                "standard_deviations": round(z_score, 1),
                                "severity": severity,
                                "description": f"User {user_id} accessed {patient_count} different patients, which is {round(z_score, 1)} standard deviations above normal for {role} role"
                            })
                # No baseline, use absolute threshold
                elif patient_count > self.thresholds["patient_access_count"]:
                    anomalies.append({
                        "type": "many_patients_accessed",
                        "user_id": user_id,
                        "user_role": role,
                        "count": patient_count,
                        "severity": "high" if patient_count > 50 else "medium",
                        "description": f"User {user_id} accessed {patient_count} different patients in a short time period"
                    })
                    
        return anomalies
    
    async def detect_unusual_access_times(self, time_window: timedelta) -> List[Dict[str, Any]]:
        """
        Detect PHI access during unusual hours
        
        Args:
            time_window: Time window to analyze
            
        Returns:
            List of detected anomalies with details
        """
        anomalies = []
        async with AsyncSession() as session:
            # Access at unusual hours (configurable thresholds)
            unusual_hours_query = """
            SELECT user_id, user_role, COUNT(*) as count,
                   array_agg(DISTINCT patient_id) as patients,
                   MIN(timestamp) as first_access,
                   MAX(timestamp) as last_access
            FROM audit_logs
            WHERE is_phi_access = TRUE
            AND EXTRACT(HOUR FROM timestamp) >= :start_hour
            OR EXTRACT(HOUR FROM timestamp) < :end_hour
            AND timestamp > NOW() - :time_window
            GROUP BY user_id, user_role
            HAVING COUNT(*) > 3
            """
            
            result = await session.execute(
                text(unusual_hours_query),
                {
                    "start_hour": self.thresholds["unusual_hours_start"],
                    "end_hour": self.thresholds["unusual_hours_end"],
                    "time_window": time_window
                }
            )
            
            for user_id, role, count, patients, first_access, last_access in result:
                # Filter out None values from patients
                patients = [p for p in patients if p is not None]
                
                # Higher severity if accessing many different patients
                severity = "high" if len(patients) > 5 else "medium"
                
                # Create anomaly entry
                anomalies.append({
                    "type": "unusual_hours_access",
                    "user_id": user_id,
                    "user_role": role,
                    "count": count,
                    "unique_patients": len(patients),
                    "first_access": first_access.isoformat(),
                    "last_access": last_access.isoformat(),
                    "severity": severity,
                    "description": f"User {user_id} accessed PHI for {len(patients)} patients during unusual hours (after {self.thresholds['unusual_hours_start']}:00 or before {self.thresholds['unusual_hours_end']}:00)"
                })
                
        return anomalies
    
    async def detect_behavioral_anomalies(self, time_window: timedelta) -> List[Dict[str, Any]]:
        """
        Detect anomalies based on user's historical behavior patterns
        
        Args:
            time_window: Time window to analyze
            
        Returns:
            List of detected anomalies with details
        """
        anomalies = []
        async with AsyncSession() as session:
            # First get recent activity for each user
            recent_activity_query = """
            SELECT user_id, 
                   COUNT(*) as total_requests,
                   COUNT(DISTINCT patient_id) as distinct_patients,
                   COUNT(*) FILTER (WHERE is_phi_access = TRUE) as phi_accesses,
                   COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
                   AVG(duration_ms) as avg_duration
            FROM audit_logs
            WHERE timestamp > NOW() - :time_window
            AND user_id != 'anonymous'
            GROUP BY user_id
            """
            
            recent_result = await session.execute(
                text(recent_activity_query),
                {"time_window": time_window}
            )
            
            # For each user, compare to their historical baseline
            for user_id, total, distinct_patients, phi_count, error_count, avg_duration in recent_result:
                # Get historical baselines for this user
                baseline_query = """
                SELECT 
                    AVG(daily_requests) as avg_requests,
                    STDDEV(daily_requests) as stddev_requests,
                    AVG(daily_patients) as avg_patients,
                    STDDEV(daily_patients) as stddev_patients,
                    AVG(daily_phi) as avg_phi,
                    STDDEV(daily_phi) as stddev_phi,
                    AVG(daily_errors) as avg_errors,
                    STDDEV(daily_errors) as stddev_errors,
                    AVG(avg_duration) as avg_duration_overall,
                    STDDEV(avg_duration) as stddev_duration
                FROM (
                    SELECT 
                        DATE_TRUNC('day', timestamp) as day,
                        COUNT(*) as daily_requests,
                        COUNT(DISTINCT patient_id) as daily_patients,
                        COUNT(*) FILTER (WHERE is_phi_access = TRUE) as daily_phi,
                        COUNT(*) FILTER (WHERE status_code >= 400) as daily_errors,
                        AVG(duration_ms) as avg_duration
                    FROM audit_logs
                    WHERE user_id = :user_id
                    AND timestamp > NOW() - INTERVAL '30 days'
                    AND timestamp < NOW() - :time_window
                    GROUP BY DATE_TRUNC('day', timestamp)
                ) as daily_stats
                """
                
                baseline_result = await session.execute(
                    text(baseline_query),
                    {"user_id": user_id, "time_window": time_window}
                )
                
                for row in baseline_result:
                    (avg_req, stddev_req, avg_patients, stddev_patients, 
                     avg_phi, stddev_phi, avg_errors, stddev_errors,
                     avg_dur, stddev_dur) = row
                    
                    # Skip if we don't have enough data
                    if not all([avg_req, stddev_req, avg_patients, avg_phi]):
                        continue
                    
                    # Check for anomalies in each dimension
                    anomaly_dimensions = []
                    
                    # Total requests anomaly
                    if stddev_req > 0 and abs(total - avg_req) > self.thresholds["std_dev_multiplier"] * stddev_req:
                        anomaly_dimensions.append({
                            "dimension": "request_volume",
                            "current": total,
                            "average": avg_req,
                            "std_dev": stddev_req,
                            "z_score": (total - avg_req) / stddev_req
                        })
                    
                    # Patient access anomaly  
                    if (stddev_patients > 0 and distinct_patients > 0 and 
                        abs(distinct_patients - avg_patients) > self.thresholds["std_dev_multiplier"] * stddev_patients):
                        anomaly_dimensions.append({
                            "dimension": "patient_access",
                            "current": distinct_patients,
                            "average": avg_patients,
                            "std_dev": stddev_patients,
                            "z_score": (distinct_patients - avg_patients) / stddev_patients
                        })
                    
                    # PHI access anomaly
                    if stddev_phi > 0 and abs(phi_count - avg_phi) > self.thresholds["std_dev_multiplier"] * stddev_phi:
                        anomaly_dimensions.append({
                            "dimension": "phi_access",
                            "current": phi_count,
                            "average": avg_phi,
                            "std_dev": stddev_phi,
                            "z_score": (phi_count - avg_phi) / stddev_phi
                        })
                    
                    # Error count anomaly
                    if stddev_errors > 0 and error_count > 3 and abs(error_count - avg_errors) > self.thresholds["std_dev_multiplier"] * stddev_errors:
                        anomaly_dimensions.append({
                            "dimension": "error_rate",
                            "current": error_count,
                            "average": avg_errors,
                            "std_dev": stddev_errors,
                            "z_score": (error_count - avg_errors) / stddev_errors
                        })
                    
                    # Add behavioral anomaly if any dimensions are anomalous
                    if anomaly_dimensions:
                        # Calculate severity based on number of anomalous dimensions and magnitude
                        max_z_score = max([abs(dim["z_score"]) for dim in anomaly_dimensions])
                        severity = "high" if (len(anomaly_dimensions) >= 3 or max_z_score > 5) else "medium"
                        
                        # Create primary dimension description (the most anomalous one)
                        primary_dim = max(anomaly_dimensions, key=lambda d: abs(d["z_score"]))
                        description = f"User {user_id} showed unusual activity: {primary_dim['dimension']} is {abs(round(primary_dim['z_score'], 1))} standard deviations from normal"
                        
                        if len(anomaly_dimensions) > 1:
                            description += f" and {len(anomaly_dimensions)-1} other behavioral anomalies"
                        
                        anomalies.append({
                            "type": "behavioral_anomaly",
                            "user_id": user_id,
                            "severity": severity,
                            "anomalous_dimensions": len(anomaly_dimensions),
                            "dimensions": anomaly_dimensions,
                            "description": description
                        })
                    
        return anomalies
    
    async def detect_unusual_locations(self, time_window: timedelta) -> List[Dict[str, Any]]:
        """
        Detect access from unusual locations for each user
        
        Args:
            time_window: Time window to analyze
            
        Returns:
            List of detected anomalies with details
        """
        anomalies = []
        async with AsyncSession() as session:
            # First get commonly used IPs for each user
            common_ip_query = """
            SELECT user_id, 
                   ip_address,
                   COUNT(*) as access_count,
                   MIN(timestamp) as first_seen,
                   MAX(timestamp) as last_seen
            FROM audit_logs
            WHERE user_id != 'anonymous'
            AND timestamp > NOW() - INTERVAL '30 days'
            AND timestamp < NOW() - :time_window
            GROUP BY user_id, ip_address
            """
            
            historical_ips = await session.execute(
                text(common_ip_query),
                {"time_window": time_window}
            )
            
            # Build map of user's common IPs
            user_ips = defaultdict(list)
            for user_id, ip, count, first, last in historical_ips:
                user_ips[user_id].append({
                    "ip": ip,
                    "count": count,
                    "first_seen": first,
                    "last_seen": last
                })
            
            # Get recent IPs for each user
            recent_ip_query = """
            SELECT user_id, 
                   ip_address,
                   COUNT(*) as access_count,
                   MIN(timestamp) as first_seen,
                   MAX(timestamp) as last_seen,
                   bool_or(is_phi_access) as accessed_phi
            FROM audit_logs
            WHERE user_id != 'anonymous'
            AND timestamp > NOW() - :time_window
            GROUP BY user_id, ip_address
            """
            
            recent_ips = await session.execute(
                text(recent_ip_query),
                {"time_window": time_window}
            )
            
            # Check each recent IP against historical data
            for user_id, ip, count, first, last, accessed_phi in recent_ips:
                # Skip if user doesn't have enough history
                if user_id not in user_ips or not user_ips[user_id]:
                    continue
                
                # Check if this IP is in the user's history
                historical_usage = next((hist for hist in user_ips[user_id] if hist["ip"] == ip), None)
                
                # If IP not in history or very rare, it's suspicious
                if historical_usage is None:
                    severity = "high" if accessed_phi else "medium"
                    
                    anomalies.append({
                        "type": "new_ip_address",
                        "user_id": user_id,
                        "ip_address": ip,
                        "count": count,
                        "first_seen": first.isoformat(),
                        "last_seen": last.isoformat(),
                        "accessed_phi": accessed_phi,
                        "severity": severity,
                        "description": f"User {user_id} accessed the system from a new IP address ({ip})" + 
                                      (" and accessed PHI" if accessed_phi else "")
                    })
                
        return anomalies
    
    async def detect_api_abuse(self, time_window: timedelta) -> List[Dict[str, Any]]:
        """
        Detect potential API abuse (high frequency calls, scraping attempts)
        
        Args:
            time_window: Time window to analyze
            
        Returns:
            List of detected anomalies with details
        """
        anomalies = []
        async with AsyncSession() as session:
            # High frequency API calls
            high_freq_query = """
            SELECT user_id, ip_address, path, COUNT(*) as count,
                   MIN(timestamp) as first_call,
                   MAX(timestamp) as last_call
            FROM audit_logs
            WHERE timestamp > NOW() - :time_window
            AND path NOT LIKE '/api/health%'
            AND path NOT LIKE '/api/ping%'
            GROUP BY user_id, ip_address, path
            HAVING COUNT(*) > 100
            ORDER BY COUNT(*) DESC
            LIMIT 20
            """
            
            high_freq_result = await session.execute(
                text(high_freq_query),
                {"time_window": time_window}
            )
            
            for user_id, ip, path, count, first, last in high_freq_result:
                # Calculate calls per minute
                time_diff = (last - first).total_seconds() / 60
                if time_diff < 1:  # Avoid division by zero
                    time_diff = 1
                
                rate = count / time_diff
                
                # Only flag if rate is really high
                if rate > 30:  # More than 30 calls per minute
                    severity = "high" if rate > 100 else "medium"
                    
                    anomalies.append({
                        "type": "api_abuse",
                        "user_id": user_id,
                        "ip_address": ip,
                        "path": path,
                        "count": count,
                        "rate_per_minute": round(rate, 1),
                        "duration_minutes": round(time_diff, 1),
                        "severity": severity,
                        "description": f"Potential API abuse: {count} calls to {path} at {round(rate, 1)} requests/minute"
                    })
            
            # Detect API scraping (accessing many distinct endpoints in short time)
            scraping_query = """
            SELECT user_id, ip_address, COUNT(DISTINCT path) as endpoint_count,
                   MIN(timestamp) as first_call,
                   MAX(timestamp) as last_call
            FROM audit_logs
            WHERE timestamp > NOW() - :time_window
            GROUP BY user_id, ip_address
            HAVING COUNT(DISTINCT path) > 20
            ORDER BY COUNT(DISTINCT path) DESC
            LIMIT 10
            """
            
            scraping_result = await session.execute(
                text(scraping_query),
                {"time_window": time_window}
            )
            
            for user_id, ip, endpoint_count, first, last in scraping_result:
                # Calculate time span
                time_diff = (last - first).total_seconds() / 60
                
                # Check if many endpoints accessed in a short time
                if time_diff < 5 and endpoint_count > 20:
                    anomalies.append({
                        "type": "api_scraping",
                        "user_id": user_id,
                        "ip_address": ip,
                        "unique_endpoints": endpoint_count,
                        "duration_minutes": round(time_diff, 1),
                        "severity": "high" if endpoint_count > 50 else "medium",
                        "description": f"Potential API scraping: {endpoint_count} different endpoints accessed in {round(time_diff, 1)} minutes"
                    })
                
        return anomalies

# Create singleton instance
anomaly_detector = AnomalyDetector() 