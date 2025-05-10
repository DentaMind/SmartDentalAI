#!/usr/bin/env python3
"""
Database Health Check Script

This script performs integrity checks on the database and sends alerts
if any issues are found. It can be run as a cronjob or scheduled task.

Usage:
  python db_health_check.py --slack-webhook=URL [--env=production]
"""

import os
import sys
import json
import argparse
import logging
import requests
from datetime import datetime
from typing import Dict, List, Any, Optional
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("db_health_check")

# Default configuration
DEFAULT_CONFIG = {
    "expected_tables": [
        "alembic_version", "users", "patients", "audit_logs", 
        "diagnostic_logs", "treatment_logs", "feedback_logs",
        "educational_content", "content_engagement"
    ],
    "expected_indexes": [
        ["audit_logs", "request_id"],
        ["diagnostic_logs", "request_id"],
        ["treatment_logs", "request_id"],
        ["feedback_logs", "request_id"],
        ["users", "email"],
        ["patients", "id"]
    ]
}

def get_db_connection_string() -> str:
    """Get database connection string from environment or config"""
    env = os.environ.get("ENVIRONMENT", "development")
    
    # In a real implementation, you would use a secure way to retrieve credentials
    if env == "production":
        return os.environ.get("DATABASE_URL", "postgresql://user:password@localhost:5432/dentamind_db")
    else:
        return os.environ.get("DATABASE_URL", "postgresql://user:password@localhost:5432/dentamind_db")

def check_tables_exist(engine: Engine, expected_tables: List[str]) -> Dict[str, Any]:
    """Check that all expected tables exist in the database."""
    logger.info("Checking tables...")
    
    inspector = inspect(engine)
    actual_tables = set(inspector.get_table_names())
    expected_tables_set = set(expected_tables)
    
    missing_tables = expected_tables_set - actual_tables
    unexpected_tables = actual_tables - expected_tables_set
    
    result = {
        "expected_tables": sorted(list(expected_tables_set)),
        "actual_tables": sorted(list(actual_tables)),
        "missing_tables": sorted(list(missing_tables)),
        "unexpected_tables": sorted(list(unexpected_tables)),
        "status": "healthy" if not missing_tables else "unhealthy"
    }
    
    if missing_tables:
        logger.warning(f"Missing tables: {', '.join(missing_tables)}")
    
    return result

def check_foreign_keys(engine: Engine) -> Dict[str, Any]:
    """Check foreign key relationships for integrity."""
    logger.info("Checking foreign keys...")
    
    broken_fks = []
    all_fks = []
    
    try:
        with engine.connect() as connection:
            # Get all foreign key relationships
            result = connection.execute(text("""
                SELECT
                    tc.table_name, 
                    kcu.column_name, 
                    ccu.table_name AS ref_table_name,
                    ccu.column_name AS ref_column_name
                FROM 
                    information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu 
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY';
            """))
            
            rows = result.fetchall()
            
            for row in rows:
                fk_info = {
                    "table": row[0],
                    "column": row[1],
                    "ref_table": row[2],
                    "ref_column": row[3]
                }
                all_fks.append(fk_info)
                
                # Check if the relationship is valid
                # Simple check: verify referenced table exists
                inspector = inspect(engine)
                if row[2] not in inspector.get_table_names():
                    fk_info["issue"] = f"Referenced table {row[2]} does not exist"
                    broken_fks.append(fk_info)
                    continue
                
                # Verify referenced column exists in referenced table
                columns = [col["name"] for col in inspector.get_columns(row[2])]
                if row[3] not in columns:
                    fk_info["issue"] = f"Referenced column {row[2]}.{row[3]} does not exist"
                    broken_fks.append(fk_info)
                    continue
        
        if broken_fks:
            logger.warning(f"Found {len(broken_fks)} broken foreign keys")
            
        return {
            "total_foreign_keys": len(all_fks),
            "broken_foreign_keys": broken_fks,
            "status": "healthy" if not broken_fks else "unhealthy"
        }
    
    except Exception as e:
        logger.error(f"Error checking foreign keys: {str(e)}")
        return {
            "error": str(e),
            "status": "error"
        }

