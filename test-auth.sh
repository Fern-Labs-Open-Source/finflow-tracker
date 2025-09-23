#!/bin/bash

# Multi-User Authentication Test Script
BASE_URL="http://localhost:3001"

echo "================================="
echo "🧪 Multi-User Authentication Test"
echo "================================="

# Test 1: Unauthorized access should be blocked
echo -e "\n🚫 Testing Unauthorized Access..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/accounts")
if [ "$response" = "401" ]; then
  echo "✅ Unauthorized access properly blocked (401)"
else
  echo "❌ CRITICAL: Unauthorized access not blocked! (Got: $response)"
  exit 1
fi

# Test 2: Register User 1
echo -e "\n📝 Registering User 1..."
response=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@example.com",
    "password": "TestPass123!",
    "name": "Test User 1"
  }')

echo "Response: $response"

# Test 3: Register User 2
echo -e "\n📝 Registering User 2..."
response=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "TestPass456!",
    "name": "Test User 2"
  }')

echo "Response: $response"

# Test 4: Try to access API endpoints
echo -e "\n🔐 Testing protected endpoints..."

# Get CSRF token first
echo "Getting CSRF token..."
csrf_response=$(curl -s "$BASE_URL/api/auth/csrf")
csrf_token=$(echo $csrf_response | grep -o '"csrfToken":"[^"]*' | sed 's/"csrfToken":"//')
echo "CSRF Token: $csrf_token"

echo -e "\n================================="
echo "✅ Basic tests completed!"
echo "================================="
echo ""
echo "Next steps to complete testing:"
echo "1. Login via the UI at $BASE_URL/login"
echo "2. Create some test data for each user"
echo "3. Verify each user only sees their own data"
echo ""
