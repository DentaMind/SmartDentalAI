# DentaMind Database Migration Strategy

## Overview

This document outlines DentaMind's approach to database migrations, with a focus on maintaining data integrity, minimizing downtime, and ensuring safe schema evolution. As a healthcare-adjacent application, our migration strategy prioritizes reliability and patient data safety.

## Key Principles

1. **Zero Data Loss**: Every migration must be designed to prevent any possibility of data loss
2. **Minimal Downtime**: Production migrations should minimize or eliminate service interruptions
3. **Verification**: All schema changes must be tested in staging before production deployment
4. **Rollback Capability**: Every migration must have a tested downgrade path
5. **Auditability**: All schema changes must be trackable and documented

## Technology Stack

- **ORM**: SQLAlchemy
- **Migration Tool**: Alembic
- **Database**: PostgreSQL
- **CI/CD**: GitHub Actions

## Development Workflow

### Creating Migrations

When making changes to database models:

1. Update SQLAlchemy models in `backend/api/models/`
2. Generate migration script:
   ```bash
   cd backend
   alembic revision --autogenerate -m "descriptive_message"
   ```
3. Review the generated migration file in `backend/migrations/versions/`
   - Ensure it correctly captures all intended changes
   - Add any data migrations that aren't auto-generated
4. Apply the migration locally:
   ```bash
   alembic upgrade head
   ```
5. Test the application with the new schema
6. Commit both model changes and migration files

### Reviewing Migrations

Before approving PRs with migrations:

1. Check that the migration has a single, specific purpose
2. Verify the migration has both `upgrade()` and `downgrade()` functions
3. Ensure large-table operations follow the staged approach (detailed below)
4. Confirm the migration uses the right column types, indices, and constraints
5. Test the migration on a copy of production data if possible

## Production Deployment Strategy

### Pre-Deployment Checklist

- [ ] Migration has been tested in staging environment
- [ ] Schema comparison between staging and production shows expected differences only
- [ ] Full backup of production database is available
- [ ] Team is notified of the upcoming migration
- [ ] Adequate time window is allocated if downtime is expected

### Deployment Process

1. **Backup**: Create a pre-migration backup
   ```bash
   pg_dump your_db > backups/pre_migration_$(date +%F).sql
   ```

2. **Apply**: Run the migration with monitoring
   ```bash
   alembic upgrade head
   ```

3. **Verify**: Check the migration succeeded
   ```bash
   alembic current
   ```

4. **Test**: Run critical API tests against the new schema

5. **Monitor**: Observe application performance after migration

### Rollback Procedure

If issues are detected:

1. Stop the application to prevent further writes
2. Run `alembic downgrade -1` to revert the last migration
3. Verify schema integrity
4. If issues persist, restore from the pre-migration backup
5. Restart the application
6. Notify the team of the rollback

## Large-Table Migration Pattern

For migrations affecting large tables or requiring potentially blocking operations:

### 1. Additive Phase
```python
# Migration 1
def upgrade():
    op.add_column('large_table', sa.Column('new_column', sa.String(), nullable=True))

def downgrade():
    op.drop_column('large_table', 'new_column')
```

### 2. Data Backfill Phase
```python
# Migration 2
def upgrade():
    # Use batch processing to avoid locks
    connection = op.get_bind()
    # Example backfill logic:
    connection.execute("""
        UPDATE large_table
        SET new_column = derived_value_or_transformation
        WHERE new_column IS NULL
    """)

def downgrade():
    connection = op.get_bind()
    connection.execute("UPDATE large_table SET new_column = NULL")
```

### 3. Constraint/Index Phase
```python
# Migration 3
def upgrade():
    # Add non-nullable constraint, indexes, etc.
    op.alter_column('large_table', 'new_column', nullable=False)
    op.create_index('ix_large_table_new_column', 'large_table', ['new_column'])

def downgrade():
    op.drop_index('ix_large_table_new_column')
    op.alter_column('large_table', 'new_column', nullable=True)
```

### 4. Cleanup Phase
```python
# Migration 4 - after application is fully using new_column
def upgrade():
    op.drop_column('large_table', 'old_column')

def downgrade():
    op.add_column('large_table', sa.Column('old_column', sa.String(), nullable=True))
    # Note: Data restoration not possible in this simple example
```

## CI/CD Integration

Our CI pipeline enforces migration integrity with these checks:

### Pull Request Checks

```yaml
# Migration validation in CI
- name: Verify migration chain integrity
  run: |
    cd backend
    # Configure test DB connection
    export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/test_db"
    
    # Test upgrade path
    alembic upgrade head
    
    # Test downgrade path
    alembic downgrade base
    
    # Test upgrade again to verify full cycle works
    alembic upgrade head
```

### Pre-Commit Hooks

We use Git hooks to prevent accidental deletion of migration files:

```bash
# .githooks/pre-commit
#!/bin/bash

# Check if any migration files are being deleted
deleted_migrations=$(git diff --cached --name-only --diff-filter=D | grep 'backend/migrations/versions/')

if [ -n "$deleted_migrations" ]; then
  echo "⛔ ERROR: You're attempting to delete migration files:"
  echo "$deleted_migrations"
  echo "This is not allowed. Please keep all migration history intact."
  exit 1
fi

exit 0
```

## Common Issues and Solutions

### Migration Chain Breaks

**Symptoms**:
- `KeyError` when running Alembic commands
- References to missing migration revisions

**Solutions**:
1. Never delete migration files from version control
2. If a migration file is missing, recreate it with the same revision ID
3. In development, if chain is irreparably broken, create a fresh baseline migration:
   ```bash
   # Backup existing migrations
   mkdir -p backend/migrations/backup
   cp -r backend/migrations/versions/* backend/migrations/backup/
   
   # Remove all existing migration versions
   rm -rf backend/migrations/versions/*
   
   # Create a fresh base migration
   alembic revision --autogenerate -m "reset: fresh migration base"
   ```

### Migration Conflicts

**Symptoms**:
- Multiple heads reported by `alembic heads`
- Branches in the migration tree

**Solutions**:
1. Create a merge migration:
   ```bash
   alembic merge -m "merge_heads" head1 head2
   ```
2. Prevent future conflicts by coordinating migrations or using feature branching

## Monitoring and Observability

- Database schema version is logged at application startup
- Schema drift detection runs weekly
- Migration execution time and errors are logged to a dedicated migration log
- All schema changes are tracked in version control with author attribution

## Conclusion

Following these guidelines ensures that our database migrations are safe, predictable, and maintainable. This strategy supports DentaMind's commitment to reliability and data integrity while allowing for continuous improvement of our data model.

## Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) 