def check_indexes(engine: Engine, expected_indexes: List[List[str]]) -> Dict[str, Any]:
    """Check database indexes for expected indexes."""
    logger.info("Checking indexes...")
    
    inspector = inspect(engine)
    all_indexes = {}
    missing_indexes = []
    
    try:
        # Get all tables
        tables = inspector.get_table_names()
        
        # Collect all indexes
        for table in tables:
            indexes = inspector.get_indexes(table)
            all_indexes[table] = indexes
            
            # Check for missing indexes
            for expected_table, expected_column in expected_indexes:
                if expected_table == table:
                    found = False
                    for idx in indexes:
                        # Check if index covers this column (could be multi-column)
                        if expected_column in idx["column_names"]:
                            found = True
                            break
                    
                    if not found:
                        missing_indexes.append({
                            "table": expected_table,
                            "column": expected_column
                        })
        
        if missing_indexes:
            logger.warning(f"Found {len(missing_indexes)} missing indexes")
            
        return {
            "missing_indexes": missing_indexes,
            "status": "healthy" if not missing_indexes else "unhealthy"
        }
    
    except Exception as e:
        logger.error(f"Error checking indexes: {str(e)}")
        return {
            "error": str(e),
            "status": "error"
        }

def run_health_checks(engine: Engine, config: Dict[str, Any]) -> Dict[str, Any]:
    """Run all health checks on the database."""
    logger.info("Running database health checks...")
    start_time = datetime.utcnow()
    
    health_data = {
        "status": "healthy",
        "tables": {},
        "foreign_keys": {},
        "indexes": {},
        "issues": [],
        "timestamp": start_time.isoformat(),
        "environment": os.environ.get("ENVIRONMENT", "development")
    }
    
    try:
        # Check tables exist
        tables_check = check_tables_exist(engine, config["expected_tables"])
        health_data["tables"] = tables_check
        
        # Check foreign keys
        fk_check = check_foreign_keys(engine)
        health_data["foreign_keys"] = fk_check
        
        # Check indexes
        indexes_check = check_indexes(engine, config["expected_indexes"])
        health_data["indexes"] = indexes_check
        
        # Collect all issues
        issues = []
        if tables_check.get("missing_tables"):
            for table in tables_check["missing_tables"]:
                issues.append(f"Missing table: {table}")
        
        if fk_check.get("broken_foreign_keys"):
            for fk in fk_check["broken_foreign_keys"]:
                issues.append(f"Broken FK: {fk['table']}.{fk['column']} -> {fk['ref_table']}.{fk['ref_column']}")
        
        if indexes_check.get("missing_indexes"):
            for idx in indexes_check["missing_indexes"]:
                issues.append(f"Missing index: {idx['table']}.{idx['column']}")
        
        health_data["issues"] = issues
        health_data["status"] = "unhealthy" if issues else "healthy"
        
    except Exception as e:
        logger.error(f"Error in database health check: {str(e)}")
        health_data["status"] = "error"
        health_data["error"] = str(e)
        health_data["issues"] = [f"Error performing health checks: {str(e)}"]
    
    end_time = datetime.utcnow()
    health_data["duration_seconds"] = (end_time - start_time).total_seconds()
    
    return health_data

