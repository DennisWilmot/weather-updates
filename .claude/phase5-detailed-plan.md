# Phase 5: Database Integration (Stub) - Detailed Plan

## Goal
Create database loading functions with stubbed queries (TODOs) that will load planning problem data from the database. This phase establishes the database connection and creates the structure for loading warehouses, communities, and needs from the existing database schema.

## Overview
This phase creates the database integration layer for the matching service. We'll set up database connection using Drizzle ORM (matching the main app's setup), create functions to load planning problems from the database, and add an endpoint that accepts configuration to load and solve problems from the database.

## Tasks Breakdown

### Task 5.1: Create Database Connection
**Objective**: Set up database connection using Drizzle ORM

**Steps**:
1. Create `src/db/connection.ts`
2. Import dependencies:
   ```typescript
   import { drizzle } from 'drizzle-orm/postgres-js';
   import postgres from 'postgres';
   ```
3. Set up connection:
   - Read `DATABASE_URL` from environment variables
   - Validate that `DATABASE_URL` is set
   - Create postgres client
   - Create drizzle instance
   - Export `db` instance
4. Handle connection errors gracefully
5. Add JSDoc comments explaining:
   - Connection pooling
   - Environment variable requirements
   - Reuse of existing database setup

**Key Points**:
- Use same pattern as main app (`lib/db/index.ts`)
- Support connection pooling
- Handle missing environment variables

**Deliverable**: `src/db/connection.ts` with database connection

---

### Task 5.2: Create Database Loading Function (Stub)
**Objective**: Create function to load planning problem from database with stubbed queries

**Steps**:
1. Create `src/db/loadProblem.ts`
2. Define configuration interface:
   ```typescript
   export interface ProblemLoadConfig {
     /** Target parish IDs (optional - if not provided, load all parishes) */
     parishIds?: string[];
     /** Target community IDs (optional - if not provided, load all communities) */
     communityIds?: string[];
     /** Planning constraints */
     constraints: GlobalPlanningConstraints;
     /** Optional: Risk layers configuration */
     riskLayers?: Record<string, number>;
   }
   ```
3. Implement `loadProblemFromDb()` function:
   - Parameters: `config: ProblemLoadConfig`
   - Returns: `Promise<GlobalPlanningProblem>`
   - Structure:
     ```typescript
     export async function loadProblemFromDb(
       config: ProblemLoadConfig
     ): Promise<GlobalPlanningProblem> {
       // TODO: Load warehouses from assets table
       // TODO: Load communities from communities table
       // TODO: Load community needs from people_needs table
       // TODO: Assemble GlobalPlanningProblem
       // TODO: Return problem
     }
   ```
4. Add detailed TODOs for each query:
   - **Load Warehouses**: 
     - Query `assets` table
     - Filter by type (e.g., warehouse/depot types)
     - Group by location to create warehouses
     - Aggregate inventory items
     - Map to `Warehouse` type
   - **Load Communities**:
     - Query `communities` table
     - Filter by `parishIds` and `communityIds` if provided
     - Extract coordinates from `coordinates` JSONB field
     - Map to `Community` type
   - **Load Community Needs**:
     - Query `peopleNeeds` table
     - Filter by `parishIds` and `communityIds` if provided
     - Group by `communityId` and `itemCode`
     - Sum quantities
     - Assign priorities (e.g., based on urgency, date)
     - Map to `CommunityNeed` type
5. Add JSDoc comments explaining:
   - What each TODO section should do
   - Expected data transformations
   - How to handle missing data
   - Performance considerations

**Key Points**:
- Function signature is complete and typed
- TODOs are clear and actionable
- Handles optional filtering
- Returns properly structured `GlobalPlanningProblem`

**Deliverable**: `src/db/loadProblem.ts` with stubbed queries and TODOs

---

### Task 5.3: Create POST /plan/from-db Endpoint
**Objective**: Add endpoint that loads problem from database and solves it

**Steps**:
1. Update `src/app.ts`
2. Import dependencies:
   ```typescript
   import { loadProblemFromDb } from './db/loadProblem.js';
   import { z } from 'zod';
   ```
3. Create Zod schema for request body:
   ```typescript
   const ProblemLoadConfigSchema = z.object({
     parishIds: z.array(z.string().uuid()).optional(),
     communityIds: z.array(z.string().uuid()).optional(),
     constraints: GlobalPlanningConstraintsSchema,
     riskLayers: z.record(z.string(), z.number()).optional(),
   });
   ```
4. Create `POST /plan/from-db` endpoint:
   - Parse and validate request body
   - Call `loadProblemFromDb(config)`
   - Instantiate planner
   - Execute planning
   - Return result
   - Handle errors gracefully
5. Add JSDoc documentation:
   - Request/response examples
   - Configuration options
   - Error handling

**Key Points**:
- Validates input with Zod
- Handles database errors
- Returns same response format as `/plan`
- Clear error messages

**Deliverable**: `POST /plan/from-db` endpoint in `src/app.ts`

---

## File Structure After Phase 5

```
matching-service/
├── src/
│   ├── types/
│   │   └── planner.ts              ✅ Phase 1
│   ├── planner/
│   │   ├── GlobalPlanner.ts       ✅ Phase 2
│   │   └── GreedyMinCostPlanner.ts ✅ Phase 3
│   ├── utils/
│   │   ├── geo.ts                 ✅ Phase 2
│   │   ├── cost.ts                ✅ Phase 2
│   │   ├── fairness.ts            ✅ Phase 2
│   │   └── index.ts               ✅ Phase 2
│   ├── validation/
│   │   └── schemas.ts             ✅ Phase 4
│   ├── db/
│   │   ├── connection.ts          ✅ Phase 5
│   │   └── loadProblem.ts         ✅ Phase 5
│   ├── app.ts                     ✅ Phase 4
│   └── index.ts                   ✅ Phase 4
├── package.json                   ✅ Phase 1
├── tsconfig.json                  ✅ Phase 1
└── README.md                      ✅ Phase 1
```

