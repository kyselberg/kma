#!/bin/bash

# Start MongoDB and load data
echo "Starting MongoDB container..."
docker-compose up -d

echo "Waiting for MongoDB to be ready..."
sleep 10

echo "Loading seed data..."
./load_data.sh

echo "MongoDB is ready!"
echo "Connect with: mongosh mongodb://admin:password123@localhost:27017/hr_database?authSource=admin"
echo "Run queries with: ./run_query.sh <query_file>"
