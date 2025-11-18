import { z } from 'zod';

// Enum definitions
export const OPERATIONAL_STATUS = ['operational', 'outage', 'partial', 'unknown'] as const;

// TypeScript interface
export interface PlaceStatusFormSchema {
  // Place Reference
  placeId?: string; // UUID reference to places.id (preferred)
  
  // Location (for filtering and backward compatibility)
  parishId: string; // UUID reference to parishes.id
  communityId: string; // UUID reference to communities.id
  town?: string;
  
  // Operational Status
  electricityStatus: 'operational' | 'outage' | 'partial' | 'unknown';
  waterStatus: 'operational' | 'outage' | 'partial' | 'unknown';
  wifiStatus: 'operational' | 'outage' | 'partial' | 'unknown';
  
  // Capacity Status (can override place.max_capacity)
  currentCapacity?: number;
  maxCapacity?: number;
  atCapacity: boolean;
  
  // Legacy: Keep for backward compatibility during migration
  shelterName?: string;
  shelterCapacity?: number;
  shelterMaxCapacity?: number;
  shelterAtCapacity?: boolean;
  
  // Additional Info
  notes?: string;
  
  // Metadata
  reportedBy: string; // User ID
  verified?: boolean;
}

// Zod validation schema
export const placeStatusSchema = z.object({
  // Place Reference (preferred)
  placeId: z.string().uuid('Invalid place ID').optional(),
  
  // Location (required for filtering and backward compatibility)
  parishId: z.string().uuid('Invalid parish ID'),
  communityId: z.string().uuid('Invalid community ID'),
  town: z.string().optional(),
  
  // Operational Status
  electricityStatus: z.enum(OPERATIONAL_STATUS),
  waterStatus: z.enum(OPERATIONAL_STATUS),
  wifiStatus: z.enum(OPERATIONAL_STATUS),
  
  // Capacity Status (can override place.max_capacity)
  currentCapacity: z.number().int().positive().optional(),
  maxCapacity: z.number().int().positive().optional(),
  atCapacity: z.boolean(),
  
  // Legacy: Keep for backward compatibility during migration
  shelterName: z.string().optional(),
  shelterCapacity: z.number().int().positive().optional(),
  shelterMaxCapacity: z.number().int().positive().optional(),
  shelterAtCapacity: z.boolean().optional(),
  
  // Validation: currentCapacity <= maxCapacity
}).refine(
  (data) => {
    if (data.currentCapacity !== undefined && data.maxCapacity !== undefined) {
      return data.currentCapacity <= data.maxCapacity;
    }
    return true;
  },
  {
    message: 'Current capacity cannot exceed maximum capacity',
    path: ['currentCapacity'],
  }
).refine(
  (data) => {
    // Either placeId or (shelterName for legacy) must be provided
    return data.placeId !== undefined || data.shelterName !== undefined;
  },
  {
    message: 'Either place ID or shelter name must be provided',
    path: ['placeId'],
  }
).merge(z.object({
  // Additional Info
  notes: z.string().optional(),
  
  // Metadata
  reportedBy: z.string().min(1, 'Reported by is required'),
  verified: z.boolean().optional(),
}));

// Type inference from Zod schema
export type PlaceStatusForm = z.infer<typeof placeStatusSchema>;

