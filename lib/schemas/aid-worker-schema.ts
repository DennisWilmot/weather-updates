import { z } from 'zod';

// Enum definitions
export const CAPABILITIES = [
  'Food',
  'Water',
  'Shelter',
  'Electricity',
  'Hygiene kits',
  'Internet',
  'Cell phone connectivity'
] as const;

export const MISSION_TYPES = ['rapid_deployment', 'planned_mission', 'standby'] as const;

export const WORKER_STATUS = ['available', 'deployed', 'on_mission', 'unavailable'] as const;

// TypeScript interface
export interface AidWorkerScheduleFormSchema {
  // Worker Information
  workerName: string;
  workerId?: string; // Optional user ID
  organization: string;
  capabilities: string[]; // Array of capabilities from CAPABILITIES
  
  // Schedule
  missionType: 'rapid_deployment' | 'planned_mission' | 'standby';
  startTime: Date;
  endTime?: Date;
  durationHours?: number;
  
  // Location
  currentLatitude?: number;
  currentLongitude?: number;
  deploymentArea?: string;
  
  // Status
  status: 'available' | 'deployed' | 'on_mission' | 'unavailable';
  
  // Contact
  contactPhone: string;
  contactEmail?: string;
  
  // Metadata
  createdBy: string; // User ID
}

// Zod validation schema
export const aidWorkerScheduleSchema = z.object({
  // Worker Information
  workerName: z.string().min(1, 'Worker name is required'),
  workerId: z.string().optional(),
  organization: z.string().min(1, 'Organization is required'),
  capabilities: z.array(z.enum(CAPABILITIES as unknown as [string, ...string[]]))
    .min(1, 'At least one capability must be selected'),
  
  // Schedule
  missionType: z.enum(MISSION_TYPES),
  startTime: z.date(),
  endTime: z.date().optional(),
  durationHours: z.number().int().positive().optional(),
  
  // Validation: endTime must be after startTime if provided
}).refine(
  (data) => {
    if (data.endTime && data.startTime) {
      return data.endTime > data.startTime;
    }
    return true;
  },
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
).merge(z.object({
  // Location
  currentLatitude: z.number()
    .min(17.7, 'Latitude must be within Jamaica bounds')
    .max(18.5, 'Latitude must be within Jamaica bounds')
    .optional(),
  currentLongitude: z.number()
    .min(-78.5, 'Longitude must be within Jamaica bounds')
    .max(-76.2, 'Longitude must be within Jamaica bounds')
    .optional(),
  deploymentArea: z.string().optional(),
  
  // Status
  status: z.enum(WORKER_STATUS),
  
  // Contact
  contactPhone: z.string()
    .regex(/^(\+?1[-.\s]?)?\(?876\)?[-.\s]?\d{3}[-.\s]?\d{4}$/, 'Invalid phone number format')
    .min(1, 'Contact phone is required'),
  contactEmail: z.string().email('Invalid email format').optional(),
  
  // Metadata
  createdBy: z.string().min(1, 'Created by is required'),
}));

// Type inference from Zod schema
export type AidWorkerScheduleForm = z.infer<typeof aidWorkerScheduleSchema>;

