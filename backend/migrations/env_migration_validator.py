"""
Environment-Aware Migration Validator

This module provides utilities to tag migrations with environment restrictions
and validate migrations before they are applied to different environments.
"""

import os
import re
import logging
from typing import List, Dict, Optional, Any, Set
from pathlib import Path
from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from alembic.runtime.migration import MigrationContext
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine

logger = logging.getLogger("env_migration_validator")

# Define environment hierarchy - higher numbers can run migrations from lower numbers
ENV_HIERARCHY = {
    "development": 10,
    "local": 10,
    "test": 20,
    "staging": 30,
    "qa": 30,
    "production": 100
}

class MigrationValidator:
    """Validates migrations based on environment tags"""
    
    def __init__(self, alembic_dir: str, migrations_dir: Optional[str] = None):
        """
        Initialize the migration validator.
        
        Args:
            alembic_dir: Directory containing alembic.ini
            migrations_dir: Directory containing migration versions (optional)
        """
        self.alembic_dir = alembic_dir
        self.migrations_dir = migrations_dir or os.path.join(alembic_dir, "migrations/versions")
        self.script_dir = None
        self.env_pattern = re.compile(r'# env: ([a-z,_]+)')
        self._initialize()
    
    def _initialize(self):
        """Initialize Alembic configuration and script directory"""
        alembic_ini = os.path.join(self.alembic_dir, "alembic.ini")
        if not os.path.exists(alembic_ini):
            raise ValueError(f"Alembic config not found at {alembic_ini}")
        
        config = Config(alembic_ini)
        self.script_dir = ScriptDirectory.from_config(config)
    
    def get_migration_environment(self, migration_path: str) -> List[str]:
        """
        Extract environment tags from a migration file.
        If no tags are found, returns ['development'] as default.
        
        Format: # env: environment1,environment2,...
        
        Args:
            migration_path: Path to migration file
            
        Returns:
            List of environment names
        """
        if not os.path.exists(migration_path):
            return ["development"]
        
        with open(migration_path, 'r') as f:
            content = f.read()
            
        match = self.env_pattern.search(content)
        if match:
            environments = [env.strip() for env in match.group(1).split(',')]
            return environments
        
        return ["development"]  # Default to development environment
    
    def get_revision_environments(self, revision_id: str) -> List[str]:
        """
        Get environments for a specific revision.
        
        Args:
            revision_id: Alembic revision ID
            
        Returns:
            List of environment names
        """
        script = self.script_dir.get_revision(revision_id)
        if not script:
            return ["development"]
        
        script_path = script.path
        return self.get_migration_environment(script_path)
    
    def can_run_in_environment(self, revision_id: str, target_env: str) -> bool:
        """
        Check if a revision can run in the target environment.
        
        Args:
            revision_id: Alembic revision ID
            target_env: Target environment name
            
        Returns:
            True if the revision can run in the target environment
        """
        if target_env not in ENV_HIERARCHY:
            logger.warning(f"Unknown environment: {target_env}")
            return False
            
        env_level = ENV_HIERARCHY[target_env]
        revision_envs = self.get_revision_environments(revision_id)
        
        for rev_env in revision_envs:
            if rev_env not in ENV_HIERARCHY:
                logger.warning(f"Unknown environment in revision {revision_id}: {rev_env}")
                continue
                
            if ENV_HIERARCHY[rev_env] <= env_level:
                return True
                
        return False
    
    def validate_migrations(self, target_env: str) -> Dict[str, Any]:
        """
        Validate all migrations for a target environment.
        
        Args:
            target_env: Target environment name
            
        Returns:
            Dictionary with validation results
        """
        if not self.script_dir:
            self._initialize()
            
        results = {
            "target_environment": target_env,
            "is_valid": True,
            "invalid_revisions": [],
            "all_revisions": []
        }
        
        # Get all revisions
        revisions = list(self.script_dir.walk_revisions())
        
        # Check each revision
        for revision in revisions:
            rev_id = revision.revision
            environments = self.get_revision_environments(rev_id)
            can_run = self.can_run_in_environment(rev_id, target_env)
            
            revision_info = {
                "revision_id": rev_id,
                "environments": environments,
                "can_run_in_target": can_run
            }
            
            results["all_revisions"].append(revision_info)
            
            if not can_run:
                results["is_valid"] = False
                results["invalid_revisions"].append(revision_info)
        
        return results
    
    def check_database(self, db_url: str, target_env: str) -> Dict[str, Any]:
        """
        Check if the current database state is compatible with the target environment.
        
        Args:
            db_url: Database connection URL
            target_env: Target environment name
            
        Returns:
            Dictionary with check results
        """
        results = {
            "target_environment": target_env,
            "is_compatible": True,
            "incompatible_revisions": [],
            "current_revision": None
        }
        
        try:
            # Connect to database
            engine = create_engine(db_url)
            with engine.connect() as conn:
                context = MigrationContext.configure(conn)
                current_rev = context.get_current_revision()
                
                results["current_revision"] = current_rev
                
                # If no revision, database is empty
                if not current_rev:
                    return results
                
                # Check if the current revision is compatible
                if not self.can_run_in_environment(current_rev, target_env):
                    results["is_compatible"] = False
                    results["incompatible_revisions"].append({
                        "revision_id": current_rev,
                        "environments": self.get_revision_environments(current_rev)
                    })
        
        except Exception as e:
            logger.error(f"Error checking database: {str(e)}")
            results["error"] = str(e)
            results["is_compatible"] = False
            
        return results

def create_migration_with_env(alembic_cfg: Config, message: str, environments: List[str], 
                              autogenerate: bool = True) -> str:
    """
    Create a new migration with environment tags.
    
    Args:
        alembic_cfg: Alembic configuration
        message: Migration message
        environments: List of environments where this migration can run
        autogenerate: Whether to autogenerate the migration
        
    Returns:
        Path to the newly created migration file
    """
    # Create the migration
    revision = command.revision(
        alembic_cfg,
        message,
        autogenerate=autogenerate
    )
    
    # Locate the newly created migration file
    script_dir = ScriptDirectory.from_config(alembic_cfg)
    # The last created revision should be our newly created one
    rev = script_dir.get_revision("head")
    if not rev:
        raise RuntimeError("Failed to find newly created revision")
    
    migration_path = rev.path
    
    # Add environment tag to the file
    with open(migration_path, 'r') as f:
        content = f.read()
    
    # Add env tag right after the Create Date line
    env_line = f"# env: {','.join(environments)}\n"
    updated_content = re.sub(
        r'(Create Date: .*\n)',
        r'\1' + env_line,
        content
    )
    
    with open(migration_path, 'w') as f:
        f.write(updated_content)
    
    return migration_path 