def send_slack_alert(webhook_url: str, health_data: Dict[str, Any]) -> bool:
    """Send an alert to Slack if there are database health issues."""
    if not webhook_url or health_data["status"] == "healthy":
        return True
    
    environment = health_data["environment"].upper()
    issue_count = len(health_data["issues"])
    
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f"⚠️ DATABASE HEALTH ALERT: {issue_count} issue(s) found in {environment}",
                "emoji": True
            }
        },
        {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": f"*Environment:*\n{environment}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Time:*\n{health_data['timestamp']}"
                }
            ]
        },
        {
            "type": "divider"
        }
    ]
    
    # Add issues section
    if health_data["issues"]:
        issues_text = "\n".join([f"• {issue}" for issue in health_data["issues"][:10]])
        if len(health_data["issues"]) > 10:
            issues_text += f"\n_(and {len(health_data['issues']) - 10} more issues)_"
        
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*Issues found:*\n{issues_text}"
            }
        })
    
    # Add details section
    details = []
    if health_data["tables"].get("missing_tables"):
        details.append(f"*Missing tables:* {len(health_data['tables']['missing_tables'])}")
    if health_data["foreign_keys"].get("broken_foreign_keys"):
        details.append(f"*Broken foreign keys:* {len(health_data['foreign_keys']['broken_foreign_keys'])}")
    if health_data["indexes"].get("missing_indexes"):
        details.append(f"*Missing indexes:* {len(health_data['indexes']['missing_indexes'])}")
    
    if details:
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Summary:*\n" + "\n".join(details)
            }
        })
    
    # Add call-to-action button
    blocks.append({
        "type": "actions",
        "elements": [
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "View in Dashboard",
                    "emoji": True
                },
                "url": f"https://dentamind.com/admin/dashboard?tab=database",
                "style": "primary"
            }
        ]
    })
    
    # Prepare payload
    payload = {
        "text": f"Database Health Alert: {issue_count} issue(s) found in {environment}",
        "blocks": blocks
    }
    
    try:
        response = requests.post(webhook_url, json=payload)
        response.raise_for_status()
        logger.info(f"Slack notification sent successfully: {response.status_code}")
        return True
    except Exception as e:
        logger.error(f"Error sending Slack notification: {str(e)}")
        return False

def main():
    """Main function to run the health check script."""
    parser = argparse.ArgumentParser(description="Database Health Check Script")
    parser.add_argument("--slack-webhook", help="Slack webhook URL for notifications")
    parser.add_argument("--env", default="development", help="Environment (development, staging, production)")
    parser.add_argument("--output", help="Output file to save results (JSON)")
    parser.add_argument("--config", help="Configuration file path (JSON)")
    args = parser.parse_args()
    
    # Set environment variable
    os.environ["ENVIRONMENT"] = args.env
    
    # Load configuration
    config = DEFAULT_CONFIG
    if args.config:
        try:
            with open(args.config, "r") as f:
                config.update(json.load(f))
        except Exception as e:
            logger.error(f"Error loading configuration: {str(e)}")
    
    # Get database connection
    db_url = get_db_connection_string()
    
    try:
        # Create database engine
        engine = create_engine(db_url)
        
        # Run health checks
        health_data = run_health_checks(engine, config)
        
        # Output results
        if args.output:
            with open(args.output, "w") as f:
                json.dump(health_data, f, indent=2)
            logger.info(f"Health check results saved to {args.output}")
        
        # Send Slack alert if issues found
        if args.slack_webhook and health_data["status"] != "healthy":
            send_slack_alert(args.slack_webhook, health_data)
        
        # Print summary
        summary = f"Database Health Check: {health_data['status'].upper()}"
        if health_data["issues"]:
            summary += f", {len(health_data['issues'])} issue(s) found"
        logger.info(summary)
        
        # Exit with appropriate code
        if health_data["status"] == "error":
            sys.exit(2)
        elif health_data["status"] == "unhealthy":
            sys.exit(1)
        else:
            sys.exit(0)
            
    except Exception as e:
        logger.error(f"Error running health check: {str(e)}")
        if args.slack_webhook:
            # Send critical error alert
            error_data = {
                "status": "error",
                "environment": os.environ.get("ENVIRONMENT", "development"),
                "timestamp": datetime.utcnow().isoformat(),
                "issues": [f"Critical error running health check: {str(e)}"]
            }
            send_slack_alert(args.slack_webhook, error_data)
        sys.exit(2)

if __name__ == "__main__":
    main() 