#!/bin/bash

set -e

cd "$(dirname "$0")/ts-consumer"

if [ ! -d "node_modules" ]; then
    npm install
fi

if [ ! -d "dist" ]; then
    npm run build
fi

npm start
