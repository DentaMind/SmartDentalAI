#!/usr/bin/env python3
"""
Create Migration Script

This script creates a new Alembic migration with environment tags.
It provides an easy way to specify which environments the migration should run in.

Usage:
  python create_migration.py --message="Add user table" --environments=development,staging
  python create_migration.py --message="Add user table" --environments=all
  python create_migration.py --message="Add user table" --no-autogenerate
"""

import os
import sys
import argparse
import logging
from pathlib import Path
from typing import List

# Add the project root to Python path
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(script_dir)
sys.path.append(root_dir)

# Import Alembic modules
from alembic.config import Config
from alembic import command

# Import project modules
from migrations.env_migration_validator import create_migration_with_env

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("create_migration")

def parse_environments(envs_string: str) -> List[str]:
    """
    Parse environment string into a list of environments.
    
    Args:
        envs_string: Comma-separated string of environments or 'all'
        
    Returns:
        List of environment names
    """
    if envs_string.lower() == "all":
        return ["development", "staging", "production"]
        
    return [env.strip() for env in envs_string.split(",") if env.strip()]

def create_migration(message: str, environments: List[str], autogenerate: bool = True) -> str:
    """
    Create a new migration with environment tags.
    
    Args:
        message: Migration message
        environments: List of environments where this migration can run
        autogenerate: Whether to autogenerate the migration
        
    Returns:
        Path to the created migration file
    """
    # Validate environments
    valid_environments = ["development", "staging", "production"]
    for env in environments:
        if env not in valid_environments:
            logger.warning(f"Unknown environment: {env}")
            logger.warning(f"Valid environments are: {', '.join(valid_environments)}")
            prompt = input(f"Continue with unknown environment '{env}'? (y/n) ")
            if prompt.lower() != "y":
                logger.info("Aborted migration creation")
                sys.exit(1)
                
    alembic_cfg = Config(os.path.join(root_dir, "alembic.ini"))
    
    try:
        # Create migration with environment tags
        migration_path = create_migration_with_env(
            alembic_cfg,
            message,
            environments,
            autogenerate=autogenerate
        )
        
        logger.info(f"Created migration: {migration_path}")
        logger.info(f"Environments: {', '.join(environments)}")
        
        return migration_path
    except Exception as e:
        logger.error(f"Error creating migration: {str(e)}")
        sys.exit(1)

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Create a new Alembic migration with environment tags")
    parser.add_argument("--message", "-m", required=True, help="Migration message")
    parser.add_argument("--environments", "-e", default="development", help="Comma-separated list of environments or 'all'")
    parser.add_argument("--no-autogenerate", action="store_true", help="Create empty migration instead of autogenerating")
    args = parser.parse_args()
    
    # Parse environments
    environments = parse_environments(args.environments)
    
    if not environments:
        logger.error("No valid environments specified")
        sys.exit(1)
        
    # Create migration
    create_migration(args.message, environments, autogenerate=not args.no_autogenerate)

if __name__ == "__main__":
    main() 