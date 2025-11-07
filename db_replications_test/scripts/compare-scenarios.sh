#!/bin/bash

# Script to run and compare different partition durations

echo "=================================="
echo "Replication Test Comparison"
echo "=================================="
echo ""

TOPOLOGY=${1:-physical}

if [[ "$TOPOLOGY" != "physical" ]] && [[ "$TOPOLOGY" != "logical" ]]; then
    echo "Usage: $0 [physical|logical]"
    exit 1
fi

echo "Running $TOPOLOGY replication tests with different partition durations..."
echo ""

# Test 1: 5 minutes
echo "======================================"
echo "Test 1: 5 minute partition"
echo "======================================"
./scripts/test-scenarios.sh $TOPOLOGY 5 > results-${TOPOLOGY}-5min.txt 2>&1
echo "✓ 5 minute test completed"
echo ""
sleep 10

# Cleanup between tests
echo "Cleaning up before next test..."
docker-compose -f docker-compose.${TOPOLOGY}.yml down -v
sleep 5
docker-compose -f docker-compose.${TOPOLOGY}.yml up -d
sleep 20

if [ "$TOPOLOGY" == "logical" ]; then
    ./setup-logical-replication.sh
    sleep 10
fi

# Test 2: 10 minutes
echo "======================================"
echo "Test 2: 10 minute partition"
echo "======================================"
./scripts/test-scenarios.sh $TOPOLOGY 10 > results-${TOPOLOGY}-10min.txt 2>&1
echo "✓ 10 minute test completed"
echo ""

# Extract and compare results
echo "======================================"
echo "Comparison Results"
echo "======================================"
echo ""

echo "5 Minute Test:"
grep -E "(Records written|Write rate|Recovery time|Data consistency)" results-${TOPOLOGY}-5min.txt | tail -4

echo ""
echo "10 Minute Test:"
grep -E "(Records written|Write rate|Recovery time|Data consistency)" results-${TOPOLOGY}-10min.txt | tail -4

echo ""
echo "Full logs saved to:"
echo "  - results-${TOPOLOGY}-5min.txt"
echo "  - results-${TOPOLOGY}-10min.txt"
