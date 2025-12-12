import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  unique,
  jsonb,
  integer,
  decimal,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

// Parish table - Top level (14 parishes of Jamaica)
export const parishes = pgTable("parishes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(), // e.g., 'KSA' for Kingston & St. Andrew
  coordinates: jsonb("coordinates"), // { lat: number, lng: number, bounds: {...} }
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Communities table - Second level (neighborhoods/towns)
export const communities = pgTable(
  "communities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    parishId: uuid("parish_id")
      .references(() => parishes.id)
      .notNull(),
    coordinates: jsonb("coordinates"), // Center point of community
    bounds: jsonb("bounds"), // Community boundaries
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueCommunityParish: unique().on(table.name, table.parishId),
  })
);

// Locations table - Third level (specific landmarks/places)
export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // "Pegasus Hotel", "UWI Campus Taylor Hall"
  type: text("type", {
    enum: ["landmark", "street", "building", "institution"],
  }).notNull(),
  communityId: uuid("community_id")
    .references(() => communities.id)
    .notNull(),
  streetAddress: text("street_address"), // Optional street name
  coordinates: jsonb("coordinates").notNull(), // { lat: number, lng: number }
  verified: boolean("verified").default(false), // Admin verified locations
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Submissions table - Enhanced with hierarchical location and detailed service tracking
export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  parishId: uuid("parish_id")
    .references(() => parishes.id)
    .notNull(),
  communityId: uuid("community_id")
    .references(() => communities.id)
    .notNull(),
  locationId: uuid("location_id").references(() => locations.id), // Optional - for specific places

  // Service Status Reports
  hasElectricity: boolean("has_electricity"), // JPS Electricity
  hasWifi: boolean("has_wifi").notNull(), // Internet service (Flow/Digicel combined for now)
  flowService: boolean("flow_service"), // Flow cable/internet (nullable for 3-state)
  digicelService: boolean("digicel_service"), // Digicel mobile (nullable for 3-state)
  waterService: boolean("water_service"), // Water availability (nullable for 3-state)

  // Infrastructure Status
  roadStatus: text("road_status", {
    enum: ["clear", "flooded", "blocked", "mudslide", "damaged"],
  }).notNull(),

  // Hazards
  flooding: boolean("flooding").default(false),
  downedPowerLines: boolean("downed_power_lines").default(false),
  fallenTrees: boolean("fallen_trees").default(false),
  structuralDamage: boolean("structural_damage").default(false),

  // Emergency Status
  needsHelp: boolean("needs_help").notNull(),
  helpType: text("help_type", {
    enum: ["medical", "physical", "police", "firefighter", "other"],
  }),

  // Contact Information (for emergency help requests)
  requesterName: text("requester_name"),
  requesterPhone: text("requester_phone"),
  helpDescription: text("help_description"),

  // Additional Info
  additionalInfo: text("additional_info"),
  imageUrl: text("image_url"),

  // Location Details (for custom locations not in locations table)
  streetName: text("street_name"),
  placeName: text("place_name"),

  // Legacy fields for backward compatibility
  parish: text("parish"), // Will be deprecated after migration
  community: text("community"), // Will be deprecated after migration

  // Metadata
  submissionType: text("submission_type", {
    enum: ["citizen", "responder"],
  }).default("citizen"), // Distinguishes citizen reports from responder updates
  confidence: integer("confidence").default(1), // 1-5 scale for report reliability
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Aggregated location status for performance
export const locationStatus = pgTable("location_status", {
  id: uuid("id").primaryKey().defaultRandom(),
  locationId: uuid("location_id").references(() => locations.id),
  communityId: uuid("community_id").references(() => communities.id),
  parishId: uuid("parish_id")
    .references(() => parishes.id)
    .notNull(),

  // Aggregated service status
  jpsElectricityStatus: text("jps_electricity_status", {
    enum: ["working", "outage", "partial", "unknown"],
  }),
  flowServiceStatus: text("flow_service_status", {
    enum: ["working", "outage", "partial", "unknown"],
  }),
  digicelServiceStatus: text("digicel_service_status", {
    enum: ["working", "outage", "partial", "unknown"],
  }),
  roadStatus: text("road_status", {
    enum: ["clear", "flooded", "blocked", "mudslide", "damaged"],
  }),

  // Hazard flags
  hasFlooding: boolean("has_flooding").default(false),
  hasDownedPowerLines: boolean("has_downed_power_lines").default(false),
  hasFallenTrees: boolean("has_fallen_trees").default(false),
  hasStructuralDamage: boolean("has_structural_damage").default(false),

  // Statistics
  totalReports: integer("total_reports").default(0),
  recentReports: integer("recent_reports").default(0), // Last hour
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }), // 0.00-1.00

  // Timestamps
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Online Retailers table - Stores online stores for purchasing goods
export const onlineRetailers = pgTable("online_retailers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  websiteUrl: text("website_url").notNull(),
  phoneNumber: text("phone_number"),
  description: text("description"),
  logoUrl: text("logo_url"), // URL to retailer logo/thumbnail in Supabase storage

  // Status tracking
  verified: boolean("verified").default(false), // Admin verified retailers
  status: text("status", {
    enum: ["active", "pending", "inactive"],
  })
    .notNull()
    .default("active"),

  // User submission support (for future functionality)
  submittedByUserId: text("submitted_by_user_id").references(() => user.id), // Nullable - null means admin/system added (references better-auth user)

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Locations table - Stores user location updates for real-time tracking
export const userLocations = pgTable("user_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  accuracy: integer("accuracy"), // Accuracy in meters
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Places table - Master list of places (shelters, JDF bases, hospitals, etc.)
export const places = pgTable(
  "places",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    type: text("type", {
      enum: [
        "shelter",
        "jdf_base",
        "hospital",
        "school",
        "community_center",
        "other",
      ],
    }).notNull(),
    parishId: uuid("parish_id")
      .references(() => parishes.id)
      .notNull(),
    communityId: uuid("community_id").references(() => communities.id),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    address: text("address"),
    maxCapacity: integer("max_capacity"), // For shelters
    description: text("description"),
    verified: boolean("verified").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    parishIdIdx: index("places_parish_id_idx").on(table.parishId),
    typeIdx: index("places_type_idx").on(table.type),
    communityIdIdx: index("places_community_id_idx").on(table.communityId),
  })
);

