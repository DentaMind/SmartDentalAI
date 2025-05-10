import logging
import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Import your models here
from models.base import Base
from models.audit import AuditEvent
from models.treatment_plan import TreatmentPlan, TreatmentPlanProcedure
from models.ledger import LedgerEntry, Payment

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
# Add validation import
from env_migration_validator import MigrationValidator

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

def get_url():
    """Get database URL from environment variable"""
    return "postgresql+psycopg2://postgres:postgres@localhost:5432/smartdental"

# Check if we should validate migrations against environment
def get_current_environment():
    """Get the current environment from environment variables."""
    return os.environ.get("ENVIRONMENT", "development")

def should_validate_env():
    """Determine if we should validate migrations against environment."""
    # Skip validation if explicitly disabled
    return os.environ.get("ALEMBIC_VALIDATE_ENV", "true").lower() == "true"

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = get_url()

    # Validate migrations if enabled
    if should_validate_env():
        validate_environment_offline(url, context)

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def validate_environment_offline(url, context):
    """Validate migrations for the current environment in offline mode."""
    try:
        # Get the target environment
        target_env = get_current_environment()
        
        # Initialize validator
        validator = MigrationValidator(os.path.dirname(os.path.dirname(__file__)))
        
        # Get target revisions
        target_revision = context.get_context().opts.get('revision', 'head')
        
        # For offline mode, we'll validate all migrations
        results = validator.validate_migrations(target_env)
        
        if not results["is_valid"]:
            invalid_revs = [rev["revision_id"] for rev in results["invalid_revisions"]]
            logging.warning(f"⚠️ WARNING: Found {len(invalid_revs)} migrations incompatible with environment '{target_env}'")
            for rev in results["invalid_revisions"]:
                logging.warning(f"  - Revision {rev['revision_id']} is tagged for environments: {', '.join(rev['environments'])}")
            
            if os.environ.get("ALEMBIC_STRICT_ENV", "false").lower() == "true":
                raise ValueError(f"Migrations incompatible with environment '{target_env}'. Set ALEMBIC_STRICT_ENV=false to bypass.")
    except Exception as e:
        logging.error(f"Error validating migrations: {str(e)}")
        # Don't block migrations if validation fails, just warn
        if os.environ.get("ALEMBIC_STRICT_ENV", "false").lower() == "true":
            raise

def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    # Validate migrations if enabled
    if should_validate_env():
        validate_environment_online(connectable, context)

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata,
            # Enable UUID type support
            compare_type=True,
            compare_server_default=True
        )

        with context.begin_transaction():
            context.run_migrations()

def validate_environment_online(connectable, context):
    """Validate migrations for the current environment in online mode."""
    try:
        # Get the target environment
        target_env = get_current_environment()
        
        # Initialize validator
        validator = MigrationValidator(os.path.dirname(os.path.dirname(__file__)))
        
        # Check the database state
        db_url = str(connectable.engine.url)
        results = validator.check_database(db_url, target_env)
        
        if not results["is_compatible"]:
            logging.warning(f"⚠️ WARNING: Current database state is incompatible with environment '{target_env}'")
            for rev in results["incompatible_revisions"]:
                logging.warning(f"  - Revision {rev['revision_id']} is tagged for environments: {', '.join(rev['environments'])}")
            
            if os.environ.get("ALEMBIC_STRICT_ENV", "false").lower() == "true":
                raise ValueError(f"Database state incompatible with environment '{target_env}'. Set ALEMBIC_STRICT_ENV=false to bypass.")
    except Exception as e:
        logging.error(f"Error validating database state: {str(e)}")
        # Don't block migrations if validation fails, just warn
        if os.environ.get("ALEMBIC_STRICT_ENV", "false").lower() == "true":
            raise

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
