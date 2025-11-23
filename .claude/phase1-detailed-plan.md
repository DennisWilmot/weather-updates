# Phase 1: Project Setup & Core Types - Detailed Plan

## Goal
Set up the Hono worker project structure and define all TypeScript types needed for the global allocation algorithm.

## Overview
This phase establishes the foundation for the matching service by creating the project structure, installing dependencies, configuring TypeScript, and defining all core types that will be used throughout the planner implementation.

## Tasks Breakdown

### Task 1.1: Create Directory Structure
**Objective**: Create the folder structure for the matching service

**Steps**:
1. Create root `matching-service/` directory
2. Create subdirectories:
   - `matching-service/src/types/` - Type definitions
   - `matching-service/src/planner/` - Planner implementations
   - `matching-service/src/utils/` - Utility functions
   - `matching-service/src/db/` - Database integration
   - `matching-service/src/validation/` - Zod schemas
   - `matching-service/src/runtime/` - Runtime adapters
   - `matching-service/tests/` - Test files (optional for Phase 1)

**Deliverable**: Complete directory structure

---

### Task 1.2: Initialize npm Project
**Objective**: Set up package.json with proper metadata and scripts

**Steps**:
1. Run `npm init -y` in `matching-service/` directory
2. Update `package.json`:
   - Set `name` to `"matching-service"`
   - Set `version` to `"0.1.0"`
   - Set `description` to `"Global allocation planner for disaster relief logistics"`
   - Set `type` to `"module"` (for ES modules)
   - Add `main` field: `"dist/index.js"`
   - Add `scripts`:
     - `"dev"`: `"tsx watch src/index.ts"`
     - `"build"`: `"tsc"`
     - `"start"`: `"node dist/index.js"`
     - `"type-check"`: `"tsc --noEmit"`

**Deliverable**: `matching-service/package.json`

---

### Task 1.3: Install Dependencies
**Objective**: Install required npm packages

**Steps**:
1. Install production dependencies:
   ```bash
   npm install hono zod drizzle-orm postgres
   ```
2. Install development dependencies:
   ```bash
   npm install -D typescript @types/node tsx
   ```

**Dependencies to install**:
- `hono` - Web framework
- `zod` - Schema validation
- `drizzle-orm` - Database ORM (for future DB integration)
- `postgres` - PostgreSQL client
- `typescript` - TypeScript compiler
- `@types/node` - Node.js type definitions
- `tsx` - TypeScript execution for development

**Deliverable**: Updated `package.json` with dependencies and `node_modules/`

---

### Task 1.4: Configure TypeScript
**Objective**: Set up TypeScript with strict mode and proper configuration

**Steps**:
1. Create `matching-service/tsconfig.json` with:
   - `"strict": true`
   - `"target": "ES2022"`
   - `"module": "ESNext"`
   - `"moduleResolution": "node"`
   - `"outDir": "./dist"`
   - `"rootDir": "./src"`
   - `"esModuleInterop": true`
   - `"skipLibCheck": true`
   - `"forceConsistentCasingInFileNames": true`
   - `"resolveJsonModule": true`
   - `"declaration": true`
   - `"declarationMap": true`
   - `"sourceMap": true`

**Deliverable**: `matching-service/tsconfig.json`

---

### Task 1.5: Create Core Types File
**Objective**: Define all TypeScript types for the planner system

**Steps**:
1. Create `matching-service/src/types/planner.ts`
2. Define the following types:

#### WarehouseItemTotal
```typescript
export interface WarehouseItemTotal {
  warehouseId: string;
  itemCode: string;
  quantity: number;
}
```

#### Warehouse
```typescript
export interface Warehouse {
  id: string;
  parishId: string;
  lat: number;
  lng: number;
  inventory: WarehouseItemTotal[];
}
```

#### Community
```typescript
export interface Community {
  id: string;
  parishId: string;
  lat: number;
  lng: number;
}
```

#### CommunityNeed
```typescript
export interface CommunityNeed {
  communityId: string;
  itemCode: string;
  quantity: number;
  priority: number; // 1 = highest priority
}
```

