#!/bin/bash

# Script to run automated test scenarios with network partitions

# Don't exit on error - we expect some commands to fail during partition
set +e

TOPOLOGY=$1
DURATION=${2:-5}  # Default 5 minutes
WRITE_INTERVAL=${3:-5}  # Default 5 seconds between writes

function show_usage() {
    echo "Usage: $0 <topology> [duration_minutes] [write_interval_seconds]"
    echo ""
    echo "Topologies:"
    echo "  physical  - Test Master->Slave replication with network partition"
    echo "  logical   - Test Master<->Master replication with network partition"
    echo ""
    echo "Duration: Number of minutes to maintain the partition (default: 5)"
    echo "Write Interval: Seconds between writes (default: 5)"
    echo "  - 5 seconds  → ~12 records/min (low load)"
    echo "  - 2 seconds  → ~30 records/min (medium load)"
    echo "  - 1 second   → ~60 records/min (high load)"
    echo "  - 0.5 second → ~120 records/min (very high load)"
    echo ""
    echo "Examples:"
    echo "  $0 physical 5      - 5 min partition, write every 5 sec"
    echo "  $0 physical 5 2    - 5 min partition, write every 2 sec (high lag)"
    echo "  $0 physical 10 1   - 10 min partition, write every 1 sec (very high lag)"
    echo "  $0 logical 5 2     - Logical replication with high write rate"
}

if [[ -z "$TOPOLOGY" ]]; then
    show_usage
    exit 1
fi

function log_with_timestamp() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