// People table - Unified table for people in need and aid workers
export const people = pgTable(
  "people",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    type: text("type", {
      enum: ["person_in_need", "aid_worker"],
    }).notNull(),
    parishId: uuid("parish_id")
      .references(() => parishes.id)
      .notNull(),
    communityId: uuid("community_id").references(() => communities.id),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    contactName: text("contact_name").notNull(),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    organization: text("organization"), // For aid workers
    userId: text("user_id").references(() => user.id), // FK to user table if registered
    needs: text("needs").array(), // Array of strings - needs
    skills: text("skills").array(), // Array of strings - skills
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    typeIdx: index("people_type_idx").on(table.type),
    parishIdIdx: index("people_parish_id_idx").on(table.parishId),
    communityIdIdx: index("people_community_id_idx").on(table.communityId),
    userIdIdx: index("people_user_id_idx").on(table.userId),
  })
);

// Skills table - Normalized skills for people
export const skills = pgTable(
  "skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(), // Display name (e.g., "Search & Rescue")
    normalizedName: text("normalized_name").notNull().unique(), // Normalized for matching (e.g., "search and rescue")
    description: text("description"), // Optional description
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    normalizedNameIdx: index("skills_normalized_name_idx").on(
      table.normalizedName
    ),
  })
);

// People-Skills junction table - Links people to their skills
export const peopleSkills = pgTable(
  "people_skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    personId: uuid("person_id")
      .references(() => people.id, { onDelete: "cascade" })
      .notNull(),
    skillId: uuid("skill_id")
      .references(() => skills.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    personIdIdx: index("people_skills_person_id_idx").on(table.personId),
    skillIdIdx: index("people_skills_skill_id_idx").on(table.skillId),
    uniquePersonSkill: unique().on(table.personId, table.skillId), // Prevent duplicate associations
  })
);

