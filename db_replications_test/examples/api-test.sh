#!/bin/bash

API_URL="http://localhost:3000"

echo "Testing PostgreSQL Replication API"
echo "==================================="
echo ""

echo "1. Health check..."
curl -s "${API_URL}/health" | jq
echo ""

echo "2. Testing Physical Replication"
echo "--------------------------------"

echo "Writing data to primary..."
WRITE_RESULT=$(curl -s -X POST "${API_URL}/physical/write" \
  -H "Content-Type: application/json" \
  -d '{"payload": {"message": "API test", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}}')

echo $WRITE_RESULT | jq
RECORD_ID=$(echo $WRITE_RESULT | jq -r '.id')
echo "Created record: $RECORD_ID"
echo ""

echo "Waiting for replication (3 seconds)..."
sleep 3
echo ""

echo "Reading from primary (last 5 records)..."
curl -s "${API_URL}/physical/read/primary?limit=5" | jq '.records[] | {id, source_node, created_at}'
echo ""

echo "Reading from standby (last 5 records)..."
curl -s "${API_URL}/physical/read/standby?limit=5" | jq '.records[] | {id, source_node, created_at}'
echo ""

echo "Record counts:"
curl -s "${API_URL}/physical/count" | jq
echo ""

echo ""
echo "3. Testing Logical Replication"
echo "-------------------------------"

echo "Writing to Node A..."
curl -s -X POST "${API_URL}/logical/write/a" \
  -H "Content-Type: application/json" \
  -d '{"payload": {"message": "From Node A via API"}}' | jq
echo ""

echo "Writing to Node B..."
curl -s -X POST "${API_URL}/logical/write/b" \
  -H "Content-Type: application/json" \
  -d '{"payload": {"message": "From Node B via API"}}' | jq
echo ""

echo "Waiting for bidirectional replication (5 seconds)..."
sleep 5
echo ""

echo "Reading from Node A..."
curl -s "${API_URL}/logical/read/a?limit=5" | jq '.records[] | {id, source_node, created_at}'
echo ""

echo "Reading from Node B..."
curl -s "${API_URL}/logical/read/b?limit=5" | jq '.records[] | {id, source_node, created_at}'
echo ""

echo "Record counts:"
curl -s "${API_URL}/logical/count" | jq
echo ""

echo "==================================="
echo "API test completed!"
