#!/bin/bash

set -e

cd task1/server
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
mkdir -p pb
python -m grpc_tools.protoc \
    -I../proto \
    --python_out=./pb \
    --grpc_python_out=./pb \
    ../proto/user.proto
touch pb/__init__.py
deactivate

cd ../client
npm install --silent

cd ../../task2/python-producer
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
deactivate

cd ../ts-consumer
npm install --silent

cd ../..
