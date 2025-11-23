# Phase 3: Greedy Min-Cost Planner Implementation - Detailed Plan

## Goal
Implement the core greedy heuristic algorithm that solves the global allocation problem by iteratively selecting the lowest-cost shipment arcs while respecting stock constraints and fairness considerations.

## Overview
This phase implements the `GreedyMinCostPlanner` class that uses a greedy approach to solve the allocation problem. The algorithm processes needs in priority order, finds feasible warehouse-community pairs, computes costs using the utilities from Phase 2, and greedily allocates from the cheapest options first.

## Algorithm Overview

The greedy algorithm follows these steps:
1. **Initialize**: Pre-compute stock levels and minimum allowed stock per warehouse-item
2. **Sort Needs**: Process needs by priority (1 = highest priority)
3. **For Each Need**:
   - Find candidate warehouses (has item, within distance, above min stock)
   - Compute cost for each candidate (distance + risk + fairness)
   - Sort candidates by cost (ascending)
   - Greedily allocate from cheapest to most expensive
   - Update stock and fairness tracking
4. **Build Result**: Collect all shipments and compute summary statistics

## Tasks Breakdown

### Task 3.1: Create GreedyMinCostPlanner Class Structure
**Objective**: Set up the class skeleton implementing the GlobalPlanner interface

**Steps**:
1. Create `src/planner/GreedyMinCostPlanner.ts`
2. Import all necessary types and utilities:
   - Types: `GlobalPlanningProblem`, `GlobalPlanningResult`, `Shipment`, `PlanningSummary`, `CommunityNeed`, `Warehouse`, `Community`
   - Utilities: `haversineDistanceKm`, `calculateArcCost`, `getRiskScore`, `createFairnessTracker`, `recordAllocation`, `calculateFairnessPenalty`
3. Create class implementing `GlobalPlanner` interface:
   ```typescript
   export class GreedyMinCostPlanner implements GlobalPlanner {
     plan(problem: GlobalPlanningProblem): GlobalPlanningResult {
       // Implementation
     }
   }
   ```
4. Add JSDoc class documentation explaining:
   - Algorithm approach (greedy heuristic)
   - Time complexity considerations
   - Memory optimization strategies
   - Where LP/MIP solver would plug in

**Deliverable**: Class structure with `plan()` method stub

---

### Task 3.2: Implement Stock Tracking System
**Objective**: Create efficient stock tracking to respect reserve fractions and prevent over-allocation

**Steps**:
1. Create internal stock tracking structure:
   ```typescript
   // Map of warehouseId -> Map of itemCode -> current available stock
   type StockMap = Map<string, Map<string, number>>;
   
   // Map of warehouseId -> Map of itemCode -> minimum allowed stock (reserve)
   type MinStockMap = Map<string, Map<string, number>>;
   ```
2. Implement `initializeStock()` helper:
   - Build stock map from warehouse inventory
   - Calculate minAllowedStock = initialStock × reserveFraction
   - Store both current stock and min stock
3. Implement `getAvailableStock()` helper:
   - Returns available stock = currentStock - minAllowedStock
   - Returns 0 if below minimum
4. Implement `allocateStock()` helper:
   - Deduct quantity from current stock
   - Validate that allocation doesn't go below minimum
   - Throw error if invalid allocation attempted

**Key Points**:
- Reserve fraction ensures we don't deplete warehouses completely
- Stock tracking must be efficient (O(1) lookups)
- Must handle multiple items per warehouse

**Deliverable**: Stock tracking helpers (`initializeStock`, `getAvailableStock`, `allocateStock`)

---

### Task 3.3: Implement Candidate Warehouse Filtering
**Objective**: Find feasible warehouse-community pairs for each need

**Steps**:
1. Create `findCandidateWarehouses()` helper:
   - Parameters: `need: CommunityNeed`, `warehouses: Warehouse[]`, `communities: Community[]`, `stockMap: StockMap`, `minStockMap: MinStockMap`, `constraints: GlobalPlanningConstraints`
   - Returns: Array of candidate objects with warehouse, community, distance, available stock
2. Filtering logic:
   - Find community by `need.communityId`
   - For each warehouse:
     - Check warehouse has the needed item (`itemCode`)
     - Check available stock > 0 (using `getAvailableStock()`)
     - Calculate distance using `haversineDistanceKm()`
     - Check distance <= `maxDistanceKm`
     - If all pass, add to candidates
3. Return candidate structure:
   ```typescript
   interface Candidate {
     warehouse: Warehouse;
     community: Community;
     distanceKm: number;
     availableStock: number;
   }
   ```

**Key Points**:
- Must efficiently filter large warehouse lists
- Distance calculation is O(1) per pair
- Early exit if no candidates found

**Deliverable**: `findCandidateWarehouses()` function

---

