#!/bin/bash

API_URL="http://localhost:3000"
REQUESTS=${1:-100}
CONCURRENCY=${2:-10}

echo "Load Testing PostgreSQL Replication"
echo "===================================="
echo "Requests: $REQUESTS"
echo "Concurrency: $CONCURRENCY"
echo ""

function write_record() {
    local index=$1
    curl -s -X POST "${API_URL}/physical/write" \
      -H "Content-Type: application/json" \
      -d "{\"payload": {\"index\": $index, \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}}" > /dev/null"
}

echo "Starting load test..."
START_TIME=$(date +%s)

INITIAL_COUNT=$(curl -s "${API_URL}/physical/count" | jq -r '.primary')
echo "Initial count: $INITIAL_COUNT"

for ((i=1; i<=$REQUESTS; i+=$CONCURRENCY)); do
    for ((j=0; j<$CONCURRENCY && i+j<=$REQUESTS; j++)); do
        write_record $((i+j)) &
    done
    wait

    if (( i % 50 == 0 )); then
        echo "  Progress: $i/$REQUESTS requests sent..."
    fi
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "Load test completed in ${DURATION}s"
echo "Throughput: $((REQUESTS / DURATION)) requests/sec"
echo ""

echo "Waiting for replication to catch up..."
sleep 5

FINAL_COUNT=$(curl -s "${API_URL}/physical/count" | jq -r '.primary')
RECORDS_CREATED=$((FINAL_COUNT - INITIAL_COUNT))

echo "Final count: $FINAL_COUNT"
echo "Records created: $RECORDS_CREATED"
echo ""

curl -s "${API_URL}/physical/count" | jq
