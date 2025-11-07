CREATE TABLE IF NOT EXISTS test_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payload JSONB,
    source_node VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE test_data REPLICA IDENTITY FULL;

INSERT INTO test_data (payload, source_node)
VALUES
    ('{"message": "Initial data from node A", "test": true}'::jsonb, 'node-a');
