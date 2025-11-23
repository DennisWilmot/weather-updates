/**
 * Geographically distributed places for testing allocation planning
 * Places (shelters, hospitals, community centers) spread across parishes
 */

export interface GeographicPlaceSeed {
  name: string;
  type: 'shelter' | 'hospital' | 'community_center' | 'school';
  parishCode: string;
  communityName: string;
  latitude: number;
  longitude: number;
  address?: string;
  maxCapacity?: number; // For shelters
  description?: string;
}

export const geographicPlaces: GeographicPlaceSeed[] = [
  // St. James - Western Jamaica
  {
    name: 'Montego Bay Community Shelter',
    type: 'shelter',
    parishCode: 'JAM',
    communityName: 'Montego Bay',
    latitude: 18.4770,
    longitude: -77.9190,
    address: 'Montego Bay Civic Center',
    maxCapacity: 300,
    description: 'Primary emergency shelter for Montego Bay area',
  },
  {
    name: 'Cornwall Regional Hospital',
    type: 'hospital',
    parishCode: 'JAM',
    communityName: 'Montego Bay',
    latitude: 18.4750,
    longitude: -77.9150,
    address: 'Mount Salem, Montego Bay',
    description: 'Major regional hospital',
  },
  {
    name: 'Ironshore Community Center',
    type: 'community_center',
    parishCode: 'JAM',
    communityName: 'Ironshore',
    latitude: 18.4680,
    longitude: -77.8350,
    description: 'Community gathering and distribution point',
  },

  // Hanover - Western Jamaica
  {
    name: 'Lucea Emergency Shelter',
    type: 'shelter',
    parishCode: 'HAN',
    communityName: 'Lucea',
    latitude: 18.4520,
    longitude: -78.1740,
    address: 'Lucea Town Hall',
    maxCapacity: 150,
    description: 'Emergency shelter for Hanover parish',
  },
  {
    name: 'Green Island Community Center',
    type: 'community_center',
    parishCode: 'HAN',
    communityName: 'Green Island',
    latitude: 18.3680,
    longitude: -78.2020,
    description: 'Distribution and coordination center',
  },

  // Westmoreland - Western Jamaica
  {
    name: 'Savanna-la-Mar Emergency Shelter',
    type: 'shelter',
    parishCode: 'WML',
    communityName: 'Savanna-la-Mar',
    latitude: 18.2200,
    longitude: -78.1330,
    address: 'Savanna-la-Mar High School',
    maxCapacity: 250,
    description: 'Primary shelter for Westmoreland',
  },
  {
    name: 'Negril Community Center',
    type: 'community_center',
    parishCode: 'WML',
    communityName: 'Negril',
    latitude: 18.2700,
    longitude: -78.3430,
    description: 'Tourism area emergency coordination',
  },
  {
    name: 'Little London Health Center',
    type: 'hospital',
    parishCode: 'WML',
    communityName: 'Little London',
    latitude: 18.3020,
    longitude: -78.1520,
    description: 'Rural health facility',
  },

  // St. Elizabeth - Western Jamaica
  {
    name: 'Black River Emergency Shelter',
    type: 'shelter',
    parishCode: 'ELI',
    communityName: 'Black River',
    latitude: 18.0260,
    longitude: -77.8470,
    address: 'Black River High School',
    maxCapacity: 200,
    description: 'Emergency shelter for St. Elizabeth',
  },
  {
    name: 'Santa Cruz Community Center',
    type: 'community_center',
    parishCode: 'ELI',
    communityName: 'Santa Cruz',
    latitude: 18.0850,
    longitude: -77.7680,
    description: 'Distribution center for central St. Elizabeth',
  },
  {
    name: 'Treasure Beach Community Shelter',
    type: 'shelter',
    parishCode: 'ELI',
    communityName: 'Treasure Beach',
    latitude: 17.9020,
    longitude: -77.7520,
    maxCapacity: 100,
    description: 'Small coastal community shelter',
  },

  // Trelawny - Western Jamaica
  {
    name: 'Falmouth Emergency Shelter',
    type: 'shelter',
    parishCode: 'TRL',
    communityName: 'Falmouth',
    latitude: 18.4930,
    longitude: -77.6570,
    address: 'Falmouth Town Hall',
    maxCapacity: 180,
    description: 'Emergency shelter for Trelawny',
  },
  {
    name: "Duncans Community Center",
    type: 'community_center',
    parishCode: 'TRL',
    communityName: 'Duncans',
    latitude: 18.4850,
    longitude: -77.7340,
    description: 'Community coordination point',
  },

  // St. Ann - Central/North Jamaica
  {
    name: "St. Ann's Bay Hospital",
    type: 'hospital',
    parishCode: 'ANN',
    communityName: "St. Ann's Bay",
    latitude: 18.4360,
    longitude: -77.2010,
    description: 'Regional hospital serving St. Ann',
  },
  {
    name: 'Runaway Bay Emergency Shelter',
    type: 'shelter',
    parishCode: 'ANN',
    communityName: 'Runaway Bay',
    latitude: 18.4680,
    longitude: -77.3340,
    maxCapacity: 220,
    description: 'Tourism area emergency shelter',
  },
  {
    name: "Browns Town Community Center",
    type: 'community_center',
    parishCode: 'ANN',
    communityName: 'Browns Town',
    latitude: 18.4020,
    longitude: -77.3520,
    description: 'Central St. Ann distribution point',
  },

  // Clarendon - Central Jamaica
  {
    name: 'May Pen Emergency Shelter',
    type: 'shelter',
    parishCode: 'CLA',
    communityName: 'May Pen',
    latitude: 17.9660,
    longitude: -77.2440,
    address: 'May Pen Civic Center',
    maxCapacity: 280,
    description: 'Primary shelter for Clarendon',
  },
  {
    name: 'Chapelton Community Center',
    type: 'community_center',
    parishCode: 'CLA',
    communityName: 'Chapelton',
    latitude: 18.1180,
    longitude: -77.2180,
    description: 'Northern Clarendon coordination',
  },
  {
    name: 'May Pen Hospital',
    type: 'hospital',
    parishCode: 'CLA',
    communityName: 'May Pen',
    latitude: 17.9640,
    longitude: -77.2420,
    description: 'Major hospital for Clarendon',
  },

  // Manchester - Central Jamaica
  {
    name: 'Mandeville Emergency Shelter',
    type: 'shelter',
    parishCode: 'MAN',
    communityName: 'Mandeville',
    latitude: 18.0340,
    longitude: -77.5020,
    address: 'Mandeville Town Hall',
    maxCapacity: 200,
    description: 'Emergency shelter for Manchester',
  },
  {
    name: 'Christiana Community Center',
    type: 'community_center',
    parishCode: 'MAN',
    communityName: 'Christiana',
    latitude: 18.1680,
    longitude: -77.5180,
    description: 'Northern Manchester distribution',
  },

  // St. Catherine - Near Kingston
  {
    name: 'Spanish Town Emergency Shelter',
    type: 'shelter',
    parishCode: 'CAT',
    communityName: 'Spanish Town',
    latitude: 17.9920,
    longitude: -76.9580,
    address: 'Spanish Town Civic Center',
    maxCapacity: 350,
    description: 'Large capacity shelter for St. Catherine',
  },
  {
    name: 'Portmore Community Center',
    type: 'community_center',
    parishCode: 'CAT',
    communityName: 'Portmore',
    latitude: 17.9520,
    longitude: -76.8850,
    description: 'Portmore area coordination',
  },
  {
    name: 'Linstead Health Center',
    type: 'hospital',
    parishCode: 'CAT',
    communityName: 'Linstead',
    latitude: 18.1350,
    longitude: -77.0350,
    description: 'Rural health facility',
  },
];

