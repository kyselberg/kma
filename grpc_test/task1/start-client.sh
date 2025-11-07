#!/bin/bash

set -e

cd "$(dirname "$0")/client"

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

if [ ! -d "dist" ]; then
    echo "Building TypeScript..."
    npm run build
fi

echo "Starting client..."
npm start
