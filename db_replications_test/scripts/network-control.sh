#!/bin/bash

# Script to control network connectivity for testing network partitions
# This simulates network disconnection scenarios

set -e

function show_usage() {
    echo "Usage: $0 <action> <topology> [options]"
    echo ""
    echo "Actions:"
    echo "  disconnect  - Disconnect node(s) from network"
    echo "  connect     - Reconnect node(s) to network"
    echo "  status      - Show current network status"
    echo ""
    echo "Topologies:"
    echo "  physical    - Physical replication (primary/standby)"
    echo "  logical     - Logical replication (node-a/node-b)"
    echo ""
    echo "Options:"
    echo "  --node <name>    - Specific node to target (standby, node-a, node-b)"
    echo "  --duration <min> - Auto-reconnect after N minutes"
    echo ""
    echo "Examples:"
    echo "  $0 disconnect physical --node standby --duration 5"
    echo "  $0 connect physical --node standby"
    echo "  $0 disconnect logical --node node-a --duration 10"
    echo "  $0 status physical"
}

ACTION=$1
TOPOLOGY=$2
NODE=""
DURATION=""

# Parse additional options
shift 2 || true
while [[ $# -gt 0 ]]; do
    case $1 in
        --node)
            NODE="$2"
            shift 2
            ;;
        --duration)
            DURATION="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate inputs
if [[ -z "$ACTION" ]] || [[ -z "$TOPOLOGY" ]]; then
    show_usage
    exit 1
fi

# Determine container and network based on topology
if [[ "$TOPOLOGY" == "physical" ]]; then
    NETWORK="replication-net"
    if [[ -z "$NODE" ]]; then
        NODE="standby"
    fi
    if [[ "$NODE" == "standby" ]]; then
        CONTAINER="pg-standby"
    elif [[ "$NODE" == "primary" ]]; then
        CONTAINER="pg-primary"
    else
        echo "Invalid node for physical topology: $NODE"
        echo "Valid nodes: primary, standby"
        exit 1
    fi
elif [[ "$TOPOLOGY" == "logical" ]]; then
    NETWORK="replication-net-logical"
    if [[ -z "$NODE" ]]; then
        echo "Error: --node is required for logical topology"
        echo "Valid nodes: node-a, node-b"
        exit 1
    fi
    if [[ "$NODE" == "node-a" ]]; then
        CONTAINER="pg-node-a"
    elif [[ "$NODE" == "node-b" ]]; then
        CONTAINER="pg-node-b"
    else
        echo "Invalid node for logical topology: $NODE"
        echo "Valid nodes: node-a, node-b"
        exit 1
    fi
else
    echo "Invalid topology: $TOPOLOGY"
    echo "Valid topologies: physical, logical"
    exit 1
fi

function disconnect_node() {
    echo "Disconnecting $CONTAINER from $NETWORK..."

    if docker network inspect $NETWORK &>/dev/null; then
        docker network disconnect $NETWORK $CONTAINER 2>/dev/null || echo "Node may already be disconnected"
        echo "✓ $CONTAINER disconnected from $NETWORK"

        if [[ -n "$DURATION" ]]; then
            echo "⏰ Auto-reconnect scheduled in $DURATION minutes"
            echo "Run this command manually to reconnect:"
            echo "  $0 connect $TOPOLOGY --node $NODE"

            # Schedule reconnection
            (
                sleep $((DURATION * 60))
                echo ""
                echo "⏰ Auto-reconnecting $CONTAINER to $NETWORK..."
                docker network connect $NETWORK $CONTAINER
                echo "✓ $CONTAINER reconnected to $NETWORK"
            ) &

            RECONNECT_PID=$!
            echo "Background reconnection process: $RECONNECT_PID"
        fi
    else
        echo "Error: Network $NETWORK not found"
        exit 1
    fi
}

function connect_node() {
    echo "Connecting $CONTAINER to $NETWORK..."

    if docker network inspect $NETWORK &>/dev/null; then
        docker network connect $NETWORK $CONTAINER 2>/dev/null || echo "Node may already be connected"
        echo "✓ $CONTAINER connected to $NETWORK"
    else
        echo "Error: Network $NETWORK not found"
        exit 1
    fi
}

function show_status() {
    echo "Network Status for $TOPOLOGY topology:"
    echo ""

    if docker network inspect $NETWORK &>/dev/null; then
        echo "Network: $NETWORK"
        echo "Containers connected:"
        docker network inspect $NETWORK | grep -A 5 '"Containers"' | grep '"Name"' | sed 's/.*"Name": "\(.*\)".*/  - \1/'
        echo ""

        # Check specific container connectivity
        if [[ -n "$NODE" ]]; then
            if docker network inspect $NETWORK | grep -q "\"Name\": \"$CONTAINER\""; then
                echo "Status: $CONTAINER is CONNECTED to $NETWORK ✓"
            else
                echo "Status: $CONTAINER is DISCONNECTED from $NETWORK ✗"
            fi
        fi
    else
        echo "Error: Network $NETWORK not found"
        exit 1
    fi
}

# Execute action
case $ACTION in
    disconnect)
        disconnect_node
        ;;
    connect)
        connect_node
        ;;
    status)
        show_status
        ;;
    *)
        echo "Invalid action: $ACTION"
        show_usage
        exit 1
        ;;
esac
