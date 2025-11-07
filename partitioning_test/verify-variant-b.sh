#!/bin/zsh
set -euo pipefail

echo "Running Variant B verification (hash sharding) inside container coordinator..."
# Run the coordinator-side SQL, but drop any shell-outs (lines starting with \!)
sed '/^\\!/d' sql/tests/variant_b_verification.sql | docker compose exec -T coordinator psql -U app -d app

echo "\nShard-level counts:"
docker compose exec -T shard1 psql -U app -d app -c "SELECT count(*) AS shard1_count FROM app.events_shard;"
docker compose exec -T shard2 psql -U app -d app -c "SELECT count(*) AS shard2_count FROM app.events_shard;"

echo "\nDone. Review the partition/shard breakdown above."
