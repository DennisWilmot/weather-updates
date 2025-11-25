# Hono Planner Worker - Global Allocation Algorithm Implementation Plan

## Overview

This document outlines the phased implementation plan for building a standalone Hono worker service that implements a global allocation algorithm for disaster relief logistics. The service will compute optimal allocation plans for distributing supplies from warehouses to communities based on needs, distance, risk, and fairness constraints.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js (Vercel)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Frontend   │  │  API Routes  │  │   Admin UI  │  │
│  │  (React)     │  │  (CRUD ops)  │  │             │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                        │
                        │ HTTP/WebSocket
                        ▼
┌─────────────────────────────────────────────────────────┐
│          Hono Planner Service (Standalone)             │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Global Allocation Engine                 │  │
│  │  - Min-cost flow heuristic                      │  │
│  │  - Distance/Risk/Fairness optimization          │  │
│  │  - Batch processing (100k+ records)             │  │
│  │  - Pluggable solver interface                   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        │
                        │ Shared Database
                        ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL (Supabase/RDS)                  │
│  - Warehouses (to be created)                           │
│  - Assets (existing)                                    │
│  - Communities (existing)                               │
│  - People Needs (existing)                              │
└─────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Project Setup & Core Types
**Goal**: Set up the Hono worker project structure and define all TypeScript types

**Tasks**:
1. Create `matching-service/` directory structure
2. Initialize npm project with TypeScript
3. Install dependencies: `hono`, `zod`, `@types/node`
4. Set up TypeScript config with strict mode
5. Create `src/types/planner.ts` with:
   - `Warehouse` type (id, parishId, lat, lng, inventory)
   - `WarehouseItemTotal` type (warehouseId, itemCode, quantity)
   - `Community` type (id, parishId, lat, lng)
   - `CommunityNeed` type (communityId, itemCode, quantity, priority)
   - `GlobalPlanningConstraints` type (reserveFraction, maxDistanceKm, weights)
   - `GlobalPlanningProblem` type (warehouses, communityNeeds, constraints)
   - `Shipment` type (fromWarehouseId, toCommunityId, itemCode, quantity, cost)
   - `GlobalPlanningResult` type (shipments, summary stats)

**Deliverables**:
- `matching-service/package.json`
- `matching-service/tsconfig.json`
- `matching-service/src/types/planner.ts`
- Basic project structure

**Estimated Time**: 1-2 hours

---

### Phase 2: Planner Interface & Utilities
**Goal**: Create the planner interface and utility functions (haversine, cost calculation)

**Tasks**:
1. Create `src/planner/GlobalPlanner.ts`:
   - Define `GlobalPlanner` interface with `plan()` method
   - Add JSDoc comments explaining the interface
2. Create `src/utils/geo.ts`:
   - Implement `haversineDistanceKm(lat1, lon1, lat2, lon2)` function
   - Add unit tests or validation
3. Create `src/utils/cost.ts`:
   - Implement `calculateArcCost()` function
   - Handle distance, risk, and fairness components
   - Make weights configurable
4. Create `src/utils/fairness.ts`:
   - Implement fairness tracking map (parishId → allocated quantities)
   - Implement `calculateFairnessPenalty()` function
   - Track per-parish allocation history

**Deliverables**:
- `src/planner/GlobalPlanner.ts`
- `src/utils/geo.ts`
- `src/utils/cost.ts`
- `src/utils/fairness.ts`

**Estimated Time**: 2-3 hours

---

### Phase 3: Greedy Min-Cost Planner Implementation
**Goal**: Implement the core greedy heuristic algorithm

**Tasks**:
1. Create `src/planner/GreedyMinCostPlanner.ts`:
   - Implement `GlobalPlanner` interface
   - Pre-compute initial stock and minAllowedStock per (warehouse, item)
   - For each community + item need:
     - Filter candidate warehouses (has item, within maxDistanceKm, above minAllowedStock)
     - Compute cost for each candidate (distance + risk + fairness)
     - Sort candidates by cost ascending
     - Greedily allocate from cheapest to most expensive
     - Respect stock limits and reserve fraction
     - Update fairness tracking
   - Return `GlobalPlanningResult` with all shipments
2. Add comprehensive comments explaining:
   - Algorithm steps
   - Where LP/MIP solver would plug in
   - Memory optimization strategies
3. Handle edge cases:
   - No feasible warehouses
   - Partial fulfillment
   - Multiple items per community

**Deliverables**:
- `src/planner/GreedyMinCostPlanner.ts`
- Algorithm fully functional for in-memory problems

**Estimated Time**: 4-6 hours

---

### Phase 4: Hono App & HTTP Endpoints
**Goal**: Create the Hono application with HTTP endpoints

