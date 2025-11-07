#!/bin/bash

# Script to set up bidirectional logical replication between Node A and Node B
# This must be run AFTER both databases are initialized

echo "Setting up bidirectional logical replication..."

# Wait for both nodes to be ready
echo "Waiting for Node A..."
until docker exec pg-node-a pg_isready -U postgres; do
  sleep 2
done

echo "Waiting for Node B..."
until docker exec pg-node-b pg_isready -U postgres; do
  sleep 2
done

echo "Both nodes are ready!"

# Create subscription on Node A to Node B's publication
echo "Creating subscription on Node A..."
docker exec -i pg-node-a psql -U postgres -d testdb << EOF
CREATE SUBSCRIPTION node_a_sub
    CONNECTION 'host=pg-node-b port=5432 dbname=testdb user=postgres password=postgres'
    PUBLICATION node_b_pub
    WITH (copy_data = false, origin = none);
EOF

# Create subscription on Node B to Node A's publication
echo "Creating subscription on Node B..."
docker exec -i pg-node-b psql -U postgres -d testdb << EOF
CREATE SUBSCRIPTION node_b_sub
    CONNECTION 'host=pg-node-a port=5432 dbname=testdb user=postgres password=postgres'
    PUBLICATION node_a_pub
    WITH (copy_data = false, origin = none);
EOF

echo "Logical replication setup complete!"
echo ""
echo "Verifying subscriptions..."
echo ""
echo "Node A subscriptions:"
docker exec pg-node-a psql -U postgres -d testdb -c "SELECT * FROM pg_stat_subscription;"
echo ""
echo "Node B subscriptions:"
docker exec pg-node-b psql -U postgres -d testdb -c "SELECT * FROM pg_stat_subscription;"
