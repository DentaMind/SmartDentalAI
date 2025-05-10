#!/bin/bash

# DentaMind Full Security Remediation Script
# This script orchestrates the complete security remediation process for DentaMind

set -e  # Exit on any error

# Display intro banner
echo "========================================================"
echo "🔒 DentaMind Complete Security Remediation"
echo "========================================================"
echo ""
echo "This script will perform a complete security remediation:"
echo "  1. Rotate all exposed secrets"
echo "  2. Clean Git history with BFG"
echo "  3. Set up pre-commit hooks for future protection"
echo "  4. Verify no sensitive files remain in the repository"
echo "  5. Push the cleaned history to origin (with confirmation)"
echo ""
echo "⚠️  WARNING: This will rewrite Git history and require a force push!"
echo "Make sure all team members are aware before proceeding."
echo ""

# Check for all required scripts
for script in "rotate-secrets.sh" "clean-git-history.sh" "setup-security-checks.sh"; do
    if [ ! -f "$script" ]; then
        echo "❌ Required script $script not found!"
        echo "Please ensure all security scripts are in the current directory."
        exit 1
    fi
    if [ ! -x "$script" ]; then
        echo "Making $script executable..."
        chmod +x "$script"
    fi
done

# Check for required tools
for tool in "git" "grep"; do
    if ! command -v $tool &> /dev/null; then
        echo "❌ Required tool $tool not found!"
        exit 1
    fi
done

# Confirm with the user
read -p "Are you ready to begin the full security remediation? (y/n): " proceed
if [[ "$proceed" != "y" ]]; then
    echo "Remediation canceled. Run again when you're ready."
    exit 0
fi

# Create a backup of the entire repository
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR=$(pwd)/.full-repo-backup-$TIMESTAMP

echo ""
echo "🔄 Creating full repository backup at $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"
cp -r . "$BACKUP_DIR"
echo "✅ Backup created."

# Step 1: Rotate secrets
echo ""
echo "========================================================"
echo "Step 1: Rotating Exposed Secrets"
echo "========================================================"
echo "Following this interactive process to rotate all exposed secrets."
echo "You MUST complete this step to properly secure your application."
echo ""

./rotate-secrets.sh

echo ""
echo "Verifying secret rotation completed..."
read -p "Did you successfully rotate all secrets (SMTP, Twilio, SECRET_KEY)? (y/n): " secrets_rotated
if [[ "$secrets_rotated" != "y" ]]; then
    echo "❌ Secret rotation must be completed before proceeding."
    echo "Please run ./rotate-secrets.sh manually and complete all steps."
    exit 1
fi

# Step 2: Clean Git history
echo ""
echo "========================================================"
echo "Step 2: Cleaning Git History"
echo "========================================================"
echo "This will remove sensitive files from your entire Git history."
echo ""

./clean-git-history.sh

echo ""
echo "Verifying Git history cleaning completed..."
if grep -q "backend/config.env" <(git ls-files); then
    echo "❌ Git history cleaning appears to have failed! The sensitive file is still tracked."
    echo "Please run ./clean-git-history.sh manually and review the results carefully."
    exit 1
else
    echo "✅ Sensitive files no longer appear in Git tracking."
fi

# Step 3: Set up pre-commit hooks
echo ""
echo "========================================================"
echo "Step 3: Setting Up Pre-commit Hooks"
echo "========================================================"
echo "This will install hooks to prevent future secret leaks."
echo ""

./setup-security-checks.sh

echo ""
echo "Verifying pre-commit hook installation..."
if [ ! -f ".pre-commit-config.yaml" ]; then
    echo "⚠️ Pre-commit configuration not found. Hooks may not be properly installed."
    echo "You may need to run ./setup-security-checks.sh manually."
else
    echo "✅ Pre-commit hooks configuration found."
fi

# Step 4: Verify no remaining sensitive files
echo ""
echo "========================================================"
echo "Step 4: Performing Final Security Check"
echo "========================================================"
echo "Checking for any remaining sensitive files or patterns..."
echo ""

# Check for common sensitive file patterns
SENSITIVE_FILES=$(find . -type f -not -path "*/\.*" -name "*.env" -o -name "*config.env*" -o -name "*secret*" -o -name "*credential*" -o -name "*password*" | grep -v "example\|sample\|template")

if [ -n "$SENSITIVE_FILES" ]; then
    echo "⚠️ Potentially sensitive files found:"
    echo "$SENSITIVE_FILES"
    echo ""
    echo "Review these files and ensure they don't contain actual secrets."
    read -p "Continue anyway? (y/n): " continue_anyway
    if [[ "$continue_anyway" != "y" ]]; then
        echo "Remediation paused. Review the files and run again."
        exit 0
    fi
else
    echo "✅ No obvious sensitive files found."
fi

# Step 5: Push cleaned history to origin
echo ""
echo "========================================================"
echo "Step 5: Push Cleaned History to Origin"
echo "========================================================"
echo "⚠️ WARNING: This will force push to your remote repository!"
echo "This overwrites remote history permanently and cannot be undone."
echo "All team members will need to re-clone or reset their local repositories."
echo ""

# Double-check with the user
read -p "Are you ABSOLUTELY SURE you want to force push cleaned history to origin? (yes/no): " confirm_push
if [[ "$confirm_push" != "yes" ]]; then
    echo "Force push canceled. You can manually push later with:"
    echo "git push --force origin <branch-name>"
    exit 0
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"

# Force push
echo "Force pushing to origin/$CURRENT_BRANCH..."
git push --force origin "$CURRENT_BRANCH"

echo ""
echo "========================================================"
echo "✅ SECURITY REMEDIATION COMPLETE!"
echo "========================================================"
echo ""
echo "Your DentaMind repository is now secured:"
echo ""
echo "✅ Secrets have been rotated"
echo "✅ Git history has been cleaned of sensitive data"
echo "✅ Pre-commit hooks are installed to prevent future leaks"
echo "✅ Clean history has been pushed to the remote repository"
echo ""
echo "IMPORTANT NEXT STEPS:"
echo ""
echo "1. Inform all team members to re-clone the repository:"
echo "   git clone https://github.com/YourOrg/DentaMind.git"
echo ""
echo "2. Update any deployment environments with the new secrets"
echo ""
echo "3. Verify HIPAA compliance with your security officer"
echo ""
echo "A full backup of your repository before remediation is saved at:"
echo "$BACKUP_DIR"
echo ""
echo "========================================================" 