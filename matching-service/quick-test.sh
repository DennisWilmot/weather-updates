#!/bin/bash

# Quick test script - replace YOUR_RAILWAY_URL with your actual Railway public domain
# Find it in Railway Dashboard → Settings → Networking → Public Domain

RAILWAY_URL="${1:-YOUR_RAILWAY_URL}"

if [ "$RAILWAY_URL" = "YOUR_RAILWAY_URL" ]; then
  echo "❌ Please provide your Railway URL as an argument"
  echo ""
  echo "Usage: ./quick-test.sh https://your-service.up.railway.app"
  echo ""
  echo "To find your Railway URL:"
  echo "1. Go to Railway Dashboard"
  echo "2. Click on matching-service project"
  echo "3. Settings → Networking"
  echo "4. Copy the Public Domain URL"
  exit 1
fi

echo "🧪 Testing Matching Service at: $RAILWAY_URL"
echo ""

# Test 1: Health Check
echo "=== 1. Health Check ==="
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$RAILWAY_URL/health")
HTTP_STATUS=$(echo "$HEALTH_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$HEALTH_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Health check passed!"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ Health check failed (HTTP $HTTP_STATUS)"
  echo "$BODY"
fi
echo ""

# Test 2: API Info
echo "=== 2. API Information ==="
API_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$RAILWAY_URL/")
HTTP_STATUS=$(echo "$API_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$API_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ API info retrieved!"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ API info failed (HTTP $HTTP_STATUS)"
  echo "$BODY"
fi
echo ""

# Test 3: Planning Endpoint
echo "=== 3. Planning Endpoint (POST /plan) ==="
PLAN_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$RAILWAY_URL/plan" \
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
  }')

HTTP_STATUS=$(echo "$PLAN_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$PLAN_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Planning endpoint works!"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  
  # Check if we got shipments
  if echo "$BODY" | grep -q "shipments"; then
    SHIPMENT_COUNT=$(echo "$BODY" | jq '.shipments | length' 2>/dev/null || echo "0")
    FULFILLMENT=$(echo "$BODY" | jq '.summary.fulfillmentRate' 2>/dev/null || echo "N/A")
    echo ""
    echo "📦 Shipments: $SHIPMENT_COUNT"
    echo "📊 Fulfillment Rate: $FULFILLMENT"
  fi
else
  echo "❌ Planning endpoint failed (HTTP $HTTP_STATUS)"
  echo "$BODY"
fi
echo ""

echo "=== Tests Complete ==="

