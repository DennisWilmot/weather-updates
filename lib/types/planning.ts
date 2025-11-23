/**
 * Type definitions for the global allocation planning system
 * 
 * These types match the matching-service types for consistency
 */

/**
 * Represents a single inventory item at a warehouse
 */
export interface WarehouseItemTotal {
  warehouseId: string;
  itemCode: string;
  quantity: number;
}

/**
 * Represents a warehouse/depot that holds inventory (supply node)
 */
export interface Warehouse {
  id: string;
  parishId: string;
  lat: number;
  lng: number;
  inventory: WarehouseItemTotal[];
}

/**
 * Represents a community/location that has needs (demand node)
 */
export interface Community {
  id: string;
  parishId: string;
  lat: number;
  lng: number;
}

/**
 * Represents a specific need for a community
 */
export interface CommunityNeed {
  communityId: string;
  itemCode: string;
  quantity: number;
  priority: number; // 1 = highest priority
}

/**
 * Constraints and parameters for the global planning algorithm
 */
export interface GlobalPlanningConstraints {
  /** Fraction of stock to keep in reserve (e.g., 0.2 = keep 20% in reserve) */
  reserveFraction: number;
  /** Maximum distance in km to consider for allocation */
  maxDistanceKm: number;
  /** Weight for distance component in cost calculation */
  distanceWeight: number;
  /** Weight for risk component in cost calculation */
  riskWeight: number;
  /** Weight for fairness component in cost calculation */
  fairnessWeight: number;
}

/**
 * Complete problem definition for the global planner
 */
export interface GlobalPlanningProblem {
  /** List of warehouses with their inventory */
  warehouses: Warehouse[];
  /** List of communities (for reference, needs reference communities) */
  communities: Community[];
  /** List of community needs to fulfill */
  communityNeeds: CommunityNeed[];
  /** Planning constraints and weights */
  constraints: GlobalPlanningConstraints;
  /** Optional: Risk scores for warehouse-community pairs */
  riskLayers?: Record<string, number>; // Map of "warehouseId-communityId" -> risk score
  /** Optional: Parish-level statistics for fairness calculations */
  parishStats?: Record<string, any>;
}

/**
 * Represents a single shipment in the allocation plan
 */
export interface Shipment {
  /** Warehouse ID where shipment originates */
  fromWarehouseId: string;
  /** Community ID where shipment is destined */
  toCommunityId: string;
  /** Item code being shipped */
  itemCode: string;
  /** Quantity being shipped */
  quantity: number;
  /** Computed cost for this shipment (distance + risk + fairness) */
  cost: number;
}

/**
 * Summary statistics for the planning result
 */
export interface PlanningSummary {
  /** Total number of shipments in the plan */
  totalShipments: number;
  /** Total quantity of items allocated across all shipments */
  totalItemsAllocated: number;
  /** Total cost of all shipments */
  totalCost: number;
  /** Needs that couldn't be fully satisfied */
  unmetNeeds: CommunityNeed[];
  /** Percentage of needs fulfilled (0-1) */
  fulfillmentRate: number;
}

/**
 * Complete result from the global planner
 */
export interface GlobalPlanningResult {
  /** List of all shipments in the allocation plan */
  shipments: Shipment[];
  /** Summary statistics */
  summary: PlanningSummary;
}

