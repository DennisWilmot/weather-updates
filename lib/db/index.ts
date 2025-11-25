// Load environment variables if not already loaded (for scripts)
if (typeof process !== 'undefined' && !process.env.DATABASE_URL) {
  try {
    const { config } = require('dotenv');
    config({ path: '.env.local' });
    config({ path: '.env' }); // Fallback to .env if .env.local doesn't exist
  } catch (e) {
    // dotenv might not be available in all contexts
  }
}

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Validate that DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const connectionString = process.env.DATABASE_URL;

// Configure postgres client with proper pool settings to prevent connection exhaustion
// Supabase connection pooler has limits, so we need to be very conservative
// IMPORTANT: Use Supabase connection pooler port (6543) instead of direct port (5432)
// The pooler handles connection management better and has higher limits
// For free tier Supabase, keep pool size very small to avoid hitting connection limits
const client = postgres(connectionString, {
  max: 20, // Maximum number of connections in the pool (flexible for concurrent requests)
  idle_timeout: 30, // Close idle connections after 30 seconds
  max_lifetime: 60 * 60, // Close connections after 1 hour
  connect_timeout: 10, // Connection timeout in seconds
  // Transform undefined to null for PostgreSQL compatibility
  transform: {
    undefined: null,
  },
  // On connection error, log but don't crash
  onnotice: () => {}, // Suppress notices
});

export const db = drizzle(client, { schema });