// Assets table - Asset inventory (Starlink, iPhones, generators, etc.)
export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(), // e.g., "Starlink Unit #123"
    type: text("type", {
      enum: [
        "starlink",
        "iphone",
        "powerbank",
        "food",
        "water",
        "box_shelter",
        "generator",
        "hygiene_kit",
      ],
    }).notNull(),
    serialNumber: text("serial_number"),
    status: text("status", {
      enum: ["available", "deployed", "maintenance", "retired"],
    })
      .notNull()
      .default("available"),
    isOneTime: boolean("is_one_time").notNull(), // Starlink=true, Food/Water=false
    currentLocation: text("current_location"), // Where it currently is
    parishId: uuid("parish_id").references(() => parishes.id),
    communityId: uuid("community_id").references(() => communities.id),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    organization: text("organization"), // Which org owns it
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    typeIdx: index("assets_type_idx").on(table.type),
    statusIdx: index("assets_status_idx").on(table.status),
    isOneTimeIdx: index("assets_is_one_time_idx").on(table.isOneTime),
    parishIdIdx: index("assets_parish_id_idx").on(table.parishId),
  })
);

// Aid Missions table - Separate missions from workers
export const aidMissions = pgTable(
  "aid_missions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    type: text("type", {
      enum: ["rapid_deployment", "planned_mission", "standby"],
    }).notNull(),
    parishId: uuid("parish_id").references(() => parishes.id),
    communityId: uuid("community_id").references(() => communities.id),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time"),
    status: text("status", {
      enum: ["planned", "active", "completed", "cancelled"],
    })
      .notNull()
      .default("planned"),
    description: text("description"),
    createdBy: text("created_by").notNull(), // User ID
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    typeIdx: index("aid_missions_type_idx").on(table.type),
    statusIdx: index("aid_missions_status_idx").on(table.status),
    startTimeIdx: index("aid_missions_start_time_idx").on(table.startTime),
    parishIdIdx: index("aid_missions_parish_id_idx").on(table.parishId),
  })
);

// Aid Worker Capabilities table - Track what aid workers can deliver
export const aidWorkerCapabilities = pgTable(
  "aid_worker_capabilities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    personId: uuid("person_id")
      .references(() => people.id)
      .notNull(), // WHERE type='aid_worker'
    capabilities: jsonb("capabilities").notNull(), // Array: ['Food', 'Water', 'Shelter', etc.]
    availabilityStatus: text("availability_status", {
      enum: ["available", "on_mission", "unavailable"],
    })
      .notNull()
      .default("available"),
    currentLatitude: decimal("current_latitude", { precision: 10, scale: 7 }),
    currentLongitude: decimal("current_longitude", { precision: 10, scale: 7 }),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    personIdIdx: index("aid_worker_capabilities_person_id_idx").on(
      table.personId
    ),
    availabilityStatusIdx: index(
      "aid_worker_capabilities_availability_status_idx"
    ).on(table.availabilityStatus),
  })
);

// Mission Assignments table - Link workers to missions
export const missionAssignments = pgTable(
  "mission_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    missionId: uuid("mission_id")
      .references(() => aidMissions.id)
      .notNull(),
    personId: uuid("person_id")
      .references(() => people.id)
      .notNull(), // WHERE type='aid_worker'
    role: text("role"), // e.g., "Team Lead", "Driver"
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    status: text("status", {
      enum: ["assigned", "active", "completed", "cancelled"],
    })
      .notNull()
      .default("assigned"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    missionIdIdx: index("mission_assignments_mission_id_idx").on(
      table.missionId
    ),
    personIdIdx: index("mission_assignments_person_id_idx").on(table.personId),
    statusIdx: index("mission_assignments_status_idx").on(table.status),
  })
);

