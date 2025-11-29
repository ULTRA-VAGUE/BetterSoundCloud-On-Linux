#!/usr/bin/env bash
set -e


INSTALL_DIR="$(dirname "${BASH_SOURCE[0]}")"

# --- Node/NVM Setup ---
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    # NVM laden
    \. "$NVM_DIR/nvm.sh"
else
    echo "⚠️ NVM nicht gefunden. Stelle sicher, dass Node.js installiert ist."
    exit 1
fi

# --- Git Repo URL ---
REPO_URL="https://github.com/ULTRA-VAGUE/BetterSoundCloud-On-Linux"

# --- change directory to install dir---
cd "$INSTALL_DIR"

# --- Repo Update check ---
echo "   Checking for updates..."
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

# --- start BSC---
echo "▶ Starting BetterSoundCloud..."
npm start
