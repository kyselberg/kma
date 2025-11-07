#!/bin/bash

set -e

cd "$(dirname "$0")/python-producer"

if [ ! -d "queue_venv" ]; then
    python3 -m venv queue_venv
fi

source queue_venv/bin/activate

if [ ! -f "queue_venv/.installed" ]; then
    pip install --upgrade pip
    pip install -r requirements.txt
    touch queue_venv/.installed
fi

python producer.py
