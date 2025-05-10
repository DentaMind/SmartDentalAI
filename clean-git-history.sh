#!/bin/bash

# Enhanced script to clean Git history with BFG
echo "🧹 Complete Git History Cleanup for DentaMind"
echo "============================================"
echo "This script will completely remove sensitive files from Git history."
echo "⚠️ WARNING: This will rewrite Git history and require a force push!"

# Check for BFG installation
if ! command -v bfg &> /dev/null; then
    echo "❌ BFG not found. Installing BFG Repo Cleaner..."
    if command -v brew &> /dev/null; then
        brew install bfg
    else
        echo "Homebrew not found. Please install BFG manually:"
        echo "Visit: https://rtyley.github.io/bfg-repo-cleaner/"
        exit 1
    fi
fi

# Check for prerequisites
read -p "Have you rotated all exposed secrets? (y/n): " secrets_rotated
if [[ "$secrets_rotated" != "y" ]]; then
    echo "⚠️ Please rotate all secrets first! Run ./rotate-secrets.sh"
    exit 1
fi

# Determine repository URL
REPO_URL=$(git remote get-url origin 2>/dev/null)
if [[ -z "$REPO_URL" ]]; then
    read -p "Enter your repository URL (e.g., https://github.com/user/repo.git): " REPO_URL
fi

echo ""
echo "Step 1: Creating a backup of your entire repository..."
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR=$(pwd)/.git-backup-complete-$TIMESTAMP
MIRROR_DIR=$(pwd)/.git-mirror-$TIMESTAMP

# Create backup of current repo state
echo "Creating backup at $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
cp -r .git "$BACKUP_DIR/"
echo "✅ Local backup created"

# Create mirror clone for BFG
echo ""
echo "Step 2: Creating a mirror clone for cleaning..."
mkdir -p "$MIRROR_DIR"
cd "$MIRROR_DIR"
git clone --mirror "$REPO_URL" repo-mirror.git
if [ $? -ne 0 ]; then
    echo "❌ Failed to clone repository. Check your permissions and network connection."
    echo "You may need to use SSH URL if you have 2FA enabled."
    exit 1
fi
cd repo-mirror.git

echo ""
echo "Step 3: Removing sensitive files from Git history..."
echo "This will remove the following files from ALL HISTORICAL COMMITS:"
echo "  - *.env files (any environment file)"
echo "  - config.env"
echo "  - Any files with 'secret' or 'credentials' in the name"

# Create a text file with sensitive patterns
cat > ../sensitive-patterns.txt << EOF
*.env
.env
.env.*
config.env
*secret*
*credential*
*password*
EOF

# Run BFG to remove the sensitive files
bfg --delete-files-matching-any ../sensitive-patterns.txt --no-blob-protection

echo ""
echo "Step 4: Cleaning up and optimizing the repository..."
# Clean refs and run garbage collection
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "Step 5: Verify the cleanup was successful..."
# Basic verification
git count-objects -v

echo ""
echo "🔍 Review complete. If everything looks good, you can push these changes."
echo ""
echo "Would you like to force push these changes to origin? This will OVERWRITE"
echo "the remote history permanently and cannot be undone."
echo "⚠️ MAKE SURE ALL TEAM MEMBERS ARE AWARE OF THIS CHANGE!"
echo ""
read -p "Force push to origin? (y/n): " force_push

if [[ "$force_push" == "y" ]]; then
    echo "Pushing changes to origin..."
    git push --force
    
    echo ""
    echo "✅ Git history has been cleaned and pushed to origin."
    echo "✅ Sensitive files have been removed from history."
    echo ""
    echo "Important next steps:"
    echo "1. Make sure all team members pull the latest changes"
    echo "2. Verify sensitive information is no longer accessible"
    echo "3. Delete any local clones and re-clone the repository"
else
    echo ""
    echo "Changes were not pushed. To push manually, run:"
    echo "cd $MIRROR_DIR/repo-mirror.git"
    echo "git push --force"
fi

echo ""
echo "Cleanup complete! Repository backup is saved at: $BACKUP_DIR" 