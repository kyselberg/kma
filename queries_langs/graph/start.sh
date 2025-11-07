#!/bin/bash

cd graph
docker-compose up -d

echo "⏳ Waiting for Neo4j to start..."
sleep 10

if curl -s http://localhost:7474 >/dev/null 2>&1; then
    echo "📊 Loading schema and data..."
    docker exec hr_neo4j cypher-shell -u neo4j -p password123 -f /var/lib/neo4j/neo4j_schema.cypher
    if [ $? -eq 0 ]; then
        echo "✅ Schema and data loaded successfully!"
    else
        echo "❌ Failed to load schema and data. Check the error messages above."
        exit 1
    fi
else
    echo "❌ Neo4j is not accessible at http://localhost:7474"
    exit 1
fi

echo ""
echo "🎉 DONE! "
echo ""
