CREATE SCHEMA IF NOT EXISTS app;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app.events (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    occurred_at timestamptz NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);

CREATE OR REPLACE FUNCTION app.create_month_partition(p_month_start date)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    v_start timestamptz := p_month_start::timestamptz;
    v_end   timestamptz := (p_month_start + INTERVAL '1 month')::timestamptz;
    v_name  text := format('events_%s', to_char(p_month_start, 'YYYY_MM'));
BEGIN
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS app.%I PARTITION OF app.events
         FOR VALUES FROM (%L) TO (%L);',
        v_name, v_start, v_end
    );

    EXECUTE format('CREATE INDEX IF NOT EXISTS %I_occurred_at ON app.%I (occurred_at);', v_name, v_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I_tenant ON app.%I (tenant_id);', v_name, v_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I_tenant_time ON app.%I (tenant_id, occurred_at);', v_name, v_name);
END;
$$;

DO $$
DECLARE
    m date;
    start_date date := date_trunc('month', now())::date - interval '30 months';
    end_date   date := date_trunc('month', now())::date + interval '6 months';
BEGIN
    FOR m IN
        SELECT gs::date
        FROM generate_series(start_date, end_date, interval '1 month') AS gs
    LOOP
        PERFORM app.create_month_partition(m);
    END LOOP;
END
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS app.events_default PARTITION OF app.events DEFAULT;

CREATE INDEX IF NOT EXISTS events_default_occurred_at ON app.events_default (occurred_at);
CREATE INDEX IF NOT EXISTS events_default_tenant ON app.events_default (tenant_id);
CREATE INDEX IF NOT EXISTS events_default_tenant_time ON app.events_default (tenant_id, occurred_at);
