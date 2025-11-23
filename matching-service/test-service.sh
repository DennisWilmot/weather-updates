#!/bin/bash

# Test script for matching-service deployed on Railway
# Usage: ./test-service.sh <RAILWAY_URL>
# Example: ./test-service.sh https://matching-service-production.up.railway.app

if [ -z "$1" ]; then
  echo "Usage: ./test-service.sh <RAILWAY_URL>"
  echo "Example: ./test-service.sh https://matching-service-production.up.railway.app"
  exit 1
fi

BASE_URL="$1"
echo "Testing matching-service at: $BASE_URL"
echo ""

# Test 1: Health check
echo "=== Test 1: Health Check ==="
curl -X GET "$BASE_URL/health" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' || echo "Response (raw):"
echo ""

# Test 2: Root endpoint (API info)
echo "=== Test 2: API Information ==="
curl -X GET "$BASE_URL/" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' || echo "Response (raw):"
echo ""

# Test 3: Planning endpoint with sample data
echo "=== Test 3: Planning Endpoint (POST /plan) ==="
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
      },
      {
        "id": "w2",
        "parishId": "p2",
        "lat": 18.1,
        "lng": -77.0,
        "inventory": [
          { "warehouseId": "w2", "itemCode": "food", "quantity": 800 },
          { "warehouseId": "w2", "itemCode": "water", "quantity": 600 }
        ]
      }
    ],
    "communities": [
      {
        "id": "c1",
        "parishId": "p1",
        "lat": 18.05,
        "lng": -76.85
      },
      {
        "id": "c2",
        "parishId": "p2",
        "lat": 18.12,
        "lng": -77.05
      }
    ],
    "communityNeeds": [
      {
        "communityId": "c1",
        "itemCode": "food",
        "quantity": 200,
        "priority": 1
      },
      {
        "communityId": "c1",
        "itemCode": "water",
        "quantity": 150,
        "priority": 1
      },
      {
        "communityId": "c2",
        "itemCode": "food",
        "quantity": 300,
        "priority": 2
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
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' || echo "Response (raw):"
echo ""

echo "=== Tests Complete ==="

