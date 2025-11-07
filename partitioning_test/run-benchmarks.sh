#!/bin/bash

set -euo pipefail

OUT_DIR="tmp/benchmarks"
mkdir -p "$OUT_DIR"

run_psql() {
  local LOCAL_DSN="$1"   # e.g. postgresql://app:app@localhost:54321/app
  local DOCKER_DSN="$2"  # e.g. postgresql://app:app@pg_plain:5432/app
  local SQL_FILE="$3"    # e.g. sql/benchmarks/plain.sql

  if command -v psql >/dev/null 2>&1; then
    psql "$LOCAL_DSN" -v ON_ERROR_STOP=1 -f "$SQL_FILE"
  else
    docker run --rm \
      -v "$(pwd)":/work \
      --network partitioning_net \
      postgres:16 \
      psql "$DOCKER_DSN" -v ON_ERROR_STOP=1 -f "/work/$SQL_FILE"
  fi
}

echo "Running benchmarks... outputs -> $OUT_DIR"

echo "Plain (no partitions)"
run_psql \
  "postgresql://app:app@localhost:54321/app" \
  "postgresql://app:app@pg_plain:5432/app" \
  "sql/benchmarks/plain.sql" | tee "$OUT_DIR/plain.txt"

echo "Variant A (RANGE partitions)"
run_psql \
  "postgresql://app:app@localhost:54322/app" \
  "postgresql://app:app@pg_partitioned:5432/app" \
  "sql/benchmarks/variant_a.sql" | tee "$OUT_DIR/variant_a.txt"

echo "Variant B (HASH shards via FDW)"
run_psql \
  "postgresql://app:app@localhost:54325/app" \
  "postgresql://app:app@pg_coordinator:5432/app" \
  "sql/benchmarks/variant_b.sql" | tee "$OUT_DIR/variant_b.txt"

echo "Done. See $OUT_DIR for results."
