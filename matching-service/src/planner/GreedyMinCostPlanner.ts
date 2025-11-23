/**
 * Greedy Min-Cost Planner
 * 
 * A fast heuristic solver for the global allocation problem using a greedy
 * min-cost approach. This algorithm processes needs in priority order and
 * greedily allocates from the cheapest available warehouse-community pairs.
 * 
 * Algorithm:
 * 1. Initialize stock tracking and fairness tracker
 * 2. Sort needs by priority (1 = highest priority)
 * 3. For each need:
 *    - Find candidate warehouses (has item, within distance, above reserve)
 *    - Compute cost for each candidate (distance + risk + fairness)
 *    - Sort candidates by cost (ascending)
 *    - Greedily allocate from cheapest to most expensive
 *    - Update stock and fairness tracking
 * 4. Build result with shipments and summary statistics
 * 
 * Time Complexity: O(N × M × log M)
 *   - N = number of needs
 *   - M = number of warehouses
 *   - log M = sorting candidates by cost
 * 
 * Space Complexity: O(W × I)
 *   - W = number of warehouses
 *   - I = number of unique items
 *   - For stock maps and fairness tracker
 * 
 * Limitations:
 * - Not optimal (greedy heuristic)
 * - May not find feasible solution even if one exists
 * - Fairness is heuristic-based
 * 
 * Future Improvements:
 * - Replace with LP/MIP solver (e.g., Gurobi, CPLEX) for optimal solutions
 * - Use hybrid approach: greedy initialization + LP refinement
 * - Add iterative improvement (local search, simulated annealing)
 * 
 * Memory Optimization:
 * - Uses Maps for O(1) lookups (stock, fairness)
 * - Reuses data structures across needs
 * - Early exits when needs are satisfied
 * - Filters invalid candidates early
 */

import type {
  GlobalPlanningProblem,
  GlobalPlanningResult,
  Shipment,
  PlanningSummary,
  CommunityNeed,
  Warehouse,
  Community,
  GlobalPlanningConstraints,
} from '../types/planner.js';

import type { GlobalPlanner } from './GlobalPlanner.js';

import { haversineDistanceKm } from '../utils/geo.js';
import { calculateArcCost, getRiskScore } from '../utils/cost.js';
import {
  createFairnessTracker,
  recordAllocation,
  calculateFairnessPenalty,
  type FairnessTracker,
} from '../utils/fairness.js';

/**
 * Internal types for stock tracking
 */
type StockMap = Map<string, Map<string, number>>; // warehouseId -> itemCode -> currentStock
type MinStockMap = Map<string, Map<string, number>>; // warehouseId -> itemCode -> minStock

/**
 * Candidate warehouse-community pair for allocation
 */
interface Candidate {
  warehouse: Warehouse;
  community: Community;
  distanceKm: number;
  availableStock: number;
  cost?: number; // Added after cost calculation
}

/**
 * Greedy Min-Cost Planner implementation
 * 
 * Solves the global allocation problem using a greedy heuristic that
 * selects the lowest-cost shipment arcs while respecting stock constraints
 * and fairness considerations.
 */
export class GreedyMinCostPlanner implements GlobalPlanner {
  /**
   * Solve the global allocation problem.
   * 
   * @param problem Complete planning problem definition
   * @returns Planning result with shipments and summary
   * @throws {Error} If the problem is invalid or solver encounters an error
   */
  plan(problem: GlobalPlanningProblem): GlobalPlanningResult {
    // Validate input
    this.validateProblem(problem);

    // Initialize tracking structures
    const { stockMap, minStockMap } = this.initializeStock(
      problem.warehouses,
      problem.constraints.reserveFraction
    );
    const fairnessTracker = createFairnessTracker();
    const shipments: Shipment[] = [];
    const unmetNeeds: CommunityNeed[] = [];

    // Sort needs by priority (1 = highest priority)
    const sortedNeeds = [...problem.communityNeeds].sort(
      (a, b) => a.priority - b.priority
    );

    // Process each need in priority order
    for (const need of sortedNeeds) {
      // Find candidate warehouses
      const candidates = this.findCandidateWarehouses(
        need,
        problem.warehouses,
        problem.communities,
        stockMap,
        minStockMap,
        problem.constraints
      );

      // If no candidates, mark as unmet
      if (candidates.length === 0) {
        unmetNeeds.push(need);
        continue;
      }

      // Compute costs and sort by cost (ascending)
      const sortedCandidates = this.computeCandidateCosts(
        candidates,
        need,
        problem,
        fairnessTracker
      );

      // Allocate greedily from cheapest to most expensive
      const remaining = this.allocateForNeed(
        need,
        sortedCandidates,
        stockMap,
        minStockMap,
        fairnessTracker,
        shipments
      );

      // If need not fully satisfied, add remaining to unmet needs
      if (remaining > 0) {
        unmetNeeds.push({ ...need, quantity: remaining });
      }
    }

    // Build and return result
    return this.buildResult(shipments, problem.communityNeeds, unmetNeeds);
  }

