import { z } from 'zod';

// Enum definitions
export const PLACE_TYPES = ['shelter', 'jdf_base', 'hospital', 'school', 'community_center', 'other'] as const;

// TypeScript interface
export interface PlaceFormSchema {
  name: string;
  type: 'shelter' | 'jdf_base' | 'hospital' | 'school' | 'community_center' | 'other';
  parishId: string; // UUID reference to parishes.id
  communityId?: string; // UUID reference to communities.id (optional)
  latitude?: number;
  longitude?: number;
  address?: string;
  maxCapacity?: number; // For shelters
  description?: string;
  verified?: boolean;
}

// Zod validation schema
export const placeSchema = z.object({
  name: z.string().min(1, 'Place name is required'),
  type: z.enum(PLACE_TYPES),
  parishId: z.string().uuid('Invalid parish ID'),
  communityId: z.string().uuid('Invalid community ID').optional(),
  latitude: z.number()
    .min(17.7, 'Latitude must be within Jamaica bounds')
    .max(18.5, 'Latitude must be within Jamaica bounds')
    .optional(),
  longitude: z.number()
    .min(-78.5, 'Longitude must be within Jamaica bounds')
    .max(-76.2, 'Longitude must be within Jamaica bounds')
    .optional(),
  address: z.string().optional(),
  maxCapacity: z.number().int().positive().optional(),
  description: z.string().optional(),
  verified: z.boolean().optional().default(false),
});

// Type inference from Zod schema
export type PlaceForm = z.infer<typeof placeSchema>;

