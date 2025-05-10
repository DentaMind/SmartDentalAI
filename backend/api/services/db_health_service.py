"""
Database Health Check Service

This service performs integrity checks on the database to ensure all expected
tables, columns, and relationships are properly configured.
"""

import logging
import asyncio
import time
import json
import traceback
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime, timedelta
from sqlalchemy import create_engine, inspect, text, MetaData
from sqlalchemy.engine import Engine, Connection
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from ..utils.db_integrity import DatabaseIntegrityChecker
from ..models.base import Base
from ..config import settings  # Adjust import if necessary

logger = logging.getLogger(__name__)

class DatabaseHealthService:
    """Service to check and report on database health and integrity."""
    
    def __init__(self):
        self._last_check_time: Optional[datetime] = None
        self._health_data: Dict[str, Any] = {}
        self._detailed_report: Dict[str, Any] = {}
        self._is_running: bool = False
        self._lock = asyncio.Lock()
        
        # Configure frequency of checks
        self._check_interval = int(settings.DB_HEALTH_CHECK_INTERVAL 
                                 if hasattr(settings, 'DB_HEALTH_CHECK_INTERVAL') 
                                 else 3600)  # Default: 1 hour
        
        # Configure caching
        self._cache_expiry = int(settings.DB_HEALTH_CACHE_EXPIRY 
                               if hasattr(settings, 'DB_HEALTH_CACHE_EXPIRY') 
                               else 300)  # Default: 5 minutes
    
    async def get_health_status(self, db: Session, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Get the database health status. Uses cached results if available and not expired.
        
        Args:
            db: SQLAlchemy session
            force_refresh: Force a refresh of the health status
            
        Returns:
            Dictionary with health status information
        """
        # Check if we need to refresh the cache
        cache_expired = (self._last_check_time is None or
                         (datetime.now() - self._last_check_time).total_seconds() > self._cache_expiry)
                         
        if force_refresh or cache_expired:
            await self._check_health(db)
            
        return {
            **self._health_data,
            "last_check_time": self._last_check_time.isoformat() if self._last_check_time else None,
            "is_stale": (self._last_check_time is not None and
                        (datetime.now() - self._last_check_time).total_seconds() > self._check_interval)
        }
    
    async def get_detailed_report(self, db: Session, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Get a detailed health report with all validation results.
        
        Args:
            db: SQLAlchemy session
            force_refresh: Force a refresh of the report
            
        Returns:
            Dictionary with detailed health information
        """
        # Ensure health data is up to date
        await self.get_health_status(db, force_refresh)
        
        return {
            **self._detailed_report,
            "last_check_time": self._last_check_time.isoformat() if self._last_check_time else None
        }
    
    async def _check_health(self, db: Session) -> None:
        """
        Run health checks on the database and update internal state.
        Uses a lock to prevent multiple concurrent runs.
        
        Args:
            db: SQLAlchemy session
        """
        # Use a lock to prevent multiple concurrent runs
        async with self._lock:
            if self._is_running:
                logger.info("Database health check already running, skipping")
                return
                
            try:
                self._is_running = True
                logger.info("Running database health check")
                
                # Run checks
                health_data = await self._run_health_checks(db)
                detailed_checks = await self._run_detailed_checks(db)
                
                # Update state
                self._health_data = health_data
                self._detailed_report = detailed_checks
                self._last_check_time = datetime.now()
                
                logger.info(f"Database health check completed: {health_data['status']}")
                if health_data['status'] != 'healthy':
                    logger.warning(f"Database health issues found: {len(health_data['issues'])}")
                    for issue in health_data['issues'][:5]:  # Log first 5 issues
                        logger.warning(f"DB Issue: {issue}")
                
            except Exception as e:
                logger.error(f"Error running database health check: {str(e)}")
                logger.error(traceback.format_exc())
                self._health_data = {
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                }
            finally:
                self._is_running = False
    
    async def _run_health_checks(self, db: Session) -> Dict[str, Any]:
        """Run all health checks on the database."""
        start_time = time.time()
        health_data: Dict[str, Any] = {
            "status": "healthy",
            "tables": {},
            "foreign_keys": {},
            "issues": [],
            "check_duration_ms": 0
        }
        
        try:
            # Get database connection
            connection = db.connection()
            
            # Check tables exist
            tables_check = self._check_tables_exist(connection)
            health_data["tables"] = tables_check
            
            # Check foreign keys
            fk_check = self._check_foreign_keys(connection)
            health_data["foreign_keys"] = fk_check
            
            # Check indexes
            indexes_check = self._check_indexes(connection)
            health_data["indexes"] = indexes_check
            
            # Collect all issues
            issues = []
            if tables_check.get("missing_tables"):
                issues.append(f"Missing tables: {', '.join(tables_check['missing_tables'])}")
            
            if fk_check.get("broken_foreign_keys"):
                for fk in fk_check["broken_foreign_keys"]:
                    issues.append(f"Broken FK: {fk['table']}.{fk['column']} -> {fk['ref_table']}.{fk['ref_column']}")
            
            if indexes_check.get("missing_indexes"):
                for idx in indexes_check.get("missing_indexes", []):
                    issues.append(f"Missing index: {idx['table']}.{idx['column']}")
            
            health_data["issues"] = issues
            health_data["status"] = "unhealthy" if issues else "healthy"
            
        except Exception as e:
            logger.error(f"Error in database health check: {str(e)}")
            health_data["status"] = "error"
            health_data["error"] = str(e)
        
        health_data["check_duration_ms"] = int((time.time() - start_time) * 1000)
        return health_data
    
    async def _run_detailed_checks(self, db: Session) -> Dict[str, Any]:
        """
        Run detailed integrity checks using DatabaseIntegrityChecker.
        
        Args:
            db: SQLAlchemy session
            
        Returns:
            Dictionary with detailed validation results
        """
        try:
            # Create an integrity checker
            checker = DatabaseIntegrityChecker(db, Base)
            
            # Run all validations
            results = checker.validate_all()
            
            # Add additional metadata
            results["timestamp"] = datetime.now().isoformat()
            results["database_name"] = str(db.bind.url).split("/")[-1].split("?")[0]
            
            # Add stats
            stats = {
                "table_count": len(results["tables"]["actual_tables"]),
                "error_count": sum(1 for r in results.values() if isinstance(r, dict) and r.get("status") == "error"),
                "warning_count": sum(1 for r in results.values() if isinstance(r, dict) and r.get("status") == "warning")
            }
            results["stats"] = stats
            
            return results
        except Exception as e:
            logger.error(f"Error in detailed database checks: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def _check_tables_exist(self, connection: Connection) -> Dict[str, Any]:
        """
        Check if all expected tables exist in the database.
        
        Args:
            connection: SQLAlchemy connection
            
        Returns:
            Dictionary with table check results
        """
        result = {
            "status": "ok",
            "expected_tables": [],
            "actual_tables": [],
            "missing_tables": [],
            "unexpected_tables": []
        }
        
        try:
            # Get metadata from models
            metadata = Base.metadata
            
            # Get expected tables from metadata
            expected_tables = set(table.name for table in metadata.sorted_tables)
            result["expected_tables"] = sorted(list(expected_tables))
            
            # Get actual tables from database
            inspector = inspect(connection)
            actual_tables = set(inspector.get_table_names())
            result["actual_tables"] = sorted(list(actual_tables))
            
            # Find missing and unexpected tables
            missing_tables = expected_tables - actual_tables
            unexpected_tables = actual_tables - expected_tables - {"spatial_ref_sys"}  # Exclude PostGIS tables
            
            result["missing_tables"] = sorted(list(missing_tables))
            result["unexpected_tables"] = sorted(list(unexpected_tables))
            
            # Update status
            if missing_tables:
                result["status"] = "error"
            elif unexpected_tables:
                result["status"] = "warning"
                
        except Exception as e:
            logger.error(f"Error checking tables: {str(e)}")
            result["status"] = "error"
            result["error"] = str(e)
            
        return result
    
    def _check_foreign_keys(self, connection: Connection) -> Dict[str, Any]:
        """
        Check if foreign keys are valid.
        
        Args:
            connection: SQLAlchemy connection
            
        Returns:
            Dictionary with foreign key check results
        """
        result = {
            "status": "ok",
            "total_foreign_keys": 0,
            "broken_foreign_keys": []
        }
        
        try:
            # Get tables
            inspector = inspect(connection)
            tables = inspector.get_table_names()
            
            total_fks = 0
            broken_fks = []
            
            # Check each table's foreign keys
            for table in tables:
                fks = inspector.get_foreign_keys(table)
                total_fks += len(fks)
                
                for fk in fks:
                    # Skip if no referenced table
                    if not fk.get("referred_table"):
                        continue
                        
                    # Skip if the referenced table doesn't exist
                    if fk["referred_table"] not in tables:
                        broken_fks.append({
                            "table": table,
                            "column": fk["constrained_columns"][0] if fk["constrained_columns"] else None,
                            "ref_table": fk["referred_table"],
                            "ref_column": fk["referred_columns"][0] if fk["referred_columns"] else None,
                            "issue": "missing_referenced_table"
                        })
                        continue
                    
                    # Check if any constrained_columns or referred_columns are missing
                    for col in fk["constrained_columns"]:
                        if col not in [c["name"] for c in inspector.get_columns(table)]:
                            broken_fks.append({
                                "table": table,
                                "column": col,
                                "ref_table": fk["referred_table"],
                                "ref_column": fk["referred_columns"][0] if fk["referred_columns"] else None,
                                "issue": "missing_local_column"
                            })
                            
                    for col in fk["referred_columns"]:
                        if col not in [c["name"] for c in inspector.get_columns(fk["referred_table"])]:
                            broken_fks.append({
                                "table": table,
                                "column": fk["constrained_columns"][0] if fk["constrained_columns"] else None,
                                "ref_table": fk["referred_table"],
                                "ref_column": col,
                                "issue": "missing_referenced_column"
                            })
            
            result["total_foreign_keys"] = total_fks
            result["broken_foreign_keys"] = broken_fks
            
            # Update status
            if broken_fks:
                result["status"] = "error"
                
        except Exception as e:
            logger.error(f"Error checking foreign keys: {str(e)}")
            result["status"] = "error"
            result["error"] = str(e)
            
        return result
    
    def _check_indexes(self, connection: Connection) -> Dict[str, Any]:
        """
        Check if essential indexes exist.
        
        Args:
            connection: SQLAlchemy connection
            
        Returns:
            Dictionary with index check results
        """
        result = {
            "status": "ok",
            "missing_indexes": []
        }
        
        try:
            # Get tables
            inspector = inspect(connection)
            
            # Check for essential indexes on tables
            essential_indexes = [
                # Format: table_name, column_name, description, recommended
                ["patients", "id", "Primary key index", True],
                ["users", "email", "Email lookup", True],
                ["audit_logs", "timestamp", "Timestamp sorting", False]
            ]
            
            missing_indexes = []
            
            # Check each index
            for table_name, column_name, description, recommended in essential_indexes:
                # Skip if table doesn't exist
                if table_name not in inspector.get_table_names():
                    continue
                    
                # Get indexes for this table
                indexes = inspector.get_indexes(table_name)
                
                # Check if any index covers this column
                column_indexed = any(
                    column_name in idx["column_names"] for idx in indexes
                )
                
                if not column_indexed:
                    missing_indexes.append({
                        "table": table_name,
                        "column": column_name,
                        "description": description,
                        "recommended": recommended
                    })
            
            result["missing_indexes"] = missing_indexes
            
            # Update status based on missing recommended indexes
            missing_recommended = any(idx["recommended"] for idx in missing_indexes)
            if missing_recommended:
                result["status"] = "warning"
                
        except Exception as e:
            logger.error(f"Error checking indexes: {str(e)}")
            result["status"] = "error"
            result["error"] = str(e)
            
        return result

# Create a singleton instance
db_health_service = DatabaseHealthService() 