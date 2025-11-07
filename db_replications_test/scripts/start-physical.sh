#!/bin/bash

# Script to start physical replication topology

set -e

echo "Starting Physical Replication Topology (Master -> Slave)..."
echo ""

# Stop any existing containers
echo "Cleaning up existing containers..."
docker-compose -f docker-compose.physical.yml down -v 2>/dev/null || true

# Start the topology
echo "Starting containers..."
docker-compose -f docker-compose.physical.yml up -d

# Wait for primary to be ready
echo ""
echo "Waiting for Primary to be ready..."
until docker exec pg-primary pg_isready -U postgres &>/dev/null; do
    echo "  Waiting for primary..."
    sleep 2
done
echo "✓ Primary is ready"

# Wait for standby to complete base backup and start
echo ""
echo "Waiting for Standby to complete initial sync..."
sleep 10

until docker exec pg-standby pg_isready -U postgres &>/dev/null; do
    echo "  Waiting for standby..."
    sleep 2
done
echo "✓ Standby is ready"

# Check replication status
echo ""
echo "Checking replication status..."
docker exec pg-primary psql -U postgres -d testdb -c "SELECT * FROM pg_stat_replication;"

echo ""
echo "Physical replication topology is running!"
echo ""
echo "Connection details:"
echo "  Primary:  localhost:5432"
echo "  Standby:  localhost:5433"
echo ""
echo "Test the setup with:"
echo "  npm run test:physical"
echo "  npm run metrics:physical"
