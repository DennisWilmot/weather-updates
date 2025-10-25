import { pgTable, uuid, text, boolean, timestamp, unique } from 'drizzle-orm/pg-core';

export const communities = pgTable('communities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  parish: text('parish').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  uniqueCommunityParish: unique().on(table.name, table.parish)
}));

export const submissions = pgTable('submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  parish: text('parish').notNull(),
  community: text('community').notNull(),
  hasElectricity: boolean('has_electricity').notNull(),
  hasWifi: boolean('has_wifi').notNull(),
  needsHelp: boolean('needs_help').notNull(),
  helpType: text('help_type', { 
    enum: ['medical', 'physical', 'police', 'firefighter', 'other'] 
  }),
  roadStatus: text('road_status', { 
    enum: ['clear', 'flooded', 'blocked', 'mudslide'] 
  }).notNull(),
  additionalInfo: text('additional_info'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