### Task 3.4: Implement Cost Calculation and Sorting
**Objective**: Compute costs for candidates and sort by cost (ascending)

**Steps**:
1. Create `computeCandidateCosts()` helper:
   - Parameters: `candidates: Candidate[]`, `need: CommunityNeed`, `problem: GlobalPlanningProblem`, `fairnessTracker: FairnessTracker`
   - Returns: Array of candidates with computed costs
2. For each candidate:
   - Get risk score using `getRiskScore(warehouse.id, community.id, problem.riskLayers)`
   - Get fairness penalty using `calculateFairnessPenalty(tracker, community.parishId, need.itemCode)`
   - Compute cost using `calculateArcCost()`:
     ```typescript
     const cost = calculateArcCost({
       distanceKm: candidate.distanceKm,
       riskScore: riskScore,
       fairnessPenalty: fairnessPenalty,
       constraints: problem.constraints,
     });
     ```
   - Attach cost to candidate
3. Sort candidates by cost (ascending) - lower cost = better
4. Return sorted candidates

**Key Points**:
- Cost calculation uses all three components (distance, risk, fairness)
- Sorting ensures greedy selection of cheapest options
- Fairness penalty updates dynamically as allocations occur

**Deliverable**: `computeCandidateCosts()` function

---

### Task 3.5: Implement Greedy Allocation Logic
**Objective**: Allocate from cheapest candidates until need is satisfied or no more candidates

**Steps**:
1. Create `allocateForNeed()` helper:
   - Parameters: `need: CommunityNeed`, `sortedCandidates: Candidate[]`, `stockMap: StockMap`, `fairnessTracker: FairnessTracker`, `shipments: Shipment[]`
   - Returns: Remaining need quantity (0 if fully satisfied)
2. Allocation loop:
   - Initialize `remainingQuantity = need.quantity`
   - For each candidate (in cost order):
     - Calculate `allocationAmount = Math.min(remainingQuantity, candidate.availableStock)`
     - If `allocationAmount > 0`:
       - Allocate stock using `allocateStock()`
       - Record allocation in fairness tracker using `recordAllocation()`
       - Create shipment:
         ```typescript
         const shipment: Shipment = {
           fromWarehouseId: candidate.warehouse.id,
           toCommunityId: candidate.community.id,
           itemCode: need.itemCode,
           quantity: allocationAmount,
           cost: candidate.cost, // Already computed
         };
         ```
       - Add shipment to shipments array
       - Update `remainingQuantity -= allocationAmount`
     - If `remainingQuantity === 0`, break (need satisfied)
3. Return `remainingQuantity` (0 if satisfied, >0 if partially/unmet)

