#!/bin/bash
# lint_migrations.sh - Alembic migration linter script
# Usage: ./scripts/lint_migrations.sh [all|recent|<file>]

set -e

cd "$(dirname "$0")/.."

BACKEND_DIR="./backend"
MIGRATIONS_DIR="$BACKEND_DIR/migrations/versions"
CONFIG_FILE="$BACKEND_DIR/.alemlintrc"

# Check if alemlint is installed
if ! command -v alemlint &> /dev/null; then
    echo "❌ alemlint is not installed. Please run: pip install alembic-linter"
    exit 1
fi

case "$1" in
    "all")
        echo "🔍 Linting all migration files..."
        find "$MIGRATIONS_DIR" -name "*.py" | xargs alemlint --config "$CONFIG_FILE"
        ;;
    "recent")
        echo "🔍 Linting most recent migration files (last 5)..."
        find "$MIGRATIONS_DIR" -name "*.py" | sort -r | head -n 5 | xargs alemlint --config "$CONFIG_FILE"
        ;;
    *)
        if [ -n "$1" ] && [ -f "$MIGRATIONS_DIR/$1" ]; then
            echo "🔍 Linting specific migration: $1"
            alemlint --config "$CONFIG_FILE" "$MIGRATIONS_DIR/$1"
        else
            echo "Usage: $0 [all|recent|<filename>]"
            echo ""
            echo "  all          - Lint all migration files"
            echo "  recent       - Lint 5 most recent migration files"
            echo "  <filename>   - Lint a specific migration file"
            echo ""
            echo "Example: $0 recent"
            exit 1
        fi
        ;;
esac

exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo "✅ Migration linting passed successfully!"
else
    echo "❌ Migration linting found issues. Please fix them before continuing."
    exit $exit_code
fi 