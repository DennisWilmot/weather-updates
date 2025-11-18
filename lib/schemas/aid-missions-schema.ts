import { z } from 'zod';

// Enum definitions
export const MISSION_TYPES = ['rapid_deployment', 'planned_mission', 'standby'] as const;
export const MISSION_STATUS = ['planned', 'active', 'completed', 'cancelled'] as const;

// TypeScript interface
export interface AidMissionFormSchema {
  name: string;
  type: 'rapid_deployment' | 'planned_mission' | 'standby';
  parishId?: string; // UUID reference to parishes.id
  communityId?: string; // UUID reference to communities.id
  startTime: Date;
  endTime?: Date;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  description?: string;
  createdBy: string; // User ID
}

// Zod validation schema
export const aidMissionSchema = z.object({
  name: z.string().min(1, 'Mission name is required'),
  type: z.enum(MISSION_TYPES),
  parishId: z.string().uuid('Invalid parish ID').optional(),
  communityId: z.string().uuid('Invalid community ID').optional(),
  startTime: z.date(),
  endTime: z.date().optional(),
  status: z.enum(MISSION_STATUS).default('planned'),
  description: z.string().optional(),
  createdBy: z.string().min(1, 'Created by is required'),
}).refine(
  (data) => {
    // If endTime is provided, it must be after startTime
    if (data.endTime !== undefined) {
      return data.endTime > data.startTime;
    }
    return true;
  },
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

// Type inference from Zod schema
export type AidMissionForm = z.infer<typeof aidMissionSchema>;