#### GlobalPlanningConstraints
```typescript
export interface GlobalPlanningConstraints {
  reserveFraction: number; // e.g., 0.2 = keep 20% in reserve
  maxDistanceKm: number; // Maximum distance to consider for allocation
  distanceWeight: number; // Weight for distance in cost calculation
  riskWeight: number; // Weight for risk in cost calculation
  fairnessWeight: number; // Weight for fairness in cost calculation
}
```

#### GlobalPlanningProblem
```typescript
export interface GlobalPlanningProblem {
  warehouses: Warehouse[];
  communities: Community[]; // Optional: for reference, needs reference communities
  communityNeeds: CommunityNeed[];
  constraints: GlobalPlanningConstraints;
  // Optional: for future risk layer integration
  riskLayers?: Record<string, number>; // Map of (warehouseId-communityId) -> risk score
  parishStats?: Record<string, any>; // Optional parish-level statistics
}
```

#### Shipment
```typescript
export interface Shipment {
  fromWarehouseId: string;
  toCommunityId: string;
  itemCode: string;
  quantity: number;
  cost: number; // Computed cost for this shipment
}
```

#### GlobalPlanningResult
```typescript
export interface GlobalPlanningResult {
  shipments: Shipment[];
  summary: {
    totalShipments: number;
    totalItemsAllocated: number;
    totalCost: number;
    unmetNeeds: CommunityNeed[]; // Needs that couldn't be fully satisfied
    fulfillmentRate: number; // Percentage of needs fulfilled (0-1)
  };
}
```

**Deliverable**: `matching-service/src/types/planner.ts` with all types defined

---

### Task 1.6: Create .gitignore
**Objective**: Exclude unnecessary files from version control

**Steps**:
1. Create `matching-service/.gitignore` with:
   - `node_modules/`
   - `dist/`
   - `.env`
   - `.env.local`
   - `*.log`
   - `.DS_Store`

**Deliverable**: `matching-service/.gitignore`

---

### Task 1.7: Create README
**Objective**: Document the project setup and basic usage

**Steps**:
1. Create `matching-service/README.md` with:
   - Project description
   - Installation instructions
   - Development setup
   - Basic project structure overview
   - Link to main implementation plan

**Deliverable**: `matching-service/README.md`

---

## File Structure After Phase 1

```
matching-service/
├── src/
│   └── types/
│       └── planner.ts          # ✅ All core types defined
├── package.json                # ✅ Dependencies and scripts
├── tsconfig.json               # ✅ TypeScript configuration
├── .gitignore                  # ✅ Git ignore rules
├── README.md                   # ✅ Project documentation
└── node_modules/               # ✅ Installed dependencies
```

## Validation Checklist

After completing Phase 1, verify:

- [ ] Directory structure is created
- [ ] `package.json` exists with correct name, version, and scripts
- [ ] All dependencies are installed (`node_modules/` exists)
- [ ] `tsconfig.json` exists with strict mode enabled
- [ ] `src/types/planner.ts` exists with all types defined
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] `.gitignore` is configured
- [ ] `README.md` documents the project

## Testing Phase 1

1. Run `npm run type-check` - should pass with no errors
2. Try importing types in a test file:
   ```typescript
   import type { Warehouse, GlobalPlanningProblem } from './src/types/planner.js';
   ```
3. Verify all types are exported correctly

## Next Steps After Phase 1

Once Phase 1 is complete, proceed to:
- **Phase 2**: Planner Interface & Utilities
  - Create `GlobalPlanner` interface
  - Implement haversine distance calculation
  - Implement cost calculation utilities
  - Implement fairness tracking utilities

## Estimated Time

- Task 1.1: 5 minutes
- Task 1.2: 5 minutes
- Task 1.3: 2-3 minutes (npm install)
- Task 1.4: 5 minutes
- Task 1.5: 20-30 minutes (type definitions)
- Task 1.6: 2 minutes
- Task 1.7: 5 minutes

**Total: 45-55 minutes**

## Notes

- All types should be exported from `planner.ts` for easy importing
- Types should be well-documented with JSDoc comments where helpful
- Consider making some fields optional if they're not always needed
- The `GlobalPlanningProblem` type should be flexible enough to accommodate future enhancements (risk layers, parish stats)


