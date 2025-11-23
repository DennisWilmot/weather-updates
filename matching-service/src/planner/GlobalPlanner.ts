/**
 * Global Planner Interface
 * 
 * This interface defines the contract for all global allocation planners.
 * It enables a pluggable architecture where different solver implementations
 * can be swapped in without changing the rest of the system.
 * 
 * Current implementations:
 * - GreedyMinCostPlanner: Fast heuristic solver using greedy min-cost approach
 * 
 * Future implementations:
 * - LinearProgrammingPlanner: Optimal solver using LP/MIP (e.g., Gurobi, CPLEX)
 * - HybridPlanner: Combines greedy initialization with LP refinement
 * 
 * The interface is synchronous for now, but could be extended to support
 * async operations for long-running optimizations or external solver APIs.
 * 
 * @example
 * ```typescript
 * const planner = new GreedyMinCostPlanner();
 * const result = planner.plan(problem);
 * console.log(`Fulfilled ${result.summary.fulfillmentRate * 100}% of needs`);
 * ```
 */

import type { GlobalPlanningProblem, GlobalPlanningResult } from '../types/planner.js';

/**
 * Interface for global allocation planners.
 * 
 * All planner implementations must satisfy this contract:
 * - Accept a complete planning problem definition
 * - Return a planning result with shipments and summary statistics
 * - Handle edge cases gracefully (no feasible solution, partial fulfillment)
 */
export interface GlobalPlanner {
  /**
   * Solve the global allocation problem.
   * 
   * Takes a complete problem definition (warehouses, communities, needs, constraints)
   * and returns an allocation plan with shipments and summary statistics.
   * 
   * @param problem Complete planning problem definition
   * @returns Planning result with shipments and summary
   * 
   * @throws {Error} If the problem is invalid or solver encounters an error
   */
  plan(problem: GlobalPlanningProblem): GlobalPlanningResult;
}

