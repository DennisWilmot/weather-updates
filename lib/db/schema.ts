import { pgTable, uuid, text, boolean, timestamp, unique, jsonb, integer, decimal } from 'drizzle-orm/pg-core';

// Parish table - Top level (14 parishes of Jamaica)
export const parishes = pgTable('parishes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  code: text('code').notNull().unique(), // e.g., 'KSA' for Kingston & St. Andrew
  coordinates: jsonb('coordinates'), // { lat: number, lng: number, bounds: {...} }
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Communities table - Second level (neighborhoods/towns)
export const communities = pgTable('communities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  parishId: uuid('parish_id').references(() => parishes.id).notNull(),
  coordinates: jsonb('coordinates'), // Center point of community
  bounds: jsonb('bounds'), // Community boundaries
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  uniqueCommunityParish: unique().on(table.name, table.parishId)
}));

// Locations table - Third level (specific landmarks/places)
export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(), // "Pegasus Hotel", "UWI Campus Taylor Hall"
  type: text('type', {
    enum: ['landmark', 'street', 'building', 'institution']
  }).notNull(),
  communityId: uuid('community_id').references(() => communities.id).notNull(),
  streetAddress: text('street_address'), // Optional street name
  coordinates: jsonb('coordinates').notNull(), // { lat: number, lng: number }
  verified: boolean('verified').default(false), // Admin verified locations
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Submissions table - Enhanced with hierarchical location and detailed service tracking
export const submissions = pgTable('submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').references(() => parishes.id).notNull(),
  communityId: uuid('community_id').references(() => communities.id).notNull(),
  locationId: uuid('location_id').references(() => locations.id), // Optional - for specific places

  // Service Status Reports
  hasElectricity: boolean('has_electricity'), // JPS Electricity
  hasWifi: boolean('has_wifi').notNull(), // Internet service (Flow/Digicel combined for now)
  flowService: boolean('flow_service'), // Flow cable/internet (nullable for 3-state)
  digicelService: boolean('digicel_service'), // Digicel mobile (nullable for 3-state)
  waterService: boolean('water_service'), // Water availability (nullable for 3-state)

  // Infrastructure Status
  roadStatus: text('road_status', {
    enum: ['clear', 'flooded', 'blocked', 'mudslide', 'damaged']
  }).notNull(),

  // Hazards
  flooding: boolean('flooding').default(false),
  downedPowerLines: boolean('downed_power_lines').default(false),
  fallenTrees: boolean('fallen_trees').default(false),
  structuralDamage: boolean('structural_damage').default(false),

  // Emergency Status
  needsHelp: boolean('needs_help').notNull(),
  helpType: text('help_type', {
    enum: ['medical', 'physical', 'police', 'firefighter', 'other']
  }),

  // Contact Information (for emergency help requests)
  requesterName: text('requester_name'),
  requesterPhone: text('requester_phone'),
  helpDescription: text('help_description'),

  // Additional Info
  additionalInfo: text('additional_info'),
  imageUrl: text('image_url'),

  // Location Details (for custom locations not in locations table)
  streetName: text('street_name'),
  placeName: text('place_name'),

  // Legacy fields for backward compatibility
  parish: text('parish'), // Will be deprecated after migration
  community: text('community'), // Will be deprecated after migration

  // Metadata
  confidence: integer('confidence').default(1), // 1-5 scale for report reliability
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Aggregated location status for performance
export const locationStatus = pgTable('location_status', {
  id: uuid('id').primaryKey().defaultRandom(),
  locationId: uuid('location_id').references(() => locations.id),
  communityId: uuid('community_id').references(() => communities.id),
  parishId: uuid('parish_id').references(() => parishes.id).notNull(),

  // Aggregated service status
  jpsElectricityStatus: text('jps_electricity_status', {
    enum: ['working', 'outage', 'partial', 'unknown']
  }),
  flowServiceStatus: text('flow_service_status', {
    enum: ['working', 'outage', 'partial', 'unknown']
  }),
  digicelServiceStatus: text('digicel_service_status', {
    enum: ['working', 'outage', 'partial', 'unknown']
  }),
  roadStatus: text('road_status', {
    enum: ['clear', 'flooded', 'blocked', 'mudslide', 'damaged']
  }),

  // Hazard flags
  hasFlooding: boolean('has_flooding').default(false),
  hasDownedPowerLines: boolean('has_downed_power_lines').default(false),
  hasFallenTrees: boolean('has_fallen_trees').default(false),
  hasStructuralDamage: boolean('has_structural_damage').default(false),

  // Statistics
  totalReports: integer('total_reports').default(0),
  recentReports: integer('recent_reports').default(0), // Last hour
  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }), // 0.00-1.00

  // Timestamps
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
