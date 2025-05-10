#!/usr/bin/env python3
"""
Create Environment-Aware Alembic Migration

This script creates a new Alembic migration and tags it with environment
restrictions, ensuring migrations can only be applied to appropriate environments.

Usage:
  python create_migration.py --message="Add new column" --envs=development,staging [--no-autogenerate]
"""

import os
import sys
import argparse
import logging
from pathlib import Path
from typing import List
from alembic.config import Config

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.migrations.env_migration_validator import create_migration_with_env, ENV_HIERARCHY

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("create_migration")

def parse_environments(env_str: str) -> List[str]:
    """Parse comma-separated environment string into a list."""
    if not env_str:
        return ["development"]
    
    envs = [env.strip() for env in env_str.split(',')]
    
    # Validate environments
    for env in envs:
        if env not in ENV_HIERARCHY:
            valid_envs = ', '.join(ENV_HIERARCHY.keys())
            raise ValueError(f"Invalid environment: {env}. Valid environments are: {valid_envs}")
    
    return envs

def display_env_hierarchy():
    """Display the environment hierarchy information."""
    print("\nEnvironment Hierarchy (lowest to highest):")
    print("------------------------------------------")
    
    # Sort environments by hierarchy value
    sorted_envs = sorted(ENV_HIERARCHY.items(), key=lambda x: x[1])
    
    for env, level in sorted_envs:
        print(f"  {env}: {level}")
    
    print("\nNOTE: Migrations tagged with a lower environment can run in higher environments,")
    print("      but not vice versa. For example, a 'development' migration can run in 'production',")
    print("      but a 'production' migration cannot run in 'development'.")
    print("\n      If you need a migration to run in multiple specific environments,")
    print("      list them all: --envs=development,staging,production\n")

def main():
    """Main function to run the migration creation script."""
    parser = argparse.ArgumentParser(description="Create an environment-aware Alembic migration")
    parser.add_argument("--message", "-m", required=True, help="Migration message")
    parser.add_argument("--envs", "-e", default="development", 
                        help="Comma-separated list of environments where this migration can run")
    parser.add_argument("--no-autogenerate", action="store_true", 
                        help="Create an empty migration instead of auto-generating")
    parser.add_argument("--show-envs", action="store_true", 
                        help="Show available environments and their hierarchy")
    args = parser.parse_args()
    
    if args.show_envs:
        display_env_hierarchy()
        return
    
    try:
        # Parse environments
        environments = parse_environments(args.envs)
        
        # Get Alembic config
        backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend'))
        alembic_cfg = Config(os.path.join(backend_dir, 'alembic.ini'))
        
        # Create migration
        logger.info(f"Creating migration: {args.message}")
        logger.info(f"Environments: {', '.join(environments)}")
        
        migration_path = create_migration_with_env(
            alembic_cfg,
            args.message,
            environments,
            not args.no_autogenerate
        )
        
        logger.info(f"Migration created: {migration_path}")
        logger.info(f"Tagged with environments: {', '.join(environments)}")
        
        # Display compatibility info
        min_env = min(environments, key=lambda e: ENV_HIERARCHY[e])
        print("\nThis migration can be applied to these environments:")
        for env, level in ENV_HIERARCHY.items():
            if level >= ENV_HIERARCHY[min_env]:
                print(f"  ✅ {env}")
            else:
                print(f"  ❌ {env}")
        
    except Exception as e:
        logger.error(f"Error creating migration: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 