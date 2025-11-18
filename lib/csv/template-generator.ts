import Papa from 'papaparse';

/**
 * Generate CSV template for asset distributions
 */
export function generateDistributionTemplate(): string {
  const headers = [
    'organization_name',
    'distribution_date',
    'organization_entity',
    'parish_id',
    'community_id',
    'latitude',
    'longitude',
    'items_distributed',
    'recipient_first_name',
    'recipient_middle_names',
    'recipient_last_name',
    'recipient_alias',
    'recipient_date_of_birth',
    'recipient_sex',
    'recipient_trn',
    'recipient_phone',
    'recipient_signature',
  ];

  const exampleRow = [
    'Red Cross',
    '2024-01-15',
    'Ministry of Health',
    'parish-uuid-here',
    'community-uuid-here',
    '18.0',
    '-76.8',
    'Food Kit,Hygiene Kit',
    'John',
    'Michael',
    'Doe',
    '',
    '1990-05-15',
    'Male',
    '123-456-789',
    '876-555-1234',
    '',
  ];

  return Papa.unparse([headers, exampleRow], {
    header: false,
  });
}

/**
 * Generate CSV template for place status
 */
export function generatePlaceStatusTemplate(): string {
  const headers = [
    'parish_id',
    'community_id',
    'town',
    'electricity_status',
    'water_status',
    'wifi_status',
    'shelter_name',
    'shelter_capacity',
    'shelter_max_capacity',
    'shelter_at_capacity',
    'notes',
  ];

  const exampleRow = [
    'parish-uuid-here',
    'community-uuid-here',
    'Kingston',
    'operational',
    'outage',
    'partial',
    'Community Center',
    '150',
    '200',
    'false',
    'Water expected back tomorrow',
  ];

  return Papa.unparse([headers, exampleRow], {
    header: false,
  });
}

/**
 * Generate CSV template for people needs
 */
export function generatePeopleNeedsTemplate(): string {
  const headers = [
    'parish_id',
    'community_id',
    'latitude',
    'longitude',
    'needs',
    'contact_name',
    'contact_phone',
    'contact_email',
    'number_of_people',
    'urgency',
    'description',
    'status',
  ];

  const exampleRow = [
    'parish-uuid-here',
    'community-uuid-here',
    '18.0',
    '-76.8',
    'Food,Water',
    'Jane Smith',
    '876-555-5678',
    'jane@email.com',
    '4',
    'high',
    'Family of 4 needs immediate assistance',
    'pending',
  ];

  return Papa.unparse([headers, exampleRow], {
    header: false,
  });
}

/**
 * Generate CSV template for aid worker schedules
 */
export function generateAidWorkerTemplate(): string {
  const headers = [
    'worker_name',
    'worker_id',
    'organization',
    'capabilities',
    'mission_type',
    'start_time',
    'end_time',
    'duration_hours',
    'current_latitude',
    'current_longitude',
    'deployment_area',
    'status',
    'contact_phone',
    'contact_email',
  ];

  const exampleRow = [
    'John Doe',
    'user-123',
    'Red Cross',
    'Food,Water',
    'rapid_deployment',
    '2024-01-15T08:00:00Z',
    '',
    '4',
    '18.0',
    '-76.8',
    'Kingston',
    'available',
    '876-555-1234',
    'john@redcross.org',
  ];

  return Papa.unparse([headers, exampleRow], {
    header: false,
  });
}



