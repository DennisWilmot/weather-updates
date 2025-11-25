/**
 * Cost calculation utilities for shipment arcs
 */

import type { GlobalPlanningConstraints } from '../types/planner.js';

/**
 * Input parameters for calculating arc cost
 */
export interface ArcCostInput {
  /** Distance in kilometers between warehouse and community */
  distanceKm: number;
  /** Optional risk score for this warehouse-community pair (0-1 scale) */
  riskScore?: number;
  /** Fairness penalty/bonus (negative = bonus for under-served, positive = penalty for over-served) */
  fairnessPenalty: number;
  /** Planning constraints containing weight parameters */
  constraints: GlobalPlanningConstraints;
}

/**
 * Calculate composite cost for a potential shipment arc.
 * 
 * Lower cost = better allocation candidate. The cost is a weighted sum of:
 * - Distance: Physical distance between warehouse and community
 * - Risk: Risk score for the route (e.g., road conditions, weather)
 * - Fairness: Penalty/bonus to ensure equitable distribution
 * 
 * The weights are configurable via `constraints` to allow tuning the
 * algorithm's priorities. For example:
 * - High distanceWeight: Prefer nearby warehouses
 * - High riskWeight: Avoid risky routes
 * - High fairnessWeight: Prioritize equitable distribution
 * 
 * Formula:
 *   cost = distanceKm × distanceWeight
 *        + (riskScore || 0) × riskWeight
 *        + fairnessPenalty × fairnessWeight
 * 
 * @param input Cost components and constraints
 * @returns Composite cost value (lower is better)
 * 
 * @example
 * ```typescript
 * const cost = calculateArcCost({
 *   distanceKm: 50,
 *   riskScore: 0.3,
 *   fairnessPenalty: -5,
 *   constraints: {
 *     distanceWeight: 1.0,
 *     riskWeight: 0.5,
 *     fairnessWeight: 0.3,
 *     // ... other constraints
 *   }
 * });
 * // Returns: 50 * 1.0 + 0.3 * 0.5 + (-5) * 0.3 = 48.65
 * ```
 */
export function calculateArcCost(input: ArcCostInput): number {
  const { distanceKm, riskScore, fairnessPenalty, constraints } = input;

  // Validate inputs
  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    throw new Error('distanceKm must be a non-negative finite number');
  }

  if (riskScore !== undefined && (!Number.isFinite(riskScore) || riskScore < 0)) {
    throw new Error('riskScore must be a non-negative finite number if provided');
  }

  if (!Number.isFinite(fairnessPenalty)) {
    throw new Error('fairnessPenalty must be a finite number');
  }

  // Calculate weighted cost components
  const distanceCost = distanceKm * constraints.distanceWeight;
  const riskCost = (riskScore || 0) * constraints.riskWeight;
  const fairnessCost = fairnessPenalty * constraints.fairnessWeight;

  const totalCost = distanceCost + riskCost + fairnessCost;

  return totalCost;
}

/**
 * Get risk score for a warehouse-community pair from risk layers.
 * 
 * Risk layers are optional and provided as a map where keys are in the format
 * "warehouseId-communityId" and values are risk scores (typically 0-1 scale).
 * 
 * @param warehouseId Warehouse identifier
 * @param communityId Community identifier
 * @param riskLayers Optional map of risk scores
 * @returns Risk score (0 if not provided or not found)
 * 
 * @example
 * ```typescript
 * const riskLayers = {
 *   'warehouse-1-community-1': 0.3,
 *   'warehouse-1-community-2': 0.7,
 * };
 * const risk = getRiskScore('warehouse-1', 'community-1', riskLayers);
 * // Returns: 0.3
 * ```
 */
export function getRiskScore(
  warehouseId: string,
  communityId: string,
  riskLayers?: Record<string, number>
): number {
  if (!riskLayers) {
    return 0;
  }

  const key = `${warehouseId}-${communityId}`;
  const riskScore = riskLayers[key];

  // Return 0 if risk score is not found or is invalid
  if (riskScore === undefined || riskScore === null) {
    return 0;
  }

  if (!Number.isFinite(riskScore) || riskScore < 0) {
    // Log warning but return 0 to avoid breaking the algorithm
    console.warn(`Invalid risk score for ${key}: ${riskScore}`);
    return 0;
  }

  return riskScore;
}