  /**
   * Validate problem input
   */
  private validateProblem(problem: GlobalPlanningProblem): void {
    if (!problem.warehouses || problem.warehouses.length === 0) {
      throw new Error('Problem must have at least one warehouse');
    }

    if (!problem.communities || problem.communities.length === 0) {
      throw new Error('Problem must have at least one community');
    }

    if (!problem.communityNeeds || problem.communityNeeds.length === 0) {
      throw new Error('Problem must have at least one community need');
    }

    const { constraints } = problem;

    if (
      !Number.isFinite(constraints.reserveFraction) ||
      constraints.reserveFraction < 0 ||
      constraints.reserveFraction > 1
    ) {
      throw new Error('reserveFraction must be between 0 and 1');
    }

    if (
      !Number.isFinite(constraints.maxDistanceKm) ||
      constraints.maxDistanceKm <= 0
    ) {
      throw new Error('maxDistanceKm must be a positive number');
    }

    if (
      !Number.isFinite(constraints.distanceWeight) ||
      constraints.distanceWeight < 0
    ) {
      throw new Error('distanceWeight must be a non-negative number');
    }

    if (
      !Number.isFinite(constraints.riskWeight) ||
      constraints.riskWeight < 0
    ) {
      throw new Error('riskWeight must be a non-negative number');
    }

    if (
      !Number.isFinite(constraints.fairnessWeight) ||
      constraints.fairnessWeight < 0
    ) {
      throw new Error('fairnessWeight must be a non-negative number');
    }
  }

  /**
   * Initialize stock tracking maps from warehouse inventory
   * 
   * Creates maps for current stock and minimum allowed stock (reserve).
   * Reserve fraction ensures we don't completely deplete warehouses.
   * 
   * @param warehouses List of warehouses with inventory
   * @param reserveFraction Fraction of stock to keep in reserve (0-1)
   * @returns Stock maps for tracking available inventory
   */
  private initializeStock(
    warehouses: Warehouse[],
    reserveFraction: number
  ): { stockMap: StockMap; minStockMap: MinStockMap } {
    const stockMap = new Map<string, Map<string, number>>();
    const minStockMap = new Map<string, Map<string, number>>();

    for (const warehouse of warehouses) {
      const warehouseStock = new Map<string, number>();
      const warehouseMinStock = new Map<string, number>();

      for (const item of warehouse.inventory) {
        const initialStock = item.quantity;
        const minStock = initialStock * reserveFraction;

        warehouseStock.set(item.itemCode, initialStock);
        warehouseMinStock.set(item.itemCode, minStock);
      }

      stockMap.set(warehouse.id, warehouseStock);
      minStockMap.set(warehouse.id, warehouseMinStock);
    }

    return { stockMap, minStockMap };
  }

  /**
   * Get available stock for a warehouse-item pair
   * 
   * Available stock = current stock - minimum allowed stock (reserve).
   * Returns 0 if current stock is at or below minimum.
   * 
   * @param warehouseId Warehouse identifier
   * @param itemCode Item code
   * @param stockMap Current stock map
   * @param minStockMap Minimum stock map
   * @returns Available stock (non-negative)
   */
  private getAvailableStock(
    warehouseId: string,
    itemCode: string,
    stockMap: StockMap,
    minStockMap: MinStockMap
  ): number {
    const warehouseStock = stockMap.get(warehouseId);
    const warehouseMinStock = minStockMap.get(warehouseId);

    if (!warehouseStock || !warehouseMinStock) {
      return 0;
    }

    const currentStock = warehouseStock.get(itemCode) || 0;
    const minStock = warehouseMinStock.get(itemCode) || 0;

    const available = currentStock - minStock;
    return Math.max(0, available);
  }