**Tasks**:
1. Create `src/app.ts`:
   - Initialize Hono app
   - Add CORS middleware
   - Add error handling middleware
2. Create `POST /plan` endpoint:
   - Accept JSON body with `GlobalPlanningProblem`
   - Validate input with Zod schema
   - Instantiate `GreedyMinCostPlanner`
   - Call `plan()` method
   - Return `GlobalPlanningResult` as JSON
   - Handle errors gracefully
3. Create `GET /health` endpoint:
   - Return simple health check response
4. Create `src/validation/schemas.ts`:
   - Zod schemas for request validation
   - Type-safe validation

**Deliverables**:
- `src/app.ts`
- `src/validation/schemas.ts`
- HTTP endpoints functional

**Estimated Time**: 2-3 hours

---

### Phase 5: Database Integration (Stub)
**Goal**: Create database loading functions (stubbed with TODOs)

**Tasks**:
1. Create `src/db/connection.ts`:
   - Set up database connection (using existing drizzle setup or new)
   - Export database client
2. Create `src/db/loadProblem.ts`:
   - Implement `loadProblemFromDb(config)` function
   - Stub queries with clear TODOs:
     - Load warehouses + inventory
     - Load communities
     - Load community needs (from people_needs table)
   - Assemble `GlobalPlanningProblem` from DB data
   - Return Promise<GlobalPlanningProblem>
3. Create `POST /plan/from-db` endpoint:
   - Accept config (target region/parish, constraints)
   - Call `loadProblemFromDb()`
   - Run planner
   - Return result

**Deliverables**:
- `src/db/connection.ts`
- `src/db/loadProblem.ts` (with TODOs)
- `POST /plan/from-db` endpoint

**Estimated Time**: 2-3 hours

---

### Phase 6: Database Schema Extensions
**Goal**: Create warehouse tables and extend schema for allocation planning

**Tasks**:
1. Review existing schema:
   - `assets` table (supply)
   - `people_needs` table (demand)
   - `communities` table (demand nodes)
2. Create `warehouses` table:
   - id, name, parishId, lat, lng, address
   - status, capacity, createdAt
3. Create `warehouse_inventory` table:
   - warehouseId, itemCode, quantity, reservedQuantity
   - lastUpdated
4. Create `allocation_plans` table:
   - id, planName, status, constraints (JSONB)
   - createdAt, executedAt
5. Create `allocation_shipments` table:
   - planId, fromWarehouseId, toCommunityId
   - itemCode, quantity, cost, status
   - scheduledDate, executedDate
6. Add migration scripts

**Deliverables**:
- Schema extensions in `lib/db/schema.ts`
- Migration files
- Updated types

**Estimated Time**: 3-4 hours

---

### Phase 7: Runtime Setup & Deployment Config
**Goal**: Set up runtime adapters and deployment configuration

**Tasks**:
1. Create runtime adapters:
   - `src/runtime/node.ts` (Node.js adapter)
   - `src/runtime/bun.ts` (Bun adapter - optional)
   - `src/runtime/cloudflare.ts` (Cloudflare Workers - optional)
2. Create `src/index.ts`:
   - Main entry point
   - Detect runtime and use appropriate adapter
   - Start server
3. Create deployment configs:
   - `Dockerfile` (for containerized deployment)
   - `wrangler.toml` (for Cloudflare Workers)
   - `railway.json` or `fly.toml` (for other platforms)
4. Create environment variable schema:
   - `DATABASE_URL`
   - `PORT`
   - `NODE_ENV`
   - `CORS_ORIGIN`

**Deliverables**:
- Runtime adapters
- `src/index.ts`
- Deployment configs
- `.env.example`

**Estimated Time**: 2-3 hours

---

### Phase 8: Testing & Validation
**Goal**: Add tests and validate the algorithm

**Tasks**:
1. Create test data fixtures:
   - Sample warehouses with inventory
   - Sample communities with needs
   - Edge cases (no matches, partial fulfillment)
2. Create unit tests:
   - `src/planner/GreedyMinCostPlanner.test.ts`
   - Test haversine distance calculation
   - Test cost calculation
   - Test fairness tracking
3. Create integration tests:
   - `src/app.test.ts`
   - Test `/plan` endpoint
   - Test `/health` endpoint
4. Create performance tests:
   - Test with 1000+ warehouses
   - Test with 100k+ community needs
   - Measure execution time
   - Check memory usage

**Deliverables**:
- Test files
- Test fixtures
- Performance benchmarks

**Estimated Time**: 4-5 hours

---

### Phase 9: Next.js Integration
**Goal**: Integrate the Hono service with Next.js app

**Tasks**:
1. Create `app/api/matching/route.ts`:
   - Proxy endpoint to Hono service
   - Handle authentication/authorization
   - Forward requests to matching service
   - Return results
