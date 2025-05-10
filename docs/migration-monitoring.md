# Database Migration Monitoring System

This document covers the migration monitoring and safety systems implemented in DentaMind.

## Overview

DentaMind uses Alembic for database migrations. To ensure database integrity and prevent issues like broken migration chains, we've implemented:

1. Automated migration checks in CI/CD
2. Migration linting for quality control
3. Real-time monitoring in the admin dashboard
4. Safe migration application scripts for production
5. Optional automatic migrations in development

## Components

### 1. Migration Linting

We use `alembic-linter` to validate migrations for common issues:

```bash
# Install the linter
pip install alembic-linter

# Run linting on all migrations
./scripts/lint_migrations.sh all

# Run linting on recent migrations only
./scripts/lint_migrations.sh recent

# Run linting on a specific migration
./scripts/lint_migrations.sh my_migration_file.py
```

The linter checks for:
- Missing downgrade paths
- Dangerous operations (dropping columns without defaults)
- Missing operation comments
- Raw SQL without downgrade paths
- And more...

### 2. Migration Status Indicator

The admin dashboard includes a migration status indicator that shows:
- Current database revision
- Head revision(s) from Alembic
- Whether the database is up to date
- Warning for multiple heads
- Full migration history

### 3. Safe Migration Scripts

For production deployments, use:

```bash
# Preview migrations
./scripts/safe_migration.sh preview

# Apply migrations (includes backup)
./scripts/safe_migration.sh apply
```

This script:
1. Creates a database backup before any changes
2. Generates a SQL preview for review
3. Applies migrations with confirmation
4. Handles errors gracefully

### 4. Automated Migration Checks

Git hooks and GitHub Actions ensure:
- No migration can be committed without `down_revision`
- Multiple heads trigger a warning
- Migrations with TODOs/FIXMEs are rejected

### 5. Auto-Migration in Development

In development environments, you can enable auto-migration:

```
# .env file
ENVIRONMENT=development
AUTO_MIGRATE=true
```

When enabled, the application will run `alembic upgrade head` on startup, with results logged but not blocking application startup.

## Best Practices

1. **Never** commit a migration without `down_revision`
2. Use `alembic merge` to resolve multiple heads
3. Always include downgrade paths
4. Run the linter before committing migrations
5. In production, always review the SQL preview before applying

## Troubleshooting

### Multiple Heads

If you see "Multiple Heads" warning:

```bash
alembic heads # To see all heads
alembic merge -m "Merge migration heads" heads  # To merge them
```

### Broken Chain

If a migration references a non-existent revision:

1. Identify the broken migration
2. Remove it (if it's not applied to production)
3. Or fix its `down_revision` to point to a valid revision
4. Create a merge migration if needed 