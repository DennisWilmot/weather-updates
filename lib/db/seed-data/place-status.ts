// Sample place status data for seeding
export interface PlaceStatusSeed {
  parishCode: string; // Will be resolved to parishId
  communityName: string; // Will be resolved to communityId
  town?: string;
  electricityStatus: 'operational' | 'outage' | 'partial' | 'unknown';
  waterStatus: 'operational' | 'outage' | 'partial' | 'unknown';
  wifiStatus: 'operational' | 'outage' | 'partial' | 'unknown';
  shelterName?: string;
  shelterCapacity?: number;
  shelterMaxCapacity?: number;
  shelterAtCapacity: boolean;
  notes?: string;
}

export const samplePlaceStatus: PlaceStatusSeed[] = [
  {
    parishCode: 'KGN',
    communityName: 'Downtown Kingston',
    town: 'Kingston',
    electricityStatus: 'operational',
    waterStatus: 'outage',
    wifiStatus: 'partial',
    shelterName: 'Community Center',
    shelterCapacity: 150,
    shelterMaxCapacity: 200,
    shelterAtCapacity: false,
    notes: 'Water expected back tomorrow',
  },
  {
    parishCode: 'CAT',
    communityName: 'Spanish Town',
    town: 'Spanish Town',
    electricityStatus: 'partial',
    waterStatus: 'operational',
    wifiStatus: 'outage',
    shelterAtCapacity: false,
  },
];

