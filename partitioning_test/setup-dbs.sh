#!/bin/bash

# Setup script to start all databases and wait for them to be ready

set -e

echo "Starting Docker Compose services..."
docker compose up -d

echo "Waiting for all databases to be ready..."

# Wait for plain database
echo "Waiting for plain database (port 54321)..."
until docker exec pg_plain pg_isready -U app -d app > /dev/null 2>&1; do
  sleep 1
done
echo "✓ Plain database is ready"

# Wait for partitioned database
echo "Waiting for partitioned database (port 54322)..."
until docker exec pg_partitioned pg_isready -U app -d app > /dev/null 2>&1; do
  sleep 1
done
echo "✓ Partitioned database is ready"

# Wait for shard1
echo "Waiting for shard1 (port 54323)..."
until docker exec pg_shard1 pg_isready -U app -d app > /dev/null 2>&1; do
  sleep 1
done
echo "✓ Shard1 is ready"

# Wait for shard2
echo "Waiting for shard2 (port 54324)..."
until docker exec pg_shard2 pg_isready -U app -d app > /dev/null 2>&1; do
  sleep 1
done
echo "✓ Shard2 is ready"

# Wait for coordinator
echo "Waiting for coordinator (port 54325)..."
until docker exec pg_coordinator pg_isready -U app -d app > /dev/null 2>&1; do
  sleep 1
done
echo "✓ Coordinator is ready"

echo ""
echo "All databases are ready!"
echo ""
echo "Database connections:"
echo "  Plain:        postgresql://app:app@localhost:54321/app"
echo "  Partitioned:  postgresql://app:app@localhost:54322/app"
echo "  Shard1:       postgresql://app:app@localhost:54323/app"
echo "  Shard2:       postgresql://app:app@localhost:54324/app"
echo "  Coordinator:  postgresql://app:app@localhost:54325/app"