  /**
   * Allocate stock from a warehouse
   * 
   * Deducts quantity from current stock and validates that allocation
   * doesn't go below minimum allowed stock.
   * 
   * @param warehouseId Warehouse identifier
   * @param itemCode Item code
   * @param quantity Quantity to allocate
   * @param stockMap Current stock map (mutated)
   * @param minStockMap Minimum stock map
   * @throws {Error} If allocation would go below minimum stock
   */
  private allocateStock(
    warehouseId: string,
    itemCode: string,
    quantity: number,
    stockMap: StockMap,
    minStockMap: MinStockMap
  ): void {
    const warehouseStock = stockMap.get(warehouseId);
    const warehouseMinStock = minStockMap.get(warehouseId);

    if (!warehouseStock || !warehouseMinStock) {
      throw new Error(`Warehouse ${warehouseId} not found in stock map`);
    }

    const currentStock = warehouseStock.get(itemCode) || 0;
    const minStock = warehouseMinStock.get(itemCode) || 0;

    const newStock = currentStock - quantity;

    if (newStock < minStock) {
      throw new Error(
        `Allocation would reduce stock below minimum: ${newStock} < ${minStock}`
      );
    }

    warehouseStock.set(itemCode, newStock);
  }

  /**
   * Find candidate warehouses for a need
   * 
   * Filters warehouses to find feasible candidates that:
   * - Have the needed item in inventory
   * - Have available stock > 0 (above reserve)
   * - Are within maxDistanceKm of the community
   * 
   * @param need Community need to fulfill
   * @param warehouses List of warehouses
   * @param communities List of communities
   * @param stockMap Current stock map
   * @param minStockMap Minimum stock map
   * @param constraints Planning constraints
   * @returns Array of candidate warehouse-community pairs
   */
  private findCandidateWarehouses(
    need: CommunityNeed,
    warehouses: Warehouse[],
    communities: Community[],
    stockMap: StockMap,
    minStockMap: MinStockMap,
    constraints: GlobalPlanningConstraints
  ): Candidate[] {
    // Find the community
    const community = communities.find((c) => c.id === need.communityId);
    if (!community) {
      return []; // Community not found
    }

    const candidates: Candidate[] = [];

    for (const warehouse of warehouses) {
      // Check warehouse has the needed item
      const hasItem = warehouse.inventory.some(
        (item) => item.itemCode === need.itemCode
      );
      if (!hasItem) {
        continue;
      }

      // Check available stock > 0
      const availableStock = this.getAvailableStock(
        warehouse.id,
        need.itemCode,
        stockMap,
        minStockMap
      );
      if (availableStock <= 0) {
        continue;
      }

      // Calculate distance
      const distanceKm = haversineDistanceKm(
        warehouse.lat,
        warehouse.lng,
        community.lat,
        community.lng
      );

      // Check distance constraint
      if (distanceKm > constraints.maxDistanceKm) {
        continue;
      }

      // All checks passed - add to candidates
      candidates.push({
        warehouse,
        community,
        distanceKm,
        availableStock,
      });
    }

    return candidates;
  }

  /**
   * Compute costs for candidates and sort by cost (ascending)
   * 
   * For each candidate, computes composite cost using:
   * - Distance cost
   * - Risk cost (if risk layers provided)
   * - Fairness penalty/bonus
   * 
   * Sorts candidates by cost (lower cost = better allocation).
   * 
   * @param candidates Candidate warehouse-community pairs
   * @param need Community need being fulfilled
   * @param problem Complete planning problem
   * @param fairnessTracker Fairness tracker for penalty calculation
   * @returns Candidates sorted by cost (ascending)
   */
  private computeCandidateCosts(
    candidates: Candidate[],
    need: CommunityNeed,
    problem: GlobalPlanningProblem,
    fairnessTracker: FairnessTracker
  ): Candidate[] {
    const candidatesWithCosts = candidates.map((candidate) => {
      // Get risk score
      const riskScore = getRiskScore(
        candidate.warehouse.id,
        candidate.community.id,
        problem.riskLayers
      );

      // Get fairness penalty
      const fairnessPenalty = calculateFairnessPenalty(
        fairnessTracker,
        candidate.community.parishId,
        need.itemCode
      );

      // Compute composite cost
      const cost = calculateArcCost({
        distanceKm: candidate.distanceKm,
        riskScore,
        fairnessPenalty,
        constraints: problem.constraints,
      });

      return {
        ...candidate,
        cost,
      };
    });

    // Sort by cost (ascending) - lower cost = better
    return candidatesWithCosts.sort((a, b) => (a.cost || 0) - (b.cost || 0));
  }

