#!/bin/bash

echo "🔄 Loading sample HR data..."

# Clear existing data
docker exec hr_neo4j cypher-shell -u neo4j -p password123 "MATCH (n) DETACH DELETE n"

# Load the sample data
docker exec hr_neo4j cypher-shell -u neo4j -p password123 -f /var/lib/neo4j/neo4j_schema.cypher

echo "✅ Data loaded successfully!"
echo "🧪 Testing with a quick query..."
./run_cypher.sh count_all_nodes.cypher
