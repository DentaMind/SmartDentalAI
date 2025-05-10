#!/bin/bash
echo "Stopping all DentaMind services..."
pkill -f "dentamind_server.py"
pkill -f "debug_routes_simple.py"
pkill -f "uvicorn"
echo "All DentaMind services stopped."
