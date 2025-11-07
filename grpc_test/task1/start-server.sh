#!/bin/bash

set -e

echo "Starting Python gRPC server..."

cd "$(dirname "$0")/server"

if [ ! -d "grpc_test_env" ]; then
    echo "Creating virtual environment..."
    python3 -m venv grpc_test_env
fi

source grpc_test_env/bin/activate

if [ ! -f "grpc_test_env/.installed" ]; then
    echo "Installing dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    touch grpc_test_env/.installed
fi

if [ ! -d "pb" ] || [ ! -f "pb/user_pb2.py" ] || [ ! -f "pb/user_pb2_grpc.py" ]; then
    echo "Generating protobuf files..."
    mkdir -p pb
    python -m grpc_tools.protoc \
        -I../proto \
        --python_out=./pb \
        --grpc_python_out=./pb \
        ../proto/user.proto
    touch pb/__init__.py
    echo "Protobuf files generated"
fi

echo "Starting server on port :50051..."
python server.py