**Key Points**:
- Greedy: always allocate from cheapest available candidate
- Respects stock limits (can't allocate more than available)
- Updates tracking state as allocations occur
- Handles partial fulfillment gracefully

**Deliverable**: `allocateForNeed()` function

---

### Task 3.6: Implement Main Planning Algorithm
**Objective**: Orchestrate the full planning process

**Steps**:
1. Implement `plan()` method:
   - Validate problem input (non-empty arrays, valid constraints)
   - Initialize stock maps using `initializeStock()`
   - Initialize fairness tracker using `createFairnessTracker()`
   - Initialize shipments array: `Shipment[] = []`
   - Initialize unmet needs array: `CommunityNeed[] = []`
2. Sort needs by priority (ascending, 1 = highest):
   ```typescript
   const sortedNeeds = [...problem.communityNeeds].sort((a, b) => a.priority - b.priority);
   ```
3. Process each need:
   - Find candidate warehouses using `findCandidateWarehouses()`
   - If no candidates: add to unmet needs, continue
   - Compute costs and sort using `computeCandidateCosts()`
   - Allocate using `allocateForNeed()`
   - If remaining quantity > 0: create unmet need with remaining quantity
4. Build result:
   - Calculate summary statistics:
     ```typescript
     const summary: PlanningSummary = {
       totalShipments: shipments.length,
       totalItemsAllocated: shipments.reduce((sum, s) => sum + s.quantity, 0),
       totalCost: shipments.reduce((sum, s) => sum + s.cost, 0),
       unmetNeeds: unmetNeeds,
       fulfillmentRate: calculateFulfillmentRate(problem.communityNeeds, unmetNeeds),
     };
     ```
   - Return `GlobalPlanningResult` with shipments and summary

**Key Points**:
- Process needs in priority order (highest priority first)
- Handle edge cases (no candidates, partial fulfillment)
- Calculate fulfillment rate = (totalNeeded - unmetNeeded) / totalNeeded

**Deliverable**: Complete `plan()` method implementation

---

### Task 3.7: Implement Helper Functions
**Objective**: Add utility functions for result calculation

**Steps**:
1. Implement `calculateFulfillmentRate()` helper:
   - Parameters: `allNeeds: CommunityNeed[]`, `unmetNeeds: CommunityNeed[]`
   - Calculate total needed = sum of all needs quantities
   - Calculate unmet = sum of unmet needs quantities
   - Return (totalNeeded - unmet) / totalNeeded
   - Handle division by zero (return 1.0 if no needs)
2. Add input validation helper:
   - Check warehouses array is non-empty
   - Check communities array is non-empty
   - Check needs array is non-empty
   - Check constraints are valid (reserveFraction 0-1, maxDistanceKm > 0, weights >= 0)
   - Throw descriptive errors if invalid

**Deliverable**: `calculateFulfillmentRate()` and validation helpers

---

### Task 3.8: Add Comprehensive Documentation and Comments
**Objective**: Document algorithm steps, complexity, and future improvements

**Steps**:
1. Add JSDoc to class explaining:
   - Algorithm: Greedy min-cost heuristic
   - Time complexity: O(N × M × log M) where N = needs, M = warehouses
   - Space complexity: O(W × I) for stock maps where W = warehouses, I = items
   - Limitations: Not optimal, but fast and practical
   - Future: LP/MIP solver would replace this entire class
2. Add inline comments explaining:
   - Why we sort needs by priority
   - Why we sort candidates by cost
   - How reserve fraction works
   - How fairness tracking affects allocation
   - Memory optimization strategies (using Maps for O(1) lookups)

**Deliverable**: Comprehensive documentation

---

## File Structure After Phase 3

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
│   ├── db/                         (Phase 5)
│   ├── validation/                 (Phase 4)
│   └── runtime/                    (Phase 7)
├── package.json                    ✅ Phase 1
├── tsconfig.json                   ✅ Phase 1
└── README.md                       ✅ Phase 1
```

## Implementation Details

### Stock Tracking Structure

```typescript
// Internal types
type StockMap = Map<string, Map<string, number>>; // warehouseId -> itemCode -> currentStock
type MinStockMap = Map<string, Map<string, number>>; // warehouseId -> itemCode -> minStock

// Initialize from problem
function initializeStock(
  warehouses: Warehouse[],
  reserveFraction: number
): { stockMap: StockMap; minStockMap: MinStockMap } {
  const stockMap = new Map<string, Map<string, number>>();
  const minStockMap = new Map<string, Map<string, number>>();
  
  for (const warehouse of warehouses) {
    const warehouseStock = new Map<string, number>();
    const warehouseMinStock = new Map<string, number>();
    
    for (const item of warehouse.inventory) {
      warehouseStock.set(item.itemCode, item.quantity);
      warehouseMinStock.set(item.itemCode, item.quantity * reserveFraction);
    }
    
    stockMap.set(warehouse.id, warehouseStock);
    minStockMap.set(warehouse.id, warehouseMinStock);
  }
  
  return { stockMap, minStockMap };
}
```

### Candidate Structure

```typescript
interface Candidate {
  warehouse: Warehouse;
  community: Community;
  distanceKm: number;
  availableStock: number;
  cost?: number; // Added after cost calculation
}
```

### Algorithm Flow

```typescript
plan(problem: GlobalPlanningProblem): GlobalPlanningResult {
  // 1. Validate input
  validateProblem(problem);
  
  // 2. Initialize tracking
  const { stockMap, minStockMap } = initializeStock(problem.warehouses, problem.constraints.reserveFraction);
  const fairnessTracker = createFairnessTracker();
  const shipments: Shipment[] = [];
  const unmetNeeds: CommunityNeed[] = [];
  
  // 3. Sort needs by priority
  const sortedNeeds = [...problem.communityNeeds].sort((a, b) => a.priority - b.priority);
  
  // 4. Process each need
  for (const need of sortedNeeds) {
    // Find candidates
    const candidates = findCandidateWarehouses(need, problem, stockMap, minStockMap);
    
    if (candidates.length === 0) {
      unmetNeeds.push(need);
      continue;
    }
    
    // Compute costs and sort
    const sortedCandidates = computeCandidateCosts(candidates, need, problem, fairnessTracker);
    
    // Allocate greedily
    const remaining = allocateForNeed(need, sortedCandidates, stockMap, fairnessTracker, shipments);
    
    if (remaining > 0) {
      unmetNeeds.push({ ...need, quantity: remaining });
    }
  }
  
  // 5. Build result
  return buildResult(shipments, problem.communityNeeds, unmetNeeds);
}
```

## Edge Cases to Handle

1. **No Feasible Warehouses**:
   - Need has no warehouses with the item
   - All warehouses are beyond maxDistanceKm
   - All warehouses are below reserve threshold
   - Solution: Add to unmet needs

2. **Partial Fulfillment**:
   - Need requires 100 units, but only 60 available across all warehouses
   - Solution: Allocate 60, add remaining 40 to unmet needs

3. **Multiple Items Per Community**:
   - Same community needs food, water, medicine
   - Solution: Process each need independently (already handled by loop)

4. **Zero Stock**:
   - Warehouse has item but quantity = 0
   - Solution: Filtered out in candidate search

5. **Invalid Inputs**:
   - Empty warehouses/communities/needs arrays
   - Invalid constraints (negative reserveFraction, etc.)
   - Solution: Validate and throw descriptive errors

6. **Same Priority Needs**:
   - Multiple needs with priority = 1
   - Solution: Process in order received (stable sort)

## Memory Optimization Strategies

1. **Use Maps for O(1) Lookups**:
   - Stock maps: `Map<warehouseId, Map<itemCode, stock>>`
   - Fairness tracker: `Map<parishId, Map<itemCode, allocation>>`
   - Avoid nested loops where possible

2. **Reuse Data Structures**:
   - Reuse stock maps across needs
   - Reuse fairness tracker across needs
   - Don't create new arrays unnecessarily

3. **Early Exits**:
   - Break when need is satisfied
   - Skip candidates with zero available stock
   - Filter invalid candidates early

4. **Lazy Evaluation**:
   - Only compute costs for feasible candidates
   - Only calculate distances when needed

## Validation Checklist

After completing Phase 3, verify:

- [ ] `GreedyMinCostPlanner` implements `GlobalPlanner` interface
- [ ] Stock tracking respects reserve fractions
- [ ] Candidates are filtered correctly (distance, stock, item availability)
- [ ] Costs are computed correctly (distance + risk + fairness)
- [ ] Allocation is greedy (cheapest first)
- [ ] Fairness tracking updates correctly
- [ ] Needs are processed in priority order
- [ ] Unmet needs are tracked correctly
- [ ] Summary statistics are accurate
- [ ] Edge cases are handled (no candidates, partial fulfillment)
- [ ] Input validation works
- [ ] TypeScript compiles without errors
- [ ] Algorithm is well-documented

## Testing Phase 3

1. **Test Basic Allocation**:
   ```typescript
   const problem: GlobalPlanningProblem = {
     warehouses: [
       { id: 'w1', parishId: 'p1', lat: 18.0, lng: -76.8, inventory: [{ warehouseId: 'w1', itemCode: 'food', quantity: 100 }] },
     ],
     communities: [
       { id: 'c1', parishId: 'p1', lat: 18.1, lng: -76.9 },
     ],
     communityNeeds: [
       { communityId: 'c1', itemCode: 'food', quantity: 50, priority: 1 },
     ],
     constraints: {
       reserveFraction: 0.2,
       maxDistanceKm: 100,
       distanceWeight: 1.0,
       riskWeight: 0.5,
       fairnessWeight: 0.3,
     },
   };
   
   const planner = new GreedyMinCostPlanner();
   const result = planner.plan(problem);
   // Should allocate 50 units, fulfillmentRate = 1.0
   ```

2. **Test Reserve Fraction**:
   - Warehouse has 100 units, reserveFraction = 0.2
   - Need requests 90 units
   - Should allocate 80 units (100 - 20 reserve), 10 unmet

3. **Test Distance Filtering**:
   - Warehouse is 150km away, maxDistanceKm = 100
   - Should not be a candidate

4. **Test Priority Ordering**:
   - Need A: priority 2, quantity 100
   - Need B: priority 1, quantity 50
   - Should process B first, then A

5. **Test Fairness**:
   - Parish 1 already allocated 100 units
   - Parish 2 allocated 0 units
   - Same need for both parishes
   - Should prefer Parish 2 (fairness bonus)

## Next Steps After Phase 3

Once Phase 3 is complete, proceed to:
- **Phase 4**: Hono App & HTTP Endpoints
  - Create Hono application
  - Add `/plan` POST endpoint
  - Add `/health` GET endpoint
  - Add input validation with Zod

## Estimated Time

- Task 3.1: 15 minutes (class structure)
- Task 3.2: 30-40 minutes (stock tracking)
- Task 3.3: 30-40 minutes (candidate filtering)
- Task 3.4: 20-30 minutes (cost calculation)
- Task 3.5: 40-50 minutes (allocation logic)
- Task 3.6: 40-50 minutes (main algorithm)
- Task 3.7: 20-30 minutes (helpers)
- Task 3.8: 20-30 minutes (documentation)

**Total: 215-305 minutes (approximately 3.5-5 hours)**

## Notes

- The greedy algorithm is not optimal but is fast and practical
- For optimal solutions, an LP/MIP solver would replace this entire class
- The algorithm is deterministic (same input = same output)
- Memory usage scales with number of warehouses × items
- Time complexity is acceptable for problems with hundreds of warehouses and thousands of needs
- Fairness tracking adds overhead but ensures equitable distribution
- Reserve fraction prevents complete warehouse depletion (important for ongoing operations)

