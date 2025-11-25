# Phase 2: Planner Interface & Utilities - Detailed Plan

## Goal
Create the planner interface and utility functions needed for the allocation algorithm, including distance calculation, cost computation, and fairness tracking.

## Overview
This phase establishes the foundational interfaces and utility functions that will be used by the greedy planner implementation in Phase 3. We'll create the `GlobalPlanner` interface and implement helper functions for geographic distance, cost calculation, and fairness tracking.

## Tasks Breakdown

### Task 2.1: Create GlobalPlanner Interface
**Objective**: Define the pluggable planner interface that all solver implementations will use

**Steps**:
1. Create `src/planner/GlobalPlanner.ts`
2. Define the `GlobalPlanner` interface:
   ```typescript
   export interface GlobalPlanner {
     plan(problem: GlobalPlanningProblem): GlobalPlanningResult;
   }
   ```
3. Add comprehensive JSDoc comments explaining:
   - The purpose of the interface
   - How it enables pluggable solvers
   - Future LP/MIP solver integration possibilities
   - Input/output contract

**Key Points**:
- This interface allows swapping implementations (greedy heuristic → LP solver)
- All planners must implement the same `plan()` method signature
- The interface is synchronous (for now), but could be async in the future

**Deliverable**: `src/planner/GlobalPlanner.ts`

---

### Task 2.2: Implement Haversine Distance Calculation
**Objective**: Create utility function to calculate distance between two geographic points

**Steps**:
1. Create `src/utils/geo.ts`
2. Implement `haversineDistanceKm()` function:
   - Parameters: `lat1: number, lon1: number, lat2: number, lon2: number`
   - Returns: `number` (distance in kilometers)
   - Formula: Standard haversine formula for great-circle distance
3. Add JSDoc documentation:
   - Explain the haversine formula
   - Note that it calculates great-circle distance (as the crow flies)
   - Mention accuracy for short distances
4. Add input validation:
   - Check latitude is between -90 and 90
   - Check longitude is between -180 and 180
   - Handle edge cases (same point, antipodal points)

**Haversine Formula**:
```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
c = 2 × atan2(√a, √(1−a))
d = R × c
```
Where R = Earth's radius (6371 km)

**Deliverable**: `src/utils/geo.ts` with `haversineDistanceKm()` function

---

### Task 2.3: Implement Cost Calculation
**Objective**: Create utility function to compute composite cost for a potential shipment arc

**Steps**:
1. Create `src/utils/cost.ts`
2. Define types:
   ```typescript
   export interface ArcCostInput {
     distanceKm: number;
     riskScore?: number;
     fairnessPenalty: number;
     constraints: GlobalPlanningConstraints;
   }
   ```
3. Implement `calculateArcCost()` function:
   - Parameters: `ArcCostInput`
   - Returns: `number` (composite cost)
   - Formula:
     ```typescript
     cost = distanceKm * constraints.distanceWeight
          + (riskScore || 0) * constraints.riskWeight
          + fairnessPenalty * constraints.fairnessWeight
     ```
4. Add JSDoc documentation:
   - Explain the cost components
   - Note that lower cost = better allocation
   - Explain how weights affect the calculation
5. Add helper function `getRiskScore()`:
   - Parameters: `warehouseId: string, communityId: string, riskLayers?: Record<string, number>`
   - Returns: `number` (risk score, default 0 if not provided)
   - Looks up risk in `riskLayers` map using key format: `"warehouseId-communityId"`

**Deliverable**: `src/utils/cost.ts` with `calculateArcCost()` and `getRiskScore()` functions

---

### Task 2.4: Implement Fairness Tracking
**Objective**: Create fairness tracking system to avoid starving under-served parishes

**Steps**:
1. Create `src/utils/fairness.ts`
2. Define types:
   ```typescript
   export interface FairnessTracker {
     // Map of parishId -> Map of itemCode -> total quantity allocated
     allocations: Map<string, Map<string, number>>;
   }
   ```
3. Implement functions:
   - `createFairnessTracker()`: Initialize empty tracker
   - `recordAllocation(tracker, parishId, itemCode, quantity)`: Record an allocation
   - `getParishAllocation(tracker, parishId, itemCode)`: Get total allocated for parish/item
   - `calculateFairnessPenalty(tracker, parishId, itemCode, targetPerCapita?)`: Calculate penalty/bonus
4. Fairness penalty logic:
   - If parish has received less than target per-capita: reduce cost (negative penalty = bonus)
   - If parish has received more than target: increase cost (positive penalty)
   - Default target can be average allocation across all parishes
   - Formula example:
     ```typescript
     const current = getParishAllocation(tracker, parishId, itemCode);
     const target = targetPerCapita || averageAllocation;
     const ratio = current / target;
     
     if (ratio < 0.8) {
       // Under-served: bonus (negative penalty)
       return -10 * (0.8 - ratio);
     } else if (ratio > 1.2) {
       // Over-served: penalty
       return 10 * (ratio - 1.2);
     }
     return 0; // Fairly served
     ```
5. Add JSDoc documentation:
   - Explain fairness concept
   - Explain how penalties/bonuses work
   - Note that this is a heuristic approach

