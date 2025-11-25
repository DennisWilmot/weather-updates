#!/bin/bash

# Simple test script (no jq dependency)
# Usage: ./test-service-simple.sh <RAILWAY_URL>

if [ -z "$1" ]; then
  echo "Usage: ./test-service-simple.sh <RAILWAY_URL>"
  echo ""
  echo "To find your Railway URL:"
  echo "1. Go to Railway dashboard"
  echo "2. Click on your matching-service project"
  echo "3. Go to Settings > Networking"
  echo "4. Copy the Public Domain URL"
  echo ""
  exit 1
fi

BASE_URL="$1"
echo "Testing matching-service at: $BASE_URL"
echo ""

# Test 1: Health check
echo "=== Test 1: Health Check ==="
curl -X GET "$BASE_URL/health" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n"
echo ""

# Test 2: Root endpoint
echo "=== Test 2: API Information ==="
curl -X GET "$BASE_URL/" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n"
echo ""

# Test 3: Planning endpoint
echo "=== Test 3: Planning Endpoint ==="
curl -X POST "$BASE_URL/plan" \
  -H "Content-Type: application/json" \
  -d '{
    "warehouses": [
      {
        "id": "w1",
        "parishId": "p1",
        "lat": 18.0,
        "lng": -76.8,
        "inventory": [
          { "warehouseId": "w1", "itemCode": "food", "quantity": 1000 },
          { "warehouseId": "w1", "itemCode": "water", "quantity": 500 }
        ]
      }
    ],
    "communities": [
      {
        "id": "c1",
        "parishId": "p1",
        "lat": 18.05,
        "lng": -76.85
      }
    ],
    "communityNeeds": [
      {
        "communityId": "c1",
        "itemCode": "food",
        "quantity": 200,
        "priority": 1
      }
    ],
    "constraints": {
      "reserveFraction": 0.2,
      "maxDistanceKm": 100,
      "distanceWeight": 1.0,
      "riskWeight": 0.5,
      "fairnessWeight": 0.3
    }
  }' \
  -w "\n\nHTTP Status: %{http_code}\n"
echo ""

echo "=== Tests Complete ==="

