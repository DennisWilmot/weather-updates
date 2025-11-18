import { z } from 'zod';

// Enum definitions
export const ASSET_TYPES = ['starlink', 'iphone', 'powerbank', 'food', 'water', 'box_shelter', 'generator', 'hygiene_kit'] as const;
export const ASSET_STATUS = ['available', 'deployed', 'maintenance', 'retired'] as const;

// TypeScript interface
export interface AssetFormSchema {
  name: string; // e.g., "Starlink Unit #123"
  type: 'starlink' | 'iphone' | 'powerbank' | 'food' | 'water' | 'box_shelter' | 'generator' | 'hygiene_kit';
  serialNumber?: string;
  status: 'available' | 'deployed' | 'maintenance' | 'retired';
  isOneTime: boolean; // Starlink=true, Food/Water=false
  currentLocation?: string; // Where it currently is
  parishId?: string; // UUID reference to parishes.id
  communityId?: string; // UUID reference to communities.id
  latitude?: number;
  longitude?: number;
  organization?: string; // Which org owns it
}

// Zod validation schema
export const assetSchema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  type: z.enum(ASSET_TYPES),
  serialNumber: z.string().optional(),
  status: z.enum(ASSET_STATUS).default('available'),
  isOneTime: z.boolean(),
  currentLocation: z.string().optional(),
  parishId: z.string().uuid('Invalid parish ID').optional(),
  communityId: z.string().uuid('Invalid community ID').optional(),
  latitude: z.number()
    .min(17.7, 'Latitude must be within Jamaica bounds')
    .max(18.5, 'Latitude must be within Jamaica bounds')
    .optional(),
  longitude: z.number()
    .min(-78.5, 'Longitude must be within Jamaica bounds')
    .max(-76.2, 'Longitude must be within Jamaica bounds')
    .optional(),
  organization: z.string().optional(),
});

// Type inference from Zod schema
export type AssetForm = z.infer<typeof assetSchema>;

