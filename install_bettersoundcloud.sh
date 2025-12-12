#!/usr/bin/env bash
set -e

APP_NAME="BetterSoundCloud"
INSTALL_DIR="$HOME/BetterSoundCloud-Linux"
APP_REPO_URL="https://github.com/ULTRA-VAGUE/BetterSoundCloud-On-Linux"
START_SCRIPT="$INSTALL_DIR/start.sh"
DESKTOP_FILE="$HOME/.local/share/applications/$APP_NAME.desktop"

# Colors for text output
GREEN="\033[0;32m"
CYAN="\033[0;36m"
RED="\033[0;31m"
RESET="\033[0m"

# 1. Safety Check: Do not run as root
if [ "$EUID" -eq 0 ]; then
  echo -e "${RED}❌ Error: Please do not run this as root/sudo.${RESET}"
  exit 1
fi

echo -e "${CYAN}=== Installing $APP_NAME ===${RESET}"

# 2. Detect the Linux distribution via Package Manager
if command -v apt >/dev/null 2>&1; then
    PM="apt"
    # Debian/Ubuntu/Mint
    INSTALL_CMD="sudo apt update && sudo apt install -y"
elif command -v pacman >/dev/null 2>&1; then
    PM="pacman"
    # Arch Linux/Manjaro 
    INSTALL_CMD="sudo pacman -S --needed --noconfirm"
elif command -v dnf >/dev/null 2>&1; then
    PM="dnf"
    # Fedora/RHEL
    INSTALL_CMD="sudo dnf install -y"
elif command -v zypper >/dev/null 2>&1; then
    PM="zypper"
    # openSUSE
    INSTALL_CMD="sudo zypper install -y"
else
    echo -e "${RED}❌ Error: Your Linux distribution is not supported automatically.${RESET}"
    exit 1
fi

echo -e "${CYAN}Detected package manager: $PM${RESET}"

# 3. Install git, curl
echo -e "${CYAN}Checking system tools...${RESET}"
$INSTALL_CMD git curl

# 4. Check for Node.js 
if command -v node >/dev/null 2>&1; then
    echo -e "${GREEN}✔ Node.js is already installed.${RESET}"
else
    echo -e "${CYAN}⚙️ Node.js missing. Installing via NVM...${RESET}"
    
    export NVM_DIR="$HOME/.nvm"
    
    # Download NVM if missing
    if [ ! -d "$NVM_DIR" ]; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
    fi
    
    # Load NVM
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    
    # Verify NVM is working
    if ! command -v nvm >/dev/null 2>&1; then
        echo -e "${RED}❌ Error: NVM failed to load. Please restart your terminal.${RESET}"
        exit 1
    fi

    # Install the latest stable Node.js version
    nvm install --lts
    nvm use --lts
    
    echo -e "${GREEN}✔ Node.js installed successfully.${RESET}"
fi

# 5. Download or Update the App Code
if [ -d "$INSTALL_DIR/.git" ]; then
    echo -e "${CYAN}Updating existing files...${RESET}"
    cd "$INSTALL_DIR"
    # Reset local changes to avoid conflicts
    git fetch origin main
    git reset --hard origin/main
    git clean -fd
else
    echo -e "${CYAN}Downloading files...${RESET}"
    # Remove old folder if it exists but is broken
    rm -rf "$INSTALL_DIR"
    git clone "$APP_REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# 6. Install App Dependencies (libraries)
echo -e "${CYAN}Installing app libraries (this may take a moment)...${RESET}"
npm install --silent
echo -e "${GREEN}✔ Libraries installed.${RESET}"

# 7. Create the launcher script
echo -e "${CYAN}Creating startup script...${RESET}"
cat > "$START_SCRIPT" <<EOF
#!/usr/bin/env bash
set -e

# Make sure Node.js is available
export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && . "\$NVM_DIR/nvm.sh"

cd "$INSTALL_DIR"

echo "🔄 Checking for updates..."
# Try to update only if internet is available
if git fetch origin main --quiet 2>/dev/null; then
    LOCAL=\$(git rev-parse @)
    REMOTE=\$(git rev-parse @{u})
    if [ "\$LOCAL" != "\$REMOTE" ]; then
        echo "⬆ New version found. Updating..."
        git reset --hard origin/main
        git clean -fd
        git pull origin main
        npm install --silent
    fi
else
    echo "⚠️ Update skipped (Offline or Git error)."
fi

echo "▶ Starting BetterSoundCloud..."
npm start
EOF

chmod +x "$START_SCRIPT"

# 8. Create Desktop Shortcut Icon
echo -e "${CYAN}Creating app menu shortcut...${RESET}"
mkdir -p "$(dirname "$DESKTOP_FILE")"

# Check if icon exists, otherwise use a default system icon
ICON_PATH="$INSTALL_DIR/app/lib/assets/icon.ico"
if [ ! -f "$ICON_PATH" ]; then
    ICON_PATH="audio-x-generic"
fi

cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Name=$APP_NAME
Exec=$START_SCRIPT
Icon=$ICON_PATH
Type=Application
Terminal=false
Categories=Audio;Music;
Comment=BetterSoundCloud Client
StartupWMClass=BetterSoundCloud
EOF
chmod +x "$DESKTOP_FILE"

echo -e "\n${GREEN}✔ Installation complete!${RESET}"
echo -e "You can run the app from your menu or type: ${CYAN}$START_SCRIPT${RESET}"
