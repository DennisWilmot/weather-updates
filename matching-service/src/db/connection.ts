/**
 * Database Connection
 * 
 * Sets up database connection using Drizzle ORM and postgres-js.
 * Uses the same connection pattern as the main application.
 * 
 * Environment Variables:
 * - DATABASE_URL: PostgreSQL connection string (required)
 * 
 * Connection Pooling:
 * - Maximum 10 connections
 * - Automatic connection management
 * - Connection reuse for better performance
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Validate that DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const connectionString = process.env.DATABASE_URL;

// Create postgres client with connection pooling
const client = postgres(connectionString, {
  max: 10, // Maximum number of connections in the pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
});

// Create Drizzle instance
// Note: We don't pass schema here since we'll import it in loadProblem.ts
// This allows us to use the same database connection without importing the full schema
export const db = drizzle(client);

// Export client for direct access if needed
export { client };