// Asset Distributions table - Tracks distribution of relief assets
export const assetDistributions = pgTable(
  "asset_distributions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationName: text("organization_name").notNull(),
    distributionDate: timestamp("distribution_date").notNull(),
    organizationEntity: text("organization_entity").notNull(),
    parishId: uuid("parish_id")
      .references(() => parishes.id)
      .notNull(),
    communityId: uuid("community_id")
      .references(() => communities.id)
      .notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),

    // New: Reference to assets table
    assetId: uuid("asset_id").references(() => assets.id), // Which asset was distributed
    personId: uuid("person_id").references(() => people.id), // Who received it
    placeId: uuid("place_id").references(() => places.id), // Where it was distributed

    // Legacy: Keep for backward compatibility during migration
    itemsDistributed: jsonb("items_distributed"), // Array of strings - nullable after migration
    assetType: text("asset_type", {
      enum: [
        "starlink",
        "iphone",
        "powerbank",
        "food",
        "water",
        "box_shelter",
        "generator",
        "hygiene_kit",
      ],
    }), // Denormalized for filtering
    isOneTime: boolean("is_one_time"), // Denormalized from assets table

    recipientFirstName: text("recipient_first_name").notNull(),
    recipientMiddleNames: text("recipient_middle_names"),
    recipientLastName: text("recipient_last_name").notNull(),
    recipientAlias: text("recipient_alias"),
    recipientDateOfBirth: date("recipient_date_of_birth").notNull(),
    recipientSex: text("recipient_sex", {
      enum: ["Male", "Female"],
    }).notNull(),
    recipientTRN: text("recipient_trn"), // Tax Registration Number
    recipientPhone: text("recipient_phone"),
    recipientSignature: text("recipient_signature"), // Base64 or URL
    submittedBy: text("submitted_by").notNull(), // User ID
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    parishIdIdx: index("asset_distributions_parish_id_idx").on(table.parishId),
    communityIdIdx: index("asset_distributions_community_id_idx").on(
      table.communityId
    ),
    distributionDateIdx: index("asset_distributions_distribution_date_idx").on(
      table.distributionDate
    ),
    submittedByIdx: index("asset_distributions_submitted_by_idx").on(
      table.submittedBy
    ),
    assetIdIdx: index("asset_distributions_asset_id_idx").on(table.assetId),
    personIdIdx: index("asset_distributions_person_id_idx").on(table.personId),
    placeIdIdx: index("asset_distributions_place_id_idx").on(table.placeId),
    assetTypeIdx: index("asset_distributions_asset_type_idx").on(
      table.assetType
    ),
  })
);

// Place Status table - Operational status of towns and parishes
export const placeStatus = pgTable(
  "place_status",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // New: Reference to places table
    placeId: uuid("place_id").references(() => places.id), // Reference to actual place

    // Keep for filtering and backward compatibility
    parishId: uuid("parish_id")
      .references(() => parishes.id)
      .notNull(),
    communityId: uuid("community_id")
      .references(() => communities.id)
      .notNull(),
    town: text("town"),

    // Operational Status
    electricityStatus: text("electricity_status", {
      enum: ["operational", "outage", "partial", "unknown"],
    }).notNull(),
    waterStatus: text("water_status", {
      enum: ["operational", "outage", "partial", "unknown"],
    }).notNull(),
    wifiStatus: text("wifi_status", {
      enum: ["operational", "outage", "partial", "unknown"],
    }).notNull(),

    // Capacity (can override place.max_capacity per status report)
    currentCapacity: integer("current_capacity"), // Renamed from shelter_capacity
    maxCapacity: integer("max_capacity"), // Can override place.max_capacity
    atCapacity: boolean("at_capacity").notNull(), // Renamed from shelter_at_capacity

    // Legacy: Keep for backward compatibility during migration
    shelterName: text("shelter_name"), // Will be removed after migration
    shelterCapacity: integer("shelter_capacity"), // Will be removed after migration
    shelterMaxCapacity: integer("shelter_max_capacity"), // Will be removed after migration
    shelterAtCapacity: boolean("shelter_at_capacity"), // Will be removed after migration

    notes: text("notes"),
    reportedBy: text("reported_by").notNull(), // User ID
    verified: boolean("verified").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    placeIdIdx: index("place_status_place_id_idx").on(table.placeId),
    parishIdIdx: index("place_status_parish_id_idx").on(table.parishId),
    communityIdIdx: index("place_status_community_id_idx").on(
      table.communityId
    ),
    createdAtIdx: index("place_status_created_at_idx").on(table.createdAt),
  })
);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    description: text("description"),
    permissions: jsonb("permissions").notNull().default("[]"), // Array of Permission strings
    isDefault: boolean("is_default").notNull().default(false), // System roles vs custom roles
    createdBy: uuid("created_by").references(() => appUsers.id), // Who created this role (null for system roles)
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index("roles_name_idx").on(table.name),
    isDefaultIdx: index("roles_is_default_idx").on(table.isDefault),
  })
);

