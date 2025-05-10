#!/bin/bash
# safe_migration.sh - Safe migration script for production deployments
# Usage: ./scripts/safe_migration.sh [backup_only|preview|apply]

set -e

# Configuration - adjust as needed
DB_NAME="dentamind_db"
BACKUP_DIR="./migration_backups"
PREVIEW_FILE="./migration_preview.sql"
MIGRATIONS_DIR="./backend/migrations"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp for backup files
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_${TIMESTAMP}.sql"

# Function to backup the database
backup_database() {
    echo "📦 Creating database backup: $BACKUP_FILE"
    pg_dump "$DB_NAME" > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Database backup successful!"
        echo "   Backup file: $BACKUP_FILE"
        # Create a compressed version for storage efficiency
        gzip -f -k "$BACKUP_FILE"
        echo "   Compressed backup: ${BACKUP_FILE}.gz"
    else
        echo "❌ Database backup failed!"
        exit 1
    fi
}

# Function to preview migrations
preview_migrations() {
    echo "🔍 Generating SQL preview of pending migrations..."
    cd backend
    alembic upgrade head --sql > "$PREVIEW_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Migration preview generated successfully!"
        echo "   Preview file: $PREVIEW_FILE"
        
        # Count the number of statements in the preview
        STATEMENT_COUNT=$(grep -c "^\s*ALTER\|^\s*CREATE\|^\s*DROP" "$PREVIEW_FILE")
        
        if [ "$STATEMENT_COUNT" -eq 0 ]; then
            echo "ℹ️ No pending migrations to apply."
        else
            echo "ℹ️ Preview contains approximately $STATEMENT_COUNT SQL statements."
            echo ""
            echo "Preview of the first 10 SQL statements:"
            grep -m 10 "^\s*ALTER\|^\s*CREATE\|^\s*DROP" "$PREVIEW_FILE"
            echo ""
            echo "👉 REVIEW THIS PREVIEW CAREFULLY before applying migrations!"
        fi
    else
        echo "❌ Migration preview generation failed!"
        exit 1
    fi
}

# Function to apply migrations
apply_migrations() {
    echo "🚀 Applying migrations to database: $DB_NAME"
    cd backend
    alembic upgrade head
    
    if [ $? -eq 0 ]; then
        echo "✅ Migrations applied successfully!"
        
        # Verify the current revision
        echo ""
        echo "Current migration state:"
        alembic current
    else
        echo "❌ Migration application failed!"
        echo "   Consider restoring from backup: $BACKUP_FILE"
        exit 1
    fi
}

# Main execution logic
case "$1" in
    "backup_only")
        backup_database
        ;;
    "preview")
        backup_database
        preview_migrations
        ;;
    "apply")
        backup_database
        preview_migrations
        echo ""
        read -p "Do you want to apply these migrations? (yes/no): " CONFIRM
        if [ "$CONFIRM" = "yes" ]; then
            apply_migrations
        else
            echo "❌ Migration cancelled by user."
            exit 0
        fi
        ;;
    *)
        echo "Usage: $0 [backup_only|preview|apply]"
        echo ""
        echo "  backup_only  - Create a database backup only"
        echo "  preview      - Create a backup and generate SQL preview"
        echo "  apply        - Create a backup, generate preview, and apply migrations"
        echo ""
        echo "Example: $0 preview"
        exit 1
        ;;
esac

exit 0 