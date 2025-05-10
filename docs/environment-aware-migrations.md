# Environment-Aware Migrations

This document covers the environment-aware migration system implemented in DentaMind, which prevents development migrations from accidentally being applied to production environments.

## Overview

The environment-aware migration system adds environment tags to Alembic migrations, creating a hierarchy of environments where migrations can only flow upward (from development to production) but not downward (from production to development).

This ensures:

1. Development-only migrations never reach production by accident
2. Production-ready migrations can be safely tested in development first
3. Environment-specific migrations are clearly marked and validated

## Environment Hierarchy

The system defines a hierarchy of environments:

| Environment | Level | Description |
|-------------|-------|-------------|
| development | 10    | Local development environment |
| local       | 10    | Equivalent to development |
| test        | 20    | Testing/CI environment |
| staging     | 30    | Pre-production staging |
| qa          | 30    | Quality assurance environment |
| production  | 100   | Production environment |

Migrations tagged with a lower-level environment can run in higher-level environments, but not vice versa. For example:

- A migration tagged with `development` can run in all environments (dev, test, staging, production)
- A migration tagged with `production` can only run in the production environment

## Creating Environment-Aware Migrations

Use the provided script to create environment-aware migrations:

```bash
# Create a migration that can run in any environment (dev to prod)
./scripts/create_migration.py --message="Add email column" --envs=development

# Create a migration that can only run in staging and production
./scripts/create_migration.py --message="Add GDPR tracking" --envs=staging,production

# Create a production-only migration
./scripts/create_migration.py --message="Encrypt sensitive data" --envs=production

# See available environments and hierarchy
./scripts/create_migration.py --show-envs
```

The script will:

1. Create an Alembic migration
2. Tag it with the specified environments
3. Display which environments the migration can run in

## How It Works

Environment tagging works by adding a special comment to migration files:

```python
"""Add email column

Revision ID: a1b2c3d4e5f6
Revises: 9z8y7x6w5v4
Create Date: 2023-01-01 12:00:00.000000
# env: development,staging,production
"""
```

When migrations are applied, the system checks if the current environment (from `ENVIRONMENT` environment variable) is compatible with the migration's environments.

## Configuration Options

The following environment variables control behavior:

| Variable           | Default | Description |
|--------------------|---------|-------------|
| ENVIRONMENT        | development | Current environment |
| ALEMBIC_VALIDATE_ENV | true | Whether to validate environment compatibility |
| ALEMBIC_STRICT_ENV | false | If true, blocks incompatible migrations with an error |

## Commands and Tools

### Create an Environment-Aware Migration

```bash
./scripts/create_migration.py --message="Add new column" --envs=development,staging
```

### Apply Migrations While Validating Environment

```bash
# Set environment (default is development)
export ENVIRONMENT=production

# Block incompatible migrations (instead of just warning)
export ALEMBIC_STRICT_ENV=true

# Run normal Alembic commands
cd backend
alembic upgrade head
```

### Skip Environment Validation (Emergency Only)

```bash
# Disable environment validation entirely
export ALEMBIC_VALIDATE_ENV=false

# Apply migrations
alembic upgrade head
```

## Best Practices

1. **Tag new migrations appropriately**:
   - Most features should be tagged as `development` to flow through all environments
   - Environment-specific changes (like encryption in prod) should be tagged accordingly

2. **Monitor migration environments**:
   - Review environments when approving PRs with migrations
   - Ensure staging/production migrations have appropriate review

3. **Never bypass validation in production**:
   - The validation system is a safeguard; bypassing it should be a rare exception

## Troubleshooting

### Environment Mismatch Error

If you see an error like:

```
WARNING: Current database state is incompatible with environment 'production'
```

Options:
1. Ensure you're running in the correct environment (`ENVIRONMENT` variable)
2. Evaluate if the migration is truly needed in this environment
3. For emergencies, you can bypass with `ALEMBIC_VALIDATE_ENV=false`

### Adding Production Migrations to a Development Database

If you need to test production-targeted migrations in a development environment:

```bash
# Temporarily override the environment check
ALEMBIC_VALIDATE_ENV=false alembic upgrade head
``` 