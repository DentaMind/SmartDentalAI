"""
Audit Log Models

This module defines the database models for storing audit logs required for HIPAA compliance.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, 
    JSON, ForeignKey, Index, Text, func
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from pydantic import BaseModel

from ..database import Base, AsyncSession, get_async_session

class AuditLog(Base):
    """
    Database model for storing API audit logs.
    
    This model follows HIPAA requirements for access logs:
    - § 164.308(a)(1)(ii)(D): Information system activity review
    - § 164.312(b): Audit controls
    - § 164.316(b)(1): Documentation
    """
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    correlation_id = Column(String(36), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    user_id = Column(String(50), nullable=False, index=True)
    user_role = Column(String(50), nullable=False)
    ip_address = Column(String(50), nullable=False, index=True)
    method = Column(String(10), nullable=False)  # GET, POST, etc.
    path = Column(String(255), nullable=False, index=True)
    query_params = Column(JSON, nullable=True)
    status_code = Column(Integer, nullable=False, index=True)
    duration_ms = Column(Integer, nullable=False)  # Request duration in milliseconds
    request_body = Column(JSON, nullable=True)  # May be anonymized or null
    response_data = Column(JSON, nullable=True)  # May be anonymized or null
    patient_id = Column(String(50), nullable=True, index=True)  # If the request involved a patient
    is_phi_access = Column(Boolean, nullable=False, default=False, index=True)  # Accessed PHI flag
    user_agent = Column(String(255), nullable=True)
    referrer = Column(String(255), nullable=True)
    
    # Add specialized indexes for commonly queried fields
    __table_args__ = (
        # Index for HIPAA compliance queries (e.g., "all PHI access for a patient")
        Index('ix_audit_is_phi_patient', 'is_phi_access', 'patient_id'),
        # Index for security alerts (e.g., "failed logins from same IP")
        Index('ix_audit_status_ip', 'status_code', 'ip_address'),
        # Index for user activity reports
        Index('ix_audit_user_timestamp', 'user_id', 'timestamp'),
        # Index for performance monitoring
        Index('ix_audit_path_duration', 'path', 'duration_ms')
    )
    
    async def save(self):
        """Save the audit log to the database"""
        async with AsyncSession() as session:
            session.add(self)
            await session.commit()

class AuditLogCreate(BaseModel):
    """Pydantic model for creating an audit log entry"""
    correlation_id: str
    user_id: str
    user_role: str
    ip_address: str
    method: str
    path: str
    query_params: Optional[Dict[str, Any]] = None
    status_code: int
    duration_ms: int
    request_body: Optional[Dict[str, Any]] = None
    response_data: Optional[Dict[str, Any]] = None
    patient_id: Optional[str] = None
    is_phi_access: bool = False
    user_agent: Optional[str] = None
    referrer: Optional[str] = None

class AuditLogResponse(BaseModel):
    """Pydantic model for returning an audit log entry"""
    id: int
    correlation_id: str
    timestamp: datetime
    user_id: str
    user_role: str
    ip_address: str
    method: str
    path: str
    status_code: int
    duration_ms: int
    patient_id: Optional[str] = None
    is_phi_access: bool
    
    class Config:
        orm_mode = True

class AuditLogFilter(BaseModel):
    """Pydantic model for filtering audit logs"""
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    user_id: Optional[str] = None
    user_role: Optional[str] = None
    ip_address: Optional[str] = None
    path: Optional[str] = None
    status_code: Optional[int] = None
    patient_id: Optional[str] = None
    is_phi_access: Optional[bool] = None
    min_duration: Optional[int] = None  # minimum duration in ms
    max_duration: Optional[int] = None  # maximum duration in ms
    
class AuditLogStats(BaseModel):
    """Pydantic model for audit log statistics"""
    total_logs: int
    total_phi_accesses: int
    unique_users: int
    unique_patients: int
    avg_response_time: float
    status_distribution: Dict[str, int]  # Key: status code, Value: count
    top_endpoints: List[Dict[str, Any]]  # Top accessed endpoints
    phi_access_by_role: Dict[str, int]  # Key: role, Value: count of PHI accesses
    
async def get_audit_log_stats(
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    user_role: Optional[str] = None
) -> AuditLogStats:
    """Get statistics for audit logs within a time range"""
    async with AsyncSession() as session:
        query = session.query(AuditLog)
        
        # Apply time range filter if provided
        if start_time:
            query = query.filter(AuditLog.timestamp >= start_time)
        if end_time:
            query = query.filter(AuditLog.timestamp <= end_time)
        if user_role:
            query = query.filter(AuditLog.user_role == user_role)
            
        # Get total count
        total_logs = await session.execute(query.count())
        total_logs = total_logs.scalar()
        
        # Get PHI access count
        phi_query = query.filter(AuditLog.is_phi_access == True)
        total_phi = await session.execute(phi_query.count())
        total_phi = total_phi.scalar()
        
        # Get unique users count
        unique_users_query = session.query(func.count(func.distinct(AuditLog.user_id)))
        if start_time:
            unique_users_query = unique_users_query.filter(AuditLog.timestamp >= start_time)
        if end_time:
            unique_users_query = unique_users_query.filter(AuditLog.timestamp <= end_time)
        unique_users = await session.execute(unique_users_query)
        unique_users = unique_users.scalar()
        
        # Get unique patients count
        unique_patients_query = session.query(
            func.count(func.distinct(AuditLog.patient_id))
        ).filter(AuditLog.patient_id != None)
        if start_time:
            unique_patients_query = unique_patients_query.filter(AuditLog.timestamp >= start_time)
        if end_time:
            unique_patients_query = unique_patients_query.filter(AuditLog.timestamp <= end_time)
        unique_patients = await session.execute(unique_patients_query)
        unique_patients = unique_patients.scalar()
        
        # Get average response time
        avg_time_query = session.query(func.avg(AuditLog.duration_ms))
        if start_time:
            avg_time_query = avg_time_query.filter(AuditLog.timestamp >= start_time)
        if end_time:
            avg_time_query = avg_time_query.filter(AuditLog.timestamp <= end_time)
        avg_time = await session.execute(avg_time_query)
        avg_time = avg_time.scalar() or 0
        
        # Get status code distribution
        status_dist_query = session.query(
            AuditLog.status_code, func.count(AuditLog.id)
        ).group_by(AuditLog.status_code)
        if start_time:
            status_dist_query = status_dist_query.filter(AuditLog.timestamp >= start_time)
        if end_time:
            status_dist_query = status_dist_query.filter(AuditLog.timestamp <= end_time)
        status_dist_result = await session.execute(status_dist_query)
        status_distribution = {str(code): count for code, count in status_dist_result}
        
        # Get top endpoints
        top_endpoints_query = session.query(
            AuditLog.path, func.count(AuditLog.id)
        ).group_by(AuditLog.path).order_by(func.count(AuditLog.id).desc()).limit(10)
        if start_time:
            top_endpoints_query = top_endpoints_query.filter(AuditLog.timestamp >= start_time)
        if end_time:
            top_endpoints_query = top_endpoints_query.filter(AuditLog.timestamp <= end_time)
        top_endpoints_result = await session.execute(top_endpoints_query)
        top_endpoints = [{"path": path, "count": count} for path, count in top_endpoints_result]
        
        # Get PHI access by role
        phi_by_role_query = session.query(
            AuditLog.user_role, func.count(AuditLog.id)
        ).filter(AuditLog.is_phi_access == True).group_by(AuditLog.user_role)
        if start_time:
            phi_by_role_query = phi_by_role_query.filter(AuditLog.timestamp >= start_time)
        if end_time:
            phi_by_role_query = phi_by_role_query.filter(AuditLog.timestamp <= end_time)
        phi_by_role_result = await session.execute(phi_by_role_query)
        phi_by_role = {role: count for role, count in phi_by_role_result}
        
        return AuditLogStats(
            total_logs=total_logs,
            total_phi_accesses=total_phi,
            unique_users=unique_users,
            unique_patients=unique_patients,
            avg_response_time=round(avg_time, 2),
            status_distribution=status_distribution,
            top_endpoints=top_endpoints,
            phi_access_by_role=phi_by_role
        )

async def get_audit_logs(
    filter_params: AuditLogFilter,
    limit: int = 100,
    offset: int = 0
) -> List[AuditLog]:
    """Get audit logs with filtering"""
    async with AsyncSession() as session:
        query = session.query(AuditLog)
        
        # Apply filters
        if filter_params.start_time:
            query = query.filter(AuditLog.timestamp >= filter_params.start_time)
        if filter_params.end_time:
            query = query.filter(AuditLog.timestamp <= filter_params.end_time)
        if filter_params.user_id:
            query = query.filter(AuditLog.user_id == filter_params.user_id)
        if filter_params.user_role:
            query = query.filter(AuditLog.user_role == filter_params.user_role)
        if filter_params.ip_address:
            query = query.filter(AuditLog.ip_address == filter_params.ip_address)
        if filter_params.path:
            query = query.filter(AuditLog.path.like(f"%{filter_params.path}%"))
        if filter_params.status_code:
            query = query.filter(AuditLog.status_code == filter_params.status_code)
        if filter_params.patient_id:
            query = query.filter(AuditLog.patient_id == filter_params.patient_id)
        if filter_params.is_phi_access is not None:
            query = query.filter(AuditLog.is_phi_access == filter_params.is_phi_access)
        if filter_params.min_duration:
            query = query.filter(AuditLog.duration_ms >= filter_params.min_duration)
        if filter_params.max_duration:
            query = query.filter(AuditLog.duration_ms <= filter_params.max_duration)
            
        # Order by timestamp (most recent first)
        query = query.order_by(AuditLog.timestamp.desc())
        
        # Apply pagination
        query = query.limit(limit).offset(offset)
        
        # Execute query
        result = await session.execute(query)
        return list(result.scalars().all())

async def count_audit_logs(filter_params: AuditLogFilter) -> int:
    """Count audit logs with filtering"""
    async with AsyncSession() as session:
        query = session.query(func.count(AuditLog.id))
        
        # Apply filters
        if filter_params.start_time:
            query = query.filter(AuditLog.timestamp >= filter_params.start_time)
        if filter_params.end_time:
            query = query.filter(AuditLog.timestamp <= filter_params.end_time)
        if filter_params.user_id:
            query = query.filter(AuditLog.user_id == filter_params.user_id)
        if filter_params.user_role:
            query = query.filter(AuditLog.user_role == filter_params.user_role)
        if filter_params.ip_address:
            query = query.filter(AuditLog.ip_address == filter_params.ip_address)
        if filter_params.path:
            query = query.filter(AuditLog.path.like(f"%{filter_params.path}%"))
        if filter_params.status_code:
            query = query.filter(AuditLog.status_code == filter_params.status_code)
        if filter_params.patient_id:
            query = query.filter(AuditLog.patient_id == filter_params.patient_id)
        if filter_params.is_phi_access is not None:
            query = query.filter(AuditLog.is_phi_access == filter_params.is_phi_access)
        if filter_params.min_duration:
            query = query.filter(AuditLog.duration_ms >= filter_params.min_duration)
        if filter_params.max_duration:
            query = query.filter(AuditLog.duration_ms <= filter_params.max_duration)
            
        # Execute query
        result = await session.execute(query)
        return result.scalar()

async def get_recent_patient_accesses(
    patient_id: str,
    limit: int = 50
) -> List[AuditLog]:
    """Get recent accesses to a specific patient's data"""
    async with AsyncSession() as session:
        query = session.query(AuditLog).filter(
            AuditLog.patient_id == patient_id,
            AuditLog.is_phi_access == True
        ).order_by(AuditLog.timestamp.desc()).limit(limit)
        
        result = await session.execute(query)
        return list(result.scalars().all())

