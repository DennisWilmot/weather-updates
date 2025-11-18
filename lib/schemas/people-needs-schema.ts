import { z } from 'zod';

// Enum definitions
export const NEEDS_OPTIONS = [
  'Food',
  'Water',
  'Shelter',
  'Electricity',
  'Hygiene kits',
  'Internet',
  'Cell phone connectivity'
] as const;

export const URGENCY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

export const NEEDS_STATUS = ['pending', 'in_progress', 'fulfilled', 'cancelled'] as const;

// TypeScript interface
export interface PeopleNeedsFormSchema {
  // Person Reference (preferred)
  personId?: string; // UUID reference to people.id WHERE type='person_in_need'
  
  // Location (required for filtering and backward compatibility)
  parishId: string; // UUID reference to parishes.id
  communityId: string; // UUID reference to communities.id
  latitude?: number;
  longitude?: number;
  
  // Needs (multi-select)
  needs: string[]; // Array of needs from NEEDS_OPTIONS
  
  // Contact Information (legacy - will reference person after migration)
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  
  // Additional Details
  numberOfPeople?: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  
  // Status
  status?: 'pending' | 'in_progress' | 'fulfilled' | 'cancelled';
  
  // Metadata
  reportedBy: string; // User ID
}

// Zod validation schema
export const peopleNeedsSchema = z.object({
  // Person Reference (preferred)
  personId: z.string().uuid('Invalid person ID').optional(),
  
  // Location (required for filtering and backward compatibility)
  parishId: z.string().uuid('Invalid parish ID'),
  communityId: z.string().uuid('Invalid community ID'),
  latitude: z.number()
    .min(17.7, 'Latitude must be within Jamaica bounds')
    .max(18.5, 'Latitude must be within Jamaica bounds')
    .optional(),
  longitude: z.number()
    .min(-78.5, 'Longitude must be within Jamaica bounds')
    .max(-76.2, 'Longitude must be within Jamaica bounds')
    .optional(),
  
  // Needs
  needs: z.array(z.enum(NEEDS_OPTIONS as unknown as [string, ...string[]]))
    .min(1, 'At least one need must be selected'),
  
  // Contact Information
  contactName: z.string().min(1, 'Contact name is required'),
  contactPhone: z.string()
    .regex(/^(\+?1[-.\s]?)?\(?876\)?[-.\s]?\d{3}[-.\s]?\d{4}$/, 'Invalid phone number format')
    .optional(),
  contactEmail: z.string().email('Invalid email format').optional(),
  
  // Additional Details
  numberOfPeople: z.number().int().positive().optional(),
  urgency: z.enum(URGENCY_LEVELS),
  description: z.string().optional(),
  
  // Status
  status: z.enum(NEEDS_STATUS).default('pending'),
  
  // Metadata
  reportedBy: z.string().min(1, 'Reported by is required'),
});

// Type inference from Zod schema
export type PeopleNeedsForm = z.infer<typeof peopleNeedsSchema>;

