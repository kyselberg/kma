#!/bin/bash

# Run MongoDB queries
# Usage: ./run_query.sh <query_file>

if [ $# -eq 0 ]; then
    echo "Usage: ./run_query.sh <query_file>"
    echo "Available queries:"
    ls -1 q/
    exit 1
fi

QUERY_FILE=$1

if [ ! -f "q/$QUERY_FILE" ]; then
    echo "Query file 'q/$QUERY_FILE' not found!"
    echo "Available queries:"
    ls -1 q/
    exit 1
fi

echo "Running query: $QUERY_FILE"
echo "=================================="

# Read the query file and execute it
QUERY_CONTENT=$(cat "q/$QUERY_FILE")
mongosh mongodb://admin:password123@localhost:27017/hr_database?authSource=admin --eval "$QUERY_CONTENT"
