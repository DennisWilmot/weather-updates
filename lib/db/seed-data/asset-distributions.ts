// Sample asset distribution data for seeding
export interface AssetDistributionSeed {
  organizationName: string;
  distributionDate: Date;
  organizationEntity: string;
  parishCode: string; // Will be resolved to parishId
  communityName: string; // Will be resolved to communityId
  latitude?: number;
  longitude?: number;
  itemsDistributed: string[];
  recipientFirstName: string;
  recipientMiddleNames?: string;
  recipientLastName: string;
  recipientAlias?: string;
  recipientDateOfBirth: Date;
  recipientSex: 'Male' | 'Female';
  recipientTRN?: string;
  recipientPhone?: string;
}

export const sampleAssetDistributions: AssetDistributionSeed[] = [
  {
    organizationName: 'Jamaica Red Cross',
    distributionDate: new Date('2024-01-15'),
    organizationEntity: 'Ministry of Health',
    parishCode: 'KGN',
    communityName: 'Downtown Kingston',
    latitude: 18.0,
    longitude: -76.8,
    itemsDistributed: ['Food Kit', 'Hygiene Kit', 'Water'],
    recipientFirstName: 'John',
    recipientMiddleNames: 'Michael',
    recipientLastName: 'Doe',
    recipientDateOfBirth: new Date('1990-05-15'),
    recipientSex: 'Male',
    recipientTRN: '123-456-789',
    recipientPhone: '876-555-1234',
  },
  {
    organizationName: 'ODPEM',
    distributionDate: new Date('2024-01-16'),
    organizationEntity: 'Office of Disaster Preparedness',
    parishCode: 'CAT',
    communityName: 'Spanish Town',
    latitude: 17.9961,
    longitude: -76.9547,
    itemsDistributed: ['Starlink', 'Powerbanks', 'Generators'],
    recipientFirstName: 'Jane',
    recipientLastName: 'Smith',
    recipientDateOfBirth: new Date('1985-03-20'),
    recipientSex: 'Female',
    recipientPhone: '876-555-5678',
  },
];

