/**
 * Fairness tracking utilities for equitable allocation
 * 
 * This module provides a fairness tracking system to ensure that allocations
 * are distributed equitably across parishes. It tracks allocation history
 * and calculates penalties/bonuses to guide the planner toward fairer distributions.
 * 
 * The fairness algorithm is a heuristic approach that:
 * - Tracks total allocations per parish per item
 * - Compares current allocations to a target (e.g., per-capita average)
 * - Provides bonuses (negative penalties) for under-served parishes
 * - Provides penalties (positive penalties) for over-served parishes
 * 
 * This encourages the planner to prioritize under-served areas while avoiding
 * over-allocation to already well-served areas.
 */

/**
 * Fairness tracker that maintains allocation history per parish and item
 */
export interface FairnessTracker {
  /**
   * Map of parishId -> Map of itemCode -> total quantity allocated
   * 
   * Example:
   * {
   *   'parish-1': { 'food': 1000, 'water': 500 },
   *   'parish-2': { 'food': 500, 'water': 300 }
   * }
   */
  allocations: Map<string, Map<string, number>>;
}

/**
 * Create a new empty fairness tracker
 * 
 * @returns New fairness tracker with empty allocations
 */
export function createFairnessTracker(): FairnessTracker {
  return {
    allocations: new Map<string, Map<string, number>>(),
  };
}

/**
 * Record an allocation in the fairness tracker
 * 
 * Updates the tracker to reflect that a quantity of an item has been
 * allocated to a parish. This is cumulative - multiple calls add to
 * the total.
 * 
 * @param tracker Fairness tracker to update
 * @param parishId Parish identifier
 * @param itemCode Item code being allocated
 * @param quantity Quantity allocated (must be non-negative)
 */
export function recordAllocation(
  tracker: FairnessTracker,
  parishId: string,
  itemCode: string,
  quantity: number
): void {
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error('quantity must be a non-negative finite number');
  }

  // Get or create parish allocation map
  let parishAllocations = tracker.allocations.get(parishId);
  if (!parishAllocations) {
    parishAllocations = new Map<string, number>();
    tracker.allocations.set(parishId, parishAllocations);
  }

  // Get or create item allocation total
  const currentTotal = parishAllocations.get(itemCode) || 0;
  parishAllocations.set(itemCode, currentTotal + quantity);
}

/**
 * Get the total quantity allocated to a parish for a specific item
 * 
 * @param tracker Fairness tracker
 * @param parishId Parish identifier
 * @param itemCode Item code
 * @returns Total quantity allocated (0 if none)
 */
export function getParishAllocation(
  tracker: FairnessTracker,
  parishId: string,
  itemCode: string
): number {
  const parishAllocations = tracker.allocations.get(parishId);
  if (!parishAllocations) {
    return 0;
  }

  return parishAllocations.get(itemCode) || 0;
}

/**
 * Calculate fairness penalty/bonus for a parish-item pair
 * 
 * This function compares the current allocation for a parish-item to a target
 * allocation. If the parish is under-served (below target), it returns a negative
 * penalty (bonus) to encourage more allocation. If over-served (above target),
 * it returns a positive penalty to discourage further allocation.
 * 
 * Fairness thresholds:
 * - Ratio < 0.8 (under-served): Bonus = -10 × (0.8 - ratio)
 * - Ratio > 1.2 (over-served): Penalty = 10 × (ratio - 1.2)
 * - 0.8 ≤ Ratio ≤ 1.2 (fairly served): No penalty/bonus
 * 
 * @param tracker Fairness tracker
 * @param parishId Parish identifier
 * @param itemCode Item code
 * @param targetPerCapita Optional target allocation (if not provided, uses average across all parishes)
 * @returns Fairness penalty (negative = bonus, positive = penalty, 0 = fair)
 * 
 * @example
 * ```typescript
 * const tracker = createFairnessTracker();
 * recordAllocation(tracker, 'parish-1', 'food', 100);
 * 
 * // If target is 150 and current is 100, ratio = 0.67 (< 0.8)
 * // Returns: -10 × (0.8 - 0.67) = -1.3 (bonus)
 * const penalty = calculateFairnessPenalty(tracker, 'parish-1', 'food', 150);
 * ```
 */
export function calculateFairnessPenalty(
  tracker: FairnessTracker,
  parishId: string,
  itemCode: string,
  targetPerCapita?: number
): number {
  const current = getParishAllocation(tracker, parishId, itemCode);

  // If no target provided, calculate average across all parishes
  let target = targetPerCapita;
  if (target === undefined) {
    target = calculateAverageAllocation(tracker, itemCode);
  }

  // Handle edge case: no target or zero target
  if (!target || target === 0) {
    // If there's no target and no allocations yet, no penalty
    if (current === 0) {
      return 0;
    }
    // If there's allocation but no target, assume it's over-served
    return 10;
  }

  const ratio = current / target;

  // Under-served: provide bonus (negative penalty)
  if (ratio < 0.8) {
    return -10 * (0.8 - ratio);
  }

  // Over-served: provide penalty (positive)
  if (ratio > 1.2) {
    return 10 * (ratio - 1.2);
  }

  // Fairly served: no penalty or bonus
  return 0;
}

/**
 * Calculate average allocation across all parishes for a specific item
 * 
 * @param tracker Fairness tracker
 * @param itemCode Item code
 * @returns Average allocation per parish (0 if no allocations)
 */
function calculateAverageAllocation(
  tracker: FairnessTracker,
  itemCode: string
): number {
  let total = 0;
  let count = 0;

  for (const parishAllocations of tracker.allocations.values()) {
    const allocation = parishAllocations.get(itemCode);
    if (allocation !== undefined && allocation > 0) {
      total += allocation;
      count++;
    }
  }

  if (count === 0) {
    return 0;
  }

  return total / count;
}


