# Phase 4: Hono App & HTTP Endpoints - Detailed Plan

## Goal
Create the Hono web application with HTTP endpoints to expose the planning algorithm via REST API, including input validation, error handling, and health checks.

## Overview
This phase creates the HTTP layer for the matching service. We'll set up a Hono application with middleware for CORS and error handling, create endpoints for planning operations, and implement Zod-based validation for type-safe request handling.

## Tasks Breakdown

### Task 4.1: Create Zod Validation Schemas
**Objective**: Define type-safe validation schemas for all request/response types

**Steps**:
1. Create `src/validation/schemas.ts`
2. Import Zod and types:
   ```typescript
   import { z } from 'zod';
   import type { GlobalPlanningProblem, GlobalPlanningResult } from '../types/planner.js';
   ```
3. Create schemas for nested types:
   - `WarehouseItemTotalSchema`: `{ warehouseId: string, itemCode: string, quantity: number }`
   - `WarehouseSchema`: `{ id, parishId, lat, lng, inventory: WarehouseItemTotal[] }`
   - `CommunitySchema`: `{ id, parishId, lat, lng }`
   - `CommunityNeedSchema`: `{ communityId, itemCode, quantity, priority }`
   - `GlobalPlanningConstraintsSchema`: `{ reserveFraction, maxDistanceKm, distanceWeight, riskWeight, fairnessWeight }`
4. Create `GlobalPlanningProblemSchema`:
   - Combines all nested schemas
   - Makes `riskLayers` and `parishStats` optional
   - Validates arrays are non-empty
   - Validates numeric ranges (lat/lng, weights, etc.)
5. Create helper functions:
   - `validatePlanningProblem(data: unknown): GlobalPlanningProblem`
   - Returns validated and typed data or throws ZodError

**Key Points**:
- Use Zod's `.refine()` for complex validations (e.g., lat/lng ranges)
- Provide clear error messages
- Validate array lengths (non-empty)
- Validate numeric ranges (0-1 for fractions, positive for distances/weights)

**Deliverable**: `src/validation/schemas.ts` with complete Zod schemas

---

### Task 4.2: Initialize Hono App with Middleware
**Objective**: Set up Hono application with CORS and error handling middleware

**Steps**:
1. Create `src/app.ts`
2. Import Hono and create app:
   ```typescript
   import { Hono } from 'hono';
   const app = new Hono();
   ```
3. Add CORS middleware:
   ```typescript
   import { cors } from 'hono/cors';
   app.use('/*', cors({
     origin: '*', // In production, restrict to specific origins
     allowMethods: ['GET', 'POST', 'OPTIONS'],
     allowHeaders: ['Content-Type'],
   }));
   ```
4. Add error handling middleware:
   ```typescript
   app.onError((err, c) => {
     console.error('Error:', err);
     
     // Handle Zod validation errors
     if (err instanceof z.ZodError) {
       return c.json({
         error: 'Validation error',
         details: err.errors,
       }, 400);
     }
     
     // Handle planner errors
     if (err.message.includes('Problem must have')) {
       return c.json({
         error: 'Invalid problem',
         message: err.message,
       }, 400);
     }
     
     // Generic error
     return c.json({
       error: 'Internal server error',
       message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
     }, 500);
   });
   ```
5. Add request logging middleware (optional but helpful):
   ```typescript
   app.use('*', async (c, next) => {
     const start = Date.now();
     await next();
     const duration = Date.now() - start;
     console.log(`${c.req.method} ${c.req.path} - ${c.res.status} (${duration}ms)`);
   });
   ```

**Key Points**:
- CORS should be configurable (env var for origins)
- Error handling should be user-friendly
- Logging helps with debugging
- Handle different error types appropriately

**Deliverable**: Hono app with middleware configured

---

### Task 4.3: Create POST /plan Endpoint
**Objective**: Implement the main planning endpoint that accepts problem and returns result

**Steps**:
1. Create `POST /plan` route handler:
   ```typescript
   app.post('/plan', async (c) => {
     // Implementation
   });
   ```
2. Parse and validate request body:
   - Get JSON body: `const body = await c.req.json()`
   - Validate using Zod schema: `const problem = validatePlanningProblem(body)`
   - Handle validation errors (caught by error middleware)
3. Instantiate planner:
   ```typescript
   import { GreedyMinCostPlanner } from './planner/GreedyMinCostPlanner.js';
   const planner = new GreedyMinCostPlanner();
   ```
4. Execute planning:
   - Call `planner.plan(problem)`
   - Catch any errors (handled by error middleware)
5. Return result:
   - Return JSON: `return c.json(result)`
   - Set appropriate content-type header
   - Status code: 200 for success
6. Add request/response examples in comments:
   - Example request body
   - Example response body

**Key Points**:
- Validate input before processing
- Handle errors gracefully
- Return structured JSON responses
- Consider adding request size limits