## Implementation Details

### Database Connection

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, {
  max: 10, // Connection pool size
});

export const db = drizzle(client);
```

### Problem Load Config

```typescript
export interface ProblemLoadConfig {
  /** Target parish IDs (optional - if not provided, load all parishes) */
  parishIds?: string[];
  /** Target community IDs (optional - if not provided, load all communities) */
  communityIds?: string[];
  /** Planning constraints */
  constraints: GlobalPlanningConstraints;
  /** Optional: Risk layers configuration */
  riskLayers?: Record<string, number>;
}
```

### Load Problem Function Structure

```typescript
export async function loadProblemFromDb(
  config: ProblemLoadConfig
): Promise<GlobalPlanningProblem> {
  // TODO: Load warehouses from assets table
  // - Query assets table where type is warehouse/depot
  // - Group by location (parishId, lat, lng)
  // - Aggregate inventory items by itemCode
  // - Map to Warehouse[] format
  const warehouses: Warehouse[] = [];

  // TODO: Load communities from communities table
  // - Query communities table
  // - Filter by parishIds if provided
  // - Filter by communityIds if provided
  // - Extract lat/lng from coordinates JSONB
  // - Map to Community[] format
  const communities: Community[] = [];

  // TODO: Load community needs from people_needs table
  // - Query peopleNeeds table
  // - Filter by parishIds/communityIds if provided
  // - Group by communityId and itemCode
  // - Sum quantities
  // - Assign priorities (e.g., based on urgency field or date)
  // - Map to CommunityNeed[] format
  const communityNeeds: CommunityNeed[] = [];

  // Assemble problem
  return {
    warehouses,
    communities,
    communityNeeds,
    constraints: config.constraints,
    riskLayers: config.riskLayers,
  };
}
```

### Database Schema Mapping

**Assets → Warehouses**:
- `assets` table has: `id`, `type`, `parishId`, `latitude`, `longitude`, `itemCode`, `quantity`
- Need to group by location to create warehouses
- Aggregate inventory items

**Communities → Communities**:
- `communities` table has: `id`, `parishId`, `coordinates` (JSONB)
- Extract `lat`/`lng` from `coordinates` JSONB field

**People Needs → Community Needs**:
- `peopleNeeds` table has: `id`, `personId`, `communityId`, `itemCode`, `quantity`, `urgency`, `createdAt`
- Group by `communityId` and `itemCode`
- Sum quantities
- Assign priorities based on `urgency` or `createdAt`

## Validation Checklist

After completing Phase 5, verify:

- [ ] Database connection is configured correctly
- [ ] `loadProblemFromDb()` function signature is complete
- [ ] TODOs are clear and actionable
- [ ] `POST /plan/from-db` endpoint validates input
- [ ] `POST /plan/from-db` endpoint handles errors
- [ ] TypeScript compiles without errors
- [ ] Function returns properly typed `GlobalPlanningProblem`
- [ ] Configuration interface is well-documented

## Testing Phase 5

1. **Test Database Connection**:
   ```typescript
   import { db } from './db/connection.js';
   // Should not throw if DATABASE_URL is set
   ```

2. **Test Load Problem Function** (with stubs):
   ```typescript
   const config = {
     constraints: {
       reserveFraction: 0.2,
       maxDistanceKm: 100,
       distanceWeight: 1.0,
       riskWeight: 0.5,
       fairnessWeight: 0.3,
     },
   };
   const problem = await loadProblemFromDb(config);
   // Should return GlobalPlanningProblem (with empty arrays for now)
   ```

3. **Test POST /plan/from-db**:
   ```bash
   curl -X POST http://localhost:3001/plan/from-db \
     -H "Content-Type: application/json" \
     -d '{
       "constraints": {
         "reserveFraction": 0.2,
         "maxDistanceKm": 100,
         "distanceWeight": 1.0,
         "riskWeight": 0.5,
         "fairnessWeight": 0.3
       }
     }'
   ```

## Edge Cases to Handle

1. **Missing DATABASE_URL**:
   - Should throw clear error on connection setup
   - Solution: Validate in connection.ts

2. **Empty Results**:
   - No warehouses, communities, or needs found
   - Solution: Return empty arrays (planner will handle gracefully)

3. **Invalid Parish/Community IDs**:
   - UUIDs that don't exist in database
   - Solution: Filter will return empty results (acceptable)

4. **Missing Coordinates**:
   - Communities without coordinates JSONB
   - Solution: Skip or use default (document in TODO)

5. **Database Connection Errors**:
   - Connection timeout, network errors
   - Solution: Let error propagate, error middleware handles it

## Next Steps After Phase 5

Once Phase 5 is complete, proceed to:
- **Phase 6**: Database Schema Extensions
  - Create `warehouses` table
  - Create `warehouse_inventory` table
  - Create `allocation_plans` table
  - Create `allocation_shipments` table
  - Then implement actual queries in `loadProblem.ts`

## Estimated Time

- Task 5.1: 20-30 minutes (database connection)
- Task 5.2: 40-60 minutes (load problem function with TODOs)
- Task 5.3: 30-40 minutes (POST /plan/from-db endpoint)

**Total: 90-130 minutes (approximately 1.5-2 hours)**

## Notes

- This phase creates the structure but doesn't implement actual queries
- Actual query implementation will happen in Phase 6 after schema extensions
- TODOs should be detailed enough for future implementation
- Database connection reuses existing setup from main app
- The function signature is complete - only query implementation is stubbed
- Consider adding query performance notes in TODOs (indexes, joins, etc.)


