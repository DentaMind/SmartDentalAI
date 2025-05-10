#!/bin/bash

# Script to clean sensitive files from Git history
echo "🧹 Git History Cleanup for Exposed Secrets"
echo "=========================================="
echo "This script will help you remove sensitive files from Git history."
echo "⚠️  WARNING: This will rewrite Git history. Make sure all team members are aware!"
echo ""

# Check if BFG is installed
if ! command -v bfg &> /dev/null; then
    echo "❌ BFG not found. Please install BFG Repo Cleaner first."
    echo "For macOS: brew install bfg"
    echo "Or download from: https://rtyley.github.io/bfg-repo-cleaner/"
    exit 1
fi

# Prompt for confirmation
read -p "Have you rotated all exposed secrets and created new credentials? (y/n): " secrets_rotated
if [[ "$secrets_rotated" != "y" ]]; then
    echo "⚠️  Please rotate all secrets first! Run ./rotate-secrets.sh"
    exit 1
fi

echo ""
echo "Step 1: Creating a backup of your repository..."
# Create backup directory with date stamp
BACKUP_DIR=".git-backup-$(date +"%Y%m%d_%H%M%S")"
mkdir -p "$BACKUP_DIR"
cp -r .git "$BACKUP_DIR/"
echo "✅ Backup created at $BACKUP_DIR"

echo ""
echo "Step 2: Removing sensitive files from Git history..."
echo "This will remove the following files from history:"
echo "  - backend/config.env"
echo "  - Any other .env files that might contain secrets"

# Run BFG to remove the sensitive files
bfg --delete-files "*.env" --no-blob-protection

echo ""
echo "Step 3: Cleaning up and optimizing the repository..."
# Clean refs and run garbage collection
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "Step 4: Verify the cleanup..."
echo "Let's check if the sensitive files are still tracked:"
git ls-files | grep -i "\.env"

echo ""
echo "🚀 Next Steps:"
echo "-------------"
echo "1. Review the changes to ensure everything looks good"
echo "2. Force push to update the remote repository:"
echo "   git push origin --force --all"
echo ""
echo "⚠️  WARNING: Force pushing will overwrite the remote repository history."
echo "Make sure all team members are aware and have pulled latest changes before doing this!" 