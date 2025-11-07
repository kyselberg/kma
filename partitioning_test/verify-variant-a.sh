#!/bin/zsh
set -euo pipefail

echo "Running Variant A verification (range partitions) inside container pg_partitioned..."
docker compose exec -T partitioned psql -U app -d app < sql/tests/variant_a_verification.sql

echo "\nDone. Review the partition names and counts above."