// People Needs table - Reports of people in need
export const peopleNeeds = pgTable(
  "people_needs",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // New: Reference to people table
    personId: uuid("person_id").references(() => people.id), // WHERE type='person_in_need'

    // Keep for filtering and backward compatibility
    parishId: uuid("parish_id")
      .references(() => parishes.id)
      .notNull(),
    communityId: uuid("community_id")
      .references(() => communities.id)
      .notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),

    needs: jsonb("needs").notNull(), // Array of strings
    skills: jsonb("skills"), // Array of strings - skills needed/helpful

    // Legacy: Keep for backward compatibility during migration
    contactName: text("contact_name").notNull(), // Will reference person.contact_name after migration
    contactPhone: text("contact_phone"), // Will reference person.contact_phone after migration
    contactEmail: text("contact_email"), // Will reference person.contact_email after migration

    numberOfPeople: integer("number_of_people"),
    urgency: text("urgency", {
      enum: ["low", "medium", "high", "critical"],
    }).notNull(),
    description: text("description"),
    status: text("status", {
      enum: ["pending", "in_progress", "fulfilled", "cancelled"],
    }).default("pending"),
    reportedBy: text("reported_by").notNull(), // User ID
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    personIdIdx: index("people_needs_person_id_idx").on(table.personId),
    parishIdIdx: index("people_needs_parish_id_idx").on(table.parishId),
    communityIdIdx: index("people_needs_community_id_idx").on(
      table.communityId
    ),
    statusIdx: index("people_needs_status_idx").on(table.status),
    urgencyIdx: index("people_needs_urgency_idx").on(table.urgency),
    createdAtIdx: index("people_needs_created_at_idx").on(table.createdAt),
  })
);