async def get_unusual_access_patterns() -> List[Dict[str, Any]]:
    """
    Detect unusual access patterns for potential security alerts
    
    Examples:
    - Multiple failed login attempts from same IP
    - Access to multiple patients in short timeframe
    - Access at unusual hours
    - Failed operations with same pattern
    """
    unusual_patterns = []
    
    async with AsyncSession() as session:
        # Multiple failed logins from same IP
        failed_logins_query = """
        SELECT ip_address, COUNT(*) as count
        FROM audit_logs
        WHERE path LIKE '/api/auth/login%'
        AND status_code >= 400
        AND timestamp > NOW() - INTERVAL '1 day'
        GROUP BY ip_address
        HAVING COUNT(*) >= 5
        """
        failed_login_result = await session.execute(failed_logins_query)
        
        for ip, count in failed_login_result:
            unusual_patterns.append({
                "type": "multiple_failed_logins",
                "ip_address": ip,
                "count": count,
                "severity": "high" if count > 10 else "medium"
            })
            
        # Too many patients accessed in short time
        # This could indicate data scraping
        many_patients_query = """
        SELECT user_id, COUNT(DISTINCT patient_id) as patients_count
        FROM audit_logs
        WHERE patient_id IS NOT NULL
        AND timestamp > NOW() - INTERVAL '1 hour'
        GROUP BY user_id
        HAVING COUNT(DISTINCT patient_id) > 20
        """
        many_patients_result = await session.execute(many_patients_query)
        
        for user_id, patient_count in many_patients_result:
            unusual_patterns.append({
                "type": "many_patients_accessed",
                "user_id": user_id,
                "count": patient_count,
                "severity": "high" if patient_count > 50 else "medium"
            })
            
        # Access at unusual hours (between 11pm-5am)
        # This depends on your practice's hours
        unusual_hours_query = """
        SELECT user_id, COUNT(*) as count
        FROM audit_logs
        WHERE is_phi_access = TRUE
        AND EXTRACT(HOUR FROM timestamp) BETWEEN 23 AND 5
        AND timestamp > NOW() - INTERVAL '1 day'
        GROUP BY user_id
        HAVING COUNT(*) > 5
        """
        unusual_hours_result = await session.execute(unusual_hours_query)
        
        for user_id, count in unusual_hours_result:
            unusual_patterns.append({
                "type": "unusual_hours_access",
                "user_id": user_id, 
                "count": count,
                "severity": "medium"
            })
            
    return unusual_patterns 