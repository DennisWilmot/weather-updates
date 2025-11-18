import { z } from 'zod';

// Enum definitions
export const PEOPLE_TYPES = ['person_in_need', 'aid_worker'] as const;

// TypeScript interface
export interface PersonFormSchema {
  name: string;
  type: 'person_in_need' | 'aid_worker';
  parishId: string; // UUID reference to parishes.id
  communityId?: string; // UUID reference to communities.id (optional)
  latitude?: number;
  longitude?: number;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  organization?: string; // For aid workers
  userId?: string; // FK to user table if registered
}

// Zod validation schema
export const personSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(PEOPLE_TYPES),
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
  contactName: z.string().min(1, 'Contact name is required'),
  contactPhone: z.string()
    .regex(/^(\+?1[-.\s]?)?\(?876\)?[-.\s]?\d{3}[-.\s]?\d{4}$/, 'Invalid phone number format')
    .optional(),
  contactEmail: z.string().email('Invalid email format').optional(),
  organization: z.string().optional(),
  userId: z.string().optional(),
});

// Type inference from Zod schema
export type PersonForm = z.infer<typeof personSchema>;

