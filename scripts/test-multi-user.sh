#!/bin/bash

# Test Multi-User Data Isolation
# This script runs critical security tests to ensure user data is properly isolated

set -e

echo "🔍 Testing Multi-User Data Isolation..."
echo "========================================="

# Check if server is running
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "❌ Server is not running. Starting development server..."
    npm run dev &
    SERVER_PID=$!
    echo "Waiting for server to start..."
    sleep 10
    
    # Check again
    if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "❌ Failed to start server"
        exit 1
    fi
    echo "✅ Server started (PID: $SERVER_PID)"
else
    echo "✅ Server is running"
fi

# Run the multi-user isolation tests
echo ""
echo "🧪 Running Multi-User Isolation Tests..."
echo "-----------------------------------------"
npm test -- tests/api/multi-user-isolation.test.ts

# If we started the server, stop it
if [ ! -z "$SERVER_PID" ]; then
    echo ""
    echo "Stopping development server..."
    kill $SERVER_PID 2>/dev/null || true
fi

echo ""
echo "✅ Multi-User Isolation Tests Complete!"