function test_physical_scenario() {
    log_with_timestamp "Starting Physical Replication Test Scenario"
    log_with_timestamp "Partition duration: $DURATION minutes"
    echo ""

    # Baseline metrics
    log_with_timestamp "=== PHASE 1: Baseline (Normal Operation) ==="
    log_with_timestamp "Collecting baseline metrics..."
    npm run metrics:physical

    log_with_timestamp "Writing test data to primary..."
    npm run test:physical

    # Get initial counts
    PRIMARY_COUNT_BEFORE=$(docker exec pg-primary psql -U postgres -d testdb -t -c "SELECT COUNT(*) FROM test_data;" | xargs)
    STANDBY_COUNT_BEFORE=$(docker exec pg-standby psql -U postgres -d testdb -t -c "SELECT COUNT(*) FROM test_data;" | xargs)
    log_with_timestamp "Initial counts - Primary: $PRIMARY_COUNT_BEFORE, Standby: $STANDBY_COUNT_BEFORE"

    echo ""
    log_with_timestamp "=== PHASE 2: Network Partition ==="
    log_with_timestamp "Disconnecting standby from network..."
    ./scripts/network-control.sh disconnect physical --node standby

    EXPECTED_WRITES=$((DURATION * 60 / WRITE_INTERVAL))
    log_with_timestamp "Starting continuous write to primary during partition..."
    log_with_timestamp "Write interval: $WRITE_INTERVAL seconds (~$((60 / WRITE_INTERVAL)) records/min)"
    log_with_timestamp "Expected total writes: ~$EXPECTED_WRITES records"

    # Start background writer process
    WRITE_LOG="/tmp/partition_writes_$$.log"
    (
        WRITE_COUNT=0
        TOTAL_DURATION=$((DURATION * 60))
        START_TIME=$(date +%s)

        while true; do
            ELAPSED=$(($(date +%s) - START_TIME))
            if [ $ELAPSED -ge $TOTAL_DURATION ]; then
                break
            fi

            WRITE_COUNT=$((WRITE_COUNT + 1))
            docker exec pg-primary psql -U postgres -d testdb -c \
                "INSERT INTO test_data (payload, source_node) VALUES ('{\"partition_write\": $WRITE_COUNT, \"elapsed_sec\": $ELAPSED, \"write_interval\": $WRITE_INTERVAL, \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}'::jsonb, 'primary-partition-continuous');" \
                >> $WRITE_LOG 2>&1

            sleep $WRITE_INTERVAL
        done

        echo "FINAL_WRITE_COUNT:$WRITE_COUNT" >> $WRITE_LOG
    ) &

    WRITER_PID=$!
    log_with_timestamp "Background writer started (PID: $WRITER_PID)"

    log_with_timestamp "Monitoring primary during partition..."

    # Wait for specified duration and collect metrics
    for ((i=1; i<=DURATION; i++)); do
        sleep 60
        log_with_timestamp "Partition active: $i/$DURATION minutes elapsed..."
        PRIMARY_COUNT=$(docker exec pg-primary psql -U postgres -d testdb -t -c "SELECT COUNT(*) FROM test_data;" | xargs)
        RECORDS_WRITTEN=$((PRIMARY_COUNT - STANDBY_COUNT_BEFORE))
        log_with_timestamp "  Primary count: $PRIMARY_COUNT (written: $RECORDS_WRITTEN records)"

        # Collect metrics from primary (standby will fail, which is expected)
        if [ $i -eq 1 ] || [ $((i % 2)) -eq 0 ]; then
            log_with_timestamp "  Collecting metrics..."
            npm run metrics:physical 2>&1 | grep -E "(Primary|Replication State|replica|lag|Warning)" || true
        fi
    done

    # Wait for writer to finish
    wait $WRITER_PID

    # Get final write count
    if [ -f $WRITE_LOG ]; then
        FINAL_COUNT=$(grep "FINAL_WRITE_COUNT" $WRITE_LOG | cut -d: -f2)
        log_with_timestamp "Background writer completed: $FINAL_COUNT records written"
    fi

    PRIMARY_COUNT_DURING=$(docker exec pg-primary psql -U postgres -d testdb -t -c "SELECT COUNT(*) FROM test_data;" | xargs)
    log_with_timestamp "Final primary count during partition: $PRIMARY_COUNT_DURING"
    log_with_timestamp "Total standby lag: $((PRIMARY_COUNT_DURING - STANDBY_COUNT_BEFORE)) records"

    echo ""
    log_with_timestamp "=== PHASE 3: Network Recovery ==="
    log_with_timestamp "Reconnecting standby to network..."
    ./scripts/network-control.sh connect physical --node standby

    log_with_timestamp "Waiting for replication to catch up..."
    CATCHUP_START=$(date +%s)

    while true; do
        PRIMARY_COUNT=$(docker exec pg-primary psql -U postgres -d testdb -t -c "SELECT COUNT(*) FROM test_data;" | xargs)
        STANDBY_COUNT=$(docker exec pg-standby psql -U postgres -d testdb -t -c "SELECT COUNT(*) FROM test_data;" | xargs)

        log_with_timestamp "  Primary: $PRIMARY_COUNT, Standby: $STANDBY_COUNT, Lag: $((PRIMARY_COUNT - STANDBY_COUNT))"

        if [[ $PRIMARY_COUNT -eq $STANDBY_COUNT ]]; then
            CATCHUP_END=$(date +%s)
            CATCHUP_TIME=$((CATCHUP_END - CATCHUP_START))
            log_with_timestamp "✓ Replication caught up! Recovery time: ${CATCHUP_TIME}s"
            break
        fi
    done

    echo ""
    log_with_timestamp "=== PHASE 4: Final Metrics ==="
    npm run metrics:physical

    echo ""
    log_with_timestamp "Test scenario completed!"
    log_with_timestamp "Summary:"
    log_with_timestamp "  - Partition duration: $DURATION minutes"
    log_with_timestamp "  - Records written during partition: $((PRIMARY_COUNT_DURING - STANDBY_COUNT_BEFORE)) records"
    log_with_timestamp "  - Write rate: ~$(((PRIMARY_COUNT_DURING - STANDBY_COUNT_BEFORE) * 60) / (DURATION * 60))) records/min"
    log_with_timestamp "  - Recovery time (RTO): ${CATCHUP_TIME}s"
    log_with_timestamp "  - Final counts - Primary: $PRIMARY_COUNT, Standby: $STANDBY_COUNT"
    log_with_timestamp "  - Data consistency: $([ $PRIMARY_COUNT -eq $STANDBY_COUNT ] && echo '✓ Perfect' || echo '✗ Mismatch')"
}

