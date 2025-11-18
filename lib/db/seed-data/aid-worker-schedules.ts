// Sample aid worker schedule data for seeding
export interface AidWorkerScheduleSeed {
  workerName: string;
  workerId?: string;
  organization: string;
  capabilities: string[];
  missionType: 'rapid_deployment' | 'planned_mission' | 'standby';
  startTime: Date;
  endTime?: Date;
  durationHours?: number;
  currentLatitude?: number;
  currentLongitude?: number;
  deploymentArea?: string;
  status: 'available' | 'deployed' | 'on_mission' | 'unavailable';
  contactPhone: string;
  contactEmail?: string;
}

export const sampleAidWorkerSchedules: AidWorkerScheduleSeed[] = [
  {
    workerName: 'John Doe',
    workerId: 'user-123',
    organization: 'Jamaica Red Cross',
    capabilities: ['Food', 'Water'],
    missionType: 'rapid_deployment',
    startTime: new Date('2024-01-15T08:00:00Z'),
    durationHours: 4,
    currentLatitude: 18.0,
    currentLongitude: -76.8,
    deploymentArea: 'Kingston',
    status: 'available',
    contactPhone: '876-555-1234',
    contactEmail: 'john@redcross.org',
  },
  {
    workerName: 'Sarah Williams',
    organization: 'ODPEM',
    capabilities: ['Shelter', 'Electricity', 'Hygiene kits'],
    missionType: 'planned_mission',
    startTime: new Date('2024-01-16T09:00:00Z'),
    endTime: new Date('2024-01-16T17:00:00Z'),
    status: 'on_mission',
    contactPhone: '876-555-3456',
  },
];



