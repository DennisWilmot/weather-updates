# Testing NOTIFY/LISTEN Implementation

## Quick Test Steps

### 1. Verify Triggers Exist

Run this SQL query in your database:

```sql
-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'notify_map_update';

-- Check if triggers exist
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%_notify';
```

**Expected:** Should see 6 triggers (assets, places, people, aid_worker_capabilities, asset_distributions, place_status)

### 2. Test Trigger Manually

Insert a test record and check if notification fires:

```sql
-- Insert a test place
INSERT INTO places (name, type, parish_id, community_id, latitude, longitude, address)
VALUES ('Test Hospital', 'hospital', 
  (SELECT id FROM parishes LIMIT 1),
  (SELECT id FROM communities LIMIT 1),
  18.0, -76.8, 'Test Address')
RETURNING id;
```

**Expected:** Should see notification in server logs if LISTEN is working

### 3. Monitor Server Logs

Watch your Next.js server logs for:

**Success indicators:**
- `Started listening on channel: map_updates`
- `Error handling notification for places:` (when data changes)
- No "Error polling for updates" messages

**Failure indicators:**
- `Error starting LISTEN:`
- `Max client connections reached`
- `Error polling for updates:` (fallback to polling)

### 4. Test Real-Time Updates

1. **Open the map dashboard** (`http://localhost:3000`)
2. **Open browser DevTools** → Network tab → Filter: "stream"
3. **Open another browser tab** with the same page
4. **In a third tab**, insert/update data via API or database:

```bash
# Via API (if you have an endpoint)
curl -X POST http://localhost:3000/api/places \
  -H "Content-Type: application/json" \
  -d '{"name": "New Place", "type": "hospital", ...}'
```

**Expected:**
- Both browser tabs should receive update within < 100ms
- Check Network tab → SSE stream → should see `{"type":"updated","layerType":"places",...}`

### 5. Monitor Connection Pool Usage

Check database connection count:

```sql
-- Check active connections
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE datname = current_database();

-- Check connection details
SELECT pid, usename, application_name, state, query 
FROM pg_stat_activity 
WHERE datname = current_database() 
AND state = 'active';
```

**Expected:**
- Before: 20+ connections (pool exhausted)
- After: < 10 connections (with batching + LISTEN)

### 6. Test Multiple SSE Connections

1. Open 3-5 browser tabs with the dashboard
2. Monitor server logs for LISTEN errors
3. Insert data and verify all tabs receive updates

**Expected:**
- All tabs receive updates
- No "Max client connections reached" errors
- Connection count stays low

## Troubleshooting

### Issue: "Max client connections reached"

**Problem:** Each SSE connection creates a new LISTEN connection

**Solution:** Need to share a single LISTEN connection across all SSE streams (see fix below)

### Issue: "Error polling for updates" still appears

**Problem:** LISTEN failed, falling back to polling

**Check:**
1. Are triggers installed? (Step 1)
2. Is DATABASE_URL set correctly?
3. Check server logs for LISTEN errors

### Issue: No updates received

**Check:**
1. Are triggers firing? (Step 2)
2. Is LISTEN connection active? (Check logs for "Started listening")
3. Is the affected layer in `requestedLayers`?
4. Check browser console for SSE errors

## Performance Metrics

### Before (Polling):
- Queries per minute: 144-252 (with 3 users)
- Connection pool: 100% saturated
- Update delay: 0-5 seconds

### After (NOTIFY/LISTEN):
- Queries per minute: ~5-10 (only when data changes)
- Connection pool: <30% usage
- Update delay: <100ms

## Manual Database Test

Test notifications directly:

```sql
-- Send a test notification manually
SELECT pg_notify('map_updates', '{"table":"places","operation":"INSERT","id":"test-123"}');

-- Check if anyone is listening
SELECT pid, usename, application_name, state 
FROM pg_stat_activity 
WHERE query LIKE '%LISTEN%';
```

