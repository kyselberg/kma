#!/bin/bash

# Master script to setup databases and generate/insert data

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "Partitioning Test - Full Setup"
echo "=========================================="
echo ""

# Step 1: Setup databases
echo "Step 1: Setting up databases..."
echo ""
bash "$SCRIPT_DIR/setup-dbs.sh"

echo ""
echo "Waiting 5 seconds for databases to fully initialize..."
sleep 5

# Step 2: Generate and insert data
echo ""
echo "Step 2: Generating CSV and inserting data..."
echo ""
bash "$SCRIPT_DIR/generate-and-insert.sh"

echo ""
echo "=========================================="
echo "Setup complete!"
echo "=========================================="
