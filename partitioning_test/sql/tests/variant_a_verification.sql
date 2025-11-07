-- Connect to partitioned DB and run:
-- psql postgresql://app:app@localhost:54322/app -f sql/tests/variant_a_verification.sql

SET client_min_messages = NOTICE;

-- Insert a few test rows into different months
INSERT INTO app.events (id, tenant_id, occurred_at, payload)
VALUES
  (gen_random_uuid(), gen_random_uuid(), date_trunc('month', now()) - interval '2 months' + interval '1 day', '{"k":1}'),
  (gen_random_uuid(), gen_random_uuid(), date_trunc('month', now()) - interval '1 month' + interval '2 days', '{"k":2}'),
  (gen_random_uuid(), gen_random_uuid(), date_trunc('month', now()) + interval '5 days', '{"k":3}'),
  (gen_random_uuid(), gen_random_uuid(), date_trunc('month', now()) + interval '1 month' + interval '3 days', '{"k":4}');

-- Show row counts per actual partition by grouping tableoid
SELECT tableoid::regclass AS partition_name, count(*) AS rows
FROM app.events
GROUP BY 1
ORDER BY 1;

-- Expect pruning: filter by occurred_at should touch only relevant partitions
EXPLAIN (ANALYZE, VERBOSE, BUFFERS)
SELECT count(*)
FROM app.events
WHERE occurred_at >= date_trunc('month', now())
  AND occurred_at < date_trunc('month', now()) + interval '1 month';
