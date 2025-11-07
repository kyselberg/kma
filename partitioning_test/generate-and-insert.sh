#!/bin/bash

# Script to generate CSV and insert data into all databases

set -e

# Check if gen.ts exists and node_modules are installed
if [ ! -f "gen.ts" ]; then
  echo "Error: gen.ts not found"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Create output directory
OUT_DIR="tmp"
mkdir -p "$OUT_DIR"

# Generation parameters
FROM_MONTH="${FROM_MONTH:-2024-01}"
TO_MONTH="${TO_MONTH:-2025-12}"
PER_MONTH="${PER_MONTH:-500000}"
TENANTS="${TENANTS:-1000}"

echo "Starting data generation and insertion..."
echo ""

# Helper to run gen with common flags
run_gen() {
  local DSN="$1";
  local TABLE="$2";
  local OUT_FILE="$3";
  echo "From $FROM_MONTH to $TO_MONTH, $PER_MONTH rows/month, tenants=$TENANTS";
  time npx tsx gen.ts \
    --dsn "$DSN" \
    --table "$TABLE" \
    --from "$FROM_MONTH" \
    --to "$TO_MONTH" \
    --per-month "$PER_MONTH" \
    --tenants "$TENANTS" \
    --out "$OUT_FILE";
}

# Plain database
echo "=========================================="
echo "Processing Plain database..."
echo "=========================================="
run_gen "postgresql://app:app@localhost:54321/app" "app.events_plain" "$OUT_DIR/events.csv"
echo "✓ Plain database complete"
echo ""

# Partitioned database (Variant A)
echo "=========================================="
echo "Processing Partitioned database (Variant A)..."
echo "=========================================="
run_gen "postgresql://app:app@localhost:54322/app" "app.events" "$OUT_DIR/events.csv"
echo "✓ Partitioned database complete"
echo ""

# Coordinator only for sharded setup (Variant B)
echo "=========================================="
echo "Processing Coordinator (Variant B, shards via FDW)..."
echo "=========================================="
run_gen "postgresql://app:app@localhost:54325/app" "app.events_sharded" "$OUT_DIR/events.csv"
echo "✓ Coordinator complete"
echo ""

echo "=========================================="
echo "All data generation and insertion complete!"
echo "=========================================="
echo ""
echo "CSV files are saved in: $OUT_DIR/"
