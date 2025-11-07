-- Benchmarks for Variant B (coordinator with HASH(tenant_id) partitions via FDW)
-- DSN: postgresql://app:app@localhost:54325/app

\timing on
SET client_min_messages = WARNING;

-- 1) Point lookup by id (sample)
EXPLAIN (ANALYZE, VERBOSE)
WITH any_row AS (
  SELECT id, tenant_id FROM app.events_sharded ORDER BY occurred_at DESC LIMIT 1
)
SELECT *
FROM app.events_sharded
WHERE id = (SELECT id FROM any_row);

-- 2) Tenant equality filter should prune to one foreign partition (single shard)
EXPLAIN (ANALYZE, VERBOSE)
WITH any_tenant AS (
  SELECT tenant_id FROM app.events_sharded ORDER BY occurred_at DESC LIMIT 1
)
SELECT count(*)
FROM app.events_sharded
WHERE tenant_id = (SELECT tenant_id FROM any_tenant)
  AND occurred_at >= date_trunc('month', now()) - interval '3 months'
  AND occurred_at <  date_trunc('month', now());

-- 3) Time-only filter (cannot prune shards; expect both shards touched)
EXPLAIN (ANALYZE, VERBOSE)
SELECT count(*)
FROM app.events_sharded
WHERE occurred_at >= date_trunc('month', now()) - interval '1 month'
  AND occurred_at <  date_trunc('month', now());

-- 4) Group by month (will aggregate across foreign partitions)
EXPLAIN (ANALYZE, VERBOSE)
SELECT date_trunc('month', occurred_at) AS m, count(*)
FROM app.events_sharded
WHERE occurred_at >= date_trunc('year', now()) - interval '1 year'
GROUP BY 1
ORDER BY 1;

-- 5) Insert small batch (10 rows) to measure coordinator routing
BEGIN;
EXPLAIN (ANALYZE, VERBOSE)
INSERT INTO app.events_sharded (id, tenant_id, occurred_at, payload)
SELECT gen_random_uuid(), gen_random_uuid(), now(), '{"bench":true}'::jsonb
FROM generate_series(1,10);
ROLLBACK;
