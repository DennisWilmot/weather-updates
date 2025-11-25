# Testing the Matching Service

This guide explains how to test the deployed matching service on Railway.

## Finding Your Railway URL

1. Go to [Railway Dashboard](https://railway.app)
2. Click on your `matching-service` project
3. Navigate to **Settings** → **Networking**
4. Copy the **Public Domain** URL (e.g., `https://matching-service-production.up.railway.app`)

Alternatively, check the **Deployments** tab - the URL is shown in the deployment logs.

## Quick Test Commands

### 1. Health Check (Simplest Test)

```bash
curl https://YOUR-RAILWAY-URL/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "matching-service",
  "version": "0.1.0"
}
```

### 2. API Information

```bash
curl https://YOUR-RAILWAY-URL/
```

Expected response:
```json
{
  "service": "matching-service",
  "version": "0.1.0",
  "description": "Global allocation planner for disaster relief logistics",
  "endpoints": { ... }
}
```

### 3. Test Planning Endpoint (Full Test)

Using the test script:
```bash
cd matching-service
./test-service-simple.sh https://YOUR-RAILWAY-URL
```

Or manually with curl:
```bash
curl -X POST https://YOUR-RAILWAY-URL/plan \
  -H "Content-Type: application/json" \
  -d @test-data.json
```

Or inline JSON:
```bash
curl -X POST https://YOUR-RAILWAY-URL/plan \
  -H "Content-Type: application/json" \
  -d '{
    "warehouses": [
      {
        "id": "w1",
        "parishId": "p1",
        "lat": 18.0,
        "lng": -76.8,
        "inventory": [
          { "warehouseId": "w1", "itemCode": "food", "quantity": 1000 }
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
  }'
```

Expected response:
```json
{
  "shipments": [
    {
      "fromWarehouseId": "w1",
      "toCommunityId": "c1",
      "itemCode": "food",
      "quantity": 200,
      "cost": 12.5
    }
  ],
  "summary": {
    "totalShipments": 1,
    "totalItemsAllocated": 200,
    "totalCost": 12.5,
    "unmetNeeds": [],
    "fulfillmentRate": 1.0
  }
}
```

## Test Scripts

Two test scripts are provided:

1. **`test-service-simple.sh`** - Basic curl commands (no dependencies)
2. **`test-service.sh`** - Uses `jq` for pretty JSON output (requires `jq` installed)

Usage:
```bash
# Simple version (no jq needed)
./test-service-simple.sh https://YOUR-RAILWAY-URL

# Pretty output version (requires jq)
./test-service.sh https://YOUR-RAILWAY-URL
```

## Troubleshooting

### Connection Refused / Timeout

- Check that the service is deployed and running in Railway
- Verify the URL is correct (check Railway dashboard)
- Check Railway deployment logs for errors

### 404 Not Found

- Ensure you're using the correct endpoint paths (`/health`, `/plan`, etc.)
- Check that the service started successfully (check logs)

### 400 Bad Request

- Verify your JSON is valid
- Check that all required fields are present:
  - `warehouses` (array)
  - `communities` (array)
  - `communityNeeds` (array)
  - `constraints` (object with all required fields)

### 500 Internal Server Error

- Check Railway deployment logs
- Verify the service built successfully
- Check that `DATABASE_URL` is set (if using `/plan/from-db`)

## Expected Behavior

### Successful Planning

- Returns HTTP 200
- Response contains `shipments` array and `summary` object
- `fulfillmentRate` should be between 0 and 1
- `totalShipments` should match number of shipments created
- `unmetNeeds` array contains needs that couldn't be fulfilled

### Algorithm Behavior

- Respects `reserveFraction` (keeps 20% of stock in reserve by default)
- Only considers warehouses within `maxDistanceKm`
- Prioritizes needs by `priority` (1 = highest)
- Minimizes cost (distance + risk + fairness)

## Example Test Scenarios

### Scenario 1: Simple Allocation
- 1 warehouse with 1000 units of food
- 1 community needing 200 units
- Expected: 1 shipment, 200 units allocated, fulfillmentRate = 1.0

### Scenario 2: Partial Fulfillment
- 1 warehouse with 100 units of food
- 1 community needing 200 units
- Expected: 1 shipment, 80 units allocated (100 - 20% reserve), fulfillmentRate = 0.4

### Scenario 3: Multiple Warehouses
- 2 warehouses with same item
- 1 community needing more than either warehouse can provide
- Expected: Multiple shipments from different warehouses, total allocation matches available stock

### Scenario 4: Distance Filtering
- 2 warehouses: one within `maxDistanceKm`, one outside
- Expected: Only the nearby warehouse is considered

## Next Steps

Once the service is verified working:

1. **Implement Database Queries** - Complete `loadProblemFromDb()` in `src/db/loadProblem.ts`
2. **Create Next.js API Route** - Add `/app/api/planning/route.ts` to call the service
3. **Add UI Component** - Create planning interface in the dashboard
4. **Add Monitoring** - Set up error tracking and performance monitoring

