// Sample people needs data for seeding
export interface PeopleNeedsSeed {
  parishCode: string; // Will be resolved to parishId
  communityName: string; // Will be resolved to communityId
  latitude?: number;
  longitude?: number;
  needs: string[];
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  numberOfPeople?: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  status?: 'pending' | 'in_progress' | 'fulfilled' | 'cancelled';
}

export const samplePeopleNeeds: PeopleNeedsSeed[] = [
  {
    parishCode: 'KGN',
    communityName: 'Downtown Kingston',
    latitude: 18.0,
    longitude: -76.8,
    needs: ['Food', 'Water'],
    contactName: 'Jane Smith',
    contactPhone: '876-555-5678',
    contactEmail: 'jane@email.com',
    numberOfPeople: 4,
    urgency: 'high',
    description: 'Family of 4 needs immediate assistance',
    status: 'pending',
  },
  {
    parishCode: 'CAT',
    communityName: 'Spanish Town',
    needs: ['Shelter', 'Electricity'],
    contactName: 'Robert Johnson',
    contactPhone: '876-555-9012',
    numberOfPeople: 2,
    urgency: 'critical',
    status: 'pending',
  },
];

