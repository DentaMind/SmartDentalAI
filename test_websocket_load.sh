#!/bin/bash
# Script to run WebSocket stress tests with different load profiles

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not found in PATH"
    exit 1
fi

# Default values
SERVER_URL=${WS_SERVER_URL:-"ws://localhost:8000/ws"}
API_URL=${WS_API_URL:-"http://localhost:8000/api/ws"}
TOKEN=""

# Function to print usage
print_usage() {
    echo "WebSocket Load Testing Utility"
    echo ""
    echo "Usage: $0 [options] [test_profile]"
    echo ""
    echo "Test Profiles:"
    echo "  light    - Light load (50 connections, 1s interval)"
    echo "  medium   - Medium load (200 connections, 0.5s interval)"
    echo "  heavy    - Heavy load (500 connections, 0.2s interval)"
    echo "  extreme  - Extreme load (1000 connections, 0.1s interval)"
    echo "  custom   - Custom test with specified parameters"
    echo ""
    echo "Options:"
    echo "  --url URL       WebSocket server URL (default: $SERVER_URL)"
    echo "  --api URL       API server URL (default: $API_URL)"
    echo "  --token TOKEN   Authentication token"
    echo "  --connections N Number of connections for custom test"
    echo "  --duration N    Test duration in seconds (default: 60)"
    echo "  --interval N    Message interval in seconds for custom test"
    echo "  --help          Show this help message"
    echo ""
}

# Parse arguments
PROFILE=""
CONNECTIONS=""
DURATION="60"
INTERVAL=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --url)
            SERVER_URL="$2"
            shift 2
            ;;
        --api)
            API_URL="$2"
            shift 2
            ;;
        --token)
            TOKEN="$2"
            shift 2
            ;;
        --connections)
            CONNECTIONS="$2"
            shift 2
            ;;
        --duration)
            DURATION="$2"
            shift 2
            ;;
        --interval)
            INTERVAL="$2"
            shift 2
            ;;
        --help)
            print_usage
            exit 0
            ;;
        light|medium|heavy|extreme|custom)
            PROFILE="$1"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
done

# If no profile specified, show usage and exit
if [ -z "$PROFILE" ]; then
    print_usage
    exit 1
fi

# Set test parameters based on profile
case $PROFILE in
    light)
        CONNECTIONS="50"
        INTERVAL="1.0"
        ;;
    medium)
        CONNECTIONS="200"
        INTERVAL="0.5"
        ;;
    heavy)
        CONNECTIONS="500"
        INTERVAL="0.2"
        ;;
    extreme)
        CONNECTIONS="1000"
        INTERVAL="0.1"
        ;;
    custom)
        # For custom profile, ensure required parameters are provided
        if [ -z "$CONNECTIONS" ] || [ -z "$INTERVAL" ]; then
            echo "Error: Custom profile requires --connections and --interval parameters"
            print_usage
            exit 1
        fi
        ;;
esac

# Show test configuration
echo "=================================="
echo "WebSocket Load Test Configuration:"
echo "=================================="
echo "Profile:     $PROFILE"
echo "Server URL:  $SERVER_URL"
echo "API URL:     $API_URL"
echo "Connections: $CONNECTIONS"
echo "Duration:    $DURATION seconds"
echo "Interval:    $INTERVAL seconds"
echo "=================================="
echo "Starting test in 3 seconds..."
echo "=================================="
sleep 3

# Build command with all parameters
CMD="python3 backend/api/utils/websocket_stress_tester.py --server-url \"$SERVER_URL\" --api-url \"$API_URL\" --connections $CONNECTIONS --duration $DURATION --interval $INTERVAL"

if [ -n "$TOKEN" ]; then
    CMD="$CMD --token \"$TOKEN\""
fi

# Run the test
echo "$CMD"
eval "$CMD"

# Create log filename with timestamp and profile
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="websocket_stress_${PROFILE}_${TIMESTAMP}.log"

# Save the last log file to a more descriptive filename
if [ -f "websocket_stress_test.log" ]; then
    cp "websocket_stress_test.log" "$LOG_FILE"
    echo ""
    echo "Log saved to: $LOG_FILE"
fi

echo ""
echo "Test completed!" 