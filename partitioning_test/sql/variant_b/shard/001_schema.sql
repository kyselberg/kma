CREATE SCHEMA IF NOT EXISTS app;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app.events_shard (
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL,
    occurred_at timestamptz NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_events_shard_occurred_at ON app.events_shard (occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_shard_tenant ON app.events_shard (tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_shard_tenant_time ON app.events_shard (tenant_id, occurred_at);