// Aid Worker Schedules table - Tracks aid worker availability and deployment (Legacy - kept for backward compatibility)
export const aidWorkerSchedules = pgTable(
  "aid_worker_schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // New: Reference to people and missions tables
    personId: uuid("person_id").references(() => people.id), // WHERE type='aid_worker'
    missionId: uuid("mission_id").references(() => aidMissions.id), // Reference to mission

    // Legacy: Keep for backward compatibility during migration
    workerName: text("worker_name").notNull(), // Will reference person.name after migration
    workerId: text("worker_id"), // Optional user ID - will reference person.user_id
    organization: text("organization").notNull(), // Will reference person.organization
    capabilities: jsonb("capabilities").notNull(), // Will move to aid_worker_capabilities table
    missionType: text("mission_type", {
      enum: ["rapid_deployment", "planned_mission", "standby"],
    }).notNull(), // Will reference aid_missions.type
    startTime: timestamp("start_time").notNull(), // Will reference aid_missions.start_time
    endTime: timestamp("end_time"), // Will reference aid_missions.end_time
    durationHours: integer("duration_hours"),
    currentLatitude: decimal("current_latitude", { precision: 10, scale: 7 }),
    currentLongitude: decimal("current_longitude", { precision: 10, scale: 7 }),
    deploymentArea: text("deployment_area"),
    status: text("status", {
      enum: ["available", "deployed", "on_mission", "unavailable"],
    }).notNull(), // Will reference mission_assignments.status
    contactPhone: text("contact_phone").notNull(), // Will reference person.contact_phone
    contactEmail: text("contact_email"), // Will reference person.contact_email
    createdBy: text("created_by").notNull(), // User ID
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    personIdIdx: index("aid_worker_schedules_person_id_idx").on(table.personId),
    missionIdIdx: index("aid_worker_schedules_mission_id_idx").on(
      table.missionId
    ),
    workerIdIdx: index("aid_worker_schedules_worker_id_idx").on(table.workerId),
    organizationIdx: index("aid_worker_schedules_organization_idx").on(
      table.organization
    ),
    statusIdx: index("aid_worker_schedules_status_idx").on(table.status),
    startTimeIdx: index("aid_worker_schedules_start_time_idx").on(
      table.startTime
    ),
    createdByIdx: index("aid_worker_schedules_created_by_idx").on(
      table.createdBy
    ),
  })
);

export const appUsers = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(), // matches uploaded data UUID string

    email: text("email").notNull().unique(),

    firstName: text("first_name"),
    lastName: text("last_name"),
    fullName: text("full_name"),

    phoneNumber: text("phone_number"),
    imageUrl: text("image_url"),

    role: text("role").notNull(), // admin | responder | viewer | etc
    status: text("status", { enum: ["active", "suspended"] })
      .notNull()
      .default("active"),
    organization: text("organization"),
    department: text("department"),

    // Permissions
    canViewSensitiveData: boolean("can_view_sensitive_data")
      .notNull()
      .default(false),
    canExportData: boolean("can_export_data").notNull().default(false),
    canManageUsers: boolean("can_manage_users").notNull().default(false),

    // Activity
    lastActiveAt: timestamp("last_active_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),

    username: text("username"),
  },
  (table) => ({
    emailIdx: index("app_users_email_idx").on(table.email),
    roleIdx: index("app_users_role_idx").on(table.role),
  })
);

// Better Auth tables - Required for authentication
// These tables are used by Better Auth for user authentication and session management
export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index("user_email_idx").on(table.email),
  })
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("session_user_id_idx").on(table.userId),
    tokenIdx: index("session_token_idx").on(table.token),
  })
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    expiresAt: timestamp("expires_at"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("account_user_id_idx").on(table.userId),
    providerIdx: index("account_provider_idx").on(
      table.providerId,
      table.accountId
    ),
  })
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    identifierIdx: index("verification_identifier_idx").on(table.identifier),
  })
);

// Warehouses table - Storage locations for relief supplies (depots/warehouses)
export const warehouses = pgTable(
  "warehouses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    parishId: uuid("parish_id")
      .references(() => parishes.id)
      .notNull(),
    communityId: uuid("community_id").references(() => communities.id),
    latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
    address: text("address"),
    status: text("status", {
      enum: ["active", "inactive", "maintenance"],
    })
      .notNull()
      .default("active"),
    capacity: integer("capacity"), // Optional: total capacity metric
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    parishIdIdx: index("warehouses_parish_id_idx").on(table.parishId),
    statusIdx: index("warehouses_status_idx").on(table.status),
    locationIdx: index("warehouses_location_idx").on(
      table.latitude,
      table.longitude
    ),
  })
);