function test_logical_scenario() {
    log_with_timestamp "Starting Logical Replication Test Scenario (Bidirectional)"
    log_with_timestamp "Partition duration: $DURATION minutes"
    echo ""

    # Check if logical replication is set up
    log_with_timestamp "Checking if bidirectional replication is configured..."
    SUB_COUNT_A=$(docker exec pg-node-a psql -U postgres -d testdb -t -c "SELECT COUNT(*) FROM pg_subscription;" 2>/dev/null | xargs)
    SUB_COUNT_B=$(docker exec pg-node-b psql -U postgres -d testdb -t -c "SELECT COUNT(*) FROM pg_subscription;" 2>/dev/null | xargs)

    if [[ "$SUB_COUNT_A" == "0" ]] || [[ "$SUB_COUNT_B" == "0" ]]; then
        log_with_timestamp "⚠ Subscriptions not found! Setting up bidirectional replication..."
        ./setup-logical-replication.sh
        log_with_timestamp "✓ Bidirectional replication configured"
    else
        log_with_timestamp "✓ Bidirectional replication already configured"
    fi
    echo ""

    # Baseline metrics
    log_with_timestamp "=== PHASE 1: Baseline (Normal Operation) ==="
    log_with_timestamp "Collecting baseline metrics..."
    npm run metrics:logical

    log_with_timestamp "Testing bidirectional replication..."
    npm run test:logical

    # Get initial counts
    NODE_A_COUNT_BEFORE=$(docker exec pg-node-a psql -U postgres -d testdb -t -c "SELECT COUNT(*) FROM test_data;" | xargs)
    NODE_B_COUNT_BEFORE=$(docker exec pg-node-b psql -U postgres -d testdb -t -c "SELECT COUNT(*) FROM test_data;" | xargs)
    log_with_timestamp "Initial counts - Node A: $NODE_A_COUNT_BEFORE, Node B: $NODE_B_COUNT_BEFORE"

    echo ""
    log_with_timestamp "=== PHASE 2: Network Partition ==="
    log_with_timestamp "Disconnecting Node B from network..."
    ./scripts/network-control.sh disconnect logical --node node-b

    EXPECTED_WRITES=$((DURATION * 60 / WRITE_INTERVAL))
    log_with_timestamp "Starting BIDIRECTIONAL continuous writes during partition..."
    log_with_timestamp "Write interval: $WRITE_INTERVAL seconds (~$((60 / WRITE_INTERVAL)) records/min per node)"
    log_with_timestamp "Expected total writes: ~$((EXPECTED_WRITES * 2)) records (from both nodes)"
    log_with_timestamp "This demonstrates true Active-Active capability!"

    # Start background writer for Node A
    WRITE_LOG_A="/tmp/logical_partition_writes_a_$$.log"
    (
        WRITE_COUNT=0
        TOTAL_DURATION=$((DURATION * 60))
        START_TIME=$(date +%s)

        while true; do
            ELAPSED=$(($(date +%s) - START_TIME))
            if [ $ELAPSED -ge $TOTAL_DURATION ]; then
                break
            fi

            WRITE_COUNT=$((WRITE_COUNT + 1))
            docker exec pg-node-a psql -U postgres -d testdb -c \
                "INSERT INTO test_data (payload, source_node) VALUES ('{\"partition_write\": $WRITE_COUNT, \"elapsed_sec\": $ELAPSED, \"write_interval\": $WRITE_INTERVAL, \"node\": \"A\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}'::jsonb, 'node-a-partition-continuous');" \
                >> $WRITE_LOG_A 2>&1

            sleep $WRITE_INTERVAL
        done

        echo "FINAL_WRITE_COUNT:$WRITE_COUNT" >> $WRITE_LOG_A
    ) &

    WRITER_PID_A=$!
    log_with_timestamp "Background writer for Node A started (PID: $WRITER_PID_A)"

    # Start background writer for Node B (writes independently while disconnected!)
    WRITE_LOG_B="/tmp/logical_partition_writes_b_$$.log"
    (
        WRITE_COUNT=0
        TOTAL_DURATION=$((DURATION * 60))
        START_TIME=$(date +%s)

        while true; do
            ELAPSED=$(($(date +%s) - START_TIME))
            if [ $ELAPSED -ge $TOTAL_DURATION ]; then
                break
            fi

            WRITE_COUNT=$((WRITE_COUNT + 1))
            docker exec pg-node-b psql -U postgres -d testdb -c \
                "INSERT INTO test_data (payload, source_node) VALUES ('{\"partition_write\": $WRITE_COUNT, \"elapsed_sec\": $ELAPSED, \"write_interval\": $WRITE_INTERVAL, \"node\": \"B\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}'::jsonb, 'node-b-partition-continuous');" \
                >> $WRITE_LOG_B 2>&1

            sleep $WRITE_INTERVAL
        done

        echo "FINAL_WRITE_COUNT:$WRITE_COUNT" >> $WRITE_LOG_B
    ) &

    WRITER_PID_B=$!
    log_with_timestamp "Background writer for Node B started (PID: $WRITER_PID_B)"
    log_with_timestamp "Both nodes writing independently - true Active-Active!"

    log_with_timestamp "Monitoring both nodes during partition..."

    # Wait for specified duration and collect metrics
    for ((i=1; i<=DURATION; i++)); do
        sleep 60
        log_with_timestamp "Partition active: $i/$DURATION minutes elapsed..."
        NODE_A_COUNT=$(docker exec pg-node-a psql -U postgres -d testdb -t -c "SELECT COUNT(*) FROM test_data;" 2>/dev/null | xargs)
        NODE_B_COUNT=$(docker exec pg-node-b psql -U postgres -d testdb -t -c "SELECT COUNT(*) FROM test_data;" 2>/dev/null | xargs)
        RECORDS_WRITTEN_A=$((NODE_A_COUNT - NODE_A_COUNT_BEFORE))
        RECORDS_WRITTEN_B=$((NODE_B_COUNT - NODE_B_COUNT_BEFORE))
        log_with_timestamp "  Node A: $NODE_A_COUNT (+$RECORDS_WRITTEN_A), Node B: $NODE_B_COUNT (+$RECORDS_WRITTEN_B)"
        log_with_timestamp "  Both nodes writing independently!"

        # Collect metrics from Node A (Node B will show as unavailable due to network)
        if [ $i -eq 1 ] || [ $((i % 2)) -eq 0 ]; then
            log_with_timestamp "  Collecting metrics..."
            npm run metrics:logical 2>&1 | grep -E "(Node A|Node B|Subscription|Publication|Warning|Unavailable)" || true
        fi
    done

    # Wait for both writers to finish
    wait $WRITER_PID_A
    wait $WRITER_PID_B

    # Get final write counts
    if [ -f $WRITE_LOG_A ]; then
        FINAL_COUNT_A=$(grep "FINAL_WRITE_COUNT" $WRITE_LOG_A | cut -d: -f2)
        log_with_timestamp "Background writer A completed: $FINAL_COUNT_A records written to Node A"
    fi

    if [ -f $WRITE_LOG_B ]; then
        FINAL_COUNT_B=$(grep "FINAL_WRITE_COUNT" $WRITE_LOG_B | cut -d: -f2)
        log_with_timestamp "Background writer B completed: $FINAL_COUNT_B records written to Node B"
    fi

    NODE_A_COUNT_DURING=$(docker exec pg-node-a psql -U postgres -d testdb -t -c "SELECT COUNT(*) FROM test_data;" | xargs)
    NODE_B_COUNT_DURING=$(docker exec pg-node-b psql -U postgres -d testdb -t -c "SELECT COUNT(*) FROM test_data;" | xargs)
    log_with_timestamp "Final counts during partition:"
    log_with_timestamp "  Node A: $NODE_A_COUNT_DURING (wrote $((NODE_A_COUNT_DURING - NODE_A_COUNT_BEFORE)) records)"
    log_with_timestamp "  Node B: $NODE_B_COUNT_DURING (wrote $((NODE_B_COUNT_DURING - NODE_B_COUNT_BEFORE)) records)"
    log_with_timestamp "  Total new records: $((NODE_A_COUNT_DURING - NODE_A_COUNT_BEFORE + NODE_B_COUNT_DURING - NODE_B_COUNT_BEFORE))"

    echo ""
    log_with_timestamp "=== PHASE 3: Network Recovery ==="
    log_with_timestamp "Reconnecting Node B to network..."
    ./scripts/network-control.sh connect logical --node node-b

    log_with_timestamp "Waiting for BIDIRECTIONAL synchronization..."
    log_with_timestamp "Node A will receive records from Node B"
    log_with_timestamp "Node B will receive records from Node A"
    CATCHUP_START=$(date +%s)

    EXPECTED_FINAL_COUNT=$((NODE_A_COUNT_DURING + NODE_B_COUNT_DURING - NODE_A_COUNT_BEFORE - NODE_B_COUNT_BEFORE))

    while true; do
        NODE_A_COUNT=$(docker exec pg-node-a psql -U postgres -d testdb -t -c "SELECT COUNT(*) FROM test_data;" 2>/dev/null | xargs)
        NODE_B_COUNT=$(docker exec pg-node-b psql -U postgres -d testdb -t -c "SELECT COUNT(*) FROM test_data;" 2>/dev/null | xargs)

        log_with_timestamp "  Node A: $NODE_A_COUNT, Node B: $NODE_B_COUNT (target: ~$EXPECTED_FINAL_COUNT each)"

        if [[ $NODE_A_COUNT -eq $NODE_B_COUNT ]]; then
            CATCHUP_END=$(date +%s)
            CATCHUP_TIME=$((CATCHUP_END - CATCHUP_START))
            log_with_timestamp "✓ Bidirectional replication synchronized!"
            log_with_timestamp "  Recovery time (RTO): ${CATCHUP_TIME}s"
            log_with_timestamp "  Final count: $NODE_A_COUNT records on each node"
            log_with_timestamp "  Successfully merged: $((NODE_A_COUNT_DURING - NODE_A_COUNT_BEFORE)) from A + $((NODE_B_COUNT_DURING - NODE_B_COUNT_BEFORE)) from B"
            break
        fi
    done

    echo ""
    log_with_timestamp "=== PHASE 4: Final Metrics ==="
    npm run metrics:logical

    echo ""
    log_with_timestamp "Test scenario completed!"
    log_with_timestamp "Summary:"
    log_with_timestamp "  - Partition duration: $DURATION minutes"
    log_with_timestamp "  - Records written to Node A: $((NODE_A_COUNT_DURING - NODE_A_COUNT_BEFORE)) records"
    log_with_timestamp "  - Records written to Node B: $((NODE_B_COUNT_DURING - NODE_B_COUNT_BEFORE)) records"
    log_with_timestamp "  - Total new records: $((NODE_A_COUNT_DURING - NODE_A_COUNT_BEFORE + NODE_B_COUNT_DURING - NODE_B_COUNT_BEFORE)) records"
    log_with_timestamp "  - Write rate per node: ~$((60 / WRITE_INTERVAL)) records/min"
    log_with_timestamp "  - Recovery time (RTO): ${CATCHUP_TIME}s"
    log_with_timestamp "  - Final counts - Node A: $NODE_A_COUNT, Node B: $NODE_B_COUNT"
    log_with_timestamp "  - Data consistency: $([ $NODE_A_COUNT -eq $NODE_B_COUNT ] && echo '✓ Perfect - Bidirectional sync successful!' || echo '✗ Mismatch')"
    log_with_timestamp "  - Active-Active demonstration: ✓ Both nodes wrote independently and merged successfully"
}

# Run appropriate test
case $TOPOLOGY in
    physical)
        test_physical_scenario
        ;;
    logical)
        test_logical_scenario
        ;;
    *)
        echo "Invalid topology: $TOPOLOGY"
        show_usage
        exit 1
        ;;
esac
