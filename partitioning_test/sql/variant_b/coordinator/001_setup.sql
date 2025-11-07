CREATE SCHEMA IF NOT EXISTS app;
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

DROP SERVER IF EXISTS shard1 CASCADE;
DROP SERVER IF EXISTS shard2 CASCADE;
CREATE SERVER shard1 FOREIGN DATA WRAPPER postgres_fdw OPTIONS (host 'shard1', dbname 'app', port '5432');
CREATE SERVER shard2 FOREIGN DATA WRAPPER postgres_fdw OPTIONS (host 'shard2', dbname 'app', port '5432');

CREATE USER MAPPING IF NOT EXISTS FOR CURRENT_USER SERVER shard1 OPTIONS (user 'app', password 'app');
CREATE USER MAPPING IF NOT EXISTS FOR CURRENT_USER SERVER shard2 OPTIONS (user 'app', password 'app');

CREATE TABLE IF NOT EXISTS app.events_sharded (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    occurred_at timestamptz NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb
) PARTITION BY HASH (tenant_id);

DROP FOREIGN TABLE IF EXISTS app.events_mod2_r0;
DROP FOREIGN TABLE IF EXISTS app.events_mod2_r1;

CREATE FOREIGN TABLE app.events_mod2_r0 (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    occurred_at timestamptz NOT NULL,
    payload jsonb NOT NULL
) SERVER shard1 OPTIONS (schema_name 'app', table_name 'events_shard');

CREATE FOREIGN TABLE app.events_mod2_r1 (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    occurred_at timestamptz NOT NULL,
    payload jsonb NOT NULL
) SERVER shard2 OPTIONS (schema_name 'app', table_name 'events_shard');

ALTER TABLE app.events_sharded ATTACH PARTITION app.events_mod2_r0 FOR VALUES WITH (MODULUS 2, REMAINDER 0);
ALTER TABLE app.events_sharded ATTACH PARTITION app.events_mod2_r1 FOR VALUES WITH (MODULUS 2, REMAINDER 1);
