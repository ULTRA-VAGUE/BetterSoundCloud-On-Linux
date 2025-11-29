#!/usr/bin/env bash
set -e

# --- Installation directory (script location) ---
INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- Node/NVM setup ---
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    # Load NVM
    \. "$NVM_DIR/nvm.sh"
else
    echo "⚠️ NVM not found. Make sure Node.js is installed."
    exit 1
fi

# --- Git repo URL ---
REPO_URL="https://github.com/ULTRA-VAGUE/BetterSoundCloud-On-Linux"

# --- Switch to installation directory ---
cd "$INSTALL_DIR"

# --- Check for updates ---
echo "🔄 Checking for updates..."
if git rev-parse --is-inside-work-tree &>/dev/null; then
    git remote set-url origin "$REPO_URL" 2>/dev/null || git remote add origin "$REPO_URL"
    git fetch origin main
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u})
    if [ "$LOCAL" != "$REMOTE" ]; then
        echo "⬆ Updating BetterSoundCloud..."
        git reset --hard origin/main
        git clean -fd
        git pull origin main
    else
        echo "✅ Already up to date."
    fi
else
    echo "⚠️ Not a git repository — skipping update."
fi

# --- Start BetterSoundCloud ---
echo "▶ Starting BetterSoundCloud..."
npm start
