#!/bin/bash
# rollback_migration.sh - Safely roll back the last Alembic migration
# Usage: ./scripts/rollback_migration.sh [--force] [--steps=1]

set -e

# Configuration - adjust as needed
DB_NAME="smartdental"
BACKUP_DIR="./migration_backups"
PREVIEW_FILE="./migration_rollback_preview.sql"
MIGRATIONS_DIR="./migrations"
STEPS=1
FORCE=false

# Parse command line arguments
for i in "$@"; do
  case $i in
    --steps=*)
      STEPS="${i#*=}"
      ;;
    --force)
      FORCE=true
      ;;
    *)
      # unknown option
      ;;
  esac
done

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp for backup files
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_rollback_backup_${TIMESTAMP}.sql"

# Function to backup the database
backup_database() {
    echo "📦 Creating database backup before rollback: $BACKUP_FILE"
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

# Function to preview rollback
preview_rollback() {
    echo "🔍 Generating SQL preview of rollback..."
    cd $(dirname $0)/..
    alembic downgrade -${STEPS}:${STEPS} --sql > "$PREVIEW_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Rollback preview generated successfully!"
        echo "   Preview file: $PREVIEW_FILE"
        
        # Count the number of statements in the preview
        STATEMENT_COUNT=$(grep -c "^\s*ALTER\|^\s*CREATE\|^\s*DROP" "$PREVIEW_FILE")
        
        if [ "$STATEMENT_COUNT" -eq 0 ]; then
            echo "ℹ️ No changes will be made by this rollback."
        else
            echo "ℹ️ Preview contains approximately $STATEMENT_COUNT SQL statements."
            echo ""
            echo "Preview of the first 10 SQL statements:"
            grep -m 10 "^\s*ALTER\|^\s*CREATE\|^\s*DROP" "$PREVIEW_FILE"
            echo ""
        fi
    else
        echo "❌ Rollback preview generation failed!"
        exit 1
    fi
}

# Function to show migration information
show_migration_info() {
    echo "🧩 Current migration information:"
    cd $(dirname $0)/..
    
    # Show current revision
    echo "--- Current revision ---"
    alembic current
    
    # Get revision ID
    CURRENT_REV=$(alembic current | grep -o '([a-z0-9]\+)' | tr -d '()')
    
    # Show revision details if available
    if [ -n "$CURRENT_REV" ]; then
        echo "--- Revision details ---"
        alembic show $CURRENT_REV
        
        # Try to find the migration file
        MIGRATION_FILE=$(find $MIGRATIONS_DIR/versions -type f -exec grep -l "$CURRENT_REV" {} \;)
        if [ -n "$MIGRATION_FILE" ]; then
            echo "--- Migration file: $MIGRATION_FILE ---"
        fi
    fi
    
    # Show migration history
    echo "--- Migration history (last 5) ---"
    alembic history -r-5:
}

# Function to apply rollback
apply_rollback() {
    echo "🚀 Rolling back $STEPS migration(s)..."
    cd $(dirname $0)/..
    alembic downgrade -$STEPS
    
    if [ $? -eq 0 ]; then
        echo "✅ Rollback completed successfully!"
        
        # Verify the current revision
        echo ""
        echo "Current migration state:"
        alembic current
    else
        echo "❌ Rollback failed!"
        echo "   Consider restoring from backup: $BACKUP_FILE"
        exit 1
    fi
}

# Function to check if running in a production environment
check_production() {
    # Check environment variables
    if [ "$ENVIRONMENT" == "production" ] || [ "$APP_ENV" == "production" ]; then
        echo "⚠️ WARNING: You are rolling back a PRODUCTION database!"
        echo "This action is potentially destructive and may cause data loss."
        
        if [ "$FORCE" != true ]; then
            echo ""
            read -p "Are you ABSOLUTELY SURE you want to proceed? Type 'CONFIRM' to continue: " CONFIRM
            if [ "$CONFIRM" != "CONFIRM" ]; then
                echo "Rollback cancelled. Exiting."
                exit 0
            fi
        fi
    fi
}

# Main execution logic
echo "🔄 Alembic Migration Rollback Tool"
echo "=================================="
echo "This tool will roll back the last $STEPS migration(s)."
echo ""

# Check if running in production
check_production

# Show current migration information
show_migration_info

# Backup database
backup_database

# Preview rollback
preview_rollback

# Apply rollback
if [ "$FORCE" = true ]; then
    apply_rollback
else
    echo ""
    read -p "⚠️ Do you want to proceed with rolling back $STEPS migration(s)? (yes/no): " CONFIRM
    if [ "$CONFIRM" = "yes" ]; then
        apply_rollback
    else
        echo "❌ Rollback cancelled by user."
        exit 0
    fi
fi

echo ""
echo "✅ Rollback process complete."
echo "If you need to restore the database, use:"
echo "   psql -d $DB_NAME < $BACKUP_FILE"

exit 0 