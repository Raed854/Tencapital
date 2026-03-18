#!/bin/sh
# Railway Build Script
# This script checks environment variables before building

echo "🚀 Starting Railway build process..."

# Check if REACT_APP_API_URL is set
if [ -z "$REACT_APP_API_URL" ]; then
    echo "⚠️  Warning: REACT_APP_API_URL is not set"
    echo "Using fallback configuration from .env.production"
else
    echo "✅ REACT_APP_API_URL is set to: $REACT_APP_API_URL"
fi

# Display environment info
echo "📋 Build Environment:"
echo "   NODE_ENV: ${NODE_ENV:-not set}"
echo "   REACT_APP_API_URL: ${REACT_APP_API_URL:-not set}"
echo "   REACT_APP_API_TIMEOUT: ${REACT_APP_API_TIMEOUT:-10000}"
echo "   REACT_APP_ENABLE_DEBUG: ${REACT_APP_ENABLE_DEBUG:-false}"

# Run the build
echo "🔨 Building React application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📦 Build output is in /app/build"
else
    echo "❌ Build failed!"
    exit 1
fi
