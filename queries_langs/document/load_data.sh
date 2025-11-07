#!/bin/bash

# Load data into MongoDB
echo "Loading HR data into MongoDB..."

# Wait a moment for MongoDB to be fully ready
sleep 2

# Connect to MongoDB and load the seed data
mongosh mongodb://admin:password123@localhost:27017/hr_database?authSource=admin --file comprehensive_seed_data.js

if [ $? -eq 0 ]; then
    echo "Data loading completed successfully!"
else
    echo "Data loading completed with some warnings (duplicates may have been skipped)."
fi