**Deliverable**: `src/utils/fairness.ts` with fairness tracking functions

---

### Task 2.5: Create Utility Index File (Optional)
**Objective**: Create barrel export for easier imports

**Steps**:
1. Create `src/utils/index.ts`
2. Export all utility functions:
   ```typescript
   export * from './geo.js';
   export * from './cost.js';
   export * from './fairness.js';
   ```

**Deliverable**: `src/utils/index.ts` (optional but recommended)

---

## File Structure After Phase 2

```
matching-service/
├── src/
│   ├── types/
│   │   └── planner.ts          ✅ Phase 1
│   ├── planner/
│   │   └── GlobalPlanner.ts    ✅ Phase 2
│   ├── utils/
│   │   ├── geo.ts              ✅ Phase 2
│   │   ├── cost.ts              ✅ Phase 2
│   │   ├── fairness.ts          ✅ Phase 2
│   │   └── index.ts             ✅ Phase 2 (optional)
│   ├── db/                      (Phase 5)
│   ├── validation/              (Phase 4)
│   └── runtime/                 (Phase 7)
├── package.json                 ✅ Phase 1
├── tsconfig.json                ✅ Phase 1
└── README.md                    ✅ Phase 1
```

## Implementation Details

### Haversine Distance Function

```typescript
/**
 * Calculate the great-circle distance between two points on Earth
 * using the Haversine formula.
 * 
 * @param lat1 Latitude of first point in degrees
 * @param lon1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lon2 Longitude of second point in degrees
 * @returns Distance in kilometers
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Implementation here
}
```

### Cost Calculation Function

```typescript
/**
 * Calculate composite cost for a potential shipment arc.
 * Lower cost = better allocation candidate.
 * 
 * @param input Cost components and constraints
 * @returns Composite cost value
 */
export function calculateArcCost(input: ArcCostInput): number {
  // Implementation here
}
```

### Fairness Tracker

```typescript
/**
 * Track allocations per parish to ensure fairness.
 * Provides bonuses for under-served parishes and penalties for over-served ones.
 */
export class FairnessTracker {
  // Implementation here
}
```

## Validation Checklist

After completing Phase 2, verify:

- [ ] `GlobalPlanner` interface is defined and exported
- [ ] `haversineDistanceKm()` calculates correct distances
- [ ] `calculateArcCost()` computes weighted cost correctly
- [ ] `FairnessTracker` tracks allocations properly
- [ ] All functions have proper JSDoc documentation
- [ ] TypeScript compiles without errors
- [ ] Functions handle edge cases (null/undefined inputs)
- [ ] Utility functions are unit-testable (pure functions where possible)

## Testing Phase 2

1. **Test Haversine Distance**:
   ```typescript
   // Test: Kingston to Montego Bay (~100km)
   const distance = haversineDistanceKm(18.0, -76.8, 18.5, -77.9);
   // Should be approximately 100-120km
   ```

2. **Test Cost Calculation**:
   ```typescript
   const cost = calculateArcCost({
     distanceKm: 50,
     riskScore: 0.3,
     fairnessPenalty: -5,
     constraints: {
       distanceWeight: 1.0,
       riskWeight: 0.5,
       fairnessWeight: 0.3,
       // ... other constraints
     }
   });
   // Expected: 50 * 1.0 + 0.3 * 0.5 + (-5) * 0.3 = 50 + 0.15 - 1.5 = 48.65
   ```

3. **Test Fairness Tracking**:
   ```typescript
   const tracker = createFairnessTracker();
   recordAllocation(tracker, 'parish-1', 'food', 100);
   const penalty = calculateFairnessPenalty(tracker, 'parish-1', 'food');
   // Should return appropriate penalty/bonus
   ```

## Edge Cases to Handle

1. **Haversine**:
   - Same coordinates (distance = 0)
   - Antipodal points (distance ≈ 20,000km)
   - Invalid coordinates (out of range)
   - NaN or Infinity inputs

2. **Cost Calculation**:
   - Missing risk score (default to 0)
   - Zero distance
   - Negative weights (should validate or handle)

3. **Fairness**:
   - First allocation (no history)
   - Zero allocations (division by zero)
   - Missing parish/item in tracker

## Next Steps After Phase 2

Once Phase 2 is complete, proceed to:
- **Phase 3**: Greedy Min-Cost Planner Implementation
  - Implement `GreedyMinCostPlanner` class
  - Use the utilities created in Phase 2
  - Implement the core allocation algorithm

## Estimated Time

- Task 2.1: 10 minutes (interface definition)
- Task 2.2: 20-30 minutes (haversine implementation + testing)
- Task 2.3: 20-30 minutes (cost calculation)
- Task 2.4: 30-40 minutes (fairness tracking)
- Task 2.5: 5 minutes (index file)

**Total: 85-115 minutes (approximately 1.5-2 hours)**

## Notes

- All utility functions should be pure functions where possible (no side effects)
- Functions should be well-documented for future maintainers
- Consider adding unit tests in Phase 8, but functions should be testable now
- The fairness algorithm is a heuristic - document that it can be refined later
- Haversine is accurate enough for our use case (within ~0.5% for distances < 1000km)