// Warehouse Inventory table - Tracks inventory items at warehouses
export const warehouseInventory = pgTable(
  "warehouse_inventory",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    warehouseId: uuid("warehouse_id")
      .references(() => warehouses.id, { onDelete: "cascade" })
      .notNull(),
    itemCode: text("item_code").notNull(), // e.g., "food", "water", "medicine"
    quantity: integer("quantity").notNull().default(0),
    reservedQuantity: integer("reserved_quantity").notNull().default(0), // Reserved for ongoing plans
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    warehouseIdIdx: index("warehouse_inventory_warehouse_id_idx").on(
      table.warehouseId
    ),
    itemCodeIdx: index("warehouse_inventory_item_code_idx").on(table.itemCode),
    uniqueWarehouseItem: unique().on(table.warehouseId, table.itemCode), // One row per warehouse-item
  })
);

// Allocation Plans table - Stores allocation plan metadata and status
export const allocationPlans = pgTable(
  "allocation_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    planName: text("plan_name").notNull(),
    status: text("status", {
      enum: [
        "draft",
        "pending",
        "approved",
        "executing",
        "completed",
        "cancelled",
      ],
    })
      .notNull()
      .default("draft"),
    constraints: jsonb("constraints").notNull(), // Store GlobalPlanningConstraints as JSONB
    createdBy: text("created_by"), // User ID who created the plan
    createdAt: timestamp("created_at").defaultNow().notNull(),
    executedAt: timestamp("executed_at"), // When plan execution started
    completedAt: timestamp("completed_at"), // When plan execution finished
  },
  (table) => ({
    statusIdx: index("allocation_plans_status_idx").on(table.status),
    createdAtIdx: index("allocation_plans_created_at_idx").on(table.createdAt),
  })
);

// Allocation Shipments table - Stores individual shipments from allocation plans
export const allocationShipments = pgTable(
  "allocation_shipments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    planId: uuid("plan_id")
      .references(() => allocationPlans.id, { onDelete: "cascade" })
      .notNull(),
    fromWarehouseId: uuid("from_warehouse_id")
      .references(() => warehouses.id)
      .notNull(),
    toCommunityId: uuid("to_community_id")
      .references(() => communities.id)
      .notNull(),
    itemCode: text("item_code").notNull(),
    quantity: integer("quantity").notNull(),
    cost: decimal("cost", { precision: 10, scale: 2 }), // Computed cost from planner
    status: text("status", {
      enum: ["planned", "scheduled", "in_transit", "delivered", "cancelled"],
    })
      .notNull()
      .default("planned"),
    scheduledDate: timestamp("scheduled_date"), // When shipment is scheduled
    executedDate: timestamp("executed_date"), // When shipment actually happened
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    planIdIdx: index("allocation_shipments_plan_id_idx").on(table.planId),
    warehouseIdIdx: index("allocation_shipments_warehouse_id_idx").on(
      table.fromWarehouseId
    ),
    communityIdIdx: index("allocation_shipments_community_id_idx").on(
      table.toCommunityId
    ),
    statusIdx: index("allocation_shipments_status_idx").on(table.status),
  })
);

// Custom Forms table - For user-created forms
export const forms = pgTable(
  "forms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    status: text("status", { enum: ["draft", "published", "archived"] })
      .notNull()
      .default("draft"),
    fields: jsonb("fields").notNull(), // Array of FormField objects
    allowedRoles: jsonb("allowed_roles").notNull().default('["admin"]'), // Array of UserRole strings that can access this form
    createdBy: uuid("created_by")
      .references(() => appUsers.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    publishedAt: timestamp("published_at"),
    archivedAt: timestamp("archived_at"),
  },
  (table) => ({
    createdByIdx: index("forms_created_by_idx").on(table.createdBy),
    statusIdx: index("forms_status_idx").on(table.status),
    nameIdx: index("forms_name_idx").on(table.name),
  })
);

// Form Submissions table - For storing form responses
export const formSubmissions = pgTable(
  "form_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // ✅ FIXED HERE
    formId: uuid("form_id")
      .references(() => forms.id, { onDelete: "cascade" })
      .notNull(),

    submittedBy: uuid("submitted_by").references(() => appUsers.id),
    submissionData: jsonb("submission_data").notNull(),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (table) => ({
    formIdIdx: index("form_submissions_form_id_idx").on(table.formId),
    submittedByIdx: index("form_submissions_submitted_by_idx").on(
      table.submittedBy
    ),
    submittedAtIdx: index("form_submissions_submitted_at_idx").on(
      table.submittedAt
    ),
  })
);

