#!/bin/bash

# Script to start logical replication topology

set -e

echo "Starting Logical Replication Topology (Master <-> Master)..."
echo ""

# Stop any existing containers
echo "Cleaning up existing containers..."
docker-compose -f docker-compose.logical.yml down -v 2>/dev/null || true

# Start the topology
echo "Starting containers..."
docker-compose -f docker-compose.logical.yml up -d

# Wait for both nodes to be ready
echo ""
echo "Waiting for Node A to be ready..."
until docker exec pg-node-a pg_isready -U postgres &>/dev/null; do
    echo "  Waiting for node-a..."
    sleep 2
done
echo "✓ Node A is ready"

echo ""
echo "Waiting for Node B to be ready..."
until docker exec pg-node-b pg_isready -U postgres &>/dev/null; do
    echo "  Waiting for node-b..."
    sleep 2
done
echo "✓ Node B is ready"

# Give databases time to fully initialize
echo ""
echo "Waiting for database initialization..."
sleep 5

# Set up bidirectional replication
echo ""
echo "Setting up bidirectional logical replication..."
./setup-logical-replication.sh

echo ""
echo "Logical replication topology is running!"
echo ""
echo "Connection details:"
echo "  Node A:  localhost:5434"
echo "  Node B:  localhost:5435"
echo ""
echo "Test the setup with:"
echo "  npm run test:logical"
echo "  npm run metrics:logical"
