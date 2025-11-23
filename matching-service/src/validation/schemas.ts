/**
 * Zod validation schemas for request/response types
 * 
 * Provides runtime type safety and validation for HTTP endpoints.
 * These schemas complement TypeScript's compile-time types with
 * runtime validation to ensure data integrity.
 */

import { z } from 'zod';
import type { GlobalPlanningProblem } from '../types/planner.js';

/**
 * Schema for a warehouse inventory item
 */
export const WarehouseItemTotalSchema = z.object({
  warehouseId: z.string().min(1, 'warehouseId must be non-empty'),
  itemCode: z.string().min(1, 'itemCode must be non-empty'),
  quantity: z
    .number()
    .nonnegative('quantity must be non-negative')
    .finite('quantity must be finite'),
});

/**
 * Schema for a warehouse/depot
 */
export const WarehouseSchema = z.object({
  id: z.string().min(1, 'id must be non-empty'),
  parishId: z.string().min(1, 'parishId must be non-empty'),
  lat: z
    .number()
    .min(-90, 'latitude must be between -90 and 90')
    .max(90, 'latitude must be between -90 and 90')
    .finite('latitude must be finite'),
  lng: z
    .number()
    .min(-180, 'longitude must be between -180 and 180')
    .max(180, 'longitude must be between -180 and 180')
    .finite('longitude must be finite'),
  inventory: z
    .array(WarehouseItemTotalSchema)
    .min(1, 'warehouse must have at least one inventory item'),
});

/**
 * Schema for a community/location
 */
export const CommunitySchema = z.object({
  id: z.string().min(1, 'id must be non-empty'),
  parishId: z.string().min(1, 'parishId must be non-empty'),
  lat: z
    .number()
    .min(-90, 'latitude must be between -90 and 90')
    .max(90, 'latitude must be between -90 and 90')
    .finite('latitude must be finite'),
  lng: z
    .number()
    .min(-180, 'longitude must be between -180 and 180')
    .max(180, 'longitude must be between -180 and 180')
    .finite('longitude must be finite'),
});

/**
 * Schema for a community need
 */
export const CommunityNeedSchema = z.object({
  communityId: z.string().min(1, 'communityId must be non-empty'),
  itemCode: z.string().min(1, 'itemCode must be non-empty'),
  quantity: z
    .number()
    .positive('quantity must be positive')
    .finite('quantity must be finite'),
  priority: z
    .number()
    .int('priority must be an integer')
    .positive('priority must be positive')
    .finite('priority must be finite'),
});

/**
 * Schema for planning constraints
 */
export const GlobalPlanningConstraintsSchema = z.object({
  reserveFraction: z
    .number()
    .min(0, 'reserveFraction must be between 0 and 1')
    .max(1, 'reserveFraction must be between 0 and 1')
    .finite('reserveFraction must be finite'),
  maxDistanceKm: z
    .number()
    .positive('maxDistanceKm must be positive')
    .finite('maxDistanceKm must be finite'),
  distanceWeight: z
    .number()
    .nonnegative('distanceWeight must be non-negative')
    .finite('distanceWeight must be finite'),
  riskWeight: z
    .number()
    .nonnegative('riskWeight must be non-negative')
    .finite('riskWeight must be finite'),
  fairnessWeight: z
    .number()
    .nonnegative('fairnessWeight must be non-negative')
    .finite('fairnessWeight must be finite'),
});

/**
 * Schema for the complete planning problem
 */
export const GlobalPlanningProblemSchema = z.object({
  warehouses: z
    .array(WarehouseSchema)
    .min(1, 'must have at least one warehouse'),
  communities: z
    .array(CommunitySchema)
    .min(1, 'must have at least one community'),
  communityNeeds: z
    .array(CommunityNeedSchema)
    .min(1, 'must have at least one community need'),
  constraints: GlobalPlanningConstraintsSchema,
  riskLayers: z
    .record(z.string(), z.number().finite())
    .optional()
    .describe('Optional risk scores for warehouse-community pairs'),
  parishStats: z.record(z.string(), z.any()).optional().describe('Optional parish-level statistics'),
});

/**
 * Validate a planning problem and return typed data
 * 
 * @param data Unknown data to validate
 * @returns Validated and typed planning problem
 * @throws {z.ZodError} If validation fails
 * 
 * @example
 * ```typescript
 * try {
 *   const problem = validatePlanningProblem(requestBody);
 *   // problem is now typed as GlobalPlanningProblem
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     // Handle validation errors
 *   }
 * }
 * ```
 */
export function validatePlanningProblem(
  data: unknown
): GlobalPlanningProblem {
  return GlobalPlanningProblemSchema.parse(data);
}