// Audit Logs table - For tracking user actions and system events
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    action: text("action").notNull(),
    userId: uuid("user_id").references(() => appUsers.id),
    userEmail: text("user_email"),
    userName: text("user_name"),
    details: text("details").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    resourceType: text("resource_type"),
    resourceId: text("resource_id"),
    beforeValue: jsonb("before_value"),
    afterValue: jsonb("after_value"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
    actionIdx: index("audit_logs_action_idx").on(table.action),
    createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
    resourceTypeIdx: index("audit_logs_resource_type_idx").on(
      table.resourceType
    ),
    resourceIdIdx: index("audit_logs_resource_id_idx").on(table.resourceId),
  })
);

// Merchants table - MSME merchant onboarding
export const merchants = pgTable(
  "merchants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    
    // Business Information
    businessName: text("business_name").notNull(),
    tradingName: text("trading_name"),
    businessType: text("business_type").notNull(),
    businessCategory: text("business_category").notNull(),
    
    // Location
    parishId: uuid("parish_id")
      .references(() => parishes.id)
      .notNull(),
    communityId: uuid("community_id")
      .references(() => communities.id)
      .notNull(),
    streetAddress: text("street_address").notNull(),
    gpsPin: text("gps_pin"), // GPS pin/plus code
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    
    // Contact Details
    ownerName: text("owner_name").notNull(),
    phone: text("phone").notNull(),
    alternatePhone: text("alternate_phone"),
    email: text("email"),
    
    // Inventory (Step 2)
    productCategories: jsonb("product_categories"), // Array of product category strings
    topItems: jsonb("top_items"), // Array of {itemName, unit, price} objects
    wantsFullInventoryUpload: boolean("wants_full_inventory_upload").default(false),
    
    // Business Capacity & Quotation (Step 3)
    monthlySalesVolume: decimal("monthly_sales_volume", { precision: 12, scale: 2 }), // Monthly sales volume in JMD
    numberOfEmployees: integer("number_of_employees"), // Number of employees
    issuesInvoices: boolean("issues_invoices").default(false),
    acceptsDigitalPayments: boolean("accepts_digital_payments").default(false),
    
    // Utilities & Connectivity
    hasElectricity: boolean("has_electricity").default(false),
    hasInternetAccess: boolean("has_internet_access").default(false),
    hasSmartphone: boolean("has_smartphone").default(false),
    
    // Import Interest & Purchasing
    revenueAllocationPercentage: integer("revenue_allocation_percentage"), // 0-100
    estimatedMonthlyPurchaseAmount: decimal("estimated_monthly_purchase_amount", { precision: 12, scale: 2 }), // JMD
    interestedImportProducts: jsonb("interested_import_products"), // Array of product category strings
    
    // Verification Photos
    shopfrontPhotoUrl: text("shopfront_photo_url"),
    documentPhotoUrl: text("document_photo_url"),
    invoicePhotoUrl: text("invoice_photo_url"),
    
    // Consent & Agreement
    consent: boolean("consent").default(false),
    
    // Additional Notes
    notes: text("notes"),
    
    // Status tracking
    verified: boolean("verified").default(false), // Admin verified merchants
    status: text("status", {
      enum: ["pending", "active", "inactive"],
    })
      .notNull()
      .default("pending"),
    
    // Metadata
    submittedBy: text("submitted_by").references(() => user.id), // User ID
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    parishIdIdx: index("merchants_parish_id_idx").on(table.parishId),
    communityIdIdx: index("merchants_community_id_idx").on(table.communityId),
    statusIdx: index("merchants_status_idx").on(table.status),
    businessTypeIdx: index("merchants_business_type_idx").on(table.businessType),
  })
);