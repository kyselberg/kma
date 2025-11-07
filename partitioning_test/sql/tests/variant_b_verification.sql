-- Connect to coordinator and run:
-- psql postgresql://app:app@localhost:54325/app -f sql/tests/variant_b_verification.sql

SET client_min_messages = NOTICE;

-- Insert multiple tenants so that distribution hits different shards
DO $$
DECLARE
    i int;
BEGIN
    FOR i IN 1..50 LOOP
        INSERT INTO app.events_sharded (id, tenant_id, occurred_at, payload)
        VALUES (
          gen_random_uuid(),
          gen_random_uuid(),
          now() - (random()*30)::int * interval '1 day',
          jsonb_build_object('t', i)
        );
    END LOOP;
END$$;

-- Show counts visible from coordinator
SELECT tableoid::regclass AS part, count(*)
FROM app.events_sharded
GROUP BY 1
ORDER BY 1;

-- Generate a tenant id and store it into psql variable :tenant
SELECT gen_random_uuid() AS tenant;
\gset

SELECT 'insert_one' AS what;

INSERT INTO app.events_sharded (id, tenant_id, occurred_at, payload)
VALUES (gen_random_uuid(), :'tenant'::uuid, now(), '{"single":true}'::jsonb);

EXPLAIN (ANALYZE, VERBOSE)
SELECT * FROM app.events_sharded WHERE tenant_id = :'tenant'::uuid;

-- Also verify data landed on shards directly
\! echo '--- Querying shard1 ---'
\! psql postgresql://app:app@localhost:54323/app -c "SELECT count(*) AS shard1_count FROM app.events_shard;"
\! echo '--- Querying shard2 ---'
\! psql postgresql://app:app@localhost:54324/app -c "SELECT count(*) AS shard2_count FROM app.events_shard;"
