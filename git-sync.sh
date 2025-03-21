#!/bin/bash

# Git sync script for automatic synchronization between Replit and GitHub
# Runs daily at 9am UTC

echo "=== Starting Git Sync at $(date) ==="

# Ensure we have credentials set up
if [ ! -f ~/.git-credentials ]; then
  echo "Setting up Git credentials..."
  git config --global credential.helper store
  echo "https://x-access-token:$GITHUB_TOKEN@github.com" > ~/.git-credentials
fi

# Get latest changes from GitHub
echo "Fetching updates from GitHub..."
git fetch origin

# Check for remote changes
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  echo "Repository is up to date."
else
  echo "Changes detected between local and remote."
  
  # Check if we have local uncommitted changes
  if [ -n "$(git status --porcelain)" ]; then
    echo "Local uncommitted changes found. Stashing changes..."
    git stash
  fi
  
  # Try to merge remote changes
  echo "Pulling changes from GitHub..."
  git pull origin main --no-edit
  
  # Apply stashed changes if any
  if [ -n "$(git stash list)" ]; then
    echo "Applying stashed changes..."
    git stash pop
    
    # If there are conflicts, notify but don't push
    if [ -n "$(git status --porcelain | grep 'UU')" ]; then
      echo "WARNING: Conflicts detected. Manual resolution required."
      exit 1
    fi
    
    # Commit any merged changes
    if [ -n "$(git status --porcelain)" ]; then
      echo "Committing merged changes..."
      git add .
      git commit -m "Merge remote changes with local work via automatic sync"
    fi
  fi
  
  # Push changes to GitHub
  echo "Pushing changes to GitHub..."
  git push origin main
fi

echo "=== Git Sync completed at $(date) ==="