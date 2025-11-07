CREATE SCHEMA IF NOT EXISTS app;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app.events_plain (
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL,
    occurred_at timestamptz NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_events_plain_occurred_at ON app.events_plain (occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_plain_tenant ON app.events_plain (tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_plain_tenant_time ON app.events_plain (tenant_id, occurred_at);