**Deliverable**: `POST /plan` endpoint functional

---

### Task 4.4: Create GET /health Endpoint
**Objective**: Implement health check endpoint for monitoring and deployment

**Steps**:
1. Create `GET /health` route handler:
   ```typescript
   app.get('/health', (c) => {
     return c.json({
       status: 'ok',
       timestamp: new Date().toISOString(),
       service: 'matching-service',
       version: '0.1.0',
     });
   });
   ```
2. Optionally add more health checks:
   - Database connectivity (if connected)
   - Memory usage
   - Uptime
3. Return 200 status for healthy, 503 for unhealthy (if checks fail)

**Key Points**:
- Simple and fast (no heavy operations)
- Useful for load balancers and monitoring
- Can be extended later with more checks

**Deliverable**: `GET /health` endpoint

---

### Task 4.5: Create Entry Point (index.ts)
**Objective**: Create the main entry point that exports the Hono app

**Steps**:
1. Create `src/index.ts`
2. Export the app:
   ```typescript
   import app from './app.js';
   export default app;
   ```
3. Add development server (optional, for local testing):
   ```typescript
   if (import.meta.url === `file://${process.argv[1]}`) {
     // Running directly (not imported)
     const port = process.env.PORT || 3001;
     const server = Bun.serve({
       port,
       fetch: app.fetch,
     });
     console.log(`Server running on http://localhost:${port}`);
   }
   ```
   Note: This assumes Bun runtime. For Node.js, use `@hono/node-server` or similar.

**Key Points**:
- Export app for use in runtime adapters (Cloudflare Workers, Node.js, etc.)
- Optional dev server for local testing
- Keep entry point simple

**Deliverable**: `src/index.ts` entry point

---

### Task 4.6: Update Package.json Scripts
**Objective**: Add scripts for running the service locally

**Steps**:
1. Update `matching-service/package.json`:
   - Add `"dev": "tsx watch src/index.ts"` (if not already present)
   - Add `"start": "node dist/index.js"` (for production)
   - Ensure `"build"` script compiles TypeScript
2. Consider adding runtime-specific dependencies:
   - For Bun: `"bun"` (if using Bun)
   - For Node.js: `"@hono/node-server"` or `"@hono/node-server/deno"`
   - For Cloudflare Workers: `"@cloudflare/workers-types"`

**Key Points**:
- Scripts should match the chosen runtime
- Dev script should watch for changes
- Build script should compile to `dist/`

**Deliverable**: Updated `package.json` with scripts

---

## File Structure After Phase 4

```
matching-service/
├── src/
│   ├── types/
│   │   └── planner.ts              ✅ Phase 1
│   ├── planner/
│   │   ├── GlobalPlanner.ts        ✅ Phase 2
│   │   └── GreedyMinCostPlanner.ts ✅ Phase 3
│   ├── utils/
│   │   ├── geo.ts                  ✅ Phase 2
│   │   ├── cost.ts                 ✅ Phase 2
│   │   ├── fairness.ts             ✅ Phase 2
│   │   └── index.ts                ✅ Phase 2
│   ├── validation/
│   │   └── schemas.ts              ✅ Phase 4
│   ├── app.ts                      ✅ Phase 4
│   └── index.ts                    ✅ Phase 4
├── package.json                    ✅ Phase 1
├── tsconfig.json                   ✅ Phase 1
└── README.md                       ✅ Phase 1
```

## Implementation Details

### Zod Schema Example

```typescript
import { z } from 'zod';

export const WarehouseItemTotalSchema = z.object({
  warehouseId: z.string().min(1),
  itemCode: z.string().min(1),
  quantity: z.number().nonnegative().finite(),
});

export const WarehouseSchema = z.object({
  id: z.string().min(1),
  parishId: z.string().min(1),
  lat: z.number().min(-90).max(90).finite(),
  lng: z.number().min(-180).max(180).finite(),
  inventory: z.array(WarehouseItemTotalSchema).min(1),
});

export const GlobalPlanningConstraintsSchema = z.object({
  reserveFraction: z.number().min(0).max(1).finite(),
  maxDistanceKm: z.number().positive().finite(),
  distanceWeight: z.number().nonnegative().finite(),
  riskWeight: z.number().nonnegative().finite(),
  fairnessWeight: z.number().nonnegative().finite(),
});

export const GlobalPlanningProblemSchema = z.object({
  warehouses: z.array(WarehouseSchema).min(1),
  communities: z.array(CommunitySchema).min(1),
  communityNeeds: z.array(CommunityNeedSchema).min(1),
  constraints: GlobalPlanningConstraintsSchema,
  riskLayers: z.record(z.string(), z.number()).optional(),
  parishStats: z.record(z.string(), z.any()).optional(),
});