2. Create `app/api/matching/status/route.ts`:
   - Poll job status endpoint
   - Return progress updates
3. Update `components/AIMatchingPanel.tsx`:
   - Replace dummy data with real API calls
   - Add loading states
   - Add error handling
   - Add progress indicators
4. Add environment variables:
   - `MATCHING_SERVICE_URL` in `.env.local`

**Deliverables**:
- Next.js API routes
- Updated frontend component
- Integration complete

**Estimated Time**: 2-3 hours

---

### Phase 10: Optimization & Scaling
**Goal**: Optimize for production and 100k+ records

**Tasks**:
1. Implement batching:
   - Process needs in batches of 1000
   - Stream results
   - Update progress
2. Add caching:
   - Cache distance calculations
   - Cache warehouse lookups
   - Use Redis for job status (optional)
3. Add job queue (optional):
   - Use BullMQ or similar
   - Background job processing
   - WebSocket for real-time updates
4. Optimize database queries:
   - Add indexes
   - Use connection pooling
   - Optimize joins
5. Add monitoring:
   - Logging (structured logs)
   - Metrics (execution time, memory)
   - Error tracking

**Deliverables**:
- Optimized code
- Caching layer
- Monitoring setup

**Estimated Time**: 4-6 hours

---

## Project Structure

```
matching-service/
├── src/
│   ├── types/
│   │   └── planner.ts              # Core types
│   ├── planner/
│   │   ├── GlobalPlanner.ts        # Interface
│   │   └── GreedyMinCostPlanner.ts # Implementation
│   ├── utils/
│   │   ├── geo.ts                  # Haversine distance
│   │   ├── cost.ts                 # Cost calculation
│   │   └── fairness.ts             # Fairness tracking
│   ├── db/
│   │   ├── connection.ts          # DB connection
│   │   └── loadProblem.ts         # Load from DB
│   ├── validation/
│   │   └── schemas.ts              # Zod schemas
│   ├── runtime/
│   │   ├── node.ts                 # Node.js adapter
│   │   └── cloudflare.ts           # CF Workers adapter
│   ├── app.ts                      # Hono app
│   └── index.ts                    # Entry point
├── tests/
│   ├── fixtures/
│   ├── unit/
│   └── integration/
├── package.json
├── tsconfig.json
├── Dockerfile
├── wrangler.toml
└── .env.example
```

## Dependencies

```json
{
  "dependencies": {
    "hono": "^4.0.0",
    "zod": "^3.22.0",
    "drizzle-orm": "^0.44.7",
    "postgres": "^3.4.7"
  },
  "devDependencies": {
    "@types/node": "^20",
    "typescript": "^5.0.0",
    "tsx": "^4.20.6"
  }
}
```

## Algorithm Notes

### Cost Function
```
cost = distanceKm * distanceWeight
     + riskScore * riskWeight
     + fairnessPenalty * fairnessWeight
```

### Fairness Tracking
- Track total allocated per parish per item
- Compare against target per-capita allocation
- Reduce cost for under-served parishes
- Increase cost for over-served parishes

### Memory Optimization
- Filter candidate warehouses before building arcs
- Only consider warehouses within `maxDistanceKm`
- Process needs in batches
- Don't materialize all possible (warehouse × community × item) combinations

### Future LP/MIP Solver Integration
The `GlobalPlanner` interface is designed to be pluggable. A future implementation could:
- Use OR-Tools (Python) via API call
- Use Gurobi or CPLEX
- Use JavaScript LP solver (e.g., `javascript-lp-solver`)
- All would implement the same `GlobalPlanner` interface

## Success Criteria

1. ✅ Service accepts JSON input and returns allocation plan
2. ✅ Algorithm respects stock limits and reserve fractions
3. ✅ Cost function properly weights distance, risk, and fairness
4. ✅ Handles 100k+ records efficiently (batched processing)
5. ✅ Can be deployed independently from Next.js app
6. ✅ Database integration ready (stubbed)
7. ✅ Next.js app can call service via HTTP
8. ✅ Code is well-documented and maintainable

## Estimated Total Time

- Phase 1: 1-2 hours
- Phase 2: 2-3 hours
- Phase 3: 4-6 hours
- Phase 4: 2-3 hours
- Phase 5: 2-3 hours
- Phase 6: 3-4 hours
- Phase 7: 2-3 hours
- Phase 8: 4-5 hours
- Phase 9: 2-3 hours
- Phase 10: 4-6 hours

**Total: 26-38 hours** (approximately 3-5 days of focused work)

## Next Steps

1. Review and approve this plan
2. Start with Phase 1 (Project Setup & Core Types)
3. Execute phases sequentially
4. Test after each phase
5. Deploy incrementally


