#!/bin/bash

# Script to stop all replication topologies

echo "Stopping all replication topologies..."
echo ""

echo "Stopping physical replication..."
docker-compose -f docker-compose.physical.yml down -v 2>/dev/null || echo "  Physical topology not running"

echo "Stopping logical replication..."
docker-compose -f docker-compose.logical.yml down -v 2>/dev/null || echo "  Logical topology not running"

echo ""
echo "All topologies stopped and cleaned up."
