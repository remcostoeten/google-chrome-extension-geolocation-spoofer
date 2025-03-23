#!/bin/bash

# Exit on error
set -e

# Configuration
EXTENSION_DIR="extension"
RELEASE_DIR="releases"
CURRENT_VERSION=$(jq -r '.version' $EXTENSION_DIR/manifest.json)
RELEASE_NAME="geolocation-manager-v$CURRENT_VERSION"
RELEASE_NOTES="RELEASE_NOTES.md"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI is not installed${NC}"
    echo "Please install it first: https://cli.github.com/"
    exit 1
fi

# Check if logged in to GitHub
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not logged in to GitHub${NC}"
    echo "Please run 'gh auth login' first"
    exit 1
fi

echo -e "${BLUE}Starting release process for version $CURRENT_VERSION${NC}"

# Create releases directory if it doesn't exist
mkdir -p $RELEASE_DIR

# Clean up any existing release files
rm -f $RELEASE_DIR/$RELEASE_NAME.zip

# Create extension zip
echo -e "${BLUE}Creating extension package...${NC}"
cd $EXTENSION_DIR
zip -r ../$RELEASE_DIR/$RELEASE_NAME.zip * > /dev/null
cd ..

echo -e "${GREEN}Created extension package at $RELEASE_DIR/$RELEASE_NAME.zip${NC}"

# Get release notes for current version
CURRENT_RELEASE_NOTES=$(awk "/## v$CURRENT_VERSION/,/## v/" $RELEASE_NOTES | sed '$d')

if [ -z "$CURRENT_RELEASE_NOTES" ]; then
    echo -e "${RED}Error: No release notes found for version $CURRENT_VERSION${NC}"
    exit 1
fi

# Create GitHub release
echo -e "${BLUE}Creating GitHub release...${NC}"
gh release create "v$CURRENT_VERSION" \
    $RELEASE_DIR/$RELEASE_NAME.zip \
    --title "Version $CURRENT_VERSION" \
    --notes "$CURRENT_RELEASE_NOTES" \
    --draft

echo -e "${GREEN}Created draft release v$CURRENT_VERSION${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo "1. Review the draft release on GitHub"
echo "2. Publish the release when ready"
echo "3. Update the Chrome Web Store listing" 