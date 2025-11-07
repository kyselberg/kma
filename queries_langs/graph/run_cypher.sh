#!/bin/bash

# Run Cypher queries from files
# Usage: ./run_cypher.sh filename.cypher [param1] [param2] ...

if [ $# -eq 0 ]; then
    echo "Usage: ./run_cypher.sh <query_file.cypher> [parameters...]"
    echo ""
    echo "Available queries:"
    ls -1 q/*.cypher | sed 's/.*\///' | sed 's/\.cypher$//' | sed 's/^/  /'
    echo ""
    echo "Examples:"
    echo "  ./run_cypher.sh get_all_cvs.cypher"
    echo "  ./run_cypher.sh get_hobbies_by_city.cypher \"Kyiv\""
    echo "  ./run_cypher.sh get_candidates_by_skills.cypher \"JavaScript\" \"expert,advanced\""
    exit 1
fi

QUERY_FILE="q/$1"

if [ ! -f "$QUERY_FILE" ]; then
    echo "❌ Query file not found: $QUERY_FILE"
    echo "Available queries:"
    ls -1 q/*.cypher | sed 's/.*\///' | sed 's/\.cypher$//' | sed 's/^/  /'
    exit 1
fi

echo "📄 Running query: $1"
echo "📁 File: $QUERY_FILE"
echo "----------------------------------------"

# Handle parameters
if [ $# -gt 1 ]; then
    # Multiple parameters - pass them as JSON
    shift
    PARAMS=""
    for param in "$@"; do
        if [ -z "$PARAMS" ]; then
            PARAMS="\"$param\""
        else
            PARAMS="$PARAMS, \"$param\""
        fi
    done

    # For simplicity, we'll handle common parameter patterns
    QUERY=$(cat "$QUERY_FILE")

    # Replace $city with first parameter
    if [[ "$QUERY" == *"\$city"* ]]; then
        QUERY=$(echo "$QUERY" | sed "s/\$city/'$1'/g")
    fi

    # Replace $skill_name with first parameter
    if [[ "$QUERY" == *"\$skill_name"* ]]; then
        QUERY=$(echo "$QUERY" | sed "s/\$skill_name/'$1'/g")
    fi

    # Replace $levels with second parameter (convert comma-separated to array)
    if [[ "$QUERY" == *"\$levels"* ]] && [ $# -ge 2 ]; then
        LEVELS_ARRAY="['$(echo "$2" | sed "s/,/','/g")']"
        QUERY=$(echo "$QUERY" | sed "s/\$levels/$LEVELS_ARRAY/g")
    fi

    echo "$QUERY" | docker exec -i hr_neo4j cypher-shell -u neo4j -p password123
else
    # No parameters - just run the file
    docker exec -i hr_neo4j cypher-shell -u neo4j -p password123 < "$QUERY_FILE"
fi