export function validatePlanningProblem(data: unknown): GlobalPlanningProblem {
  return GlobalPlanningProblemSchema.parse(data);
}
```

### Hono App Structure

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import { GreedyMinCostPlanner } from './planner/GreedyMinCostPlanner.js';
import { validatePlanningProblem } from './validation/schemas.js';

const app = new Hono();

// Middleware
app.use('/*', cors({
  origin: process.env.CORS_ORIGIN || '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${c.req.method} ${c.req.path} - ${c.res.status} (${duration}ms)`);
});

// Error handling
app.onError((err, c) => {
  // Handle errors
});

// Routes
app.post('/plan', async (c) => {
  // Planning endpoint
});

app.get('/health', (c) => {
  // Health check
});

export default app;
```

### Request/Response Examples

**POST /plan Request**:
```json
{
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
      "lat": 18.1,
      "lng": -76.9
    }
  ],
  "communityNeeds": [
    {
      "communityId": "c1",
      "itemCode": "food",
      "quantity": 100,
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
}
```

**POST /plan Response**:
```json
{
  "shipments": [
    {
      "fromWarehouseId": "w1",
      "toCommunityId": "c1",
      "itemCode": "food",
      "quantity": 100,
      "cost": 12.5
    }
  ],
  "summary": {
    "totalShipments": 1,
    "totalItemsAllocated": 100,
    "totalCost": 12.5,
    "unmetNeeds": [],
    "fulfillmentRate": 1.0
  }
}
```

**GET /health Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "matching-service",
  "version": "0.1.0"
}
```

## Validation Checklist

After completing Phase 4, verify:

- [ ] Zod schemas validate all required fields
- [ ] Zod schemas validate numeric ranges (lat/lng, weights, etc.)
- [ ] Zod schemas validate array lengths (non-empty)
- [ ] CORS middleware is configured
- [ ] Error handling middleware catches all error types
- [ ] POST /plan endpoint validates input
- [ ] POST /plan endpoint returns correct response format
- [ ] GET /health endpoint returns correct format
- [ ] Entry point exports app correctly
- [ ] TypeScript compiles without errors
- [ ] Service can be started locally (if dev server added)

## Testing Phase 4

1. **Test Validation**:
   ```typescript
   // Should throw ZodError
   validatePlanningProblem({ warehouses: [] });
   validatePlanningProblem({ warehouses: [{ lat: 200 }] });
   ```

2. **Test POST /plan**:
   ```bash
   curl -X POST http://localhost:3001/plan \
     -H "Content-Type: application/json" \
     -d @test-problem.json
   ```

3. **Test GET /health**:
   ```bash
   curl http://localhost:3001/health
   ```

4. **Test Error Handling**:
   - Invalid JSON → 400
   - Missing required fields → 400
   - Invalid numeric ranges → 400
   - Planner errors → 400/500

## Edge Cases to Handle

1. **Invalid JSON**:
   - Malformed JSON body
   - Solution: Return 400 with clear error

2. **Missing Required Fields**:
   - Empty arrays, missing properties
   - Solution: Zod validation catches this

3. **Invalid Numeric Values**:
   - NaN, Infinity, out of range
   - Solution: Zod `.finite()` and range validations

4. **Large Requests**:
   - Very large problem definitions
   - Solution: Consider adding request size limits

5. **CORS Issues**:
   - Requests from different origins
   - Solution: CORS middleware handles this

## Runtime Considerations

The Hono app should be deployable to multiple runtimes:

1. **Cloudflare Workers** (Recommended):
   - Long process timeouts (up to 30s)
   - Good for compute-heavy operations
   - Use `@cloudflare/workers-types`

2. **Node.js**:
   - Use `@hono/node-server`
   - Standard server setup

3. **Bun**:
   - Native support
   - Fast runtime

4. **Deno**:
   - Use `@hono/node-server/deno`
   - Or native Deno server

## Next Steps After Phase 4

Once Phase 4 is complete, proceed to:
- **Phase 5**: Database Integration (Stub)
  - Create database loading functions
  - Add `POST /plan/from-db` endpoint
  - Stub queries with TODOs

## Estimated Time

- Task 4.1: 45-60 minutes (Zod schemas)
- Task 4.2: 30-40 minutes (middleware setup)
- Task 4.3: 30-40 minutes (POST /plan endpoint)
- Task 4.4: 10-15 minutes (GET /health endpoint)
- Task 4.5: 15-20 minutes (entry point)
- Task 4.6: 10-15 minutes (package.json updates)

**Total: 140-190 minutes (approximately 2.5-3 hours)**

## Notes

- Hono is framework-agnostic and works with multiple runtimes
- Zod provides runtime type safety (complements TypeScript compile-time types)
- CORS should be configurable via environment variables
- Error handling should be user-friendly but secure (don't leak internal details)
- Health check is essential for production deployments
- Consider adding request rate limiting in production
- Consider adding request/response logging for debugging
- The service is stateless (no session management needed)

