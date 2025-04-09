#!/bin/bash

# Exit on error
set -e

# Print commands as they are executed
set -x

echo "🚀 Starting development rebuild process..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first."
    exit 1
fi

# Build all projects
echo "📦 Building all projects..."
pnpm nx run-many -t build || {
    echo "❌ Build failed"
    exit 1
}

# Navigate to the simple example directory
cd examples/simple || {
    echo "❌ Failed to navigate to examples/simple directory"
    exit 1
}

# Clean Vite cache
echo "🧹 Cleaning Vite cache..."
rm -rf node_modules/.vite

# Reinstall dependencies
echo "📥 Reinstalling dependencies..."
pnpm install || {
    echo "❌ Failed to install dependencies"
    exit 1
}

# Start development server
echo "🚀 Starting development server..."
pnpm dev 