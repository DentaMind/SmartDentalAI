"""
Database Integrity Validation Utilities

This module provides utilities to check database integrity against expected schemas,
identify orphaned records, and validate data consistency.
"""

import logging
from typing import Dict, List, Any, Tuple, Optional, Set
from sqlalchemy import inspect, text, MetaData, Table, Column, ForeignKey
from sqlalchemy.engine import Engine, Connection
from sqlalchemy.orm import Session
from sqlalchemy.ext.declarative import DeclarativeMeta

logger = logging.getLogger("db_integrity")

class DatabaseIntegrityChecker:
    """
    Utility class to validate database integrity against SQLAlchemy models
    and identify potential issues.
    """
    
    def __init__(self, engine_or_session: Any, model_base: DeclarativeMeta):
        """
        Initialize the integrity checker.
        
        Args:
            engine_or_session: SQLAlchemy engine or session
            model_base: SQLAlchemy declarative base class
        """
        if hasattr(engine_or_session, 'bind'):
            # It's a session
            self.engine = engine_or_session.bind
            self.session = engine_or_session
        else:
            # It's an engine
            self.engine = engine_or_session
            self.session = None
            
        self.model_base = model_base
        self.inspector = inspect(self.engine)
        self.metadata = model_base.metadata
    
    def validate_all(self) -> Dict[str, Any]:
        """
        Run all validation checks on the database.
        
        Returns:
            Dictionary with validation results
        """
        results = {
            "tables": self.validate_tables(),
            "columns": self.validate_columns(),
            "foreign_keys": self.validate_foreign_keys(),
            "indexes": self.validate_indexes(),
            "constraints": self.validate_constraints(),
            "orphaned_records": self.check_orphaned_records() if self.session else {"status": "skipped", "error": "No session provided"}
        }
        
        # Calculate overall status
        has_errors = any(r.get("status") == "error" for r in results.values())
        has_warnings = any(r.get("status") == "warning" for r in results.values())
        
        if has_errors:
            results["status"] = "error"
        elif has_warnings:
            results["status"] = "warning"
        else:
            results["status"] = "ok"
            
        return results
    
    def validate_tables(self) -> Dict[str, Any]:
        """
        Check if all expected tables exist in the database.
        
        Returns:
            Dictionary with table validation results
        """
        result = {
            "status": "ok",
            "expected_tables": [],
            "actual_tables": [],
            "missing_tables": [],
            "unexpected_tables": []
        }
        
        # Get expected tables from models
        expected_tables = set(table.name for table in self.metadata.sorted_tables)
        result["expected_tables"] = list(expected_tables)
        
        # Get actual tables from database
        actual_tables = set(self.inspector.get_table_names())
        result["actual_tables"] = list(actual_tables)
        
        # Find missing and unexpected tables
        missing_tables = expected_tables - actual_tables
        unexpected_tables = actual_tables - expected_tables
        
        result["missing_tables"] = list(missing_tables)
        result["unexpected_tables"] = list(unexpected_tables)
        
        # Update status
        if missing_tables:
            result["status"] = "error"
        elif unexpected_tables:
            result["status"] = "warning"
            
        return result
    
    def validate_columns(self) -> Dict[str, Any]:
        """
        Check if all expected columns exist in the database tables.
        
        Returns:
            Dictionary with column validation results
        """
        result = {
            "status": "ok",
            "issues": []
        }
        
        # Iterate through all tables
        for table in self.metadata.sorted_tables:
            table_name = table.name
            
            # Skip if table doesn't exist in database
            if table_name not in self.inspector.get_table_names():
                continue
                
            # Get expected columns from model
            expected_columns = {col.name: col for col in table.columns}
            
            # Get actual columns from database
            actual_columns = {col["name"]: col for col in self.inspector.get_columns(table_name)}
            
            # Check for missing columns
            for col_name, col_obj in expected_columns.items():
                if col_name not in actual_columns:
                    result["issues"].append({
                        "table": table_name,
                        "column": col_name,
                        "issue": "missing"
                    })
                    result["status"] = "error"
            
            # Check for unexpected columns
            for col_name in actual_columns:
                if col_name not in expected_columns:
                    result["issues"].append({
                        "table": table_name,
                        "column": col_name,
                        "issue": "unexpected"
                    })
                    if result["status"] == "ok":
                        result["status"] = "warning"
                        
        return result
    
    def validate_foreign_keys(self) -> Dict[str, Any]:
        """
        Check if all expected foreign keys exist and are valid.
        
        Returns:
            Dictionary with foreign key validation results
        """
        result = {
            "status": "ok",
            "issues": []
        }
        
        # Iterate through all tables
        for table in self.metadata.sorted_tables:
            table_name = table.name
            
            # Skip if table doesn't exist in database
            if table_name not in self.inspector.get_table_names():
                continue
                
            # Get expected foreign keys from model
            expected_fks = []
            for col in table.columns:
                for fk in col.foreign_keys:
                    expected_fks.append({
                        "column": col.name,
                        "ref_table": fk.column.table.name,
                        "ref_column": fk.column.name
                    })
            
            # Get actual foreign keys from database
            actual_fks = []
            for fk in self.inspector.get_foreign_keys(table_name):
                if len(fk["constrained_columns"]) == 1 and len(fk["referred_columns"]) == 1:
                    actual_fks.append({
                        "column": fk["constrained_columns"][0],
                        "ref_table": fk["referred_table"],
                        "ref_column": fk["referred_columns"][0]
                    })
            
            # Check for missing foreign keys
            for expected in expected_fks:
                if not any(actual["column"] == expected["column"] and
                          actual["ref_table"] == expected["ref_table"] and
                          actual["ref_column"] == expected["ref_column"]
                          for actual in actual_fks):
                    result["issues"].append({
                        "table": table_name,
                        "column": expected["column"],
                        "ref_table": expected["ref_table"],
                        "ref_column": expected["ref_column"],
                        "issue": "missing"
                    })
                    result["status"] = "error"
            
            # Check for unexpected foreign keys
            for actual in actual_fks:
                if not any(expected["column"] == actual["column"] and
                          expected["ref_table"] == actual["ref_table"] and
                          expected["ref_column"] == actual["ref_column"]
                          for expected in expected_fks):
                    result["issues"].append({
                        "table": table_name,
                        "column": actual["column"],
                        "ref_table": actual["ref_table"],
                        "ref_column": actual["ref_column"],
                        "issue": "unexpected"
                    })
                    if result["status"] == "ok":
                        result["status"] = "warning"
                        
        return result
    
    def validate_indexes(self) -> Dict[str, Any]:
        """
        Check if all expected indexes exist in the database.
        
        Returns:
            Dictionary with index validation results
        """
        result = {
            "status": "ok",
            "issues": []
        }
        
        # Iterate through all tables
        for table in self.metadata.sorted_tables:
            table_name = table.name
            
            # Skip if table doesn't exist in database
            if table_name not in self.inspector.get_table_names():
                continue
                
            # Get expected indexes from model
            expected_indexes = {}
            for idx in table.indexes:
                cols = tuple(sorted(col.name for col in idx.columns))
                expected_indexes[cols] = {
                    "name": idx.name,
                    "unique": idx.unique
                }
            
            # Get actual indexes from database
            actual_indexes = {}
            for idx in self.inspector.get_indexes(table_name):
                cols = tuple(sorted(idx["column_names"]))
                actual_indexes[cols] = {
                    "name": idx["name"],
                    "unique": idx["unique"]
                }
            
            # Check for missing indexes
            for cols, idx_info in expected_indexes.items():
                if cols not in actual_indexes:
                    result["issues"].append({
                        "table": table_name,
                        "columns": list(cols),
                        "index_name": idx_info["name"],
                        "issue": "missing"
                    })
                    result["status"] = "error"
                elif actual_indexes[cols]["unique"] != idx_info["unique"]:
                    result["issues"].append({
                        "table": table_name,
                        "columns": list(cols),
                        "index_name": idx_info["name"],
                        "issue": "unique_mismatch",
                        "expected_unique": idx_info["unique"],
                        "actual_unique": actual_indexes[cols]["unique"]
                    })
                    result["status"] = "error"
                        
        return result
    
    def validate_constraints(self) -> Dict[str, Any]:
        """
        Check if all expected constraints exist in the database.
        
        Returns:
            Dictionary with constraint validation results
        """
        result = {
            "status": "ok",
            "issues": []
        }
        
        # Iterate through all tables
        for table in self.metadata.sorted_tables:
            table_name = table.name
            
            # Skip if table doesn't exist in database
            if table_name not in self.inspector.get_table_names():
                continue
                
            # Check primary key constraint
            expected_pk = [col.name for col in table.primary_key.columns]
            actual_pk = self.inspector.get_pk_constraint(table_name)["constrained_columns"]
            
            if sorted(expected_pk) != sorted(actual_pk):
                result["issues"].append({
                    "table": table_name,
                    "constraint_type": "primary_key",
                    "expected": expected_pk,
                    "actual": actual_pk,
                    "issue": "mismatch"
                })
                result["status"] = "error"
                
            # TODO: Add checks for other constraint types (unique, check) if needed
                
        return result
    
    def check_orphaned_records(self) -> Dict[str, Any]:
        """
        Check for orphaned records that violate foreign key relationships.
        This requires a session to be provided.
        
        Returns:
            Dictionary with orphaned record check results
        """
        if not self.session:
            return {
                "status": "error",
                "error": "No session provided"
            }
            
        result = {
            "status": "ok",
            "issues": []
        }
        
        # Iterate through all tables with foreign keys
        for table in self.metadata.sorted_tables:
            table_name = table.name
            
            # Skip if table doesn't exist in database
            if table_name not in self.inspector.get_table_names():
                continue
                
            # Check each foreign key
            for col in table.columns:
                for fk in col.foreign_keys:
                    # Get referenced table and column
                    ref_table = fk.column.table.name
                    ref_column = fk.column.name
                    
                    # Skip if referenced table doesn't exist
                    if ref_table not in self.inspector.get_table_names():
                        continue
                        
                    # Check for orphaned records
                    try:
                        # Use raw SQL for performance on large tables
                        sql = text(f"""
                            SELECT COUNT(*) 
                            FROM {table_name} t
                            LEFT JOIN {ref_table} r ON t.{col.name} = r.{ref_column}
                            WHERE t.{col.name} IS NOT NULL
                            AND r.{ref_column} IS NULL
                        """)
                        
                        count = self.session.execute(sql).scalar()
                        
                        if count > 0:
                            result["issues"].append({
                                "table": table_name,
                                "column": col.name,
                                "ref_table": ref_table,
                                "ref_column": ref_column,
                                "orphaned_count": count
                            })
                            result["status"] = "error"
                    except Exception as e:
                        logger.error(f"Error checking orphaned records: {str(e)}")
                        result["issues"].append({
                            "table": table_name,
                            "column": col.name,
                            "ref_table": ref_table,
                            "ref_column": ref_column,
                            "error": str(e)
                        })
                        result["status"] = "error"
                        
        return result 