  /**
   * Allocate stock for a need greedily from cheapest candidates
   * 
   * Iteratively allocates from candidates in cost order (cheapest first)
   * until the need is satisfied or no more candidates are available.
   * Updates stock and fairness tracking as allocations occur.
   * 
   * @param need Community need to fulfill
   * @param sortedCandidates Candidates sorted by cost (ascending)
   * @param stockMap Current stock map (mutated)
   * @param minStockMap Minimum stock map for validation
   * @param fairnessTracker Fairness tracker (mutated)
   * @param shipments Shipments array (mutated)
   * @returns Remaining quantity (0 if fully satisfied)
   */
  private allocateForNeed(
    need: CommunityNeed,
    sortedCandidates: Candidate[],
    stockMap: StockMap,
    minStockMap: MinStockMap,
    fairnessTracker: FairnessTracker,
    shipments: Shipment[]
  ): number {
    let remainingQuantity = need.quantity;

    for (const candidate of sortedCandidates) {
      if (remainingQuantity <= 0) {
        break; // Need satisfied
      }

      // Recalculate available stock (may have changed from previous allocations)
      const availableStock = this.getAvailableStock(
        candidate.warehouse.id,
        need.itemCode,
        stockMap,
        minStockMap
      );

      if (availableStock <= 0) {
        continue; // No stock available, try next candidate
      }

      // Calculate allocation amount (can't exceed available stock or remaining need)
      const allocationAmount = Math.min(remainingQuantity, availableStock);

      if (allocationAmount > 0) {
        // Allocate stock
        this.allocateStock(
          candidate.warehouse.id,
          need.itemCode,
          allocationAmount,
          stockMap,
          minStockMap
        );

        // Record allocation in fairness tracker
        recordAllocation(
          fairnessTracker,
          candidate.community.parishId,
          need.itemCode,
          allocationAmount
        );

        // Create shipment
        const shipment: Shipment = {
          fromWarehouseId: candidate.warehouse.id,
          toCommunityId: candidate.community.id,
          itemCode: need.itemCode,
          quantity: allocationAmount,
          cost: candidate.cost || 0,
        };

        shipments.push(shipment);

        // Update remaining quantity
        remainingQuantity -= allocationAmount;
      }
    }

    return remainingQuantity;
  }

  /**
   * Build planning result with shipments and summary statistics
   * 
   * @param shipments All shipments in the allocation plan
   * @param allNeeds All original needs
   * @param unmetNeeds Needs that couldn't be fully satisfied
   * @returns Complete planning result
   */
  private buildResult(
    shipments: Shipment[],
    allNeeds: CommunityNeed[],
    unmetNeeds: CommunityNeed[]
  ): GlobalPlanningResult {
    const totalItemsAllocated = shipments.reduce(
      (sum, s) => sum + s.quantity,
      0
    );
    const totalCost = shipments.reduce((sum, s) => sum + s.cost, 0);
    const fulfillmentRate = this.calculateFulfillmentRate(
      allNeeds,
      unmetNeeds
    );

    const summary: PlanningSummary = {
      totalShipments: shipments.length,
      totalItemsAllocated,
      totalCost,
      unmetNeeds,
      fulfillmentRate,
    };

    return {
      shipments,
      summary,
    };
  }

  /**
   * Calculate fulfillment rate (percentage of needs satisfied)
   * 
   * @param allNeeds All original needs
   * @param unmetNeeds Needs that couldn't be fully satisfied
   * @returns Fulfillment rate (0-1, where 1 = 100% satisfied)
   */
  private calculateFulfillmentRate(
    allNeeds: CommunityNeed[],
    unmetNeeds: CommunityNeed[]
  ): number {
    const totalNeeded = allNeeds.reduce((sum, n) => sum + n.quantity, 0);
    const unmet = unmetNeeds.reduce((sum, n) => sum + n.quantity, 0);

    if (totalNeeded === 0) {
      return 1.0; // No needs = 100% fulfilled
    }

    return (totalNeeded - unmet) / totalNeeded;
  }
}

