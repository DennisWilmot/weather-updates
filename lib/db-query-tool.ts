/**
 * Database Query Tool
 *
 * Executes validated SQL queries and returns results.
 * Only read-only SELECT queries are allowed.
 */

import postgres from "postgres";
import { validateSQL, sanitizeSQL } from "./sql-validator";

// Get database connection string
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create a separate postgres client for raw SQL queries
// Using a smaller pool for AI queries to avoid exhausting connections
const sqlClient = postgres(connectionString, {
  max: 5, // Smaller pool for AI queries
  idle_timeout: 20,
  connect_timeout: 10,
  transform: {
    undefined: null,
  },
});

export interface QueryResult {
  success: boolean;
  data?: any[];
  error?: string;
  rowCount?: number;
  columns?: string[];
}

/**
 * Executes a validated SQL query and returns the results
 * @param sqlQuery The SQL query to execute
 * @returns Query result with data or error
 */
export async function executeQuery(sqlQuery: string): Promise<QueryResult> {
  try {
    // Validate the SQL query
    const validation = validateSQL(sqlQuery);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || "SQL validation failed",
      };
    }

    // Sanitize the query
    const sanitized = sanitizeSQL(sqlQuery);

    // Execute the query using postgres client directly
    const result = await sqlClient.unsafe(sanitized);

    // If result is empty, return empty data
    if (!result || result.length === 0) {
      return {
        success: true,
        data: [],
        rowCount: 0,
        columns: [],
      };
    }

    // Extract column names from the first row
    const columns = Object.keys(result[0]);

    // Result is already an array of objects from postgres-js
    return {
      success: true,
      data: result,
      rowCount: result.length,
      columns,
    };
  } catch (error: any) {
    console.error("Database query error:", error);
    return {
      success: false,
      error: error?.message || "Failed to execute database query",
    };
  }
}
