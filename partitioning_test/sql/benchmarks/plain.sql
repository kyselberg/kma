-- Benchmarks for plain table (no partitions)
-- DSN: postgresql://app:app@localhost:54321/app

\timing on
SET client_min_messages = WARNING;

-- 1) Point lookup by id (requires an existing id; approximate by sampling)
EXPLAIN (ANALYZE, VERBOSE, BUFFERS)
WITH any_id AS (
  SELECT id FROM app.events_plain ORDER BY occurred_at DESC LIMIT 1
)
SELECT * FROM app.events_plain WHERE id = (SELECT id FROM any_id);

-- 2) Time-range count for single month
EXPLAIN (ANALYZE, VERBOSE, BUFFERS)
SELECT count(*)
FROM app.events_plain
WHERE occurred_at >= date_trunc('month', now()) - interval '1 month'
  AND occurred_at <  date_trunc('month', now());

-- 3) Tenant-scoped time-range scan
EXPLAIN (ANALYZE, VERBOSE, BUFFERS)
WITH any_tenant AS (
  SELECT tenant_id FROM app.events_plain ORDER BY occurred_at DESC LIMIT 1
)
SELECT count(*)
FROM app.events_plain
WHERE tenant_id = (SELECT tenant_id FROM any_tenant)
  AND occurred_at >= date_trunc('month', now()) - interval '3 months'
  AND occurred_at <  date_trunc('month', now());

-- 4) Group by month (rollup)
EXPLAIN (ANALYZE, VERBOSE, BUFFERS)
SELECT date_trunc('month', occurred_at) AS m, count(*)
FROM app.events_plain
WHERE occurred_at >= date_trunc('year', now()) - interval '1 year'
GROUP BY 1
ORDER BY 1;

-- 5) Insert small batch (10 rows) to measure per-statement overhead
BEGIN;
EXPLAIN (ANALYZE, VERBOSE, BUFFERS)
INSERT INTO app.events_plain (id, tenant_id, occurred_at, payload)
SELECT gen_random_uuid(), gen_random_uuid(), now(), '{"bench":true}'::jsonb
FROM generate_series(1,10);
ROLLBACK;
